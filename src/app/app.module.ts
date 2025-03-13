import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { CourseComponent } from './pages/course/course.component';
import { CartComponent } from './pages/cart/cart.component';
import { UserComponent } from './pages/user/user.component';
import { ComponentsModule } from './components/components.module';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BookingDetailComponent } from './pages/user/booking-detail/booking-detail.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { UserDetailComponent } from './pages/user/user-detail/user-detail.component';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatListModule } from '@angular/material/list';
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';
import { MatSortModule } from '@angular/material/sort';
import { SlugResolver } from './resolver/slug.resolver';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { FooterComponent } from './layout/footer/app.component';
import { HeaderComponent } from './layout/header/app.component';
import { CourseCardComponent } from './components/course-card/app.component';
import { MobileModalComponent } from './components/mobile-modal/app.component';
import { CourseModalConfirmComponent } from './pages/course/modal-confirm/app.component';
import { UserDetailDialogComponent } from './pages/user/user-detail/dialog/dialog.component';
import { ConfirmModalModule } from './components/confirm-dialog/confirm-dialog.component.module';
import { FluxUploadImgModule } from './pages/user/user-detail/upload-img/app.module';
import { SportCardComponent } from './pages/user/sport-card/app.component';
import { ComponenteDatePickerModule } from './components/form/datepicker/app.module';
import { ComponenteSelectModule } from './components/form/select/app.module';
import { ModalAddUserComponent } from './components/modal-add-user/modal-add-user.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CourseCardComponent,
    CourseComponent,
    CartComponent,
    UserComponent,
    BookingDetailComponent,
    UserDetailComponent, SportCardComponent,
    PageNotFoundComponent,
    HeaderComponent,
    FooterComponent,
    MobileModalComponent,
    CourseModalConfirmComponent,
    UserDetailDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ComponentsModule,
    ConfirmModalModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatSelectModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    FormsModule, FluxUploadImgModule,
    MatExpansionModule,
    MatBadgeModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatAutocompleteModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    CommonModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatMenuModule,
    MatDividerModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatListModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    MatSortModule,
    MatFormFieldModule,
    ComponenteDatePickerModule,
    ComponenteSelectModule
    ,
  ],
  providers: [SlugResolver],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(translate: TranslateService) {
    translate.setDefaultLang('fr');
    translate.use('fr');
  }
}


