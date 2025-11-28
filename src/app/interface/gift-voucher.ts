/**
 * Interfaces: Gift Voucher
 *
 * Interfaces TypeScript para la gestión de bonos regalo en la aplicación Boukii.
 * Permite a usuarios comprar bonos regalo que pueden ser canjeados por otros usuarios.
 *
 * @author Claude Code
 * @date 2025-10-16
 * @time 10 min
 */

/**
 * Modelo principal de bono regalo
 */
export interface GiftVoucher {
  id?: number;
  voucher_id?: number | null;
  amount: number;
  personal_message?: string;
  sender_name?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_locale?: string;
  template?: GiftVoucherTemplate;
  background_color?: string;
  text_color?: string;
  recipient_email: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_locale?: string;
  delivery_date?: string | null;
  is_delivered?: boolean;
  delivered_at?: string | null;
  is_redeemed?: boolean;
  redeemed_at?: string | null;
  redeemed_by_client_id?: number | null;
  purchased_by_client_id?: number | null;
  school_id: number;
  is_paid?: boolean;
  payment_reference?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * Request para crear un bono regalo (compra)
 */
export interface CreateGiftVoucherRequest {
  amount: number;
  recipient_email: string;
  school_id: number;
  recipient_name?: string;
  personal_message?: string;
  sender_name?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_locale?: string;
  template?: GiftVoucherTemplate;
  background_color?: string;
  text_color?: string;
  delivery_date?: string;
  recipient_phone?: string;
  recipient_locale?: string;
}

/**
 * Response del servidor al crear/obtener un bono regalo
 */
export interface GiftVoucherResponse {
  id: number;
  amount: number;
  sender_name: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_locale: string | null;
  recipient_email: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_locale: string | null;
  template: string | null;
  personal_message: string | null;
  background_color: string | null;
  text_color: string | null;
  delivery_date: string | null;
  is_delivered: boolean;
  delivered_at: string | null;
  is_redeemed: boolean;
  redeemed_at: string | null;
  can_be_redeemed: boolean;
  is_pending_delivery: boolean;
  is_paid: boolean;
  voucher_id: number | null;
  school_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Request para canjear un bono regalo
 */
export interface RedeemGiftVoucherRequest {
  gift_voucher_id: number;
  client_id: number;
}

/**
 * Resumen del bono regalo
 */
export interface GiftVoucherSummary {
  id: number;
  amount: number;
  sender_name: string | null;
  recipient_email: string;
  recipient_name: string | null;
  template: string | null;
  delivery_date: string | null;
  is_delivered: boolean;
  delivered_at: string | null;
  is_redeemed: boolean;
  redeemed_at: string | null;
  can_be_redeemed: boolean;
  is_pending_delivery: boolean;
  is_paid: boolean;
  voucher_id: number | null;
}

/**
 * Templates disponibles para bonos regalo
 */
export type GiftVoucherTemplate =
  | 'default'
  | 'christmas'
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'congratulations'
  | 'valentine'
  | 'easter'
  | 'summer'
  | 'winter';

/**
 * Información de template con metadata
 */
export interface GiftVoucherTemplateInfo {
  key: GiftVoucherTemplate;
  name: string;
  description: string;
  defaultBackgroundColor: string;
  defaultTextColor: string;
  icon?: string;
}

/**
 * Estado del proceso de compra de bono regalo
 */
export interface GiftVoucherPurchaseState {
  step: 'amount' | 'personalize' | 'recipient' | 'payment' | 'confirmation';
  giftVoucher: Partial<CreateGiftVoucherRequest>;
  isProcessing: boolean;
  error: string | null;
}

/**
 * Montos predefinidos para bonos regalo
 */
export interface GiftVoucherAmountOption {
  value: number;
  label: string;
  popular?: boolean;
}

/**
 * Configuración de templates con colores y estilos
 */
export const GIFT_VOUCHER_TEMPLATES: GiftVoucherTemplateInfo[] = [
  {
    key: 'default',
    name: 'Default',
    description: 'Simple and elegant',
    defaultBackgroundColor: '#FFFFFF',
    defaultTextColor: '#333333',
    icon: 'card_giftcard'
  },
  {
    key: 'christmas',
    name: 'Christmas',
    description: 'Festive holiday spirit',
    defaultBackgroundColor: '#C41E3A',
    defaultTextColor: '#FFFFFF',
    icon: 'celebration'
  },
  {
    key: 'birthday',
    name: 'Birthday',
    description: 'Celebrate special day',
    defaultBackgroundColor: '#FFD700',
    defaultTextColor: '#333333',
    icon: 'cake'
  },
  {
    key: 'anniversary',
    name: 'Anniversary',
    description: 'Memorable moments',
    defaultBackgroundColor: '#8B4789',
    defaultTextColor: '#FFFFFF',
    icon: 'favorite'
  },
  {
    key: 'thank_you',
    name: 'Thank You',
    description: 'Express gratitude',
    defaultBackgroundColor: '#4CAF50',
    defaultTextColor: '#FFFFFF',
    icon: 'thumb_up'
  },
  {
    key: 'congratulations',
    name: 'Congratulations',
    description: 'Celebrate achievements',
    defaultBackgroundColor: '#FF9800',
    defaultTextColor: '#FFFFFF',
    icon: 'emoji_events'
  },
  {
    key: 'valentine',
    name: "Valentine's Day",
    description: 'Share the love',
    defaultBackgroundColor: '#E91E63',
    defaultTextColor: '#FFFFFF',
    icon: 'favorite_border'
  },
  {
    key: 'easter',
    name: 'Easter',
    description: 'Spring celebration',
    defaultBackgroundColor: '#9C27B0',
    defaultTextColor: '#FFFFFF',
    icon: 'egg'
  },
  {
    key: 'summer',
    name: 'Summer',
    description: 'Sunny vibes',
    defaultBackgroundColor: '#00BCD4',
    defaultTextColor: '#FFFFFF',
    icon: 'wb_sunny'
  },
  {
    key: 'winter',
    name: 'Winter',
    description: 'Cozy season',
    defaultBackgroundColor: '#2196F3',
    defaultTextColor: '#FFFFFF',
    icon: 'ac_unit'
  }
];

/**
 * Montos predefinidos sugeridos
 */
export const GIFT_VOUCHER_AMOUNT_OPTIONS: GiftVoucherAmountOption[] = [
  { value: 50, label: '50' },
  { value: 100, label: '100', popular: true },
  { value: 150, label: '150', popular: true },
  { value: 200, label: '200' },
  { value: 250, label: '250' },
  { value: 500, label: '500' }
];

/**
 * Request para compra pública de gift voucher (sin autenticación)
 */
export interface GiftVoucherPurchaseRequest {
  amount: number;
  currency: string;
  school_id: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_locale?: string;
  recipient_name: string;
  recipient_email: string;
  recipient_phone?: string;
  recipient_locale?: string;
  sender_name?: string;
  personal_message?: string;
  template?: string;
  delivery_date?: string;
}

/**
 * Response de compra pública
 */
export interface GiftVoucherPurchaseResponse {
  success: boolean;
  message: string;
  data: {
    gift_voucher: GiftVoucher;
    voucher_code: string;
    payment_url?: string | null;
  };
}

/**
 * Response de verificación pública
 */
export interface GiftVoucherVerifyResponse {
  valid: boolean;
  id?: number;
  code?: string;
  amount?: number;
  balance?: number;
  currency?: string;
  expires_at?: string;
  status?: string;
  is_expired?: boolean;
  recipient_name?: string;
  sender_name?: string;
}
