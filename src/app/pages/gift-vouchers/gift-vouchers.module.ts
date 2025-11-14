import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { GiftVouchersRoutingModule } from './gift-vouchers-routing.module';
import { GiftVoucherPurchaseComponent } from './purchase/purchase.component';
import { GiftVoucherVerifyComponent } from './verify/verify.component';
import { GiftVoucherSuccessComponent } from './success/success.component';
import { GiftVoucherCancelComponent } from './cancel/cancel.component';

/**
 * Module: GiftVouchersModule
 *
 * Módulo independiente para gift vouchers públicos.
 * Incluye compra, verificación y páginas de confirmación/cancelación.
 *
 * @author Claude Code
 * @date 2025-10-29
 * @task GIFT-002
 */
@NgModule({
  declarations: [
    GiftVoucherPurchaseComponent,
    GiftVoucherVerifyComponent,
    GiftVoucherSuccessComponent,
    GiftVoucherCancelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    GiftVouchersRoutingModule
  ]
})
export class GiftVouchersModule { }
