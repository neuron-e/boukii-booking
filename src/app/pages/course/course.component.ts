import { Component, HostListener, OnInit } from '@angular/core';
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
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import { ApiCrudService } from 'src/app/services/crud.service';

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
  courseType: number = 1;
  courseFlux: number = 0
  confirmModal: boolean = false
  dataLevels: any
  selectedLevel: any;
  selectedUser: any;
  selectedUserMultiple: any[] = [];
  selectedDateReservation: any;
  selectedForfait: any[] = []

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

  selectedHour: string = '';
  selectedDuration: number = 0;
  availableDurations: number[] = [];
  availableHours: any[] = [];

  schoolData: any;
  settings: any;
  settingsExtras: any
  selectedDates: any = [];
  collectivePrice: any = 0;

  defaultImage = '../../../assets/images/3.png';

  constructor(private router: Router, public themeService: ThemeService, public coursesService: CoursesService,
    private route: ActivatedRoute, private authService: AuthService, public schoolService: SchoolService,
    private datePipe: DatePipe, private cartService: CartService, private bookingService: BookingService, private translateService: TranslateService, private snackbar: MatSnackBar,
    private crudService: ApiCrudService
  ) {
    this.checkScreenWidth();
  }

  SmallScreenModal: boolean = false
  isSmallScreen: boolean = false;
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenWidth();
  }
  checkScreenWidth() {
    this.isSmallScreen = window.innerWidth < 800;
  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => this.userLogged = data);
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = JSON.parse(data.data.settings);
          this.settingsExtras = [...this.settings.extras.forfait, ...this.settings.extras.food, ...this.settings.extras.transport,]
        }
      }
    );
    const id = this.route.snapshot.paramMap.get('id');
    this.coursesService.getCourse(id).subscribe(res => {
      this.course = res.data;
      this.discounts = JSON.parse(this.course.discounts);
      this.getDegrees()
      this.activeDates = this.course.course_dates.map((dateObj: any) => this.datePipe.transform(dateObj.date, 'yyyy-MM-dd'));
      this.course.availableDegrees = Object.values(this.course.availableDegrees);
      if (this.course.course_type == 2) {
        this.availableHours = this.getAvailableHours();
        if (this.course.is_flexible) {
          this.availableDurations = this.getAvailableDurations(this.selectedHour);
          this.updatePrice();
        } else this.selectedDuration = this.course.duration;
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
      }
      this.collectivePrice = this.course.price_range?.reduce((max: any, obj: any) => {
        Object.values(obj).forEach((value: any) => {
          if (value !== null && !isNaN(value)) max = Math.max(max, parseInt(value, 10));
        }); return max;
      }, -Infinity) || 0
    });

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
    let adjustedStartDay = startDay - 1;
    if (adjustedStartDay < 0) adjustedStartDay = 6;
    for (let j = 0; j < adjustedStartDay; j++) this.days.push({ number: '', active: false });
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
    for (let k = lastDayOfWeek; k <= 6 && lastDayOfWeek !== 6; k++)       this.days.push({ number: '', active: false });
  }

  selectDay(day: any) {
    if (day.active) {
      this.days.forEach(d => d.selected = false);
      day.selected = true;
      this.selectedDateReservation = `${day.number}`.padStart(2, '0') + '/' + `${this.currentMonth + 1}`.padStart(2, '0') + '/' + this.currentYear;
      if (this.course.is_flexible) this.updateAvailableDurations(this.selectedHour);
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
            'currency': this.course?.currency || 'CHF',
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
            'currency': this.course?.currency || 'CHF',
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
              'currency': this.course?.currency || 'CHF',
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
            'currency': this.course?.currency || 'CHF',
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
    this.bookingService.checkOverlap(bookingUsers).subscribe(
      () => {
        let cartStorage = localStorage.getItem(this.schoolData.slug + '-cart');
        let cart: any = {};
        if (cartStorage) cart = JSON.parse(cartStorage);
        if (!cart[this.course.id]) cart[this.course.id] = {};
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
                } return false;
              });
            });
          });
          if (!isAnyUserReserved) {
            if (!cart[this.course.id][selectedUserIds]) cart[this.course.id][selectedUserIds] = [];
            cart[this.course.id][selectedUserIds].push(...bookingUsers);
            localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
            this.cartService.carData.next(cart);
            this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });
          } else this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
        } else {
          if (!cart[this.course.id][this.selectedUser.id]) {
            cart[this.course.id][this.selectedUser.id] = [];
            cart[this.course.id][this.selectedUser.id].push(...bookingUsers);
            localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
            this.cartService.carData.next(cart);
            this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });
          } else this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
        }
      },
      (error) => {
        let cartStorage = localStorage.getItem(this.schoolData.slug + '-cart');
        let cart: any = {};
        if (cartStorage) cart = JSON.parse(cartStorage);
        if (!cart[this.course.id]) cart[this.course.id] = {};
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
            if (!cart[this.course.id][selectedUserIds]) cart[this.course.id][selectedUserIds] = [];
            cart[this.course.id][selectedUserIds].push(...bookingUsers);
            localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
            this.cartService.carData.next(cart);
            this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });
          } else {
            this.snackbar.open(this.translateService.instant(error.error.message), 'OK', { duration: 3000 });
          }
        } else {
          if (!cart[this.course.id][this.selectedUser.id]) {
            cart[this.course.id][this.selectedUser.id] = [];
            cart[this.course.id][this.selectedUser.id].push(...bookingUsers);
            localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));
            this.cartService.carData.next(cart);
            this.snackbar.open(this.translateService.instant('text_go_to_cart'), 'OK', { duration: 3000 });
          } else {
            this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
          }
        }
        this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
      },
      () => {
        this.goTo('/' + this.schoolData.slug + '/cart/')
      }
    )
  }

  calculateEndTime(startTime: string, durationMinutes: number): string {
    // Convertir la hora de inicio y la duración a minutos
    const [startHours, startMinutes] = startTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const durationTotalMinutes = durationMinutes;

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
  }

  showTooltipFilter(index: number) {
    this.tooltipsFilter[index] = true;
  }

  hideTooltipFilter(index: number) {
    this.tooltipsFilter[index] = false;
  }


  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  transformAge(birthDate: string) {
    let fechaNacimientoDate: Date;
    if (/\d{4}-\d{2}-\d{2}/.test(birthDate)) {
      fechaNacimientoDate = new Date(birthDate);
    } else if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z/.test(birthDate)) {
      const parts = birthDate.split('T')[0].split('-');
      fechaNacimientoDate = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    } else {
      console.error('Formato de fecha de nacimiento no válido');
      return 0;
    }
    const fechaActual = new Date();
    const diferencia = fechaActual.getTime() - fechaNacimientoDate.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
  }

  isAgeAppropriate(userAge: number, minAge: number, maxAge: number): boolean {
    return userAge >= minAge && userAge <= maxAge;
  }

  selectDate(checked: boolean, date: any) {
    const index = this.selectedDates.findIndex((d: any) => d === date);
    if (index === -1 && checked) this.selectedDates.push(date);
    else if (!checked) this.selectedDates.splice(index, 1);
    this.updateCollectivePrice();
  }

  discounts: any[] = []
  updateCollectivePrice() {
    let collectivePrice = this.course.price * this.selectedDates.length;;
    if (this.course.discounts) {
      this.discounts = JSON.parse(this.course.discounts);
      this.discounts.forEach((discount: any) => {
        if (this.selectedDates.length === discount.date) {
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



  getAvailableDurations(selectedHour: string): any[] {
    const endTime = parseInt(this.course.hour_max);
    const startTime = parseInt(selectedHour.split(':')[0]);
    let durations = this.filteredPriceRange();
    this.selectedDuration = durations[0];
    return durations;
  }

  getAvailableHours(): string[] {
    let hours = [];
    const hourMin = parseInt(this.course.hour_min);
    const hourMax = parseInt(this.course.hour_max);
    const duration = parseInt(this.course.duration);
    if (!this.course.is_flexible) {
      for (let hour = hourMin; hour < hourMax; hour++) {
        for (let minute = 0; minute <= 60 - duration; minute += 5) {
          let formattedHour = hour < 10 ? '0' + hour : '' + hour;
          let formattedMinute = minute < 10 ? '0' + minute : '' + minute;
          let formattedTime = `${formattedHour}:${formattedMinute}`;
          hours.push(formattedTime);
        }
      }
      let formattedHourMax = hourMax - 1 < 10 ? '0' + (hourMax - 1) : '' + (hourMax - 1);
      let formattedTimeMax = `${formattedHourMax}:00`;
      hours.push(formattedTimeMax);
    } else {
      let timeIntervals = this.filteredPriceRange();
      let differences = timeIntervals.slice(1).map((value: number, index: number) => value - timeIntervals[index]);
      let minInterval = Math.min(...differences);
      //let minDuration = Math.min(...timeIntervals); // Duración mínima en minutos
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

  getStartDate(): string {
    const startDate = this.course?.course_dates
      .filter((date: any) => date.active)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date;

    return startDate ? moment(startDate).format('DD/MM/YYYY') : '';
  }

  getEndDate(): string {
    const endDate = this.course?.course_dates
      .filter((date: any) => date.active)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;

    return endDate ? moment(endDate).format('DD/MM/YYYY') : '';
  }

  updateAvailableDurations(selectedHour: string): void {
    const selectedHourInt = parseInt(selectedHour.split(':')[0]);
    const selectedMinutesInt = parseInt(selectedHour.split(':')[1]);
    const hourMax = parseInt(this.course.hour_max);
    const selectedTimeInMinutes = selectedHourInt * 60 + selectedMinutesInt;
    const maxTimeInMinutes = hourMax * 60;

    this.availableDurations = this.filteredPriceRange()
      .filter((range: any) => selectedTimeInMinutes + range <= maxTimeInMinutes) // Cambiar esta línea
    const isSelectedDurationAvailable = this.availableDurations
      .some((range: any) => range === this.selectedDuration); // Cambiar esta línea
    if (!isSelectedDurationAvailable && this.availableDurations.length > 0) {
      this.selectedDuration = this.availableDurations[0];
    }
    this.updatePrice();
  }

  updatePrice(): void {
    const selectedPax = this.selectedUserMultiple.length;
    const matchingTimeRange = this.course.price_range.find((range: any) => {
      const parts = range.intervalo.split(' ');
      let rangeMinutes = 0;
      for (const part of parts) {
        if (part.endsWith('h')) rangeMinutes += parseInt(part) * 60;
        else if (part.endsWith('m')) rangeMinutes += parseInt(part);
      }
      return rangeMinutes === this.selectedDuration;
    });
    if (matchingTimeRange && matchingTimeRange[selectedPax]) this.course.price = matchingTimeRange[selectedPax];
    else this.course.price = 0;
  }


  calculateAvailableLevels(user: any) {
    const userAge = this.transformAge(user.birth_date);
    const availableDegreesArray = Array.isArray(this.course?.availableDegrees)
      ? this.course?.availableDegrees
      : Object.values(this.course?.availableDegrees || {});
    this.hasLevelsAvailable = availableDegreesArray.some((level: any) =>
      level.recommended_age === 1 || this.isAgeAppropriate(userAge, level.age_min, level.age_max)
    );
    //if (!this.hasLevelsAvailable) {
    // Puedes establecer un mensaje o manejarlo como prefieras
    //}
    this.showLevels = true;
  }


  hasMatchingSportLevel(level: any): boolean {
    const selectedSport = this.selectedUser?.sports?.find((sport: any) => sport.id === level.sport_id);
    if (!selectedSport) return true;
    return selectedSport && selectedSport.pivot.degree_id >= level.id;
  }

  isDateValid(dateToCheck: string, hourStart: string, hourEnd: string): boolean {
    const currentDate = new Date();
    const date = new Date(dateToCheck);
    if (date < currentDate) return false;
    const checkHour = parseInt(dateToCheck.substring(11, 13));
    const checkMinutes = parseInt(dateToCheck.substring(14, 16));
    const startHour = parseInt(hourStart.substring(0, 2));
    const endHour = parseInt(hourEnd.substring(0, 2));
    const isStartTimeValid = checkHour < startHour ||
      (checkHour === startHour && checkMinutes < parseInt(hourStart.substring(3, 5)));
    const isEndTimeValid = checkHour < endHour ||
      (checkHour === endHour && checkMinutes < parseInt(hourEnd.substring(3, 5)));
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
  getShotrDescription(course: any) {
    if (!course.translations || course.translations === null) {
      return course.short_description;
    } else {
      const translations = JSON.parse(course.translations);
      return translations[this.translateService.currentLang].short_description;
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
  next() {
    if (this.courseFlux === 0) {
    } else if (this.courseFlux === 1) {
      this.selectLevel(this.selectedLevel)
      if (!this.course.is_flexible && this.course.course_type !== 2) {
        this.courseFlux++
      }
    } else if (this.courseFlux === 2) {
    } else if (this.courseFlux === 3) {
      this.confirmModal = true
      this.courseFlux--
    }
    this.courseFlux++
  }

  getDaysBetweenDates(startDateString: string, endDateString: string): string[] {
    const dates: string[] = [];
    let currentDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate).toISOString().split("T")[0]);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dates;
  }

  getLanguages = () => this.crudService.list('/languages', 1, 1000).subscribe((data) => this.languages = data.data.reverse())
  getLanguage(id: any) {
    const lang: any = this.languages.find((c: any) => c.id == +id);
    return lang ? lang.code.toUpperCase() : 'NDF';
  }
  countries = MOCK_COUNTRIES;
  languages = [];
  getCountry(id: any) {
    const country = this.countries.find((c) => c.id == +id);
    return country ? country.name : 'NDF';
  }
  calculateAge(birthDateString: any) {
    if (birthDateString && birthDateString !== null) {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    } else return 0;
  }

  getDegrees = () => this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.course.school_id + '&sport_id=' + this.course.sport.id).subscribe((data) => {
    this.dataLevels = []
    data.data.forEach((element: any) => element.active ? this.dataLevels.push(element) : null);
  });

  Date = (date: string) => new Date(date)

  toggleForfaitSelection(extra: any) {
    const index = this.selectedForfait.indexOf(extra);
    if (index > -1) {
      this.selectedForfait.splice(index, 1); // Elimina si ya está seleccionado
    } else {
      this.selectedForfait.push(extra); // Añade si no está seleccionado
    }
  }
  find = (table: any[], value: string, variable: string, variable2?: string) => table.find((a: any) => variable2 ? a[variable][variable2] === value : a[variable] === value)

}
