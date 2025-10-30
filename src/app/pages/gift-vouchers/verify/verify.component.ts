import { Component } from '@angular/core';
import { GiftVoucherService } from '../../../services/gift-voucher.service';
import { GiftVoucherVerifyResponse } from '../../../interface/gift-voucher';

/**
 * Component: GiftVoucherVerifyComponent
 *
 * Componente público para verificar códigos de gift vouchers.
 * Permite comprobar validez, balance y fecha de expiración sin autenticación.
 *
 * @author Claude Code
 * @date 2025-10-29
 * @task GIFT-002
 */
@Component({
  selector: 'app-gift-voucher-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class GiftVoucherVerifyComponent {
  code = '';
  result: GiftVoucherVerifyResponse | null = null;
  loading = false;
  error: string | null = null;

  constructor(private giftVoucherService: GiftVoucherService) {}

  /**
   * Verifica un código de gift voucher
   */
  verify(): void {
    if (!this.code || this.code.trim() === '') {
      this.error = 'Por favor ingresa un código';
      return;
    }

    this.loading = true;
    this.error = null;
    this.result = null;

    this.giftVoucherService.verifyPublic(this.code.trim()).subscribe({
      next: (response) => {
        this.result = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error verifying voucher:', error);
        this.result = { valid: false };
        this.error = error.error?.message || 'Error al verificar el código';
        this.loading = false;
      }
    });
  }

  /**
   * Limpia el formulario y resultados
   */
  reset(): void {
    this.code = '';
    this.result = null;
    this.error = null;
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
