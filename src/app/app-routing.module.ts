import { NgModule } from '@angular/core';
import { RouterModule, Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CourseComponent } from './pages/course/course.component';
import { CartComponent } from './pages/cart/cart.component';
import { UserComponent } from './pages/user/user.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'course/:id', component: CourseComponent },
  { path: 'cart', component: CartComponent },
  { path: 'user', component: UserComponent },
  { path: '**', redirectTo: '' },
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
