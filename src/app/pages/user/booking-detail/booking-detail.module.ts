import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingDetailV2Component } from './booking-detail.component';

import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from './components/components.module';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatOptionModule} from '@angular/material/core';
import {MatRadioModule} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {CancelPartialBookginModalModule} from './components/cancel-partial-booking/cancel-partial-booking.module';
import {CancelBookginModalModule} from './components/cancel-booking/cancel-booking.module';
import {FluxModalModule} from './components/flux-component/flux-modal/app.module';

@NgModule({
  declarations: [
    BookingDetailV2Component
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    MatButtonModule,
    TranslateModule,
    MatFormFieldModule,
    MatOptionModule,
    MatRadioModule,
    MatSelectModule,
    FormsModule,
    CancelPartialBookginModalModule,
    CancelBookginModalModule,
    FluxModalModule
  ],
  exports: [
    BookingDetailV2Component
  ]
})
export class BookingDetailModule { }
