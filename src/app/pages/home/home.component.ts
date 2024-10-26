import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { CoursesService } from '../../services/courses.service';
import { SchoolService } from '../../services/school.service';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import {map,  UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {catchError} from 'rxjs/operators';

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
  FilterModal: boolean = false

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

  constructor(public router: Router, public themeService: ThemeService, private coursesService: CoursesService, public translateService: TranslateService,
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
          this.selectedAgeType = parseInt(localStorage.getItem(this.schoolData.slug + '-selectedAgeType') ?? '1');
          this.selectedDegreeType =  parseInt(localStorage.getItem(this.schoolData.slug + '-selectedDegreeType') ?? '1');
          this.selectedCourseType = parseInt(localStorage.getItem(this.schoolData.slug + '-selectedCourseType') ?? '1');
          this.crudService
            .list('/seasons', 1, 10000, 'asc', 'id', '&school_id=' +
              this.schoolData.id + '&is_active=1').subscribe({
            next: (res) => {
                if (res.data.length > 0) {
                  this.season = res.data[0]; // Guardamos la temporada en caché
                  this.holidays = this.season.vacation_days ? JSON.parse(this.season.vacation_days) : [];
                  this.holidays.forEach((element: any) => {
                    this.myHolidayDates.push(moment(element).toDate());
                  });
                }
                this.setAgeRange();
                if (this.schoolData?.sports?.length > 0) {
                  this.selectedSportId = parseInt(localStorage.getItem(this.schoolData.slug + '-selectedSportId') ?? this.schoolData.sports[0].id);
                  this.initializeMonthNames();
                  const storedMonthStr = localStorage.getItem(this.schoolData.slug + '-month');
                  this.currentMonth = storedMonthStr ? parseInt(storedMonthStr) : new Date().getMonth();

                  const storedYearStr = localStorage.getItem(this.schoolData.slug + '-year');
                  this.currentYear = storedYearStr ? parseInt(storedYearStr) : new Date().getFullYear();
                  this.getCourses();
                }
            },
            error: (err) => {
              console.error('Error al obtener la temporada:', err);
            }
          });

        }
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

  getSeason(schoolId: number): Observable<any> {
    // Si ya tenemos la temporada, devolverla directamente
    if (this.season) {
      return of(this.season); // Devuelve un Observable con la temporada almacenada
    }

    // Si no está almacenada, hacemos la llamada a la API
    return this.crudService
      .list('/seasons', 1, 10000, 'asc', 'id', '&school_id=' + schoolId + '&is_active=1')
      .pipe(
        tap((response) => {
          if (response.data.length > 0) {
            this.season = response.data[0]; // Guardamos la temporada en caché
            this.holidays = this.season.vacation_days ? JSON.parse(this.season.vacation_days) : [];
            this.holidays.forEach((element: any) => {
              this.myHolidayDates.push(moment(element).toDate());
            });
          }
        }),
        catchError((error) => {
          console.error('Error fetching season:', error);
          return of(null); // Manejar error y devolver un valor vacío
        })
      );
  }


  inUseDatesFilter = (d: Date): boolean => {
    if (!d) return false; // Si la fecha es nula o indefinida, no debería ser seleccionable.

    const formattedDate = moment(d).format('YYYY-MM-DD');
    const time = moment(d).startOf('day').valueOf(); // .getTime() es igual a .valueOf()
    const today = moment().startOf('day'); // Fecha actual (sin hora, solo día)
    // Encuentra si la fecha actual está en myHolidayDates.
    const isHoliday = this.myHolidayDates.some((x:any) => x.getTime() === time);

    // La fecha debería ser seleccionable si no es un día festivo y está activa (o sea, active no es falso ni 0).
    return !isHoliday;
  }

  selectDay(day: any) {
    if (day.active) {
      this.days.forEach(d => d.selected = false);
      day.selected = true;
      const formattedDate = `${this.currentYear}-${this.currentMonth + 1}-${day.number}`;
      this.daySelected = formattedDate;
      this.getCourses();
    } else {
      this.daySelected = null;
    }
  }

  showTooltipFilter(index: number) {
    this.tooltipsFilter[index] = true;
  }

  hideTooltipFilter(index: number) {
    this.tooltipsFilter[index] = false;
  }

  /*
  getFilteredGoals(degree:number): any[] {
    return this.degreeGoals.filter((goal:any) => goal.sport.id === this.selectedSport && goal.degree.id === degree);
  }
  */

  goTo(url: string) {
    this.router.navigate([url]);
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
