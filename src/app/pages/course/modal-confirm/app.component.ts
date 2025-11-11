import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { CourseComponent } from '../course.component';

@Component({
  selector: 'app-course-modal-confirm',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../course.component.scss'],

})
export class CourseModalConfirmComponent {
  @Input() course: any
  @Input() selectedDates: any
  @Input() selectedDuration: any
  @Input() selectedUsers: any
  @Input() selectedForfait: any
  @Input() selectedForfaits: { [key: string]: any[] } = {};  // Asegúrate de que esto sea un objeto que contenga arrays.
  @Input() collectivePrice: number = 0
  @Input() originalPrice: number = 0
  @Input() appliedDiscountAmount: number = 0
  @Input() hasActiveDiscount: boolean = false
  @Input() discountsByInterval: { intervalId: string; intervalName: string; discountAmount: number; discountPercentage: number }[] = []

  @Output() onClose = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  constructor(public themeService: ThemeService, public translateService: TranslateService,
              public courseC: CourseComponent) { }
  closeModal() {
    this.onClose.emit();
  }
  getCourseName(course: any) {
    if (course) {
      if (!course.translations || course.translations === null) {
        return course.name;
      } else {
        const translations = typeof course.translations === 'string' ?
          JSON.parse(course.translations) : course.translations;
        return translations[this.translateService.currentLang].name || course.name;
      }
    }
  }
  getWeekDay(): string {
    const uniqueDays: Set<number> = new Set();
    this.course.course_dates.forEach((item: any) => {
      const day = new Date(item.date).getDay();
      uniqueDays.add(day);
    });
    const dayNames: string[] = Array.from(uniqueDays).map(day => this.Week[day]);
    if (dayNames.length === 0) return "";
    if (dayNames.length === 1) return dayNames[0];
    const lastDay = dayNames.pop();
    return dayNames.join(", ") + " y " + lastDay;
  }
  Week: string[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"]

  findMaxHourEnd(): string {
    const maxHourStart = Math.max(
      ...this.course.course_dates.map((date: any) => {
        return parseInt(date.hour_end.replace(":", ""));
      })
    );
    const maxHourString = maxHourStart.toString().padStart(4, "0");
    return `${maxHourString.slice(0, 2)}:${maxHourString.slice(2)}`;
  }
  findMinHourStart(): string {
    const maxHourStart = Math.max(
      ...this.course.course_dates.map((date: any) => {
        return parseInt(date.hour_start.replace(":", ""));
      })
    );
    const minHourString = maxHourStart.toString().padStart(4, "0");
    return `${minHourString.slice(0, 2)}:${minHourString.slice(2)}`;
  }
  getWeekdays(settings: string): string {
    const settingsObj = typeof settings === 'string' ? JSON.parse(settings) : settings;
    const weekDays = settingsObj.weekDays;
    const daysMap: any = {
      "monday": "Lundi",
      "tuesday": "Mardi",
      "wednesday": "Mercredi",
      "thursday": "Jeudi",
      "friday": "Vendredi",
      "saturday": "Samedi",
      "sunday": "Diamanche",
    };

    const activeDays = Object.entries(weekDays)
      .filter(([_, isActive]) => isActive)
      .map(([day]) => this.translateService.instant(daysMap[day]));

    if (activeDays.length === 7) {
      return `${this.translateService.instant('Lundi')} - ${this.translateService.instant('Diamanche')}`;
    } else {
      return activeDays.join(', ');
    }
  }

  // Agrupar fechas seleccionadas por intervalo
  getDatesByInterval(): any[] {
    if (!this.course?.is_flexible || !this.selectedDates || this.selectedDates.length === 0) {
      return [];
    }

    const intervals = new Map<string, any>();

    this.selectedDates.forEach((date: any) => {
      const intervalId = date.course_interval_id || 'default';
      const intervalIdStr = String(intervalId);

      if (!intervals.has(intervalIdStr)) {
        // Buscar nombre del intervalo
        const settings = this.courseC.getCourseSettings();
        let intervalName = 'Intervalo ' + intervalIdStr;

        if (settings?.intervals) {
          const intervalConfig = settings.intervals.find((i: any) => String(i.id) === intervalIdStr);
          if (intervalConfig && intervalConfig.name) {
            intervalName = intervalConfig.name;
          }
        }

        intervals.set(intervalIdStr, {
          id: intervalIdStr,
          name: intervalName,
          dates: []
        });
      }

      intervals.get(intervalIdStr).dates.push(date);
    });

    return Array.from(intervals.values());
  }

  protected readonly Object = Object;
}
