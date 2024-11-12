import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ThemeService} from '../../services/theme.service';
import {CoursesService} from '../../services/courses.service';
import {SchoolService} from '../../services/school.service';
import {DatePipe} from '@angular/common';
import {AuthService} from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import {map, Observable, of, tap} from 'rxjs';
import {ApiCrudService} from '../../services/crud.service';
import * as moment from 'moment';
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
  ]
})
export class HomeComponent implements OnInit {

  tooltipsFilter: boolean[] = [];
  tooltipsLevel: boolean[] = [];
  showMoreFilters: boolean = false;

  monthNames: string[] = [];
  weekdays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  currentMonth: number;
  currentYear: number;
  firstDayOfMonth: any;
  lastDayOfMonth: any;
  days: any[] = [];
  loading = false;

  schoolData: any = null;
  sports: any[];
  courses: any[];

  isModalLogin:boolean=false;
  isModalNewUser:boolean=false;
  activeDates: string[] = [];

  //SEE MORE -> do it for each course
  fullText: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam at eros tempor, sollicitudin sem sit amet, ornare augue. Cras eget neque fermentum, rutrum dolor at, vulputate odio. Duis nec pulvinar eros. Ut et interdum ante. Nulla id quam lectus. In efficitur congue nisi, vel dapibus felis egestas sed.';
  displayedText: string;
  displayedTextOld: string;
  showSeeMore: boolean = false;
  showSeeLess: boolean = false;
  private maxLength: number = 100;

  /** Filters**/
  selectedDegreeType: number;
  degreeValues: any = {
    doesntMatter: null,
    novice: [1, 2, 3],
    intermediate: [4, 5, 6],
    advanced: [7, 8, 9],
    expert: [10, 11, 12]
  };
  degreeOptions = [
    {id: 1, label: 'text_doesnt_matter', tooltips: []},
    {id: 2, label: 'text_novice', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3']},
    {id: 3, label: 'text_intermediate', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3']},
    {id: 4, label: 'text_advanced', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3']},
    {id: 5, label: 'text_expert', tooltips: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3']}
  ];
  ageOptions = [
    {id: 1, label: 'text_all_ages'},
    {id: 2, label: 'text_ages2'},
    {id: 3, label: 'text_ages3'},
    {id: 4, label: 'text_ages4'},
    {id: 5, label: 'text_adults'}
  ];
  currentDegreeRange: number[] = [];
  selectedSportId: number;
  selectedCourseType: number;
  degreesSports: any;
  selectedAgeType: number;
  min_age: number;
  max_age: number;
  daySelected: any;
  userLogged: any;
  defaultImage = '../../../assets/images/3.png';
  season: any = [];
  holidays: any = [];
  myHolidayDates: any = [];

  constructor(private router: Router, public themeService: ThemeService, private coursesService: CoursesService, public translateService: TranslateService,
              private schoolService: SchoolService, private datePipe: DatePipe, private authService: AuthService,
              private crudService: ApiCrudService) {
  }

  ngOnInit(): void {
  //  this.userLogged = JSON.parse(localStorage.getItem(this.authService.slug+ '-boukiiUser') ?? '');

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

    this.authService.getUserData().subscribe(
      data => {
        this.userLogged = data;
      }
    );

    //SEE MORE -> do it for each course received
    if (this.fullText.length > this.maxLength) {
      this.displayedText = this.fullText.substring(0, this.maxLength) + '...';
      this.displayedTextOld = this.fullText.substring(0, this.maxLength) + '...';
      this.showSeeMore = true;
    } else {
      this.displayedText = this.fullText;
    }
  }

  reloadFilters() {
    this.setAgeRange();
    this.setDegreeRange();
    localStorage.setItem(this.schoolData.slug + '-selectedCourseType', this.selectedCourseType.toString())
    localStorage.setItem(this.schoolData.slug + '-selectedSportId', this.selectedSportId.toString())
    this.getCourses();
  }

  getCourses() {
    this.loading = true;
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayOfMonth = this.formatDate(this.currentYear, this.currentMonth + 1, 1);
    const lastDayOfMonth = this.formatDate(this.currentYear, this.currentMonth + 1, daysInMonth);


    let params = {
      'start_date': this.daySelected ?? firstDayOfMonth,
      'end_date': this.daySelected ?? lastDayOfMonth,
      'course_type': this.selectedCourseType,
      'degree_order': this.currentDegreeRange,
      'sport_id': this.selectedSportId,
      'max_age': this.max_age,
      'min_age': this.min_age
    };
    this.coursesService.getCoursesAvailableByDates(params).subscribe(res => {
      this.courses = res.data;
      this.activeDates = [];
      this.activeDates = this.courses.reduce((acc, course) => {
        const formattedDates = course.course_dates.map((dateObj: any) =>
          this.datePipe.transform(dateObj.date, 'yyyy-MM-dd')
        );
        return acc.concat(formattedDates);
      }, []);
      this.loading = false;
      if (!this.daySelected) {
        this.renderCalendar();
      }
    });
  }

  //SEE MORE -> do it for each course
  showFullText(course: any) {
    course.showSeeMore = false;
    course.showSeeLess = true;
  }

  showLessText(course: any) {
    course.showSeeMore = true;
    course.showSeeLess = false;
  }

  initializeMonthNames() {
    this.monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  }

  prevMonth() {
    if (this.currentYear > new Date().getFullYear() || (this.currentYear === new Date().getFullYear() && this.currentMonth > new Date().getMonth())) {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      localStorage.setItem(this.schoolData.slug + '-month',  String(this.currentMonth));
      localStorage.setItem(this.schoolData.slug + '-year',  String(this.currentYear));
      this.getCourses();
    }
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    localStorage.setItem(this.schoolData.slug + '-month',  String(this.currentMonth));
    localStorage.setItem(this.schoolData.slug + '-year',  String(this.currentYear));
    this.getCourses();
  }

  renderCalendar(getCourses = true) {
    const startDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    // Último día del mes: ya calculaste los días en el mes, solo usa esta información para obtener la fecha
    this.firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    this.lastDayOfMonth = new Date(this.currentYear, this.currentMonth, daysInMonth);


    this.days = [];
    //Start monday
    let adjustedStartDay = startDay - 1;
    if (adjustedStartDay < 0) adjustedStartDay = 6;

    for (let j = 0; j < adjustedStartDay; j++) {
      this.days.push({number: '', active: false});
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const spanDate = new Date(this.currentYear, this.currentMonth, i);
      const isPast = spanDate < new Date();
      const formattedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
      const formattedDay = i.toString().padStart(2, '0');
      const dateStr = `${this.currentYear}-${formattedMonth}-${formattedDay}`;
      const isActive = !isPast && this.activeDates.includes(dateStr) && this.inUseDatesFilter(spanDate);
      this.days.push({number: i, active: isActive, selected: false, past: isPast});
    }

    let lastDayOfWeek = new Date(this.currentYear, this.currentMonth, daysInMonth).getDay();
    for (let k = lastDayOfWeek; k <= 6 && lastDayOfWeek !== 6; k++) {
      this.days.push({number: '', active: false});
    }

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
    switch (this.selectedAgeType) {
      case 1: // Todas las edades
        this.min_age = 1;
        this.max_age = 99; // Poner un valor alto para 'todas las edades'
        break;
      case 2: // 2 a 3
        this.min_age = 2;
        this.max_age = 3;
        break;
      case 3: // 3 a 5
        this.min_age = 3;
        this.max_age = 5;
        break;
      case 4: // Más de 5
        this.min_age = 6;
        this.max_age = 18; // O el valor máximo que consideres apropiado
        break;
      case 5: // Solo adultos +18
        this.min_age = 18;
        this.max_age = 99; // O el valor máximo que consideres apropiado
        break;
      default:
        this.min_age = 1;
        this.max_age = 99;
        break;
    }
    localStorage.setItem(this.schoolData.slug + '-selectedAgeType', this.selectedAgeType.toString())
  }

  setDegreeRange(): void {
    switch (this.selectedDegreeType) {
      case 1: // No importa
        this.currentDegreeRange = this.degreeValues.doesntMatter;
        break;
      case 2: // Principiante
        this.currentDegreeRange = this.degreeValues.novice;
        break;
      case 3: // Intermedio
        this.currentDegreeRange = this.degreeValues.intermediate;
        break;
      case 4: // Avanzado
        this.currentDegreeRange = this.degreeValues.advanced;
        break;
      case 5: // Experto
        this.currentDegreeRange = this.degreeValues.expert;
        break;
      default:
        this.currentDegreeRange = [];
        break;
    }
    localStorage.setItem(this.schoolData.slug + '-selectedDegreeType', this.selectedDegreeType.toString())
  }

  getShotrDescription(course: any) {

    if (!course.translations || course.translations === null) {
      return course.short_description;
    } else {
      const translations = JSON.parse(course.translations);
      return translations[this.translateService.currentLang].short_description;
    }
  }

  getDescription(course: any) {

    if (course) {
      if (!course.translations || course.translations === null) {
        return course.description;
      } else {
        const translations = JSON.parse(course.translations);
        return translations[this.translateService.currentLang].description;
      }
    }

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

  getCoursePrice(course: any) {
    if (course) {
      if(course.course_type == 2 && course.is_flexible) {
        const priceRange = course.price_range.find((a:any) => a[1] !== null);
        return priceRange[1];
      } else{
        return course.price
      }
    }

    return 0;
  }


  getWeekdays(settings: string): string {
    const settingsObj = JSON.parse(settings);
    const weekDays = settingsObj.weekDays;
    const daysMap:any = {
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
