import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { GiftVoucherService } from '../../../services/gift-voucher.service';
import { SchoolService } from '../../../services/school.service';
import { GiftVoucherPurchaseRequest, GiftVoucherPurchaseResponse } from '../../../interface/gift-voucher';
import { Subscription } from 'rxjs';

/**
 * Component: GiftVoucherPurchaseComponent
 *
 * Página pública para comprar gift vouchers sin necesidad de login.
 * Permite seleccionar monto, escuela, datos del comprador/destinatario y completar la compra.
 */
@Component({
  selector: 'app-gift-voucher-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss']
})
export class GiftVoucherPurchaseComponent implements OnInit, OnDestroy {
  purchaseForm: UntypedFormGroup;
  schools: any[] = [];
  loading = false;
  error: string | null = null;

  predefinedAmounts = [50, 100, 150, 200];
  selectedAmount: number | null = 50;
  private subscriptions = new Subscription();

  constructor(
    private fb: UntypedFormBuilder,
    private giftVoucherService: GiftVoucherService,
    private schoolService: SchoolService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.purchaseForm = this.fb.group({
      amount: [50, [Validators.required, Validators.min(10), Validators.max(1000)]],
      currency: ['CHF', Validators.required],
      school_id: [null, Validators.required],
      buyer_name: ['', [Validators.required, Validators.maxLength(255)]],
      buyer_email: ['', [Validators.required, Validators.email]],
      buyer_phone: [''],
      recipient_name: ['', [Validators.required, Validators.maxLength(255)]],
      recipient_email: ['', [Validators.required, Validators.email, this.differentFromBuyerEmailValidator.bind(this)]],
      recipient_phone: [''],
      personal_message: ['', Validators.maxLength(500)],
      template: ['default']
    });
  }

  ngOnInit(): void {
    this.setupValueChangeSubscriptions();
    this.loadSchools();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Carga la lista de escuelas disponibles.
   */
  private loadSchools(): void {
    this.schoolService.getSchools().subscribe({
      next: (response: any) => {
        this.schools = response?.data || response || [];

        if (this.schools.length === 1 && !this.purchaseForm.get('school_id')?.value) {
          this.purchaseForm.patchValue({
            school_id: this.schools[0].id,
            currency: this.schools[0]?.currency || this.purchaseForm.get('currency')?.value
          });
          this.applySchoolCurrency(this.schools[0].id);
        } else if (this.purchaseForm.get('school_id')?.value) {
          this.applySchoolCurrency(this.purchaseForm.get('school_id')?.value);
        }
      },
      error: (err) => {
        console.error('Error loading schools:', err);
        this.error = this.translate.instant('gift_vouchers.error_loading_schools');
      }
    });
  }

  selectAmount(amount: number): void {
    this.selectedAmount = amount;
    this.purchaseForm.patchValue({ amount });
  }

  selectCustomAmount(): void {
    this.selectedAmount = null;
  }

  onSubmit(): void {
    if (this.purchaseForm.invalid) {
      this.purchaseForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.purchaseForm.value;

    if (formValue.buyer_email && formValue.recipient_email && formValue.buyer_email === formValue.recipient_email) {
      const recipientControl = this.purchaseForm.get('recipient_email');
      const existingErrors = recipientControl?.errors || {};
      recipientControl?.setErrors({ ...existingErrors, sameEmail: true });
      this.error = this.translate.instant('gift_vouchers.error_same_email');
      this.loading = false;
      return;
    }

    const locale = this.translate.currentLang || 'en';

    const purchaseData: GiftVoucherPurchaseRequest = {
      amount: formValue.amount,
      currency: formValue.currency,
      school_id: formValue.school_id,
      buyer_name: formValue.buyer_name,
      buyer_email: formValue.buyer_email,
      buyer_phone: formValue.buyer_phone || undefined,
      buyer_locale: locale,
      recipient_name: formValue.recipient_name,
      recipient_email: formValue.recipient_email,
      recipient_phone: formValue.recipient_phone || undefined,
      recipient_locale: locale,
      personal_message: formValue.personal_message || undefined,
      template: formValue.template
    };

    this.giftVoucherService.purchasePublic(purchaseData).subscribe({
      next: (response: GiftVoucherPurchaseResponse) => {
        if (response?.success) {
          // Check if payment URL is provided (Payrexx integration)
          if (response.data?.payment_url) {
            // Redirect to Payrexx payment gateway
            window.location.href = response.data.payment_url;
          } else {
            // Fallback: navigate to success page (for direct/test purchases)
            const voucherId = response.data?.gift_voucher?.id;
            const voucherCode = response.data?.voucher_code;

            this.router.navigate(['/gift-vouchers/success'], {
              queryParams: {
                voucher_id: voucherId,
                code: voucherCode
              }
            });
            this.loading = false;
          }
        } else {
          this.error = response?.message || this.translate.instant('gift_vouchers.error_purchase');
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error purchasing voucher:', err);
        this.error =
          err.error?.message ||
          err.error?.data?.message ||
          this.translate.instant('gift_vouchers.error_purchase');
        this.loading = false;
      }
    });
  }


  get messageLength(): number {
    return this.purchaseForm.get('personal_message')?.value?.length || 0;
  }

  get selectedCurrency(): string {
    return this.purchaseForm.get('currency')?.value || 'CHF';
  }

  hasError(field: string): boolean {
    const control = this.purchaseForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.purchaseForm.get(field);
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return this.translate.instant('gift_vouchers.error_required');
    }
    if (control.errors['email']) {
      return this.translate.instant('gift_vouchers.error_email_invalid');
    }
    if (control.errors['min']) {
      return this.translate.instant('gift_vouchers.error_amount_min', { min: control.errors['min'].min });
    }
    if (control.errors['max']) {
      return this.translate.instant('gift_vouchers.error_amount_max', { max: control.errors['max'].max });
    }
    if (control.errors['maxlength']) {
      return this.translate.instant('gift_vouchers.error_maxlength', {
        max: control.errors['maxlength'].requiredLength
      });
    }
    if (control.errors['sameEmail']) {
      return this.translate.instant('gift_vouchers.error_same_email');
    }

    return this.translate.instant('gift_vouchers.error_invalid_field');
  }

  private setupValueChangeSubscriptions(): void {
    const buyerEmailControl = this.purchaseForm.get('buyer_email');
    const recipientEmailControl = this.purchaseForm.get('recipient_email');
    const schoolControl = this.purchaseForm.get('school_id');

    if (buyerEmailControl && recipientEmailControl) {
      this.subscriptions.add(
        buyerEmailControl.valueChanges.subscribe(() => {
          recipientEmailControl.updateValueAndValidity({ onlySelf: true });
        })
      );
    }

    if (schoolControl) {
      this.subscriptions.add(
        schoolControl.valueChanges.subscribe((schoolId) => {
          this.applySchoolCurrency(schoolId);
        })
      );
    }
  }

  private applySchoolCurrency(schoolId: number | string | null | undefined): void {
    if (!schoolId) {
      return;
    }

    const numericId = typeof schoolId === 'string' ? parseInt(schoolId, 10) : schoolId;
    const selectedSchool = this.schools.find((school) => Number(school.id) === Number(numericId));

    if (selectedSchool?.currency) {
      this.purchaseForm.patchValue({ currency: selectedSchool.currency }, { emitEvent: false });
    }
  }

  private differentFromBuyerEmailValidator(control: AbstractControl): ValidationErrors | null {
    const buyerEmail = this.purchaseForm?.get('buyer_email')?.value;
    const recipientEmail = control?.value;

    if (!buyerEmail || !recipientEmail) {
      return null;
    }

    return buyerEmail.trim().toLowerCase() === recipientEmail.trim().toLowerCase()
      ? { sameEmail: true }
      : null;
  }
}
