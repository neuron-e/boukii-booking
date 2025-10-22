/**
 * Interface: DiscountCode
 *
 * Representa un código de descuento promocional que puede ser aplicado
 * durante el flujo de reserva para obtener un descuento.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 10 min
 */

export interface DiscountCode {
  id: number;
  code: string;
  description?: string;

  // Tipo y valor del descuento
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;

  // Límites de uso
  total?: number | null;
  remaining?: number | null;
  max_uses_per_user?: number;

  // Vigencia
  valid_from?: string | null;
  valid_to?: string | null;

  // Restricciones
  school_id?: number | null;
  sport_ids?: number[] | null;
  course_ids?: number[] | null;
  degree_ids?: number[] | null;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;

  // Estado
  active: boolean;

  // Metadatos
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Interface: DiscountCodeValidationRequest
 *
 * Datos requeridos para validar un código de descuento
 */
export interface DiscountCodeValidationRequest {
  code: string;
  school_id: number;
  course_id?: number;
  sport_id?: number;
  degree_id?: number;
  amount: number;
  user_id?: number;
}

/**
 * Interface: DiscountCodeValidationResponse
 *
 * Respuesta de la validación de un código de descuento
 */
export interface DiscountCodeValidationResponse {
  valid: boolean;
  discount_code: DiscountCode | null;
  message: string;
  discount_amount: number;
}

/**
 * Interface: AppliedDiscount
 *
 * Representa un descuento aplicado en el carrito
 */
export interface AppliedDiscount {
  type: 'code' | 'voucher';
  code: string;
  discount_amount: number;
  discount_code?: DiscountCode;
}
