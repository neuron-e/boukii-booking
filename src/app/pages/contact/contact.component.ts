import { Component, OnInit } from '@angular/core';
import { SchoolService } from '../../services/school.service';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactContent: SafeHtml = '';
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
      let settings = JSON.parse(this.schoolData.settings);
      // Buscar el contenido para el idioma actual
      const contact = settings?.bookingPage?.conditions?.contact || {};
      let content = contact[this.currentLang] || '';

      // Si no hay contenido para el idioma actual, usar el idioma por defecto
      if (!content && Object.keys(contact).length > 0) {
        const defaultLang = Object.keys(contact)[0];
        content = contact[defaultLang] || '';
      }

      // Sanitizar el HTML para mostrarlo de forma segura
      this.contactContent = this.sanitizer.bypassSecurityTrustHtml(content);
    } catch (error) {
      console.error('Error al cargar la información de contacto:', error);
    } finally {
      this.loading = false;
    }
  }
}
