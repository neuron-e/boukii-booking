import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-home-course-card',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class CourseCardComponent {
  @Input() data: any
}
