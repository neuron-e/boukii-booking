import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode: boolean = true;
  modeIcon:string;
  arrowLeft:string;
  arrowRight:string;
  arrowUp:string;
  cart:string;
  calendar:string;
  clock:string;
  arrowReturn:string;
  edit:string;
  logoPay:string;
  add:string;
  trash:string;
  user:string;
  avatarEmpty:string;
  close:string;

  constructor() {
    const savedTheme = localStorage.getItem('isDarkMode');
    if (savedTheme) {
      this.isDarkMode = JSON.parse(savedTheme);
    }
    this.setThemeConstants();
  }

  toggleTheme(): void {
    const root = document.documentElement;
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('isDarkMode', JSON.stringify(this.isDarkMode));

    if (this.isDarkMode) {
      /*DARK MODE*/
      root.style.setProperty('--background-image-screen', 'url(./assets/images/bg-dark.jpg)');
      root.style.setProperty('--background-color-screen', 'rgba(22, 28, 40, 0.8)');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-color-light', '#c8c8c8');
      root.style.setProperty('--text-color-medium', '#2b2f37');
      root.style.setProperty('--background-color-trans', 'rgba(22, 28, 40, 0.8)');
      root.style.setProperty('--background-color-full', '#161c28');
      root.style.setProperty('--box-shadow-color', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--button-grey', 'rgba(200, 200, 200, 0.24)');
      root.style.setProperty('--form-background', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--border-background', 'rgba(200, 200, 200, 0.12)');
      root.style.setProperty('--border-separator', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--level-background', '#08090E');

      this.modeIcon = '../../assets/images/light-mode.png';
      this.arrowLeft = '../../assets/icons/icons-outline-arrow-left-2.svg';
      this.arrowRight = '../../assets/icons/icons-outline-arrow-right-3-white.svg';
      this.arrowUp = '../../assets/icons/icons-outline-arrow-up-2.svg';
      this.cart = '../../assets/icons/cart.svg';
      this.calendar = '../../assets/icons/icons-outline-calendar-1.svg';
      this.clock = '../../assets/icons/icons-outline-clock.svg';
      this.arrowReturn = '../../assets/icons/icons-outline-arrow-left.svg';
      this.edit = '../../assets/icons/icons-outline-edit-white.svg';
      this.add = '../../assets/icons/icons-outline-add.svg';
      this.trash = '../../assets/icons/icons-outline-trash.svg';
      this.user = '../../assets/icons/user_landing.svg';
      this.close = '../../assets/icons/icons-outline-close.svg';
      this.logoPay = '../../assets/logos/login-rigth.png';
      this.avatarEmpty = '../../assets/images/avatar-empty.png';
    } else {
      /*LIGHT MODE*/
      root.style.setProperty('--background-image-screen', 'url(./assets/images/bg-light.jpeg)');
      root.style.setProperty('--background-color-screen', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--text-color-light', '#333333');
      root.style.setProperty('--text-color-medium', '#9fa5ab');
      root.style.setProperty('--background-color-trans', 'rgba(245, 245, 245, 0.9)');
      root.style.setProperty('--background-color-full', '#EFF0F2');
      root.style.setProperty('--box-shadow-color', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--button-grey', 'rgba(100, 100, 100, 0.85)');
      root.style.setProperty('--form-background', 'rgba(200, 200, 200, 0.2)');
      root.style.setProperty('--border-background', 'rgba(100, 100, 100, 0.08)');
      root.style.setProperty('--border-separator', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--level-background', '#D6D7DC');

      this.modeIcon = '../../assets/images/dark-mode.png';
      this.arrowLeft = '../../assets/icons/icons-outline-arrow-left-2-black.svg';
      this.arrowRight = '../../assets/icons/icons-outline-arrow-right-3-black.svg';
      this.arrowUp = '../../assets/icons/icons-outline-arrow-up-2-black.svg';
      this.cart = '../../assets/icons/cart-black.svg';
      this.calendar = '../../assets/icons/icons-outline-calendar-1-black.svg';
      this.clock = '../../assets/icons/icons-outline-clock-black.svg';
      this.arrowReturn = '../../assets/icons/icons-outline-arrow-left-black.svg';
      this.edit = '../../assets/icons/icons-outline-edit-black.svg';
      this.add = '../../assets/icons/icons-outline-add-black.svg';
      this.trash = '../../assets/icons/icons-outline-trash-black.svg';
      this.user = '../../assets/icons/user_landing-black.svg';
      this.close = '../../assets/icons/icons-outline-close-black.svg';
      this.logoPay = '../../assets/logos/login-rigth-black.png';
      this.avatarEmpty = '../../assets/images/avatar-empty-black.png';
    }
  }

  private setThemeConstants() {
    const root = document.documentElement;
    if (this.isDarkMode) {
      /*DARK MODE*/
      root.style.setProperty('--background-image-screen', 'url(./assets/images/bg-dark.jpg)');
      root.style.setProperty('--background-color-screen', 'rgba(22, 28, 40, 0.8)');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--text-color-light', '#c8c8c8');
      root.style.setProperty('--text-color-medium', '#2b2f37');
      root.style.setProperty('--background-color-trans', 'rgba(22, 28, 40, 0.8)');
      root.style.setProperty('--background-color-full', '#161c28');
      root.style.setProperty('--box-shadow-color', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--button-grey', 'rgba(200, 200, 200, 0.24)');
      root.style.setProperty('--form-background', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--border-background', 'rgba(200, 200, 200, 0.12)');
      root.style.setProperty('--border-separator', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--level-background', '#08090E');

      this.modeIcon = '../../assets/images/light-mode.png';
      this.arrowLeft = '../../assets/icons/icons-outline-arrow-left-2.svg';
      this.arrowRight = '../../assets/icons/icons-outline-arrow-right-3-white.svg';
      this.arrowUp = '../../assets/icons/icons-outline-arrow-up-2.svg';
      this.cart = '../../assets/icons/cart.svg';
      this.calendar = '../../assets/icons/icons-outline-calendar-1.svg';
      this.clock = '../../assets/icons/icons-outline-clock.svg';
      this.arrowReturn = '../../assets/icons/icons-outline-arrow-left.svg';
      this.edit = '../../assets/icons/icons-outline-edit-white.svg';
      this.add = '../../assets/icons/icons-outline-add.svg';
      this.trash = '../../assets/icons/icons-outline-trash.svg';
      this.user = '../../assets/icons/user_landing.svg';
      this.close = '../../assets/icons/icons-outline-close.svg';
      this.logoPay = '../../assets/logos/login-rigth.png';
      this.avatarEmpty = '../../assets/images/avatar-empty.png';
    } else {
      /*LIGHT MODE*/
      root.style.setProperty('--background-image-screen', 'url(./assets/images/bg-light.jpeg)');
      root.style.setProperty('--background-color-screen', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--text-color-light', '#333333');
      root.style.setProperty('--text-color-medium', '#9fa5ab');
      root.style.setProperty('--background-color-trans', 'rgba(245, 245, 245, 0.9)');
      root.style.setProperty('--background-color-full', '#EFF0F2');
      root.style.setProperty('--box-shadow-color', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--button-grey', 'rgba(100, 100, 100, 0.85)');
      root.style.setProperty('--form-background', 'rgba(200, 200, 200, 0.2)');
      root.style.setProperty('--border-background', 'rgba(100, 100, 100, 0.08)');
      root.style.setProperty('--border-separator', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--level-background', '#D6D7DC');

      this.modeIcon = '../../assets/images/dark-mode.png';
      this.arrowLeft = '../../assets/icons/icons-outline-arrow-left-2-black.svg';
      this.arrowRight = '../../assets/icons/icons-outline-arrow-right-3-black.svg';
      this.arrowUp = '../../assets/icons/icons-outline-arrow-up-2-black.svg';
      this.cart = '../../assets/icons/cart-black.svg';
      this.calendar = '../../assets/icons/icons-outline-calendar-1-black.svg';
      this.clock = '../../assets/icons/icons-outline-clock-black.svg';
      this.arrowReturn = '../../assets/icons/icons-outline-arrow-left-black.svg';
      this.edit = '../../assets/icons/icons-outline-edit-black.svg';
      this.add = '../../assets/icons/icons-outline-add-black.svg';
      this.trash = '../../assets/icons/icons-outline-trash-black.svg';
      this.user = '../../assets/icons/user_landing-black.svg';
      this.close = '../../assets/icons/icons-outline-close-black.svg';
      this.logoPay = '../../assets/logos/login-rigth-black.png';
      this.avatarEmpty = '../../assets/images/avatar-empty-black.png';
    }
  }

  isDarkModeEnabled(): boolean {
    return this.isDarkMode;
  }
}