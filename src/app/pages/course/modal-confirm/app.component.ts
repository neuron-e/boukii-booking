import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { CourseComponent } from '../course.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-course-modal-confirm',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class CourseModalConfirmComponent {
  @Input() course: any
  @Input() selectedUser: any
  @Input() selectedForfait: any
  @Input() collectivePrice: number = 0

  @Output() onClose = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() goCart = new EventEmitter<void>();
  constructor(public themeService: ThemeService, public translateService: TranslateService, public courseC: CourseComponent,) { }
  closeModal() {
    this.onClose.emit();
  }
  getCourseName(course: any) {
    if (course) {
      if (!course.translations || course.translations === null) {
        return course.name;
      } else {
        const translations = JSON.parse(course.translations);
        return translations[this.translateService.currentLang].name;
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

}
