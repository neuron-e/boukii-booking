import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home-course-card',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class CourseCardComponent {
  @Input() data: any
  Week: string[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"]
  WeekDisplayed: number[] = []
  constructor(public translateService: TranslateService) { }
  getWeekDay(): string {
    const uniqueDays: Set<number> = new Set();
    this.data.course_dates.forEach((item: any) => {
      const day = new Date(item.date).getDay();
      uniqueDays.add(day);
    });
    const dayNames: string[] = Array.from(uniqueDays).map(day => this.Week[day]);
    if (dayNames.length === 0) return "";
    if (dayNames.length === 1) return dayNames[0];
    const lastDay = dayNames.pop();
    return dayNames.join(", ") + " y " + lastDay;
  }

  findMaxHourEnd(): string {
    const maxHourStart = Math.max(
      ...this.data.course_dates.map((date: any) => {
        return parseInt(date.hour_end.replace(":", ""));
      })
    );
    const maxHourString = maxHourStart.toString().padStart(4, "0");
    return `${maxHourString.slice(0, 2)}:${maxHourString.slice(2)}`;
  }
  findMinHourStart(): string {
    const maxHourStart = Math.max(
      ...this.data.course_dates.map((date: any) => {
        return parseInt(date.hour_start.replace(":", ""));
      })
    );
    const minHourString = maxHourStart.toString().padStart(4, "0");
    return `${minHourString.slice(0, 2)}:${minHourString.slice(2)}`;
  }


  getShotrDescription() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.short_description;
    } else {
      const translations = JSON.parse(this.data.translations);
      return translations[this.translateService.currentLang].short_description;
    }
  }

  getDescription() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.description;
    } else {
      const translations = JSON.parse(this.data.translations);
      return translations[this.translateService.currentLang].description;
    }
  }

  getCourseName() {
    if (!this.data.translations || this.data.translations === null) {
      return this.data.name;
    } else {
      const translations = JSON.parse(this.data.translations);
      return translations[this.translateService.currentLang].name;
    }
  }

  getCoursePrice() {
    if (this.data.course_type == 2 && this.data.is_flexible) {
      const priceRange = this.data.price_range.find((a: any) => a[1] !== null);
      return priceRange[1];
    } else {
      return this.data.price
    }
  }

  getWeekdays(settings: string): string {
    const settingsObj = JSON.parse(settings);
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

  protected readonly JSON = JSON;
}
