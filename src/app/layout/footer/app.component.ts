import { Component, OnInit } from '@angular/core';
import { SchoolService } from 'src/app/services/school.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class FooterComponent implements OnInit {
  constructor(private schoolService: SchoolService) { }
  SchoolData: any
  ngOnInit() {
    this.schoolService.fetchSchoolData();
    this.schoolService.getSchoolData().subscribe((data: any) => data ? this.SchoolData = data.data : null)
  }
}
