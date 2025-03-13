import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { CoursesService } from '../../services/courses.service';
import { SchoolService } from '../../services/school.service';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ApiCrudService } from 'src/app/services/crud.service';

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
  moreProximosCourse: number = 8
  typeProximosCourse = ["text_all_availability"]
  selectedTypeProximosCourse: string = this.typeProximosCourse[0]

  FilterModal: boolean = false
  schoolData: any = null;
  sports: any[];
  season: any
  holidays: any
  myHolidayDates: any = [];
  selectedSportId: any
  currentMonth: any
  currentYear: any
  days: any
  settings: any
  degreeValues: any = {
    doesntMatter: null,
    novice: [1, 2, 3],
    intermediate: [4, 5, 6],
    advanced: [7, 8, 9],
    expert: [10, 11, 12]
  };
  degreeOptions = [
    { id: 1, label: 'text_doesnt_matter', tooltips: [], Range: this.degreeValues.doesntMatter },
    { id: 2, label: 'text_novice', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'], Range: this.degreeValues.novice },
    { id: 3, label: 'text_intermediate', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'], Range: this.degreeValues.intermediate },
    { id: 4, label: 'text_advanced', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'], Range: this.degreeValues.advanced },
    { id: 5, label: 'text_expert', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'], Range: this.degreeValues.expert }
  ];

  ageOptions = [
    { id: 1, label: 'text_all_ages', min_age: 1, max_age: 99 },
    { id: 2, label: 'text_ages2', min_age: 2, max_age: 3 },
    { id: 3, label: 'text_ages3', min_age: 3, max_age: 5 },
    { id: 4, label: 'text_ages4', min_age: 6, max_age: 99 },
    { id: 5, label: 'text_adults', min_age: 18, max_age: 99 }
  ];

  currentDegreeRange: number[] = [];
  selectedCourseType: number;

  constructor(public router: Router, public themeService: ThemeService, private coursesService: CoursesService, public translateService: TranslateService,
    private schoolService: SchoolService, private crudService: ApiCrudService,
    private fb: UntypedFormBuilder) {
  }


  ngOnInit(): void {
    this.FormGroup = this.fb.group({
      deporte: ["", Validators.required],
      course_type: ["", Validators.required],
      edat: ["", Validators.required],
      nivel: ["", Validators.required],
    })
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = JSON.parse(data.data.settings)
          this.FormGroup.patchValue({
            course_type: localStorage.getItem(this.schoolData.slug + '-selectedCourseType')
              ? parseInt(localStorage.getItem(this.schoolData.slug + '-selectedCourseType')!)
              : null,
            edat: parseInt(localStorage.getItem(this.schoolData.slug + '-selectedAgeType') ?? '1'),
            nivel: parseInt(localStorage.getItem(this.schoolData.slug + '-selectedDegreeType') ?? '1')
          })
          this.crudService
            .list('/seasons', 1, 10000, 'asc', 'id', '&school_id=' +
              this.schoolData.id + '&is_active=1').subscribe({
                next: (res) => {
                  if (res.data.length > 0) {
                    this.season = res.data[0];
                    this.holidays = this.season.vacation_days ? JSON.parse(this.season.vacation_days) : [];
                    this.holidays.forEach((element: any) => {
                      this.myHolidayDates.push(moment(element).toDate());
                    });
                  }
                  if (this.schoolData?.sports?.length > 0) {
                    this.FormGroup.patchValue({
                      sport_id: parseInt(localStorage.getItem(this.schoolData.slug + '-selectedSportId') ?? this.schoolData.sports[0].id)
                    })
                    //const storedMonthStr = localStorage.getItem(this.schoolData.slug + '-month');
                    //this.currentMonth = storedMonthStr ? parseInt(storedMonthStr) : new Date().getMonth();
                    //const storedYearStr = localStorage.getItem(this.schoolData.slug + '-year');
                    //this.currentYear = storedYearStr ? parseInt(storedYearStr) : new Date().getFullYear();
                    this.getCourses();
                  }
                },
                error: (err) => console.error('Error al obtener la temporada:', err)
              });
        }
      }
    );

  }

  getCourses() {
    this.coursesService.getCoursesAvailableByDates({
      start_date: this.formatDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
      end_date: this.formatDate(new Date().getFullYear() + 100, 1, 1),
      course_type: this.FormGroup.controls['course_type'].value,
      degree_order: this.degreeOptions.find((a: any) => a.id == this.FormGroup.controls['nivel'].value)?.Range,
      sport_id: this.FormGroup.controls['deporte'].value,
      max_age: this.ageOptions.find((a: any) => a.id == this.FormGroup.controls['edat'].value)?.max_age,
      min_age: this.ageOptions.find((a: any) => a.id == this.FormGroup.controls['edat'].value)?.min_age,
      highlighted: 1
    }).subscribe(res => { this.DestacadoCourse = res.data; });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.coursesService.getCoursesAvailableByDates({
      start_date: this.formatDate(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate()),
      'end_date': this.formatDate(new Date().getFullYear() + 100, 1, 1),
    }).subscribe(res => {
      this.ProximosCourse = res.data
      this.typeProximosCourse = ["text_all_availability", ...this.ProximosCourse.map((a: any) => a.sport.name).filter((valor: any, indice: any) => this.ProximosCourse.map((a: any) => a.sport.name).indexOf(valor) === indice)]
    });
  }

  searchCourses() {
    this.coursesService.getCoursesAvailableByDates({
      start_date: this.formatDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
      end_date: this.formatDate(new Date().getFullYear() + 100, 1, 1),
      course_type: this.FormGroup.controls['course_type'].value,
      degree_order: this.degreeOptions.find((a: any) => a.id == this.FormGroup.controls['nivel'].value)?.Range,
      sport_id: this.FormGroup.controls['deporte'].value,
      max_age: this.ageOptions.find((a: any) => a.id == this.FormGroup.controls['edat'].value)?.max_age,
      min_age: this.ageOptions.find((a: any) => a.id == this.FormGroup.controls['edat'].value)?.min_age
    }).subscribe(res => this.ResultCourse = res.data)
  }

  formatDate(year: number, month: number, day: number): string {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  // getSeason(schoolId: number): Observable<any> {
  //   if (this.season) return of(this.season);
  //   return this.crudService
  //     .list('/seasons', 1, 10000, 'asc', 'id', '&school_id=' + schoolId + '&is_active=1')
  //     .pipe(
  //       tap((response) => {
  //         if (response.data.length > 0) {
  //           this.season = response.data[0]; // Guardamos la temporada en caché
  //           this.holidays = this.season.vacation_days ? JSON.parse(this.season.vacation_days) : [];
  //           this.holidays.forEach((element: any) => {
  //             this.myHolidayDates.push(moment(element).toDate());
  //           });
  //         }
  //       }),
  //       catchError((error) => {
  //         console.error('Error fetching season:', error);
  //         return of(null); // Manejar error y devolver un valor vacío
  //       })
  //     );
  // }

  // selectDay(day: any) {
  //   if (day.active) {
  //     this.days.forEach((d: any) => d.selected = false);
  //     day.selected = true;
  //     const formattedDate = `${this.currentYear}-${this.currentMonth + 1}-${day.number}`;
  //     this.daySelected = formattedDate;
  //     this.getCourses();
  //   } else {
  //     this.daySelected = null;
  //   }
  // }
  //showTooltipFilter(index: number) {
  //  this.tooltipsFilter[index] = true;
  //}

  //hideTooltipFilter(index: number) {
  //  this.tooltipsFilter[index] = false;
  //}

  //getFilteredGoals(degree:number): any[] {
  //  return this.degreeGoals.filter((goal:any) => goal.sport.id === this.selectedSport && goal.degree.id === degree);
  //}

  goTo(url: string) {
    this.router.navigate([url]);
  }

  find = (table: any[], value: string, variable: string, variable2?: string) => table.find((a: any) => variable2 ? a[variable][variable2] === value : a[variable] === value)
}
