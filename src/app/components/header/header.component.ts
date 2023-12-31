import {Component, Input, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';
import {SchoolService} from '../../services/school.service';
import {AuthService} from '../../services/auth.service';
import {CartService} from '../../services/cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userLogged: any;
  cart: any;
  schoolData: any = null;
  isOpenDropdownLang = false;
  isOpenDropdownUser = false;
  selectedLang = 'fr';

  @Input() isModalLogin:boolean=false;
  @Input() isModalNewUser:boolean=false;

  constructor(private router: Router, public translate: TranslateService, public themeService: ThemeService,
              private schoolService: SchoolService, private authService: AuthService, private cartService: CartService) { }

  ngOnInit(): void {
    this.schoolService.fetchSchoolData();
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data;
          let storageSlug = localStorage.getItem(this.schoolData.data.slug+ '-boukiiUser');
          if(storageSlug) {
            const slug = localStorage.getItem(this.schoolData.data.slug+'-cart');
            this.userLogged = JSON.parse(storageSlug);
            this.cart = JSON.parse(localStorage.getItem(this.schoolData.data.slug+'-cart') ?? '');
            if (slug!==null) {
              this.cart = JSON.parse(slug !== null ? slug : '');
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
        if (data) {
          this.cart = data;
        }
      }
    );
  }

  calculateCartLength() {
    let uniqueCourses = new Set();

    for (let courseId in this.cart) {
      if (this.cart.hasOwnProperty(courseId)) {
        uniqueCourses.add(courseId);
      }
    }
    return uniqueCourses.size;
  }

  toggleDropdownLang() {
    this.isOpenDropdownLang = !this.isOpenDropdownLang;
  }

  toggleDropdownUser() {
    this.isOpenDropdownUser = !this.isOpenDropdownUser;
  }

  logOut() {
    this.authService.user.next(null);
    this.userLogged = null;
    localStorage.clear();
  }

  selectLanguage(lang: string) {
    console.log('Language selected:', lang);
    this.isOpenDropdownLang = false;
  }

  switchLang(lang: any){
    this.translate.use(lang);
    this.selectedLang = lang;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openModalLogin() {
    this.isModalLogin = true;
  }

  closeModalLogin() {
    this.isModalLogin = false;
  }

  openModalNewUser() {
    this.isModalNewUser = true;
  }

  closeModalNewUser() {
    this.isModalNewUser = false;
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

}
