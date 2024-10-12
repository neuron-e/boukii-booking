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
  selectedSportId: number;
  selectedCourseType: number;
  degreesSports: any;
  selectedAgeType: number;
  min_age: number;
  max_age: number;
  daySelected: any;
  userLogged: any;
  defaultImage = '../../../assets/images/3.png';

  constructor(private router: Router, public themeService: ThemeService, private coursesService: CoursesService, public translateService: TranslateService,
    private schoolService: SchoolService, private datePipe: DatePipe, private authService: AuthService,
    private fb: UntypedFormBuilder) {
  }


  ngOnInit(): void {
    //  this.userLogged = JSON.parse(localStorage.getItem(this.authService.slug+ '-boukiiUser') ?? '');
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
          this.selectedDegreeType = parseInt(localStorage.getItem(this.schoolData.slug + '-selectedDegreeType') ?? '1');
          this.selectedCourseType = parseInt(localStorage.getItem(this.schoolData.slug + '-selectedCourseType') ?? '1');

          this.setAgeRange();
          if (this.schoolData?.sports?.length > 0) {
            this.selectedSportId =
              parseInt(localStorage.getItem(this.schoolData.slug + '-selectedSportId') ?? this.schoolData.sports[0].id);
            this.getCourses();
          }
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
    let params = {
      'start_date': this.formatDate(2024, 1, 1),
      'end_date': this.formatDate(2034, 1, 1),
      //'course_type': this.selectedCourseType,
      //'degree_order': this.currentDegreeRange,
      //'sport_id': this.selectedSportId,
      //'max_age': this.max_age,
      //'min_age': this.min_age
    };
    this.coursesService.getCoursesAvailableByDates(params)
      .subscribe(res => {
        this.ResultCourse = res.data;
        this.DestacadoCourse = res.data;
        this.ProximosCourse = res.data;
      });
  }

  showFullText() {
    this.displayedText = this.fullText;
    this.showSeeMore = false;
    this.showSeeLess = true;
  }

  showLessText() {
    this.displayedText = this.displayedTextOld;
    this.showSeeMore = true;
    this.showSeeLess = false;
  }



  formatDate(year: number, month: number, day: number): string {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

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
      if (course.course_type == 2 && course.is_flexible) {
        const priceRange = course.price_range.find((a: any) => a[1] !== null);
        return priceRange[1];
      } else {
        return course.price
      }
    }

    return 0;
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
