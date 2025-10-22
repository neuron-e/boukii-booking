import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../interface/api-response';
import {
  CreateGiftVoucherRequest,
  GiftVoucherResponse,
  GiftVoucherSummary,
  RedeemGiftVoucherRequest,
  GiftVoucherTemplateInfo,
  GIFT_VOUCHER_TEMPLATES
} from '../interface/gift-voucher';

/**
 * Service: GiftVoucherService
 *
 * Servicio para gestionar bonos regalo en la aplicación Boukii.
 * Permite crear, comprar, enviar y canjear bonos regalo.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 15 min
 *
 * Endpoints utilizados:
 * - POST /slug/gift-vouchers - Crear nuevo bono regalo (compra)
 * - GET /slug/gift-vouchers - Listar bonos regalo
 * - GET /slug/gift-vouchers/templates - Obtener templates disponibles
 * - GET /slug/gift-vouchers/{id} - Ver detalles de un bono
 * - GET /slug/gift-vouchers/{id}/summary - Obtener resumen de un bono
 * - POST /slug/gift-vouchers/{id}/redeem - Canjear un bono regalo
 * - POST /slug/gift-vouchers/{id}/deliver - Enviar bono por email
 * - PUT /slug/gift-vouchers/{id} - Actualizar bono
 * - DELETE /slug/gift-vouchers/{id} - Eliminar bono
 */
@Injectable({
  providedIn: 'root'
})
export class GiftVoucherService extends ApiService {

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  /**
   * Crea un nuevo bono regalo (compra)
   *
   * @param giftVoucherData - Datos del bono regalo a crear
   * @returns Observable con la respuesta de creación
   *
   * @example
   * ```typescript
   * const giftVoucher: CreateGiftVoucherRequest = {
   *   amount: 150,
   *   recipient_email: 'destinatario@example.com',
   *   recipient_name: 'John Doe',
   *   sender_name: 'Jane Smith',
   *   personal_message: '¡Feliz cumpleaños! Disfruta este regalo.',
   *   template: 'birthday',
   *   school_id: 1,
   *   delivery_date: '2025-12-25'
   * };
   *
   * this.giftVoucherService.createGiftVoucher(giftVoucher).subscribe(
   *   response => {
   *     console.log('Bono creado:', response.data);
   *     // Redirigir a pasarela de pago
   *   },
   *   error => console.error('Error:', error)
   * );
   * ```
   */
  createGiftVoucher(giftVoucherData: CreateGiftVoucherRequest): Observable<ApiResponse> {
    const url = this.baseUrl + '/slug/gift-vouchers';
    return this.http.post<ApiResponse>(url, giftVoucherData, { headers: this.getHeaders() });
  }

  /**
   * Obtiene la lista de bonos regalo
   *
   * @param filters - Filtros opcionales (schoolId, isPaid, isRedeemed, etc.)
   * @returns Observable con la lista de bonos regalo
   *
   * @example
   * ```typescript
   * this.giftVoucherService.getGiftVouchers({ school_id: 1, is_paid: true }).subscribe(
   *   response => {
   *     console.log('Bonos regalo:', response.data);
   *   }
   * );
   * ```
   */
  getGiftVouchers(filters?: any): Observable<ApiResponse> {
    let url = this.baseUrl + '/slug/gift-vouchers';

    if (filters) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          params.append(key, filters[key].toString());
        }
      });
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }

    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene los templates disponibles para bonos regalo
   *
   * @returns Observable con los templates disponibles
   *
   * @example
   * ```typescript
   * this.giftVoucherService.getTemplates().subscribe(
   *   response => {
   *     console.log('Templates:', response.data);
   *   }
   * );
   * ```
   */
  getTemplates(): Observable<ApiResponse> {
    const url = this.baseUrl + '/slug/gift-vouchers/templates';
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene los detalles de un bono regalo específico
   *
   * @param giftVoucherId - ID del bono regalo
   * @returns Observable con los detalles del bono
   *
   * @example
   * ```typescript
   * this.giftVoucherService.getGiftVoucher(15).subscribe(
   *   response => {
   *     console.log('Detalles del bono:', response.data);
   *   }
   * );
   * ```
   */
  getGiftVoucher(giftVoucherId: number): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}`;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene el resumen de un bono regalo
   *
   * @param giftVoucherId - ID del bono regalo
   * @returns Observable con el resumen del bono
   *
   * @example
   * ```typescript
   * this.giftVoucherService.getGiftVoucherSummary(15).subscribe(
   *   response => {
   *     const summary: GiftVoucherSummary = response.data;
   *     console.log('¿Puede canjearse?', summary.can_be_redeemed);
   *   }
   * );
   * ```
   */
  getGiftVoucherSummary(giftVoucherId: number): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}/summary`;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Canjea un bono regalo convirtiéndolo en voucher para el usuario
   *
   * @param giftVoucherId - ID del bono regalo a canjear
   * @param clientId - ID del cliente que canjea el bono
   * @returns Observable con el resultado del canje
   *
   * @example
   * ```typescript
   * this.giftVoucherService.redeemGiftVoucher(15, 42).subscribe(
   *   response => {
   *     console.log('Bono canjeado exitosamente');
   *     console.log('Voucher creado:', response.data);
   *   },
   *   error => console.error('Error al canjear:', error)
   * );
   * ```
   */
  redeemGiftVoucher(giftVoucherId: number, clientId: number): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}/redeem`;
    return this.http.post<ApiResponse>(url, { client_id: clientId }, { headers: this.getHeaders() });
  }

  /**
   * Envía un bono regalo por email al destinatario
   *
   * @param giftVoucherId - ID del bono regalo a enviar
   * @returns Observable con el resultado del envío
   *
   * @example
   * ```typescript
   * this.giftVoucherService.deliverGiftVoucher(15).subscribe(
   *   response => {
   *     console.log('Bono enviado por email');
   *   }
   * );
   * ```
   */
  deliverGiftVoucher(giftVoucherId: number): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}/deliver`;
    return this.http.post<ApiResponse>(url, {}, { headers: this.getHeaders() });
  }

  /**
   * Actualiza un bono regalo existente
   *
   * @param giftVoucherId - ID del bono regalo
   * @param updateData - Datos a actualizar
   * @returns Observable con el bono actualizado
   *
   * @example
   * ```typescript
   * this.giftVoucherService.updateGiftVoucher(15, {
   *   delivery_date: '2025-12-31'
   * }).subscribe(
   *   response => console.log('Bono actualizado')
   * );
   * ```
   */
  updateGiftVoucher(giftVoucherId: number, updateData: Partial<CreateGiftVoucherRequest>): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}`;
    return this.http.put<ApiResponse>(url, updateData, { headers: this.getHeaders() });
  }

  /**
   * Elimina un bono regalo (soft delete)
   *
   * @param giftVoucherId - ID del bono regalo
   * @returns Observable con el resultado
   *
   * @example
   * ```typescript
   * this.giftVoucherService.deleteGiftVoucher(15).subscribe(
   *   response => console.log('Bono eliminado')
   * );
   * ```
   */
  deleteGiftVoucher(giftVoucherId: number): Observable<ApiResponse> {
    const url = this.baseUrl + `/slug/gift-vouchers/${giftVoucherId}`;
    return this.http.delete<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene bonos regalo pendientes de entrega
   *
   * @returns Observable con bonos pendientes
   *
   * @example
   * ```typescript
   * this.giftVoucherService.getPendingDeliveryGiftVouchers().subscribe(
   *   response => {
   *     console.log('Bonos pendientes:', response.data);
   *   }
   * );
   * ```
   */
  getPendingDeliveryGiftVouchers(): Observable<ApiResponse> {
    const url = this.baseUrl + '/slug/gift-vouchers/pending-delivery';
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene los templates con información completa (frontend)
   * Incluye colores predeterminados e iconos
   *
   * @returns Array de templates con metadata
   *
   * @example
   * ```typescript
   * const templates = this.giftVoucherService.getAvailableTemplates();
   * console.log(templates);
   * // [{ key: 'birthday', name: 'Birthday', description: '...', ... }]
   * ```
   */
  getAvailableTemplates(): GiftVoucherTemplateInfo[] {
    return GIFT_VOUCHER_TEMPLATES;
  }

  /**
   * Obtiene información de un template específico
   *
   * @param templateKey - Clave del template
   * @returns Template info o null si no existe
   *
   * @example
   * ```typescript
   * const template = this.giftVoucherService.getTemplateInfo('birthday');
   * console.log(template.defaultBackgroundColor); // '#FFD700'
   * ```
   */
  getTemplateInfo(templateKey: string): GiftVoucherTemplateInfo | null {
    return GIFT_VOUCHER_TEMPLATES.find(t => t.key === templateKey) || null;
  }

  /**
   * Valida un monto de bono regalo
   *
   * @param amount - Monto a validar
   * @param minAmount - Monto mínimo (default: 10)
   * @param maxAmount - Monto máximo (default: 1000)
   * @returns Objeto con validación y mensaje
   *
   * @example
   * ```typescript
   * const validation = this.giftVoucherService.validateAmount(75);
   * if (!validation.valid) {
   *   console.error(validation.message);
   * }
   * ```
   */
  validateAmount(amount: number, minAmount: number = 10, maxAmount: number = 1000): { valid: boolean; message: string } {
    if (amount < minAmount) {
      return {
        valid: false,
        message: `El monto mínimo es CHF ${minAmount}`
      };
    }

    if (amount > maxAmount) {
      return {
        valid: false,
        message: `El monto máximo es CHF ${maxAmount}`
      };
    }

    if (amount % 1 !== 0 && (amount * 100) % 1 !== 0) {
      return {
        valid: false,
        message: 'El monto debe tener máximo 2 decimales'
      };
    }

    return {
      valid: true,
      message: ''
    };
  }

  /**
   * Valida un email
   *
   * @param email - Email a validar
   * @returns true si es válido
   *
   * @example
   * ```typescript
   * if (this.giftVoucherService.validateEmail('test@example.com')) {
   *   console.log('Email válido');
   * }
   * ```
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida un código hexadecimal de color
   *
   * @param color - Color en formato hex (#RRGGBB)
   * @returns true si es válido
   *
   * @example
   * ```typescript
   * if (this.giftVoucherService.validateColor('#FF5733')) {
   *   console.log('Color válido');
   * }
   * ```
   */
  validateColor(color: string): boolean {
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    return colorRegex.test(color);
  }

  /**
   * Formatea un monto para mostrar
   *
   * @param amount - Monto a formatear
   * @returns String formateado (ej: "CHF 150.00")
   *
   * @example
   * ```typescript
   * const formatted = this.giftVoucherService.formatAmount(150);
   * console.log(formatted); // "CHF 150.00"
   * ```
   */
  formatAmount(amount: number): string {
    return `CHF ${amount.toFixed(2)}`;
  }
}
