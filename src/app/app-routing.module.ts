import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseComponent } from './pages/course/course.component';
import { CartComponent } from './pages/cart/cart.component';
import { UserComponent } from './pages/user/user.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { SlugResolver } from './resolver/slug.resolver';

const routes: Routes = [
  { path: ':slug', component: HomeComponent, resolve: { schoolData: SlugResolver }},
  { path: ':slug/course/:id', component: CourseComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/cart', component: CartComponent, resolve: { schoolData: SlugResolver } },
  { path: ':slug/user', component: UserComponent, resolve: { schoolData: SlugResolver } },
  { path: '**', component: PageNotFoundComponent },
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
