import { NgModule } from '@angular/core';
import { ComponenteButtonComponent } from './app.component';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [ComponenteButtonComponent],
  imports: [
    MatButtonModule,
    CommonModule,
    MatIconModule,
    TranslateModule
  ],
  exports: [ComponenteButtonComponent]
})

export class ComponenteButtonModule { }
