import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './header/header.component';
import { LevelUserComponent } from './level-user/level-user.component';
import { ModalAddUserComponent } from './modal-add-user/modal-add-user.component';
import { ModalVoucherComponent } from './modal-voucher/modal-voucher.component';
import { ModalNewUserComponent } from './modal-new-user/modal-new-user.component';
import { ModalLoginComponent } from './modal-login/modal-login.component';
import { ModalConditionsComponent } from './modal-conditions/modal-conditions.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { ConfirmModalComponent } from './confirm-dialog/confirm-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';



@NgModule({
  declarations: [HeaderComponent, LevelUserComponent, ModalAddUserComponent, ModalVoucherComponent, ModalNewUserComponent, ModalLoginComponent, ModalConditionsComponent, ConfirmModalComponent],
  imports: [
    CommonModule, BrowserModule, BrowserAnimationsModule, TranslateModule, ReactiveFormsModule, FormsModule, TranslateModule, MatDialogModule, MatDividerModule
  ],
  exports: [HeaderComponent, LevelUserComponent, ModalAddUserComponent, ModalVoucherComponent, ModalNewUserComponent, ModalLoginComponent, ModalConditionsComponent, ConfirmModalComponent]
})
export class ComponentsModule { }
