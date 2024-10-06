import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class HeaderComponent {
  constructor(public themeService: ThemeService, public translate: TranslateService) { }
  isOpenDropdownLang: boolean = false;
  selectedLang = 'es';

  switchLang(lang: any) {
    this.translate.use(lang);
    this.selectedLang = lang;
    this.isOpenDropdownLang = !this.isOpenDropdownLang
  }

}
