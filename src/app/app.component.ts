import { Component } from '@angular/core';
import localeIt from "@angular/common/locales/it";
import localeEnGb from "@angular/common/locales/en-GB";
import localeEs from "@angular/common/locales/es";
import localeDe from "@angular/common/locales/de";
import localeFr from "@angular/common/locales/fr";
import {TranslateService} from '@ngx-translate/core';
import {catchError} from 'rxjs/operators';
import {SchoolService} from './services/school.service';
import {ActivatedRouteSnapshot} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  locales: { locale: any, lan: string }[] =
    [
      { locale: localeDe, lan: 'de' },
      { locale: localeEs, lan: 'es' },
      { locale: localeIt, lan: 'it-IT' },
      { locale: localeEnGb, lan: 'en-GB' },
      { locale: localeFr, lan: 'fr' },
    ]

  constructor( private translateService: TranslateService, private schoolService: SchoolService) {
    const lang = sessionStorage.getItem('lang');
    if (lang && lang.length > 0) {
      this.translateService.setDefaultLang(lang);
      this.translateService.currentLang = lang;
    } else {
      if (this.locales.find((a: any) => a.lan === navigator.language.split('-')[0])) {
        this.translateService.setDefaultLang(navigator.language.split('-')[0]);
        this.translateService.currentLang = navigator.language.split('-')[0];
        sessionStorage.setItem('lang', navigator.language.split("-")[0]);
      } else {
        const fallback = 'de';
        this.translateService.setDefaultLang(fallback);
        this.translateService.currentLang = fallback;
        sessionStorage.setItem('lang', fallback);
      }
    }
    setTimeout(() => {
      if(!this.schoolService.getSchoolData()) {
        this.schoolService.fetchSchoolData().pipe(catchError(err => {
          console.log(err);
          return '';
        }));
      }

    }, 150);
  }
}
