import { Component, OnInit, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { DiscountCodeService } from '../../services/discount-code.service';
import { SchoolService } from '../../services/school.service';
import { DiscountCodeValidationRequest, DiscountCodeValidationResponse } from '../../interface/discount-code';

/**
 * Component: ModalDiscountCodeComponent
 *
 * Modal para aplicar códigos de descuento en el flujo de reserva.
 * Permite al usuario ingresar un código promocional, validarlo contra
 * la API y aplicarlo al carrito si es válido.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 30 min
 *
 * Funcionalidades:
 * - Input de código con validación
 * - Preview de descuento calculado
 * - Mensajes de error claros
 * - Integración con API de validación
 *
 * Uso:
 * ```html
 * <app-modal-discount-code
 *   [isOpen]="showDiscountModal"
 *   [slug]="slug"
 *   [cartTotal]="totalAmount"
 *   [courseId]="selectedCourse.id"
 *   [sportId]="selectedSport.id"
 *   (onClose)="handleDiscountModalClose()"
 *   (onApply)="applyDiscountCode($event)">
 * </app-modal-discount-code>
 * ```
 */
@Component({
  selector: 'app-modal-discount-code',
  templateUrl: './modal-discount-code.component.html',
  styleUrls: ['./modal-discount-code.component.scss'],
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
  ]
})
export class ModalDiscountCodeComponent implements OnInit, OnChanges {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Input() cartTotal: number = 0;
  @Input() courseId?: number;
  @Input() sportId?: number;
  @Input() degreeId?: number;
  @Output() onClose = new EventEmitter<any>();
  @Output() onApply = new EventEmitter<DiscountCodeValidationResponse>();

  code: string = '';
  isValidating: boolean = false;
  validationResult: DiscountCodeValidationResponse | null = null;
  errorMessage: string = '';
  schoolId: number;

  constructor(
    public themeService: ThemeService,
    private discountCodeService: DiscountCodeService,
    private schoolService: SchoolService
  ) { }

  ngOnInit(): void {
    // Obtener school_id del servicio
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data && data.data) {
          this.schoolId = data.data.id;
        }
      }
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Limpiar estado al abrir/cerrar modal
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        this.resetModal();
      }
    }
  }

  /**
   * Valida el código de descuento ingresado
   */
  validateCode(): void {
    if (!this.code || this.code.trim() === '') {
      this.errorMessage = 'Por favor ingresa un código';
      return;
    }

    if (!this.schoolId) {
      this.errorMessage = 'Error: No se pudo obtener información de la escuela';
      return;
    }

    this.isValidating = true;
    this.errorMessage = '';
    this.validationResult = null;

    // Obtener user_id del localStorage si existe
    let userId: number | undefined;
    const storageSlug = localStorage.getItem(this.slug + '-boukiiUser');
    if (storageSlug) {
      const userLogged = JSON.parse(storageSlug);
      userId = userLogged.clients?.[0]?.id;
    }

    // Preparar datos de validación
    const validationData: DiscountCodeValidationRequest = {
      code: this.code.toUpperCase(),
      school_id: this.schoolId,
      amount: this.cartTotal,
      user_id: userId
    };

    // Agregar IDs opcionales si existen
    if (this.courseId) {
      validationData.course_id = this.courseId;
    }
    if (this.sportId) {
      validationData.sport_id = this.sportId;
    }
    if (this.degreeId) {
      validationData.degree_id = this.degreeId;
    }

    // Llamar a la API
    this.discountCodeService.validateCode(validationData).subscribe(
      response => {
        this.isValidating = false;

        if (response.data && response.data.valid) {
          // Código válido
          this.validationResult = response.data;
          this.errorMessage = '';
        } else {
          // Código inválido
          this.validationResult = null;
          this.errorMessage = response.data?.message || 'Código de descuento inválido';
        }
      },
      error => {
        this.isValidating = false;
        this.validationResult = null;
        this.errorMessage = error.error?.message || 'Error al validar el código. Por favor intenta de nuevo.';
      }
    );
  }

  /**
   * Aplica el código de descuento validado
   */
  applyCode(): void {
    if (this.validationResult && this.validationResult.valid) {
      this.onApply.emit(this.validationResult);
      this.closeModal();
    }
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.onClose.emit();
  }

  /**
   * Resetea el estado del modal
   */
  private resetModal(): void {
    this.code = '';
    this.validationResult = null;
    this.errorMessage = '';
    this.isValidating = false;
  }

  /**
   * Formatea el tipo de descuento para mostrar
   */
  getDiscountTypeLabel(): string {
    if (!this.validationResult?.discount_code) {
      return '';
    }

    const discountCode = this.validationResult.discount_code;
    if (discountCode.discount_type === 'percentage') {
      return `${discountCode.discount_value}%`;
    } else {
      return `CHF ${discountCode.discount_value}`;
    }
  }
}
