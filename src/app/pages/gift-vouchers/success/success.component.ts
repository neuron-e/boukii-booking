import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GiftVoucherService } from '../../../services/gift-voucher.service';
import { GiftVoucherVerifyResponse } from '../../../interface/gift-voucher';
import { take } from 'rxjs/operators';
import {
  buildGiftVoucherLink,
  extractGiftVoucherSlug
} from '../gift-voucher-routing.utils';

/**
 * Component: GiftVoucherSuccessComponent
 *
 * Public page that confirms a successful gift-voucher purchase.
 * It fetches voucher information so we can show a localized summary.
 */
@Component({
  selector: 'app-gift-voucher-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class GiftVoucherSuccessComponent implements OnInit {
  voucherId: number | null = null;
  voucherCode: string | null = null;
  voucherDetails: GiftVoucherVerifyResponse | null = null;
  recipientName: string | null = null;
  senderName: string | null = null;
  loading = false;
  errorKey: string | null = null;
  private giftVoucherSlug: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private giftVoucherService: GiftVoucherService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.voucherId = params['voucher_id'] ? Number(params['voucher_id']) : null;
      this.voucherCode = params['code'] || null;
      this.giftVoucherSlug = extractGiftVoucherSlug(this.route);

      if (this.voucherCode) {
        this.fetchVoucherDetails(this.voucherCode);
      } else {
        this.errorKey = 'gift_vouchers.error_summary_missing_code';
      }
    });
  }

  get amount(): number | null {
    return this.voucherDetails?.amount ?? null;
  }

  get currency(): string | null {
    return this.voucherDetails?.currency ?? null;
  }

  private fetchVoucherDetails(code: string): void {
    this.loading = true;
    this.errorKey = null;

    this.giftVoucherService.verifyPublic(code, this.giftVoucherSlug ?? undefined, this.voucherId ?? undefined).subscribe({
      next: result => {
        this.loading = false;

        if (!result?.valid) {
          this.voucherDetails = null;
          this.errorKey = 'gift_vouchers.error_summary_invalid';
          return;
        }

        this.voucherDetails = result;
        this.recipientName = result.recipient_name ?? null;
        this.senderName = result.sender_name ?? null;
      },
      error: () => {
        this.loading = false;
        this.voucherDetails = null;
        this.errorKey = 'gift_vouchers.error_summary_load';
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
}
