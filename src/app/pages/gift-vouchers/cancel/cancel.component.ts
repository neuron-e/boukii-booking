import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs/operators';
import { GiftVoucherService } from '../../../services/gift-voucher.service';
import {
  buildGiftVoucherLink,
  extractGiftVoucherSlug
} from '../gift-voucher-routing.utils';

/**
 * Component: GiftVoucherCancelComponent
 *
 * Página mostrada cuando se cancela una compra de gift voucher.
 *
 * @author Claude Code
 * @date 2025-10-29
 * @task GIFT-002
 */
@Component({
  selector: 'app-gift-voucher-cancel',
  templateUrl: './cancel.component.html',
  styleUrls: ['./cancel.component.scss']
})
export class GiftVoucherCancelComponent implements OnInit {
  private giftVoucherSlug: string | null = null;
  voucherId: number | null = null;
  voucherCode: string | null = null;
  cancellationError: string | null = null;

  constructor(
    private giftVoucherService: GiftVoucherService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.giftVoucherSlug = extractGiftVoucherSlug(this.route);
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.voucherId = params['voucher_id'] ? Number(params['voucher_id']) : null;
      this.voucherCode = params['code'] || null;
      this.cancelPendingVoucher();
    });
  }

  cancelPendingVoucher(): void {
    if (!this.voucherId || !this.voucherCode) {
      return;
    }

    this.giftVoucherService
      .cancelPublic(this.voucherId, this.voucherCode, this.giftVoucherSlug ?? undefined)
      .subscribe({
        next: () => {
          this.cancellationError = null;
        },
        error: (err) => {
          console.error('Error cancelling voucher:', err);
          this.cancellationError = err.error?.message || 'Unable to cancel the voucher at this time.';
        }
      });
  }

  getGiftVoucherLink(child: string): string {
    return buildGiftVoucherLink(this.giftVoucherSlug, child);
  }

  getSchoolHomeLink(): any[] {
    if (this.giftVoucherSlug) {
      return ['/', this.giftVoucherSlug];
    }
    return ['/'];
  }

  getContactLink(): any[] {
    if (this.giftVoucherSlug) {
      return ['/', this.giftVoucherSlug, 'contact'];
    }
    return ['/contact'];
  }
}
