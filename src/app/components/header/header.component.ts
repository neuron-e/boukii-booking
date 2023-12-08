import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  userLogged:boolean=true;

  isOpenDropdownLang = false;
  isOpenDropdownUser = false;
  selectedLang = 'fr';

  isModalLogin:boolean=false;
  isModalNewUser:boolean=false;

  constructor(private router: Router, public translate: TranslateService, public themeService: ThemeService) { }

  ngOnInit(): void {
  }

  toggleDropdownLang() {
    this.isOpenDropdownLang = !this.isOpenDropdownLang;
  }

  toggleDropdownUser() {
    this.isOpenDropdownUser = !this.isOpenDropdownUser;
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
