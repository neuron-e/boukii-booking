import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-home-course-card',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class CourseCardComponent {
  @Input() data: any
  Week: string[] = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"]
  getWeekDay(v: string) { return new Date(v).getDay() }
}
