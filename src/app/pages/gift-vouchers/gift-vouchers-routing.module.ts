import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GiftVoucherPurchaseComponent } from './purchase/purchase.component';
import { GiftVoucherVerifyComponent } from './verify/verify.component';
import { GiftVoucherSuccessComponent } from './success/success.component';
import { GiftVoucherCancelComponent } from './cancel/cancel.component';

/**
 * Module: GiftVouchersRoutingModule
 *
 * Configuración de rutas para el módulo de gift vouchers públicos.
 *
 * @author Claude Code
 * @date 2025-10-29
 * @task GIFT-002
 */
const routes: Routes = [
  {
    path: '',
    redirectTo: 'purchase',
    pathMatch: 'full'
  },
  {
    path: 'purchase',
    component: GiftVoucherPurchaseComponent
  },
  {
    path: 'verify',
    component: GiftVoucherVerifyComponent
  },
  {
    path: 'success',
    component: GiftVoucherSuccessComponent
  },
  {
    path: 'cancel',
    component: GiftVoucherCancelComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GiftVouchersRoutingModule { }
