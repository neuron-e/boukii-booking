import {Component, OnInit} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {SchoolService} from '../../services/school.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {
  privacyContent: SafeHtml = '';
  loading: boolean = true;
  schoolData: any;
  currentLang: string = '';

  constructor(
    private schoolService: SchoolService,
    private translateService: TranslateService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.currentLang = this.translateService.currentLang;
    this.translateService.onLangChange.subscribe(lang => {
      this.currentLang = lang.lang;
      this.updateContent();
    });

    this.schoolService.getSchoolData().subscribe(data => {
      if (data) {
        this.schoolData = data.data;
        this.updateContent();
      } else {
        // Si no hay datos, intentamos cargarlos
        this.schoolService.fetchSchoolData().subscribe();
      }
    });
  }

  updateContent(): void {
    if (!this.schoolData || !this.currentLang) return;

    try {
      // Buscar el contenido para el idioma actual
      let settings = JSON.parse(this.schoolData.settings);
      // Buscar el contenido para el idioma actual
      const privacy = settings?.bookingPage?.conditions?.privacy || {};
      let content = privacy[this.currentLang] || '';

      // Si no hay contenido para el idioma actual, usar el idioma por defecto
      if (!content && Object.keys(privacy).length > 0) {
        const defaultLang = Object.keys(privacy)[0];
        content = privacy[defaultLang] || '';
      }

      // Sanitizar el HTML para mostrarlo de forma segura
      this.privacyContent = this.sanitizer.bypassSecurityTrustHtml(content);
    } catch (error) {
      console.error('Error al cargar la política de privacidad:', error);
    } finally {
      this.loading = false;
    }
  }
}
