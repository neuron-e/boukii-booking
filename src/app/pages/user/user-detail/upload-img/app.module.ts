import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FluxUploadImgComponent } from './app.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [FluxUploadImgComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  exports: [FluxUploadImgComponent]
})
export class FluxUploadImgModule { }
