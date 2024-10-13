import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';
import { SchoolService } from '../../services/school.service';
import { DatePipe } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { BookingService } from '../../services/booking.service';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
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
export class CourseComponent implements OnInit {
  today: Date = new Date();
  userLogged: any;
  course: any;
  courseType: number = 2;
  dataLevels = [
    {
      'id': 181,
      'league': 'SKV',
      'level': 'test',
      'name': 'Ptit Loup',
      'annotation': 'PT',
      'degree_order': 0,
      'color': '#1C482C',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 182,
      'league': 'SKV',
      'level': 'test',
      'name': 'JN',
      'annotation': 'JN',
      'degree_order': 1,
      'color': '#1C482C',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 183,
      'league': 'SKV',
      'level': 'test',
      'name': 'Débutant Kid Village',
      'annotation': 'DKV',
      'degree_order': 2,
      'color': '#1C482C',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 184,
      'league': 'BLEU',
      'level': 'test',
      'name': 'Prince / Pricesse Bleu',
      'annotation': 'PB',
      'degree_order': 3,
      'color': '#0E3991',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 185,
      'league': 'BLEU',
      'level': 'test',
      'name': 'Roi / Reine Bleu',
      'annotation': 'RB',
      'degree_order': 4,
      'color': '#0E3991',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 186,
      'league': 'BLEU',
      'level': 'test',
      'name': 'Star Bleu',
      'annotation': 'SB',
      'degree_order': 5,
      'color': '#0E3991',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 187,
      'league': 'ROUGE',
      'level': 'test',
      'name': 'R1',
      'annotation': 'R1',
      'degree_order': 6,
      'color': '#572830',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 188,
      'league': 'ROUGE',
      'level': 'test',
      'name': 'R2',
      'annotation': 'R2',
      'degree_order': 7,
      'color': '#572830',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 189,
      'league': 'ROUGE',
      'level': 'test',
      'name': 'R3',
      'annotation': 'R3',
      'degree_order': 8,
      'color': '#572830',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 190,
      'league': 'NOIR',
      'level': 'test',
      'name': 'Prince / Pricesse Noir',
      'annotation': 'PN',
      'degree_order': 9,
      'color': '#000000',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 191,
      'league': 'Academy',
      'level': 'test',
      'name': 'Race',
      'annotation': 'ACA',
      'degree_order': 10,
      'color': '#7d7c7c',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 192,
      'league': 'Academy',
      'level': 'test',
      'name': 'Freestyle',
      'annotation': 'ACA',
      'degree_order': 11,
      'color': '#7d7c7c',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    },
    {
      'id': 193,
      'league': 'Academy',
      'level': 'test',
      'name': 'Freeride',
      'annotation': 'ACA',
      'degree_order': 12,
      'color': '#7d7c7c',
      'active': true,
      'school_id': 1,
      'sport_id': 1
    }
  ];
  selectedLevel: any;
  selectedUser: any;
  selectedUserMultiple: any[] = [];
  selectedDateReservation: any;
  selectedForfait: any


  tooltipsFilter: boolean[] = [];
  tooltipsLevel: boolean[] = [];
  showMoreFilters: boolean = false;
  showLevels: boolean = false;
  hasLevelsAvailable: boolean = true;

  monthNames: string[] = [];
  weekdays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  currentMonth: number;
  currentYear: number;
  days: any[] = [];

  activeDates: string[] = [];

  isModalAddUser: boolean = false;
  isModalLogin: boolean = false;
  isModalNewUser: boolean = false;

  selectedHour: string = '';
  selectedPaxes: any = 1;
  selectedDuration: any;
  availableDurations: any[] = [];
  availableHours: any[] = [];

  schoolData: any;
  settings: any;
  selectedDates: any = [];
  collectivePrice: any = 0;

  defaultImage = '../../../assets/images/3.png';

  constructor(private router: Router, public themeService: ThemeService, private coursesService: CoursesService,
    private route: ActivatedRoute, private authService: AuthService, private schoolService: SchoolService,
    private datePipe: DatePipe, private cartService: CartService, private bookingService: BookingService, private translateService: TranslateService, private snackbar: MatSnackBar) {

  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => {
      this.userLogged = data;
    });
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = JSON.parse(data.data.settings);
          console.log(this.settings);
          console.log(this.schoolData);
        }
      }
    );
    const id = this.route.snapshot.paramMap.get('id');
    this.dataLevels.forEach((degree: any) => {
      degree.inactive_color = this.lightenColor(degree.color, 30);
    });
    this.coursesService.getCourse(id).subscribe(res => {
      this.course = res.data;
      console.log(this.course);
      this.activeDates = this.course.course_dates.map((dateObj: any) =>
        this.datePipe.transform(dateObj.date, 'yyyy-MM-dd')
      );
      this.course.availableDegrees = Object.values(this.course.availableDegrees);
      if (this.course.course_type == 2) {
        this.availableHours = this.getAvailableHours();
        if (this.course.is_flexible) {
          this.availableDurations = this.getAvailableDurations(this.selectedHour);
          this.updatePrice();
        } else {
          this.selectedDuration = this.course.duration;
        }

        this.initializeMonthNames();
        if (this.course.date_start) {
          if (moment(this.course.date_start).isBefore(moment(), 'day')) {
            const storedMonthStr = localStorage.getItem(this.schoolData.slug + '-month');
            this.currentMonth = storedMonthStr ? parseInt(storedMonthStr) : new Date().getMonth();

            const storedYearStr = localStorage.getItem(this.schoolData.slug + '-year');
            this.currentYear = storedYearStr ? parseInt(storedYearStr) : new Date().getFullYear();
          }
          else {
            this.currentMonth = new Date(this.course.date_start).getMonth();
            this.currentYear = new Date(this.course.date_start).getFullYear();
          }
        }
        else {
          const storedMonthStr = localStorage.getItem(this.schoolData.slug + '-month');
          this.currentMonth = storedMonthStr ? parseInt(storedMonthStr) : new Date().getMonth();

          const storedYearStr = localStorage.getItem(this.schoolData.slug + '-year');
          this.currentYear = storedYearStr ? parseInt(storedYearStr) : new Date().getFullYear();



        }
        this.renderCalendar();

      } else {
        this.collectivePrice = this.course.price;
      }
    });
  }

  openModalLogin() {
    this.isModalLogin = !this.isModalLogin;
  }

  toggleForfaitSelection(extra: any) {
    if (this.selectedForfait === extra) {
      this.selectedForfait = null; // Deselect if already selected
    } else {
      this.selectedForfait = extra; // Select the clicked option
    }
  }

  /*
    getSports() {
      this.crudService.list('/sports', 1, 10000, 'desc', 'id', '&school_id='+this.user.schools[0].id)
        .subscribe((sport) => {
          this.sports = sport.data;
        })
    }*/

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
      this.renderCalendar();
    }
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
  }

  renderCalendar() {
    const startDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    this.days = [];
    //Start monday
    let adjustedStartDay = startDay - 1;
    if (adjustedStartDay < 0) adjustedStartDay = 6;

    for (let j = 0; j < adjustedStartDay; j++) {
      this.days.push({ number: '', active: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const spanDate = new Date(this.currentYear, this.currentMonth, i);
      const isPast = spanDate < new Date();
      const formattedMonth = (this.currentMonth + 1).toString().padStart(2, '0');
      const formattedDay = i.toString().padStart(2, '0');
      const dateStr = `${this.currentYear}-${formattedMonth}-${formattedDay}`;
      const isActive = !isPast && this.activeDates.includes(dateStr);
      this.days.push({ number: i, active: isActive, selected: false, past: isPast });
    }

    let lastDayOfWeek = new Date(this.currentYear, this.currentMonth, daysInMonth).getDay();
    for (let k = lastDayOfWeek; k <= 6 && lastDayOfWeek !== 6; k++) {
      this.days.push({ number: '', active: false });
    }

  }

  selectDay(day: any) {
    if (day.active) {
      this.days.forEach(d => d.selected = false);
      day.selected = true;
      const formattedDate = `${this.currentYear}-${this.currentMonth + 1}-${day.number}`;

      this.selectedDateReservation = `${day.number}`.padStart(2, '0') + '/' + `${this.currentMonth + 1}`.padStart(2, '0') + '/' + this.currentYear;
      if (this.course.is_flexible) {
        this.updateAvailableDurations(this.selectedHour);
      }

    }
  }

  addBookingToCart() {
    let bookingUsers: any = [];
    if (this.course.course_type == 2) {
      if (this.course.is_flexible) {
        let course_date = this.findMatchingCourseDate();
        this.selectedUserMultiple.forEach((selectedUser, index) => {
          bookingUsers.push({
            'course': this.course,
            'client': selectedUser,
            'school_id': this.schoolData.id,
            'client_id': selectedUser.id,
            'price': index === 0 ? this.course.price : 0,
            'currency': 'CHF',
            'course_id': this.course.id,
            'course_date_id': course_date.id,
            'course_group_id': null,
            'course_subgroup_id': null,
            'date': course_date.date,
            'hour_start': this.selectedHour,
            'hour_end': this.calculateEndTime(this.selectedHour, this.selectedDuration),
            'extra': this.selectedForfait
          });
        });
      } else {
        let course_date = this.findMatchingCourseDate();
        this.selectedUserMultiple.forEach((selectedUser, index) => {
          bookingUsers.push({
            'course': this.course,
            'client': selectedUser,
            'school_id': this.schoolData.id,
            'client_id': selectedUser.id,
            'price': this.course.price,
            'currency': 'CHF',
            'course_id': this.course.id,
            'course_date_id': course_date.id,
            'course_group_id': null,
            'course_subgroup_id': null,
            'date': course_date.date,
            'hour_start': this.selectedHour,
            'hour_end': this.calculateEndTime(this.selectedHour, this.course.duration),
            'extra': this.selectedForfait
          });
        });
      }
    } else {
      if (this.course.is_flexible) {
        this.course.course_dates.forEach((date: any) => {

          if (this.selectedDates.find((d: any) => moment(d).format('YYYY-MM-DD') === moment(date.date).format('YYYY-MM-DD'))) {
            let courseGroup = date.course_groups.find((i: any) => i.degree_id == this.selectedLevel.id);
            let courseSubgroup = courseGroup.course_subgroups[0];
            bookingUsers.push({
              'course': this.course,
              'client': this.selectedUser,
              'course_date': date,
              'group': courseGroup,
              'subGroup': courseSubgroup,
              'school_id': this.schoolData.id,
              'client_id': this.selectedUser.id,
              'price': this.collectivePrice,
              'currency': 'CHF',
              'course_id': this.course.id,
              'course_date_id': date.id,
              'course_group_id': courseGroup.id,
              'course_subgroup_id': courseSubgroup.id,
              'date': date.date,
              'hour_start': date.hour_start,
              'hour_end': date.hour_end,
              'extra': this.selectedForfait
            })
          }

        })
      } else {
        this.course.course_dates.forEach((date: any) => {
          let courseGroup = date.course_groups.find((i: any) => i.degree_id == this.selectedLevel.id);
          let courseSubgroup = courseGroup.course_subgroups[0];
          bookingUsers.push({
            'course': this.course,
            'client': this.selectedUser,
            'course_date': date,
            'group': courseGroup,
            'subGroup': courseSubgroup,
            'school_id': this.schoolData.id,
            'client_id': this.selectedUser.id,
            'price': this.course.price,
            'currency': 'CHF',
            'course_id': this.course.id,
            'course_date_id': date.id,
            'course_group_id': courseGroup.id,
            'course_subgroup_id': courseSubgroup.id,
            'date': date.date,
            'hour_start': date.hour_start,
            'hour_end': date.hour_end,
            'extra': this.selectedForfait
          })
        })
      }
    }

    this.bookingService.checkOverlap(bookingUsers).subscribe(res => {
      let cartStorage = localStorage.getItem(this.schoolData.slug + '-cart');
      let cart: any = {};

      if (cartStorage) {
        cart = JSON.parse(cartStorage);
      }

      if (!cart[this.course.id]) {
        cart[this.course.id] = {};
      }

      if (this.course.course_type === 2) {
        const selectedUserIds = this.selectedUserMultiple.map(user => user.id).join('-');

        const isAnyUserReserved = selectedUserIds.split('-').some(id => {
          const idArray = id.split('-');
          return idArray.some(singleId => {
            const keys = Object.keys(cart[this.course.id]);
            return keys.some(key => {
              const userCourseIds = key.split('-');
              const hasUserOverlap = userCourseIds.includes(singleId);

              if (hasUserOverlap) {
                let course_date = this.findMatchingCourseDate();
                const userBookings = cart[this.course.id][key];
                return userBookings.some((booking: any) => booking.course_date_id === course_date.id);
              }

              return false;
            });
          });
        });

        if (!isAnyUserReserved) {
          if (!cart[this.course.id][selectedUserIds]) {
            cart[this.course.id][selectedUserIds] = [];
          }
          cart[this.course.id][selectedUserIds].push(...bookingUsers);

          localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
          this.cartService.carData.next(cart);
          // TODO: mostrar mensaje de curso guardado correctamente.
          this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });
        } else {
          this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
        }
      } else {
        if (!cart[this.course.id][this.selectedUser.id]) {
          cart[this.course.id][this.selectedUser.id] = [];
          cart[this.course.id][this.selectedUser.id].push(...bookingUsers);

          localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
          this.cartService.carData.next(cart);
          this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });

          this.goTo(this.schoolData.slug);
        } else {

          this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
        }
      }

    }, error => {
      this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });

    })
  }

  calculateEndTime(startTime: string, duration: string): string {
    let durationHours = 0;
    let durationMinutes = 0;
    if (duration.includes(":")) {
      [durationHours, durationMinutes] = duration.split(':').map(Number);
    } else {
      const hoursMatch = duration.match(/(\d+)h/);
      const minutesMatch = duration.match(/(\d+)min/);
      if (hoursMatch) {
        durationHours = parseInt(hoursMatch[1]);
      }
      if (minutesMatch) {
        durationMinutes = parseInt(minutesMatch[1]);
      }
    }

    // Convertir la hora de inicio y la duración a minutos
    const [startHours, startMinutes] = startTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const durationTotalMinutes = durationHours * 60 + durationMinutes;

    // Calcular la hora de fin en minutos
    const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

    // Convertir la hora de fin de vuelta a formato 'HH:MM'
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;

    // Formatear la hora de fin para tener siempre dos dígitos
    const formattedEndHours = endHours.toString().padStart(2, '0');
    const formattedEndMinutes = endMinutes.toString().padStart(2, '0');

    return `${formattedEndHours}:${formattedEndMinutes}`;
  }

  findMatchingCourseDate(): any {
    // Convertir selectedDateReservation a un objeto Date
    const [day, month, year] = this.selectedDateReservation.split('/').map(Number);
    const selectedDate = new Date(year, month - 1, day);

    // Buscar en courseDates una fecha que coincida
    const matchingDate = this.course.course_dates.find((courseDate: any) => {
      // Convertir la fecha de courseDate a objeto Date
      const courseDateObject = new Date(courseDate.date);

      // Compara si las fechas (año, mes y día) son iguales
      return courseDateObject.getFullYear() === selectedDate.getFullYear() &&
        courseDateObject.getMonth() === selectedDate.getMonth() &&
        courseDateObject.getDate() === selectedDate.getDate();
    });

    return matchingDate;
  }

  private lightenColor(hexColor: string, percent: number): string {
    let r: any = parseInt(hexColor.substring(1, 3), 16);
    let g: any = parseInt(hexColor.substring(3, 5), 16);
    let b: any = parseInt(hexColor.substring(5, 7), 16);

    // Increase the lightness
    r = Math.round(r + (255 - r) * percent / 100);
    g = Math.round(g + (255 - g) * percent / 100);
    b = Math.round(b + (255 - b) * percent / 100);

    // Convert RGB back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }

  selectUser(user: any, course_type: any) {
    if (course_type == 2) {
      const index = this.selectedUserMultiple.indexOf(user);
      if (index !== -1) {
        this.selectedUserMultiple.splice(index, 1);
      } else {
        if (this.selectedUserMultiple.length < this.course.max_participants) {
          this.selectedUserMultiple.push(user);
        }
        else {
          this.snackbar.open(this.translateService.instant('text_select_maximum_user') + this.course.max_participants, 'OK', { duration: 3000 });
        }
      }
      if (this.course.is_flexible) {
        this.updatePrice();
      }
    }
    else {
      this.selectedUser = user;
      this.selectedLevel = null;
      this.showLevels = false;
      this.calculateAvailableLevels(user);
    }
  }

  selectLevel(level: any) {
    this.selectedLevel = level;
    this.showLevels = false;
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

  openModalAddUser() {
    this.isModalAddUser = true;
  }

  closeModalLogin() {
    this.isModalLogin = false;
  }

  closeModalNewUser() {
    this.isModalNewUser = false;
  }

  closeModalAddUser() {
    this.isModalAddUser = false;
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  transformAge(birthDate: string) {
    let fechaNacimientoDate: Date;

    // Verificar el formato de la fecha y ajustar en consecuencia
    if (/\d{4}-\d{2}-\d{2}/.test(birthDate)) {
      // Si el formato es "2022-01-18"
      fechaNacimientoDate = new Date(birthDate);
    } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z/.test(birthDate)) {
      // Si el formato es "2024-01-17T00:00:00.000000Z"
      const parts = birthDate.split('T')[0].split('-');
      fechaNacimientoDate = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    } else {
      // Formato no reconocido, manejarlo según tus requisitos
      console.error('Formato de fecha de nacimiento no válido');
      return 0; // Retorna 0 en caso de un formato no válido
    }

    const fechaActual = new Date();

    // Calcula la diferencia en milisegundos entre las dos fechas
    const diferencia = fechaActual.getTime() - fechaNacimientoDate.getTime();

    // Convierte la diferencia en milisegundos a años
    return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
  }

  isAgeAppropriate(userAge: number, minAge: number, maxAge: number): boolean {
    return userAge >= minAge && userAge <= maxAge;
  }

  selectDate(date: any) {
    const index = this.selectedDates.findIndex((d: any) => d === date);
    if (index === -1) {
      this.selectedDates.push(date);
    } else {
      this.selectedDates.splice(index, 1);
    }
    this.updateCollectivePrice();
  }
  updateCollectivePrice() {
    let collectivePrice = this.course.price;
    if (this.course.discounts) {
      let discounts = JSON.parse(this.course.discounts);
      discounts.forEach((discount: any) => {
        // Verificar si el date coincide con la longitud de las fechas seleccionadas
        if (this.selectedDates.length === discount.date) {
          // Aplicar descuento al precio colectivo
          var discountApplied = collectivePrice * (discount.percentage / 100);
          collectivePrice = collectivePrice - discountApplied;
        }
      });

    }
    this.collectivePrice = collectivePrice;
  }

  generateNumberArray(max: number): number[] {
    return Array.from({ length: max }, (v, k) => k + 1);
  }

  filteredPriceRange() {
    return this.course.price_range.filter((range: any) => {
      // Verificar si todos los valores son null excepto el campo 'intervalo'
      const keys = Object.keys(range).filter((key) => key !== 'intervalo');
      const allNull = keys.every((key) => range[key] === null);

      // Mantener el objeto si no todos los valores son null
      return !allNull;
    }).map((range: any) => {
      const parts = range.intervalo.split(' ');
      let minutes = 0;
      for (const part of parts) {
        if (part.endsWith('h')) {
          minutes += parseInt(part) * 60;
        } else if (part.endsWith('m')) {
          minutes += parseInt(part);
        }
      }
      return minutes;
    }).sort((a: number, b: number) => a - b);
  }

  convertToHoursAndMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  getAvailableDurations(selectedHour: string): any[] {
    const endTime = parseInt(this.course.hour_max);
    const startTime = parseInt(selectedHour.split(':')[0]);
    const availableTime = endTime - startTime; // Tiempo disponible en horas

    let durations = this.filteredPriceRange();
    this.selectedDuration = this.convertToHoursAndMinutes(durations[0]);
    return durations;
  }

  getAvailableHours(): string[] {
    let hours = [];
    const hourMin = parseInt(this.course.hour_min);
    const hourMax = parseInt(this.course.hour_max);
    const duration = parseInt(this.course.duration);

    if (!this.course.is_flexible) {
      // Generar intervalos de 5 minutos desde la hora de inicio hasta la hora final,
      // teniendo en cuenta la duración máxima
      for (let hour = hourMin; hour < hourMax; hour++) {
        for (let minute = 0; minute <= 60 - duration; minute += 5) {
          let formattedHour = hour < 10 ? '0' + hour : '' + hour;
          let formattedMinute = minute < 10 ? '0' + minute : '' + minute;
          let formattedTime = `${formattedHour}:${formattedMinute}`;
          hours.push(formattedTime);
        }
      }
      // Añadir la hora final teniendo en cuenta la duración
      let formattedHourMax = hourMax - 1 < 10 ? '0' + (hourMax - 1) : '' + (hourMax - 1);
      let formattedTimeMax = `${formattedHourMax}:00`;
      hours.push(formattedTimeMax);
    } else {
      // Obtener los intervalos de tiempo de los price_range y ordenarlos
      let timeIntervals = this.filteredPriceRange();

      // Calcular las diferencias entre intervalos consecutivos
      let differences = timeIntervals.slice(1).map((value: number, index: number) => value - timeIntervals[index]);

      // Encontrar el intervalo mínimo en minutos
      let minInterval = Math.min(...differences);
      let minDuration = Math.min(...timeIntervals); // Duración mínima en minutos

      // Calcular las horas disponibles en intervalos de minInterval
      for (let minute = hourMin * 60; minute <= (hourMax - 1) * 60; minute += minInterval) {
        let hour = Math.floor(minute / 60);
        let min = minute % 60;
        let formattedHour = hour < 10 ? '0' + hour : hour;
        let formattedMin = min < 10 ? '0' + min : min;
        let formattedTime = `${formattedHour}:${formattedMin}`;
        hours.push(formattedTime);
      }
    }


    this.selectedHour = hours[0];

    return hours;
  }

  updateAvailableDurations(selectedHour: string): void {
    const selectedHourInt = parseInt(selectedHour.split(':')[0]);
    const selectedMinutesInt = parseInt(selectedHour.split(':')[1]);
    const hourMax = parseInt(this.course.hour_max);

    // Convertir la hora seleccionada y la hora máxima a minutos para comparación
    const selectedTimeInMinutes = selectedHourInt * 60 + selectedMinutesInt;
    const maxTimeInMinutes = hourMax * 60;

    this.availableDurations = this.filteredPriceRange()
      .filter((range: any) => selectedTimeInMinutes + range <= maxTimeInMinutes) // Cambiar esta línea

    // Convertir la duración seleccionada a minutos
    const selectedDurationMinutes = this.convertHourToMinutes(this.selectedDuration);

    // Comprobar si la duración seleccionada está dentro de las duraciones disponibles
    const isSelectedDurationAvailable = this.availableDurations
      .some((range: any) => range === selectedDurationMinutes); // Cambiar esta línea

    // Si no está disponible, establecer la primera duración disponible
    if (!isSelectedDurationAvailable && this.availableDurations.length > 0) {
      this.selectedDuration = this.convertToHoursAndMinutes(this.availableDurations[0]);
    }
  }

  updatePrice(): void {
    const selectedDurationInMinutes = this.convertHourToMinutes(this.selectedDuration); // Convertir duración a minutos
    //const selectedPax = this.selectedPaxes; // Asumiendo que tienes una variable para los pax seleccionados
    const selectedPax = this.selectedUserMultiple.length;

    // Encontrar el price_range que coincida con la duración y el pax seleccionados
    const matchingTimeRange = this.course.price_range.find((range: any) => {
      const parts = range.intervalo.split(' ');
      let rangeMinutes = 0;
      for (const part of parts) {
        if (part.endsWith('h')) {
          rangeMinutes += parseInt(part) * 60;
        } else if (part.endsWith('m')) {
          rangeMinutes += parseInt(part);
        }
      }
      return rangeMinutes === selectedDurationInMinutes;
    });

    // Calcular el precio basado en el rango de tiempo encontrado y el número de pax seleccionado
    if (matchingTimeRange && matchingTimeRange[selectedPax]) {
      this.course.price = matchingTimeRange[selectedPax];
    } else {
      // Si no hay una coincidencia, puedes establecer un precio predeterminado o dejarlo como está
      this.course.price = 0; // O cualquier valor predeterminado que desees
    }
  }


  convertHourToMinutes(hourString: string): number {
    const [hours, minutes] = hourString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  calculateAvailableLevels(user: any) {
    // Suponiendo que tienes una función para transformar la fecha de nacimiento en edad
    const userAge = this.transformAge(user.birth_date);

    // Convertir availableDegrees en un arreglo si es necesario
    const availableDegreesArray = Array.isArray(this.course?.availableDegrees)
      ? this.course?.availableDegrees
      : Object.values(this.course?.availableDegrees || {});

    // Calcula si hay niveles disponibles
    this.hasLevelsAvailable = availableDegreesArray.some((level: any) =>
      level.recommended_age === 1 || this.isAgeAppropriate(userAge, level.age_min, level.age_max)
    );

    // Si no hay niveles disponibles, muestra un mensaje
    if (!this.hasLevelsAvailable) {
      // Puedes establecer un mensaje o manejarlo como prefieras
      console.log("No hay niveles disponibles para este usuario.");
    }
    this.showLevels = true;
  }


  hasMatchingSportLevel(level: any): boolean {
    // Obtén el deporte seleccionado por el usuario
    const selectedSport = this.selectedUser?.sports?.find((sport: any) => sport.id === level.sport_id);

    if (!selectedSport) {
      return true;
    }

    // Verifica si el deporte tiene un grado (degree) que coincide con el nivel actual
    return selectedSport && selectedSport.pivot.degree_id >= level.id;
  }

  isDateValid(dateToCheck: string, hourStart: string, hourEnd: string): boolean {
    const currentDate = new Date();
    const date = new Date(dateToCheck);

    // Compara la fecha completa incluyendo hora, minutos y segundos
    if (date < currentDate) {
      return false;
    }

    // Extrae la hora y los minutos de dateToCheck
    const checkHour = parseInt(dateToCheck.substring(11, 13));
    const checkMinutes = parseInt(dateToCheck.substring(14, 16));

    // Extrae la hora de hourStart y hourEnd
    const startHour = parseInt(hourStart.substring(0, 2));
    const endHour = parseInt(hourEnd.substring(0, 2));

    // Compara la hora y los minutos con hourStart y hourEnd
    const isStartTimeValid = checkHour < startHour ||
      (checkHour === startHour && checkMinutes < parseInt(hourStart.substring(3, 5)));

    const isEndTimeValid = checkHour < endHour ||
      (checkHour === endHour && checkMinutes < parseInt(hourEnd.substring(3, 5)));

    // Si la fecha es igual o posterior y la hora está dentro del rango, devuelve true
    return isStartTimeValid && isEndTimeValid;
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

  getSportName(sportId: number): string | null {
    const sport = this.schoolData.sports.find((s: any) => s.id === sportId);
    return sport ? sport.name : null;
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
