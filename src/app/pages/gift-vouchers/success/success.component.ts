import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Component: GiftVoucherSuccessComponent
 *
 * Página de confirmación después de una compra exitosa de gift voucher.
 * Muestra mensaje de éxito y detalles del voucher.
 *
 * @author Claude Code
 * @date 2025-10-29
 * @task GIFT-002
 */
@Component({
  selector: 'app-gift-voucher-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss']
})
export class GiftVoucherSuccessComponent implements OnInit {
  voucherId: string | null = null;
  voucherCode: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.voucherId = params['voucher_id'] || null;
      this.voucherCode = params['code'] || null;
    });
  }
}
