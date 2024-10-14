import { Component, Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SchoolService } from 'src/app/services/school.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class HeaderComponent implements OnInit {
  constructor(public themeService: ThemeService, public translate: TranslateService, public router: Router, public schoolService: SchoolService) { }
  isOpenDropdownLang: boolean = false;
  selectedLang = 'es';
  schoolData: any


  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data
        }
      }
    );
  }
  switchLang(lang: any) {
    this.translate.use(lang);
    this.selectedLang = lang;
    this.isOpenDropdownLang = !this.isOpenDropdownLang
  }
}
