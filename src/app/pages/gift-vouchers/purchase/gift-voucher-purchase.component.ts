import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GiftVoucherService } from '../../../services/gift-voucher.service';
import { SchoolService } from '../../../services/school.service';
import {
  CreateGiftVoucherRequest,
  GIFT_VOUCHER_TEMPLATES,
  GiftVoucherTemplateInfo
} from '../../../interface/gift-voucher';

/**
 * Component: GiftVoucherPurchaseComponent
 *
 * Página pública para comprar gift vouchers sin necesidad de login.
 * Permite seleccionar monto, escuela, destinatario y personalizar el bono.
 *
 * @author Frontend Booking Engineer
 * @date 2025-10-29
 * @task GIFT-002
 *
 * Features:
 * - Selector de monto predefinido o custom
 * - Selector de escuela
 * - Preview del voucher en tiempo real
 * - Validación de formulario
 * - Integración con API y Payrexx
 */
@Component({
  selector: 'app-gift-voucher-purchase',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './gift-voucher-purchase.component.html',
  styleUrls: ['./gift-voucher-purchase.component.scss']
})
export class GiftVoucherPurchaseComponent implements OnInit {
  purchaseForm!: FormGroup;
  schools = signal<any[]>([]);
  templates: GiftVoucherTemplateInfo[] = GIFT_VOUCHER_TEMPLATES;

  // Predefined amounts
  predefinedAmounts = [25, 50, 100, 200];
  selectedAmount = signal<number | 'custom'>(50);

  // Loading and error states
  loading = signal(false);
  error = signal<string | null>(null);
  schoolsLoading = signal(true);

  // Form state for preview
  formData = computed(() => {
    if (!this.purchaseForm) return null;
    return {
      amount: this.purchaseForm.get('amount')?.value || 0,
      senderName: this.purchaseForm.get('sender_name')?.value || '',
      recipientName: this.purchaseForm.get('recipient_name')?.value || '',
      message: this.purchaseForm.get('personal_message')?.value || '',
      template: this.purchaseForm.get('template')?.value || 'default'
    };
  });

  // Character counter for message
  messageLength = computed(() => {
    return this.purchaseForm?.get('personal_message')?.value?.length || 0;
  });

  slug: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private giftVoucherService: GiftVoucherService,
    private schoolService: SchoolService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Get slug from route
    this.route.params.subscribe(params => {
      this.slug = params['slug'] || '';
    });

    this.initForm();
    this.loadSchools();
  }

  /**
   * Initialize the purchase form with validators
   */
  private initForm(): void {
    this.purchaseForm = this.fb.group({
      amount: [50, [Validators.required, Validators.min(10), Validators.max(1000)]],
      currency: ['CHF', Validators.required],
      school_id: [null, Validators.required],
      recipient_name: ['', [Validators.required, Validators.maxLength(255)]],
      recipient_email: ['', [Validators.required, Validators.email]],
      sender_name: ['', [Validators.required, Validators.maxLength(255)]],
      personal_message: ['', Validators.maxLength(500)],
      template: ['default']
    });
  }

  /**
   * Load available schools
   */
  private loadSchools(): void {
    this.schoolsLoading.set(true);
    this.schoolService.getSchools().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.schools.set(response.data);

          // If there's only one school or slug matches, pre-select it
          if (response.data.length === 1) {
            this.purchaseForm.patchValue({ school_id: response.data[0].id });
          } else if (this.slug) {
            const school = response.data.find((s: any) => s.slug === this.slug);
            if (school) {
              this.purchaseForm.patchValue({ school_id: school.id });
            }
          }
        }
        this.schoolsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading schools:', err);
        this.error.set(this.translate.instant('gift_vouchers.error_loading_schools'));
        this.schoolsLoading.set(false);
      }
    });
  }

  /**
   * Select a predefined amount
   */
  selectAmount(amount: number | 'custom'): void {
    this.selectedAmount.set(amount);
    if (amount !== 'custom') {
      this.purchaseForm.patchValue({ amount });
    }
  }

  /**
   * Get the selected template info
   */
  getSelectedTemplate(): GiftVoucherTemplateInfo {
    const templateKey = this.purchaseForm?.get('template')?.value || 'default';
    return this.templates.find(t => t.key === templateKey) || this.templates[0];
  }

  /**
   * Check if form field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.purchaseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for a field
   */
  getFieldError(fieldName: string): string {
    const field = this.purchaseForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return this.translate.instant('gift_vouchers.error_required');
    }
    if (field.errors['email']) {
      return this.translate.instant('gift_vouchers.error_email_invalid');
    }
    if (field.errors['min']) {
      return this.translate.instant('gift_vouchers.error_amount_min', { min: 10 });
    }
    if (field.errors['max']) {
      return this.translate.instant('gift_vouchers.error_amount_max', { max: 1000 });
    }
    if (field.errors['maxlength']) {
      return this.translate.instant('gift_vouchers.error_maxlength', {
        max: field.errors['maxlength'].requiredLength
      });
    }

    return '';
  }

  /**
   * Submit the form and initiate payment
   */
  onSubmit(): void {
    if (this.purchaseForm.invalid) {
      Object.keys(this.purchaseForm.controls).forEach(key => {
        this.purchaseForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formData: CreateGiftVoucherRequest = {
      amount: this.purchaseForm.value.amount,
      currency: this.purchaseForm.value.currency,
      school_id: this.purchaseForm.value.school_id,
      recipient_name: this.purchaseForm.value.recipient_name,
      recipient_email: this.purchaseForm.value.recipient_email,
      sender_name: this.purchaseForm.value.sender_name,
      personal_message: this.purchaseForm.value.personal_message,
      template: this.purchaseForm.value.template
    };

    // Call the public API endpoint to create purchase
    this.giftVoucherService.purchasePublic(formData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Redirect to Payrexx payment URL
          if (response.data.payment_url) {
            window.location.href = response.data.payment_url;
          } else {
            this.error.set(this.translate.instant('gift_vouchers.error_payment_url'));
            this.loading.set(false);
          }
        } else {
          this.error.set(response.message || this.translate.instant('gift_vouchers.error_purchase'));
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error purchasing voucher:', err);
        this.error.set(
          err.error?.message ||
          this.translate.instant('gift_vouchers.error_purchase')
        );
        this.loading.set(false);
      }
    });
  }

  /**
   * Get school by ID
   */
  getSchoolById(id: number): any {
    return this.schools().find(s => s.id === id);
  }
}
