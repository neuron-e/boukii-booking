import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { CoursesService } from '../../services/courses.service';
import { SchoolService } from '../../services/school.service';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: [DatePipe],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(300))
    ])
  ],
})
export class HomeComponent implements OnInit {
  FormGroup: UntypedFormGroup;
  ResultCourse: any
  DestacadoCourse: any
  ProximosCourse: any

  schoolData: any = null;
  sports: any[];


  selectedDegreeType: number;
  degreeValues: any = {
    doesntMatter: null,
    novice: [1, 2, 3],
    intermediate: [4, 5, 6],
    advanced: [7, 8, 9],
    expert: [10, 11, 12]
  };
  degreeOptions = [
    { id: 1, label: 'text_doesnt_matter', tooltips: [] },
    { id: 2, label: 'text_novice', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'] },
    { id: 3, label: 'text_intermediate', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'] },
    { id: 4, label: 'text_advanced', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'] },
    { id: 5, label: 'text_expert', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'] }
  ];
  ageOptions = [
    { id: 1, label: 'text_all_ages' },
    { id: 2, label: 'text_ages2' },
    { id: 3, label: 'text_ages3' },
    { id: 4, label: 'text_ages4' },
    { id: 5, label: 'text_adults' }
  ];
  currentDegreeRange: number[] = [];
  selectedCourseType: number;
  degreesSports: any;
  min_age: number;
  max_age: number;
  daySelected: any;
  userLogged: any;

  constructor(private router: Router, public themeService: ThemeService, private coursesService: CoursesService, public translateService: TranslateService,
    private schoolService: SchoolService, private datePipe: DatePipe, private authService: AuthService,
    private fb: UntypedFormBuilder) {
  }


  ngOnInit(): void {
    this.FormGroup = this.fb.group({
      deporte: ["", Validators.required],
      cursoType: ["", Validators.required],
      edat: ["", Validators.required],
      nivel: ["", Validators.required],
    })

    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.setAgeRange();
          this.getCourses();
        }
      }
    );

    this.authService.getUserData().subscribe(
      data => {
        this.userLogged = data;
      }
    );
  }

  getCourses() {
    let params = {
      'start_date': this.formatDate(2000, 1, 1),
      'end_date': this.formatDate(2034, 1, 1),
    };
    this.coursesService.getCoursesAvailableByDates(params)
      .subscribe(res => {
        this.DestacadoCourse = res.data;
        this.ProximosCourse = res.data;
      });
  }
  searchCourses() {
    this.setDegreeRange()
    this.setAgeRange()
    let params = {
      'start_date': this.formatDate(2000, 1, 1),
      'end_date': this.formatDate(2034, 1, 1),
      'course_type': this.FormGroup.controls['nivel'].value,
      'degree_order': this.currentDegreeRange,
      'sport_id': this.FormGroup.controls['deporte'].value,
      'max_age': this.max_age,
      'min_age': this.min_age
    };
    this.coursesService.getCoursesAvailableByDates(params).subscribe(res => this.ResultCourse = res.data)
  }

  formatDate(year: number, month: number, day: number): string {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  setAgeRange(): void {
    switch (this.FormGroup.controls['edat'].value) {
      case 1:
        this.min_age = 1;
        this.max_age = 99;
        break;
      case 2:
        this.min_age = 2;
        this.max_age = 3;
        break;
      case 3:
        this.min_age = 3;
        this.max_age = 5;
        break;
      case 4:
        this.min_age = 6;
        this.max_age = 18;
        break;
      case 5:
        this.min_age = 18;
        this.max_age = 99;
        break;
      default:
        this.min_age = 1;
        this.max_age = 99;
        break;
    }
  }

  setDegreeRange(): void {
    switch (this.FormGroup.controls['nivel'].value) {
      case 1:
        this.currentDegreeRange = this.degreeValues.doesntMatter;
        break;
      case 2:
        this.currentDegreeRange = this.degreeValues.novice;
        break;
      case 3:
        this.currentDegreeRange = this.degreeValues.intermediate;
        break;
      case 4:
        this.currentDegreeRange = this.degreeValues.advanced;
        break;
      case 5:
        this.currentDegreeRange = this.degreeValues.expert;
        break;
      default:
        this.currentDegreeRange = [];
        break;
    }
  }
}
