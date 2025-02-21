import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ComponenteInputComponent } from './app.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AngularEditorModule } from '@kolkov/angular-editor';


@NgModule({
  declarations: [ComponenteInputComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    AngularEditorModule, 
    FormsModule
  ],
  exports: [ComponenteInputComponent]
})
export class ComponenteEditorModule { }
