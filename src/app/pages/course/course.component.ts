import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {trigger, state, style, transition, animate} from '@angular/animations';
import {ThemeService} from '../../services/theme.service';
import {CoursesService} from '../../services/courses.service';
import {AuthService} from '../../services/auth.service';
import {SchoolService} from '../../services/school.service';
import {DatePipe} from '@angular/common';
import {CartService} from '../../services/cart.service';
import * as moment from 'moment';
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
  selectedDateReservation: any;

  tooltipsFilter: boolean[] = [];
  tooltipsLevel: boolean[] = [];
  showMoreFilters: boolean = false;
  showLevels: boolean = false;

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
  availableHours : any[] = [];

  schoolData: any;
  selectedDates: any = [];

  constructor(private router: Router, public themeService: ThemeService, private coursesService: CoursesService,
              private route: ActivatedRoute, private authService: AuthService, private schoolService: SchoolService,
              private datePipe: DatePipe,  private cartService: CartService) {

  }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => {
      this.userLogged = data;
    });
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
        }
      }
    );
    const id = this.route.snapshot.paramMap.get('id');
    this.dataLevels.forEach((degree: any) => {
      degree.inactive_color = this.lightenColor(degree.color, 30);
    });
    this.coursesService.getCourse(id).subscribe(res => {
      this.course = res.data;
      this.activeDates = this.course.course_dates.map((dateObj: any) =>
        this.datePipe.transform(dateObj.date, 'yyyy-MM-dd')
      );
      if (this.course.course_type == 2) {
        this.availableHours = this.getAvailableHours();
        this.availableDurations = this.getAvailableDurations(this.selectedHour);
        this.initializeMonthNames();
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.renderCalendar();
      }
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
      const isActive = !isPast && this.activeDates.includes(dateStr);
      this.days.push({number: i, active: isActive, selected: false, past: isPast});
    }

    let lastDayOfWeek = new Date(this.currentYear, this.currentMonth, daysInMonth).getDay();
    for (let k = lastDayOfWeek; k <= 6 && lastDayOfWeek !== 6; k++) {
      this.days.push({number: '', active: false});
    }

  }

  selectDay(day: any) {
    if (day.active) {
      this.days.forEach(d => d.selected = false);
      day.selected = true;
      const formattedDate = `${this.currentYear}-${this.currentMonth + 1}-${day.number}`;

      this.selectedDateReservation = `${day.number}`.padStart(2, '0') + '/' + `${this.currentMonth + 1}`.padStart(2, '0') + '/' + this.currentYear;
    }
  }

  addBookingToCart() {
    let bookingUsers = [];
    if(this.course.course_type == 2) {
      if(this.course.is_flexible) {
        let course_date = this.findMatchingCourseDate();
        bookingUsers.push({
          'school_id': this.schoolData.id,
          'client_id': this.selectedUser.id,
          'price': this.course.price,
          'currency': 'CHF',
          'course_id': this.course.id,
          'course_date_id': course_date.id,
          'course_group_id': null,
          'course_subgroup_id': null,
          'date': course_date.date,
          'hour_start': this.selectedHour,
          'hour_end': this.calculateEndTime(this.selectedHour, this.selectedDuration)
        })
      }
    } else {
      if(this.course.is_flexible) {
        this.course.course_dates.forEach((date: any) => {
          if (this.selectedDates.find((d:any) => moment(d).format('YYYY-MM-DD') == moment(date.date).format('YYYY-MM-DD'))) {
            let courseGroup = date.course_groups.find((i:any) => i.degree_id == this.selectedLevel.id);
            let courseSubgroup = courseGroup.course_subgroups[0]
            bookingUsers.push({
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
              'name': this.course.name,
              'sport_id': this.course.sport_id,
              'course_type': 1,
              'degree': this.course.availableDegrees.find((l: any) => l.id === this.selectedLevel.id)
            })
          }
        })
      } else {
        this.course.course_dates.forEach((date: any) => {
          let courseGroup = date.course_groups.find((i:any) => i.degree_id == this.selectedLevel.id);
          let courseSubgroup = courseGroup.course_subgroups[0]
          bookingUsers.push({
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
            'name': this.course.name,
            'sport_id': this.course.sport_id,
            'course_type': 1,
            'degree': this.course.availableDegrees.find((l: any) => l.id === this.selectedLevel.id)
          })
        })
      }
    }

    let cartStorage = localStorage.getItem(this.schoolData.slug + '-cart');
    let cart: any = {};

    if (cartStorage) {
      cart = JSON.parse(cartStorage);
    }

    if (!cart[this.selectedUser.id]) {
      cart[this.selectedUser.id] = {};
    }

    if (!cart[this.selectedUser.id][this.course.id]) {
      cart[this.selectedUser.id][this.course.id] = [];
    }

    cart[this.selectedUser.id][this.course.id].push(...bookingUsers);

    localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cart));

    this.cartService.carData.next(cart);
    //TODO: mostrar mensaje de curso guardado correctamente.

    this.goTo(this.schoolData.slug);

  }

  calculateEndTime(startTime: string, duration: string): string {
    // Convertir la hora de inicio y la duración a minutos
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [durationHours, durationMinutes] = duration.split(':').map(Number);

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
    const matchingDate = this.course.course_dates.find((courseDate:any) => {
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

  selectUser(user: any) {
    this.selectedUser = user;
    this.selectedLevel = null;
    this.showLevels = false;
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

  closeModalAddUser() {
    this.isModalAddUser = false;
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  transformAge(birthDate:string) {
    const fechaNacimientoDate = new Date(birthDate);
    const fechaActual = new Date();

    // Calcula la diferencia en milisegundos entre las dos fechas
    const diferencia = fechaActual.getTime() - fechaNacimientoDate.getTime();

    // Convierte la diferencia en milisegundos a años
    return Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365.25));
  }

  isAgeAppropriate(userAge: number, minAge: number, maxAge: number): boolean {
    return userAge >= minAge && userAge <= maxAge;
  }

  generateNumberArray(max: number): number[] {
    return Array.from({length: max}, (v, k) => k + 1);
  }

  filteredPriceRange() {
    return this.course.price_range.filter((item:any) => item.price !== '0.00'
      && item.num_pax == this.selectedPaxes );
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

    let durations = this.filteredPriceRange().filter((range: any) => {
      const durationInHours = Math.floor(range.time_interval / 60);
      return durationInHours <= availableTime;
    });
    this.selectedDuration = this.convertToHoursAndMinutes(durations[0].time_interval);
    return durations;
  }

  getAvailableHours(): string[] {
    let hours = [];
    const hourMin = parseInt(this.course.hour_min);
    const hourMax = parseInt(this.course.hour_max);

    // Obtener los intervalos de tiempo de los price_range y ordenarlos
    let timeIntervals = this.filteredPriceRange().map((range:any) => range.time_interval).sort((a:any, b:any) => a - b);

    // Calcular las diferencias entre intervalos consecutivos
    let differences = timeIntervals.slice(1).map((value:any, index:any) => value - timeIntervals[index]);

    // Encontrar el intervalo mínimo en minutos
    let minInterval = Math.min(...differences);
    let minDuration = Math.min(...timeIntervals); // Duración mínima en minutos

    // Calcular las horas disponibles en intervalos de minInterval
    for (let minute = hourMin * 60; minute <= hourMax * 60 - minDuration; minute += minInterval) {
      let hour = Math.floor(minute / 60);
      let min = minute % 60;
      let formattedTime = `${hour < 10 ? '0' + hour : hour}:${min < 10 ? '0' + min : min}`;
      hours.push(formattedTime);
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

    // Filtrar las duraciones disponibles
    this.availableDurations = this.filteredPriceRange()
      .filter((range:any) => selectedTimeInMinutes + range.time_interval <= maxTimeInMinutes);

    // Convertir la duración seleccionada a minutos
    const selectedDurationMinutes = this.convertHourToMinutes(this.selectedDuration);

    // Comprobar si la duración seleccionada está dentro de las duraciones disponibles
    const isSelectedDurationAvailable = this.availableDurations
      .some((range:any) => range.time_interval === selectedDurationMinutes);

    // Si no está disponible, establecer la primera duración disponible
    if (!isSelectedDurationAvailable && this.availableDurations.length > 0) {
      this.selectedDuration = this.convertToHoursAndMinutes(this.availableDurations[0].time_interval);
    }
  }

  updatePrice(): void {
    const selectedDurationInMinutes = this.convertHourToMinutes(this.selectedDuration); // Convertir duración a minutos
    const selectedPax = this.selectedPaxes; // Asumiendo que tienes una variable para los pax seleccionados

    // Encontrar el price_range que coincida con la duración y el pax seleccionados
    const matchingPriceRange = this.course.price_range.find((range:any) =>
      range.time_interval === selectedDurationInMinutes && // Convertir horas a minutos para la comparación
      range.num_pax == selectedPax
    );

    // Actualizar el precio basado en el price_range encontrado
    if (matchingPriceRange) {
      this.course.price = matchingPriceRange.price;
    } else {
      // Si no hay una coincidencia, puedes establecer un precio predeterminado o dejarlo como está
      this.course.price = 0; // O cualquier valor predeterminado que desees
    }
  }

  convertHourToMinutes(hourString: string): number {
    const [hours, minutes] = hourString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  selectDate(date: any) {
    const index = this.selectedDates.findIndex((d: any) => d === date);

    if (index === -1) {
      this.selectedDates.push(date);
    } else {
      this.selectedDates.splice(1, index);
    }
  }
}
