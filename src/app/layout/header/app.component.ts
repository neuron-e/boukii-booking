import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';
import { CartService } from 'src/app/services/cart.service';
import { SchoolService } from 'src/app/services/school.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class HeaderComponent implements OnInit {
  constructor(public themeService: ThemeService, public translate: TranslateService, public router: Router, public schoolService: SchoolService
    , private authService: AuthService, private cartService: CartService) { }

  isOpenDropdownLang: boolean = false;
  isOpenDropdownUser: boolean = false;
  selectedLang = 'es';
  schoolData: any
  userLogged: any
  cart: any = {}

  async ngOnInit() {
    this.schoolService.fetchSchoolData();
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data;
          let storageSlug = localStorage.getItem(this.schoolData.data.slug + '-boukiiUser');
          if (storageSlug) {
            const slug = localStorage.getItem(this.schoolData.data.slug + '-cart');
            this.userLogged = JSON.parse(storageSlug);
            const cart = localStorage.getItem(this.schoolData.data.slug + '-cart');
            this.cart = cart ? JSON.parse(cart) : {};
            this.selectedLang = localStorage.getItem(this.schoolData.data.slug + '-lang') || 'fr';
            this.translate.use(this.selectedLang);
            if (slug !== null) {
              this.cart = JSON.parse(slug !== null ? slug : '{}');
            } else {
              this.cart = {};
            }
          } else {
            localStorage.clear();
          }
          this.authService.user.next(this.userLogged);
        }
      }
    );
    this.authService.getUserData().subscribe(
      data => {
        if (data) {
          this.userLogged = data;
        }
      }
    );

    this.cartService.getCartData().subscribe(
      data => {
        this.cart = data || {};
      }
    );
  }

  switchLang(lang: any) {
    localStorage.setItem(this.schoolData.data.slug + '-lang', lang);
    this.translate.use(lang);
    this.selectedLang = lang;
  }

  logOut() {
    this.authService.user.next(null);
    this.userLogged = null;
    localStorage.clear();
    this.router.navigate(['/' + this.schoolData.data.slug]);
  }

  calculateCartLength() {
    let uniqueCourses = new Set();
    if (!this.cart || typeof this.cart !== 'object') {
      return 0;
    }
    for (let courseId in this.cart) {
      if (this.cart.hasOwnProperty(courseId)) {
        uniqueCourses.add(courseId);
      }
    }
    return uniqueCourses.size;
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  goBack(url: string) {
    this.router.navigate(['/' + this.schoolData.data.slug + "/" + url]);
  }
}
