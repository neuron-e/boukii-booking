import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../interface/api-response';
import { DiscountCodeValidationRequest, DiscountCodeValidationResponse } from '../interface/discount-code';

/**
 * Service: DiscountCodeService
 *
 * Servicio para gestionar códigos de descuento en el flujo de reserva.
 * Permite validar códigos promocionales y obtener información de descuentos aplicables.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 15 min
 *
 * Endpoints utilizados:
 * - POST /slug/discount-codes/validate - Validar código con datos de reserva
 * - GET /slug/discount-codes/active - Obtener códigos activos para una escuela
 */
@Injectable({
  providedIn: 'root'
})
export class DiscountCodeService extends ApiService {

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  /**
   * Valida un código de descuento contra los datos de la reserva
   *
   * @param validationData - Datos de validación (código, school_id, monto, etc.)
   * @returns Observable con la respuesta de validación
   *
   * @example
   * ```typescript
   * const data: DiscountCodeValidationRequest = {
   *   code: 'VERANO2025',
   *   school_id: 1,
   *   course_id: 5,
   *   amount: 150.00,
   *   user_id: 123
   * };
   *
   * this.discountCodeService.validateCode(data).subscribe(
   *   response => {
   *     if (response.data.valid) {
   *       console.log('Descuento aplicado:', response.data.discount_amount);
   *     } else {
   *       console.error('Error:', response.data.message);
   *     }
   *   }
   * );
   * ```
   */
  validateCode(validationData: DiscountCodeValidationRequest): Observable<ApiResponse> {
    const url = this.baseUrl + '/slug/discount-codes/validate';
    return this.http.post<ApiResponse>(url, validationData, { headers: this.getHeaders() });
  }

  /**
   * Obtiene los códigos de descuento activos para una escuela específica
   *
   * @param schoolId - ID de la escuela
   * @returns Observable con la lista de códigos activos
   *
   * @example
   * ```typescript
   * this.discountCodeService.getActiveCodesForSchool(1).subscribe(
   *   response => {
   *     console.log('Códigos activos:', response.data);
   *   }
   * );
   * ```
   */
  getActiveCodesForSchool(schoolId: number): Observable<ApiResponse> {
    const url = this.baseUrl + '/slug/discount-codes/active?school_id=' + schoolId;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Calcula el monto de descuento para mostrar preview
   *
   * @param discountType - Tipo de descuento ('percentage' o 'fixed_amount')
   * @param discountValue - Valor del descuento
   * @param purchaseAmount - Monto de compra
   * @param maxDiscount - Descuento máximo permitido (opcional)
   * @returns Monto de descuento calculado
   *
   * @example
   * ```typescript
   * const discount = this.discountCodeService.calculateDiscountPreview(
   *   'percentage',
   *   20,
   *   100,
   *   15
   * );
   * // Retorna: 15 (20% de 100 = 20, pero limitado a 15)
   * ```
   */
  calculateDiscountPreview(
    discountType: 'percentage' | 'fixed_amount',
    discountValue: number,
    purchaseAmount: number,
    maxDiscount?: number
  ): number {
    let discount = 0;

    if (discountType === 'percentage') {
      discount = (purchaseAmount * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    // Aplicar límite máximo si existe
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    // No puede ser mayor al monto de compra
    if (discount > purchaseAmount) {
      discount = purchaseAmount;
    }

    return Math.round(discount * 100) / 100; // Redondear a 2 decimales
  }
}
