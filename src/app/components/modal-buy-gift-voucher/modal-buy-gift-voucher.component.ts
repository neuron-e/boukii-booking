import { Component, OnInit, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { GiftVoucherService } from '../../services/gift-voucher.service';
import { SchoolService } from '../../services/school.service';
import {
  CreateGiftVoucherRequest,
  GiftVoucherTemplateInfo,
  GiftVoucherAmountOption,
  GIFT_VOUCHER_TEMPLATES,
  GIFT_VOUCHER_AMOUNT_OPTIONS
} from '../../interface/gift-voucher';

/**
 * Component: ModalBuyGiftVoucherComponent
 *
 * Modal multi-paso para comprar bonos regalo.
 * Permite al usuario seleccionar monto, personalizar diseño y enviar bono regalo.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 40 min
 *
 * Flujo:
 * 1. Selección de monto (predefinido o personalizado)
 * 2. Personalización (template, colores, mensaje)
 * 3. Datos del destinatario (nombre, email, fecha de envío)
 * 4. Resumen y confirmación
 * 5. Redirección a pago
 *
 * Uso:
 * ```html
 * <app-modal-buy-gift-voucher
 *   [isOpen]="showBuyGiftVoucherModal"
 *   [slug]="slug"
 *   (onClose)="handleCloseModal()"
 *   (onPurchase)="handlePurchaseComplete($event)">
 * </app-modal-buy-gift-voucher>
 * ```
 */
@Component({
  selector: 'app-modal-buy-gift-voucher',
  templateUrl: './modal-buy-gift-voucher.component.html',
  styleUrls: ['./modal-buy-gift-voucher.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(-100%)' })),
      ]),
    ]),
  ]
})
export class ModalBuyGiftVoucherComponent implements OnInit, OnChanges {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Output() onClose = new EventEmitter<any>();
  @Output() onPurchase = new EventEmitter<any>();

  // Estado del flujo
  currentStep: 'amount' | 'personalize' | 'recipient' | 'summary' = 'amount';

  // Datos del gift voucher
  giftVoucher: Partial<CreateGiftVoucherRequest> = {
    amount: 0,
    template: 'default',
    background_color: '#FFFFFF',
    text_color: '#333333'
  };

  // Opciones disponibles
  amountOptions: GiftVoucherAmountOption[] = GIFT_VOUCHER_AMOUNT_OPTIONS;
  templates: GiftVoucherTemplateInfo[] = GIFT_VOUCHER_TEMPLATES;
  selectedTemplate: GiftVoucherTemplateInfo;

  // Modo de monto (predefinido o personalizado)
  amountMode: 'preset' | 'custom' = 'preset';
  customAmount: number = 0;

  // Estado
  isProcessing: boolean = false;
  errorMessage: string = '';
  schoolId: number;

  // Fecha mínima para delivery_date (hoy)
  minDate: string;

  constructor(
    public themeService: ThemeService,
    private giftVoucherService: GiftVoucherService,
    private schoolService: SchoolService
  ) {
    // Establecer fecha mínima como hoy
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Obtener school_id del servicio
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data && data.data) {
          this.schoolId = data.data.id;
          this.giftVoucher.school_id = this.schoolId;
        }
      }
    );

    // Seleccionar template default por defecto
    this.selectedTemplate = this.templates[0];
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Resetear al abrir modal
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.resetModal();
      }
    }
  }

  /**
   * Resetea el estado del modal
   */
  private resetModal(): void {
    this.currentStep = 'amount';
    this.amountMode = 'preset';
    this.customAmount = 0;
    this.giftVoucher = {
      amount: 0,
      template: 'default',
      background_color: '#FFFFFF',
      text_color: '#333333',
      school_id: this.schoolId
    };
    this.selectedTemplate = this.templates[0];
    this.errorMessage = '';
    this.isProcessing = false;
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.onClose.emit();
  }

  // ===== PASO 1: SELECCIÓN DE MONTO =====

  /**
   * Selecciona un monto predefinido
   */
  selectPresetAmount(amount: number): void {
    this.giftVoucher.amount = amount;
    this.amountMode = 'preset';
    this.errorMessage = '';
  }

  /**
   * Activa el modo de monto personalizado
   */
  activateCustomAmount(): void {
    this.amountMode = 'custom';
    this.giftVoucher.amount = 0;
    this.customAmount = 0;
  }

  /**
   * Actualiza el monto personalizado
   */
  updateCustomAmount(): void {
    this.giftVoucher.amount = this.customAmount;
  }

  /**
   * Avanza al paso de personalización
   */
  goToPersonalize(): void {
    // Validar monto
    const validation = this.giftVoucherService.validateAmount(this.giftVoucher.amount);
    if (!validation.valid) {
      this.errorMessage = validation.message;
      return;
    }

    this.errorMessage = '';
    this.currentStep = 'personalize';
  }

  // ===== PASO 2: PERSONALIZACIÓN =====

  /**
   * Selecciona un template
   */
  selectTemplate(template: GiftVoucherTemplateInfo): void {
    this.selectedTemplate = template;
    this.giftVoucher.template = template.key;
    this.giftVoucher.background_color = template.defaultBackgroundColor;
    this.giftVoucher.text_color = template.defaultTextColor;
  }

  /**
   * Actualiza el color de fondo
   */
  updateBackgroundColor(color: string): void {
    if (this.giftVoucherService.validateColor(color)) {
      this.giftVoucher.background_color = color;
    }
  }

  /**
   * Actualiza el color de texto
   */
  updateTextColor(color: string): void {
    if (this.giftVoucherService.validateColor(color)) {
      this.giftVoucher.text_color = color;
    }
  }

  /**
   * Avanza al paso de destinatario
   */
  goToRecipient(): void {
    this.currentStep = 'recipient';
  }

  // ===== PASO 3: DATOS DEL DESTINATARIO =====

  /**
   * Valida el email del destinatario
   */
  validateRecipientEmail(): boolean {
    if (!this.giftVoucher.recipient_email) {
      this.errorMessage = 'El email del destinatario es requerido';
      return false;
    }

    if (!this.giftVoucherService.validateEmail(this.giftVoucher.recipient_email)) {
      this.errorMessage = 'El email del destinatario no es válido';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  /**
   * Avanza al resumen
   */
  goToSummary(): void {
    if (!this.validateRecipientEmail()) {
      return;
    }

    this.currentStep = 'summary';
  }

  // ===== PASO 4: RESUMEN Y CONFIRMACIÓN =====

  /**
   * Finaliza la compra creando el gift voucher y redirigiendo a pago
   */
  completePurchase(): void {
    if (!this.validateRecipientEmail()) {
      return;
    }

    if (!this.schoolId) {
      this.errorMessage = 'Error: No se pudo obtener información de la escuela';
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    // Obtener user_id del localStorage si existe
    const storageSlug = localStorage.getItem(this.slug + '-boukiiUser');
    let purchasedByClientId: number | undefined;
    if (storageSlug) {
      const userLogged = JSON.parse(storageSlug);
      purchasedByClientId = userLogged.clients?.[0]?.id;
    }

    // Preparar datos finales
    const giftVoucherData: CreateGiftVoucherRequest = {
      amount: this.giftVoucher.amount!,
      recipient_email: this.giftVoucher.recipient_email!,
      school_id: this.schoolId,
      recipient_name: this.giftVoucher.recipient_name,
      personal_message: this.giftVoucher.personal_message,
      sender_name: this.giftVoucher.sender_name,
      template: this.giftVoucher.template,
      background_color: this.giftVoucher.background_color,
      text_color: this.giftVoucher.text_color,
      delivery_date: this.giftVoucher.delivery_date
    };

    // Crear gift voucher en backend
    this.giftVoucherService.createGiftVoucher(giftVoucherData).subscribe(
      response => {
        this.isProcessing = false;

        if (response.success && response.data) {
          // Emitir evento de compra exitosa con datos del gift voucher
          this.onPurchase.emit({
            giftVoucher: response.data,
            amount: this.giftVoucher.amount
          });

          this.closeModal();

          // NOTA: El componente padre debe manejar la redirección a la pasarela de pago
          // usando el ID del gift voucher creado
        } else {
          this.errorMessage = response.message || 'Error al crear el bono regalo';
        }
      },
      error => {
        this.isProcessing = false;
        this.errorMessage = error.error?.message || 'Error al procesar la compra. Por favor intenta de nuevo.';
      }
    );
  }

  // ===== NAVEGACIÓN ENTRE PASOS =====

  /**
   * Retrocede al paso anterior
   */
  goBack(): void {
    switch (this.currentStep) {
      case 'personalize':
        this.currentStep = 'amount';
        break;
      case 'recipient':
        this.currentStep = 'personalize';
        break;
      case 'summary':
        this.currentStep = 'recipient';
        break;
    }
    this.errorMessage = '';
  }

  /**
   * Verifica si puede avanzar al siguiente paso
   */
  canProceed(): boolean {
    switch (this.currentStep) {
      case 'amount':
        return this.giftVoucher.amount > 0;
      case 'personalize':
        return true; // Personalización es opcional
      case 'recipient':
        return !!this.giftVoucher.recipient_email;
      case 'summary':
        return !this.isProcessing;
      default:
        return false;
    }
  }

  /**
   * Obtiene el título del paso actual
   */
  getStepTitle(): string {
    switch (this.currentStep) {
      case 'amount':
        return 'text_select_amount';
      case 'personalize':
        return 'text_personalize_voucher';
      case 'recipient':
        return 'text_recipient_info';
      case 'summary':
        return 'text_summary';
      default:
        return '';
    }
  }

  /**
   * Obtiene el número del paso actual (1-4)
   */
  getStepNumber(): number {
    switch (this.currentStep) {
      case 'amount': return 1;
      case 'personalize': return 2;
      case 'recipient': return 3;
      case 'summary': return 4;
      default: return 1;
    }
  }

  /**
   * Formatea un monto para mostrar
   */
  formatAmount(amount: number): string {
    return this.giftVoucherService.formatAmount(amount);
  }
}
