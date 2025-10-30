import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseComponent } from './pages/course/course.component';
import { CartComponent } from './pages/cart/cart.component';
import { UserComponent } from './pages/user/user.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { SlugResolver } from './resolver/slug.resolver';
import {SlugGuard} from './slug.guard';
import {TermsComponent} from './pages/terms/terms.component';
import {ContactComponent} from './pages/contact/contact.component';
import {PrivacyComponent} from './pages/privacy/privacy.component';

const routes: Routes = [
  { path: '404', canActivate: [SlugGuard], component: PageNotFoundComponent },
  {
    path: 'gift-vouchers',
    loadChildren: () => import('./pages/gift-vouchers/gift-vouchers.module').then(m => m.GiftVouchersModule)
  },
  { path: ':slug', component: HomeComponent, resolve: { schoolData: SlugResolver }},
  { path: ':slug/course/:id', component: CourseComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/cart', component: CartComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/user', component: UserComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/terms', component: TermsComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/privacy', component: PrivacyComponent , resolve: { schoolData: SlugResolver } },
  { path: ':slug/contact', component: ContactComponent, resolve: { schoolData: SlugResolver } },
  { path: '**', canActivate: [SlugGuard], component: PageNotFoundComponent },

];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'top',
  anchorScrolling: 'enabled',
  scrollOffset: [0, 0]
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
