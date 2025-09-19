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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import {MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule} from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';



@NgModule({
  declarations: [HeaderComponent, LevelUserComponent, ModalAddUserComponent, ModalVoucherComponent, ModalNewUserComponent, ModalLoginComponent, ModalConditionsComponent,],
  imports: [
    CommonModule, BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, FormsModule,
    TranslateModule.forChild(), MatDialogModule, MatDividerModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatFormFieldModule, MatOptionModule, MatSelectModule, MatRadioModule,
    MatSnackBarModule, MatCheckboxModule
  ],
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: { verticalPosition: 'top', horizontalPosition: 'center', duration: 3000 }
    }
  ],
  exports: [HeaderComponent, LevelUserComponent, ModalAddUserComponent, ModalVoucherComponent, ModalNewUserComponent, ModalLoginComponent, ModalConditionsComponent,]
})
export class ComponentsModule { }
