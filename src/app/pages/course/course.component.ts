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
import {UtilsService} from '../../services/utils.service';

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
  tooltipVisible: boolean[] = []; // Ahora es un array en lugar de un objeto
  selectedForfaits: { [date: string]: any[] } = {};

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
  selectedDuration: any ;
  availableDurations: number[] = [];
  availableHours: any[] = [];

  schoolData: any;
  settings: any;
  settingsExtras: any
  selectedDates: any = [];
  selectedCourseDates: any = [];
  collectivePrice: any = 0;

  defaultImage = '../../../assets/images/3.png';

  constructor(private router: Router, public themeService: ThemeService, public coursesService: CoursesService,
              private route: ActivatedRoute, private authService: AuthService, public schoolService: SchoolService,
              private datePipe: DatePipe, private cartService: CartService, private bookingService: BookingService,
              private translateService: TranslateService, private snackbar: MatSnackBar,
              private crudService: ApiCrudService, private utilService: UtilsService
  ) {
    this.checkScreenWidth();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.tooltip-container') &&
      !(event.target as HTMLElement).closest('.icon24')) {
      this.tooltipVisible = this.tooltipVisible.map(() => false);
    }
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

  showTooltip(index: number) {
    // Cierra todos los tooltips antes de abrir el nuevo
    this.tooltipVisible = this.tooltipVisible.map(() => false);
    this.tooltipVisible[index] = true;
  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => this.userLogged = data);
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = typeof data.data.settings === 'string' ? JSON.parse(data.data.settings) : data.data.settings;
        }
      }
    );
    const id = this.route.snapshot.paramMap.get('id');
    this.coursesService.getCourse(id).subscribe(res => {
      this.course = res.data;
      this.course.availableDegrees.sort((a, b) => a.degree_order - b.degree_order);
      this.settingsExtras = this.course.course_extras;
      if (this.course.discounts) {
        try {
          const discounts = JSON.parse(this.course.discounts);
        } catch (error) {
        }
      } else {
      }
      this.getDegrees()
      this.activeDates = this.course.course_dates.map((dateObj: any) => this.datePipe.transform(dateObj.date, 'yyyy-MM-dd'));
      this.course.availableDegrees = Object.values(this.course.availableDegrees);
      if (this.course.course_type == 2) {
        this.availableHours = this.getAvailableHours();
        this.selectedHour = this.availableHours[0];
        if (this.course.is_flexible) {
          this.availableDurations = this.getAvailableDurations(this.selectedHour);
          this.selectedDuration =  this.availableDurations[0];
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
      this.collectivePrice = this.course.price;
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
      this.getAvailableHours();
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
            'hour_end':  this.calculateEndTime(this.selectedHour, this.utilService.parseDurationToMinutes(this.selectedDuration)),
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
            'hour_end':  this.calculateEndTime(this.selectedHour, this.utilService.parseDurationToMinutes(this.selectedDuration)),
            'extra': this.selectedForfait
          });
        });
      }
    } else {
      if (this.course.is_flexible) {
        this.course.course_dates.forEach((date: any) => {
          // Verifica si la fecha está en las fechas seleccionadas
          if (this.selectedDates.find((d: any) => moment(d).format('YYYY-MM-DD') === moment(date.date).format('YYYY-MM-DD'))) {
            // Encuentra el grupo correspondiente al nivel seleccionado
            let courseGroup = date.course_groups.find((i: any) => i.degree_id == this.selectedLevel.id);
            let courseSubgroup = courseGroup.course_subgroups[0];

            // Encuentra los extras de la fecha
            const dateExtras = this.selectedForfaits[date.date] || [];  // Verifica si hay extras para esa fecha

            // Agrega los usuarios con los extras correspondientes
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
              'extra': dateExtras  // Asignando los extras de la fecha
            });
          }
        });
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
      return 0;
    }
    const fechaActual = new Date();
    const diferencia = fechaActual.getTime() - fechaNacimientoDate.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
  }

  isAgeAppropriate(userAge: number, minAge: number, maxAge: number): boolean {
    return userAge >= minAge && userAge <= maxAge;
  }

  hasMatchingSportLevel(level: any): boolean {
    const selectedSport = this.selectedUser?.sports?.find((sport: any) => sport.id === level.sport_id);
    if (!selectedSport) return true;
    return selectedSport && selectedSport.pivot.degree_id >= level.id;
  }

  isUserValidForLevel(user: any, level: any): boolean {
    return this.isAgeAppropriate(this.transformAge(user.birth_date), level.age_min, level.age_max);
  }

  findMatchingUser(level: any): boolean {
    if (this.selectedUser) {
      // Si hay un selectedUser, valida ese usuario
      return this.isUserValidForLevel(this.selectedUser, level);
    } else {
      // Si no hay selectedUser, busca en selectedUsers
      return this.selectedUserMultiple.some(user => this.isUserValidForLevel(user, level));
    }
  }

  controlSelectedUsers() {
    return this.selectedUserMultiple.filter((user: any) => {
      // Verificar que la edad del usuario es apropiada para el nivel
      const ageAppropriate = this.isAgeAppropriate(user.age, user.minAge, user.maxAge);

      // Verificar si el nivel de deporte coincide con el nivel del grupo
      const sportLevelMatches = this.hasMatchingSportLevel(user.level);

      // Solo incluir usuarios que cumplan ambas condiciones
      return ageAppropriate && sportLevelMatches;
    });
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
      try {
        const discounts = JSON.parse(this.course.discounts);
        this.discounts.forEach((discount: any) => {
          if (this.selectedDates.length === discount.date) {
            var discountApplied = collectivePrice * (discount.percentage / 100);
            collectivePrice = collectivePrice - discountApplied;
          }
        });
      } catch (error) {
      }
    } else {
    }
    this.collectivePrice = collectivePrice;
  }

  generateNumberArray(max: number): number[] {
    return Array.from({ length: max }, (v, k) => k + 1);
  }

  filteredPriceRange(formatted: boolean = false) {
    const selectedPax = this.selectedUserMultiple.length; // Obtener el número de paxes seleccionados

    return this.course.price_range
      .filter((range: any) => {
        // Verificar si todos los valores son null excepto 'intervalo'
        const keys = Object.keys(range).filter((key) => key !== 'intervalo');
        return !keys.every((key) => range[key] === null);
      })
      .map((range: any) => {
        // Convertir el intervalo en minutos
        const parts = range.intervalo.split(' ');
        let minutes = 0;
        for (const part of parts) {
          if (part.endsWith('h')) {
            minutes += parseInt(part) * 60;
          } else if (part.endsWith('m')) {
            minutes += parseInt(part);
          }
        }

        // Aplicar el número de paxes al cálculo de la duración
        // Si el número de paxes está disponible, ajustar el cálculo
        if (selectedPax && range[selectedPax] !== undefined) {
          minutes *= selectedPax; // Ajustamos el tiempo por el número de paxes
        }

        return minutes;
      })
      .sort((a: number, b: number) => a - b)
      .map((minutes: number) => {
        if (!formatted) {
          return minutes; // Devuelve solo los minutos si formatted es false
        }
        // Convertir minutos a formato "1h 0min" o "15min"
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
          return `${hours}h ${mins}m`;
        } else if (hours > 0) {
          return `${hours}h 0m`;
        } else {
          return `${mins}m`;
        }
      });
  }


  convertToMinutes(duration: string): number {
    let minutes = 0;
    const regex = /(\d+)h|(\d+)m/g;
    let match;

    // Extraer horas y minutos
    while ((match = regex.exec(duration)) !== null) {
      if (match[1]) minutes += parseInt(match[1]) * 60; // Horas a minutos
      if (match[2]) minutes += parseInt(match[2]); // Minutos
    }

    return minutes;
  }

  getAvailableDurations(selectedHour: string): any[] {
    const endTime = parseInt(this.course.hour_max);
    const startTime = parseInt(selectedHour.split(':')[0]);
    let durations = this.filteredPriceRange(true);

    return durations;
  }

  getFormattedDuration(duration: number): string {
    return `${duration} min`;  // Formatea el valor con el sufijo "min"
  }

  getAvailableHours(): string[] {
    let hours = [];
    let course_date = this.course.course_dates[0];
    if(this.selectedDateReservation){
      course_date = this.findMatchingCourseDate();
    }

    const hourMin = parseInt(course_date.hour_start);
    const hourMax = parseInt(course_date.hour_end);
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

    // Filtrar las duraciones disponibles basadas en el tiempo máximo y el tiempo seleccionado
    this.availableDurations = this.filteredPriceRange()
      .filter((range: any) => selectedTimeInMinutes + range <= maxTimeInMinutes);

    // Verificar si la duración seleccionada está disponible en la lista filtrada
    const isSelectedDurationAvailable = this.availableDurations
      .some((range: any) => range === this.convertToMinutes(this.selectedDuration)); // Convertimos selectedDuration a minutos para comparar

    if (!isSelectedDurationAvailable && this.availableDurations.length > 0) {
      // Si la duración seleccionada no está disponible, seleccionamos la primera opción
      this.selectedDuration = this.convertToDuration(this.availableDurations[0]);
    }

    // Actualizamos el precio basado en la duración seleccionada
    this.updatePrice();
  }

  convertToDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let duration = '';
    if (hours > 0) {
      duration += `${hours}h`;
    }
    if (remainingMinutes > 0) {
      duration += ` ${remainingMinutes}m`;
    }

    return duration || '0m'; // Si no hay horas ni minutos, devolvemos "0m"
  }

  getExtraPrice() {
    // Verificar si selectedForfait tiene elementos
    if (this.selectedForfait && this.selectedForfait.length > 0) {
      // Recorrer cada objeto en selectedForfait y obtener el precio
      const extraPrice = this.selectedForfait.reduce((total, forfait) => {
        // Asegurarse de que el precio sea un número (en caso de que esté como string)
        return total + parseFloat(forfait.price);
      }, 0);

      // Mostrar el precio total de los extras
      return extraPrice;  // Puedes devolver el precio total si lo necesitas
    } else {
      // Si no hay extras seleccionados, mostrar un mensaje
      return 0;  // Retorna 0 si no hay forfait seleccionado
    }
  }

  getExtraPriceCollective() {
    // Verificar si selectedForfait tiene elementos
    let totalPrice = 0;

    Object.keys(this.selectedForfaits).forEach(date => {
      const dateExtras = this.selectedForfaits[date] || [];
      const dateExtraPrice = dateExtras.reduce((total, extra) => total + parseFloat(extra.price), 0);
      totalPrice += dateExtraPrice;
    });

    return totalPrice;
  }


  updatePrice(): void {
    const selectedPax = this.selectedUserMultiple.length || 1;
    let extraPrice = this.getExtraPrice() * selectedPax;
    if(this.course.course_type == 2 && this.course.is_flexible) {
      // Convertir selectedDuration en minutos (si es necesario)
      const selectedDurationInMinutes = this.convertToMinutes(this.selectedDuration);

      const matchingTimeRange = this.course.price_range.find((range: any) => {
        let rangeMinutes = 0;
        const regex = /(\d+)h|(\d+)m/g;
        let match;

        // Extraer horas y minutos del intervalo
        while ((match = regex.exec(range.intervalo)) !== null) {
          if (match[1]) rangeMinutes += parseInt(match[1]) * 60; // Horas a minutos
          if (match[2]) rangeMinutes += parseInt(match[2]); // Minutos
        }

        return rangeMinutes === selectedDurationInMinutes;
      });


      // Asignar el precio si hay coincidencia en la duración y participantes
      this.course.price = matchingTimeRange && matchingTimeRange[selectedPax]
        ? parseFloat(matchingTimeRange[selectedPax]) + extraPrice
        : 0 + extraPrice;

    }else if(this.course.course_type == 2 && !this.course.is_flexible) {
      this.course.price = parseFloat(this.course.price) + this.getExtraPrice();
    }
    else if(this.course.course_type == 1 && !this.course.is_flexible) {
      this.course.price = parseFloat(this.course.price) + this.getExtraPrice();
    } else {
      this.updateCollectivePrice();
      this.collectivePrice = parseFloat(this.collectivePrice) + this.getExtraPriceCollective();
    }

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
        const translations = typeof course.translations === 'string' ?
          JSON.parse(course.translations) : course.translations;
        return translations[this.translateService.currentLang].description || course.description;
      }
    }

  }
  getShotrDescription(course: any) {
    if (!course.translations || course.translations === null) {
      return course.short_description;
    } else {
      const translations = typeof course.translations === 'string' ?
        JSON.parse(course.translations) : course.translations;
      return translations[this.translateService.currentLang].short_description || course.short_description;
    }
  }

  getCourseName(course: any) {
    if (course) {
      if (!course.translations || course.translations === null) {
        return course.name;
      } else {
        const translations = typeof course.translations === 'string' ?
          JSON.parse(course.translations) : course.translations;
        return translations[this.translateService.currentLang].name || course.name;
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
    const settingsObj = typeof settings === 'string' ? JSON.parse(settings) : settings;
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
      if(this.course.course_type === 1 && this.course.is_flexible) {
        this.selectedCourseDates = this.findMatchingCourseDates();
      } else if(this.course.course_type === 2) {
        let course_date = this.findMatchingCourseDate();
        course_date.hour_start = this.selectedHour
        let duration = this.utilService.parseDurationToMinutes(this.selectedDuration)
        course_date.hour_end = this.calculateEndTime(this.selectedHour, duration);
        this.selectedCourseDates = [course_date];
      } else {
        this.selectedCourseDates = this.course.course_dates;
      }

      this.confirmModal = true
      this.courseFlux--
    }
    this.courseFlux++
  }

  findMatchingCourseDates() {
    // Filtrar las course_dates que coinciden con las fechas seleccionadas
    const matchingDates = this.course.course_dates.filter((courseDate: any) => {
      return this.selectedDates.some((selectedDate: any) =>
        moment(selectedDate).isSame(moment(courseDate.date), 'day')
      );
    });

    return matchingDates;
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
    this.updatePrice();
  }
  toggleForfaitSelectionCollective(extra: any, date: string): boolean {
    if (!this.selectedForfaits[date]) {
      this.selectedForfaits[date] = [];
    }

    const index = this.selectedForfaits[date].findIndex(e => e.name === extra.name);

    if (index > -1) {
      // ❌ Se elimina el extra
      this.selectedForfaits[date].splice(index, 1);
      this.updatePrice();
      return false;
    } else {
      // ✅ Se agrega el extra
      this.selectedForfaits[date].push(extra);
      this.updatePrice();
      return true;
    }
  }

  isExtraSelected(extra: any, date: string): boolean {
    return this.selectedForfaits[date]?.some(e => e.name === extra.name) ?? false;
  }

  find = (table: any[], value: string, variable: string, variable2?: string) => table.find((a: any) => variable2 ? a[variable][variable2] === value : a[variable] === value)

}
