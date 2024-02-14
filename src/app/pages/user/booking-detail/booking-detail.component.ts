import { Component, EventEmitter, OnInit, Output, Input, SimpleChanges, OnChanges } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Observable, Subscription, forkJoin, map, of, startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { AuthService } from 'src/app/services/auth.service';
import { ConfirmModalComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'vex-booking-detail',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss']
})
export class BookingDetailComponent implements OnInit {
  private destroy$: Subject<boolean> = new Subject<boolean>();

  @Output() closeBooking = new EventEmitter<void>();

  privateIcon = 'https://school.boukii.com/assets/icons/prive_ski2x.png';
  collectifIcon = 'https://school.boukii.com/assets/icons/collectif_ski2x.png';
  @Input()
  public monthAndYear = new Date();

  @Input()
  id: any;

  @Input() set bookingId(value: number) {
    if (this.id !== value) {
      this.id = value;
    }
  }

  @Input() bookingSelectionChanged: EventEmitter<number>;

  @Output()
  public monthAndYearChange = new EventEmitter<Date | null>();

  borderActive: number = -1;
  showDetail: any = [];

  selectedDatePrivate = new Date();

  title = 'Título de la Reserva';
  titleMoniteur = 'Nombre monitor';
  usersCount = 5;
  duration = '3 horas';
  dates = ['03/11/2023', '04/11/2023', '05/11/2023']; // Ejemplo de fechas
  durations = ['1h 30', '2h 00', '2h 30']; // Ejemplo de duraciones
  persons: any = []; // Ejemplo de número de personas

  reservedDates = [
    new Date(),
    new Date(),
    new Date(),
    new Date(),
    new Date(),
    // ... otras fechas
  ];
  userAvatar = 'https://school.boukii.online/assets/icons/icons-outline-default-avatar.svg';
  userName = 'Nombre de Usuario';
  userNameSub = 'Nombre de Utilizador';
  userLevel = 'Intermedio';
  selectedButton: string = '1';
  selectedSubButton: string = '';
  bookingComplete: boolean = false;

  static id = 100;
  minDate: Date;
  selectedDate = null;
  selectedPrivateCoursesDate = moment();
  selectedItem: any = null;
  selectedCourseDateItem: any = null;
  selectedSubGroupItem: any = null;
  selectedSubGroupItemIndex: any = null;
  courseDates: any = [];
  reservableCourseDate: any = [];

  periodUnique = true;
  periodMultiple = false;
  sameMonitor = false;

  times: string[] = this.generateTimes();
  filteredTimes: Observable<string[]>;

  dateControl = new FormControl();
  timeControl = new FormControl();
  durationControl = new FormControl();
  personsControl = new FormControl();
  clientsForm = new FormControl('');
  subClientForm = new FormControl();
  sportForm = new FormControl();
  levelForm = new FormControl();
  monitorsForm = new FormControl();

  filteredOptions: Observable<any[]>;
  filteredSubClients: Observable<any[]>;
  filteredSports: Observable<any[]>;
  filteredLevel: Observable<any[]>;
  filteredMonitors: Observable<any[]>;
  languages = [];
  courseType: any = 'collectif';
  courseTypeId: any = 1;
  opRem = 0;
  boukiiCare = 0;
  form: UntypedFormGroup;
  defaults: any = {
    price_total: null,
    has_cancellation_insurance: false,
    price_cancellation_insurance: 0,
    has_boukii_care: false,
    price_boukii_care: 0,
    currency: null,
    paid_total: null,
    paid: null,
    payrexx_reference: null,
    payrexx_transaction: null,
    attendance: null,
    payrexx_refund: null,
    notes: null,
    notes_school: null,
    school_id: null,
    client_main_id: null,
    payment_method_id: null,
    paxes: null,
    color: null,
  };

  defaultsBookingUser: any = {
    school_id: null,
    booking_id: null,
    client_id: null,
    course_subgroup_id: null,
    course_id: null,
    course_date_id: null,
    degree_id: null,
    course_group_id: null,
    monitor_id: null,
    hour_start: null,
    hour_end: null,
    price: null,
    currency: null,
    date: null,
    attended: null,
    color: null,
  };

  options: string[] = ['One', 'Two', 'Three'];
  mode: 'create' | 'update' = 'create';
  loading: boolean = true;
  loadingCalendar: boolean = true;
  sportTypeSelected: number = 1;

  bookings: any = [];
  bookingsToCreate: any = [];
  discounts: any = [];
  clients: any = [];
  sportData: any = [];
  sportDataList: any = [];
  sportTypeData: any = [];
  levels: any = [];
  utilizers: any = [];
  courses: any = [];
  bookingExtras: any = [];
  courseExtra: any = [];
  coursesMonth: any = [];
  monitors: any = [];
  season: any = [];
  school: any = [];
  settings: any = [];
  user: any;
  selectedForfait: any = [];
  mainIdSelected = true;
  detailClient: any;
  reduction: any = null;
  finalPrice: any = null;
  finalPriceNoTaxes: any = null;
  bonus: any = [];
  currentBonus: any = [];
  bonusLog: any = [];
  totalPrice: any = 0;
  booking: any;
  bookingPendingPrice: any = 0;
  bookingUsers: any;
  bookingUsersUnique: any;
  countries = MOCK_COUNTRIES;
  schoolSettings: any = [];
  clientsIds: any = [];

  tva = 0;
  tvaPrice = 0;
  cancellationInsurance = 0;
  boukiiCarePrice = 0;

  cancelationNoOp = null;
  cancelationOp = null;

  degreesClient:any[]=[];
  today = moment();

  private subscription: Subscription;
  constructor(private dialog: MatDialog, private crudService: ApiCrudService, private authService: AuthService, private activatedRoute: ActivatedRoute,
    private snackbar: MatSnackBar, private schoolService: SchoolService, private router: Router, private translateService: TranslateService) {

    this.minDate = new Date(); // Establecer la fecha mínima como la fecha actual
  }

  ngOnInit() {
    this.bookingSelectionChanged.subscribe((data: any) => {
      this.id = data;
      this.loadData();
    });
  }

  async loadData() {

    if (this.id) {

      await this.schoolService.getSchoolData().subscribe(data => {
        this.schoolSettings = data.data;

        let storageSlug = localStorage.getItem(this.schoolSettings.slug+ '-boukiiUser');
          if(storageSlug) {
            this.user = JSON.parse(storageSlug);
          }

        this.getMonitors();
        this.getLanguages();

        this.getDegreesClient();
        this.getData(false);
      });
    }
  }

  async getDegreesClient(){
    try {
      const data: any = await this.crudService.get('/degrees?perPage='+99999+'&school_id='+this.schoolSettings.id).toPromise();
      this.degreesClient = data.data.sort((a: any, b: any) => a.degree_order - b.degree_order);
      this.degreesClient.forEach((degree: any) => {
        degree.inactive_color = this.lightenColor(degree.color, 30);
      });
    } catch (error) {
      console.error('There was an error!', error);
    }
  }

  private lightenColor(hexColor: string, percent: number): string {
    let r:any = parseInt(hexColor.substring(1, 3), 16);
    let g:any = parseInt(hexColor.substring(3, 5), 16);
    let b:any = parseInt(hexColor.substring(5, 7), 16);

    // Increase the lightness
    r = Math.round(r + (255 - r) * percent / 100);
    g = Math.round(g + (255 - g) * percent / 100);
    b = Math.round(b + (255 - b) * percent / 100);

    // Convert RGB back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return '#'+r+g+b;
  }


  getData(updateBooking = false) {
    this.loading = true;
    this.discounts = [];
    this.bonus = [];
    this.bookingsToCreate = [];
    this.courseExtra = [];
    this.bookingExtras = [];
    this.bookingUsers = [];
    this.currentBonus = [];

    this.crudService.get('/schools/'+this.schoolSettings.id)
    .subscribe((school) => {
      this.school = school.data;
      this.settings = JSON.parse(school.data.settings);
      this.cancellationInsurance =  parseFloat(this.settings?.taxes?.cancellation_insurance_percent);
      this.boukiiCarePrice = parseInt(this.settings?.taxes?.boukii_care_price);
      this.tva = parseFloat(this.settings?.taxes?.tva);
      this.cancelationNoOp = this.settings?.cancellations?.without_cancellation_insurance;
      this.cancelationOp = this.settings?.cancellations?.with_cancellation_insurance;

      forkJoin([this.getSportsType(), this.getClients()])
      .subscribe((data: any) => {
        this.sportTypeData = data[0].data.reverse();
        this.clients = data[1].data;
        this.detailClient = this.clients[0];
        this.crudService.get('/bookings/'+this.id)
        .subscribe((data) => {
          this.booking = data.data;

          this.crudService.list('/vouchers-logs', 1, 10000, 'asc', 'id', '&booking_id='+this.id)
            .subscribe((vl) => {
              if(vl.data.length > 0) {
                this.bonusLog = vl.data;
                vl.data.forEach((voucherLog: any) => {
                  this.crudService.get('/vouchers/'+voucherLog.voucher_id)
                    .subscribe((v) => {
                      v.data.currentPay = parseFloat(voucherLog.amount);
                      v.data.before = true;

                      if (parseFloat(voucherLog.amount) < 0) {
                        const idx = this.bonus.findIndex((b: any) => b.bonus.id === voucherLog.voucher_id);

                        this.bonus.splice(idx, 1);
                        this.currentBonus.splice(idx, 1);
                      } else {

                        this.bonus.push({bonus: v.data});
                        this.currentBonus.push({bonus: v.data});
                      }
                    })
                });
              }
            })

        this.crudService.list('/booking-users', 1, 10000, 'desc', 'id', '&booking_id='+this.id)
          .subscribe((bookingUser) => {
            this.bookingUsers = bookingUser.data;
            this.getUniqueBookingUsers();

            const groupedByCourseId = bookingUser.data.reduce((accumulator: any, currentValue: any) => {
              // Obtiene el course_id del objeto actual
              const key = currentValue.course_id;

              // Si el acumulador ya no tiene este course_id como clave, inicialízalo
              if (!accumulator[key]) {
                accumulator[key] = [];
              }

              // Agrega el objeto actual al array correspondiente para este course_id
              accumulator[key].push(currentValue);

              return accumulator;
            }, {});

            for (const courseId in groupedByCourseId) {
              if (groupedByCourseId.hasOwnProperty(courseId)) {


                this.crudService.get('/slug/courses/' + courseId)
                  .subscribe((course) => {

                    if (course.data.course_type === 2 && this.booking.old_id === null) {

                      const data: any = {price_total: 0, courseDates: [], degrees_sport: [], sport_id: null, clients: []}

                        groupedByCourseId[courseId].forEach((element: any) => {

                          if(parseFloat(element.price) !== 0) {
                            data.sport_id = course.data?.sport_id;
                            data.degrees_sport = this.degreesClient.filter(degree => degree.sport_id === course.data?.sport_id);
                            this.courses.push(course.data);
                            data.courseDates.push(element);
                            this.clientsIds.push(element.client_id);


                          } else {
                            data.clients.push(courseId);
                            this.clientsIds.push(element.client_id);
                          }

                        });

                        if(data.courseDates.length > 0) {
                          this.bookingsToCreate.push(data);
                        }

                    } else {
                      this.courses.push(course.data);

                      const data: any = {price_total: 0, courseDates: [], degrees_sport: [], sport_id: null}
                      data.sport_id = course.data?.sport_id;
                      data.degrees_sport = this.degreesClient.filter(degree => degree.sport_id === course.data?.sport_id);
                        groupedByCourseId[courseId].forEach((element: any, idx: any) => {

                          if (course.data.course_type === 1 && !course.data.is_flexible) {
                            if (idx === 0) {
                              data.price_total = parseFloat(element.price);
                            }
                          }
                          data.courseDates.push(element);
                        });

                        this.bookingsToCreate.push(data);
                    }

                  })
              }
            }


            this.bookingUsers.forEach((bu: any) => {
              this.crudService.list('/booking-user-extras', 1, 10000, 'desc', 'id', '&booking_user_id='+bu.id)
                .subscribe((bue) =>{
                  if (bue.data.length > 0) {
                    this.bookingExtras.push(bue.data[0]);
                    bue.data.forEach((element: any) => {
                      this.crudService.get('/course-extras/'+element.course_extra_id)
                      .subscribe((ce) => {
                        if (ce.data) {
                          ce.data.course_date_id = bu.course_date_id;
                          ce.data.booking_user_id = bu.id;
                          this.courseExtra.push(ce.data);
                        }
                      })
                    });
                  }
                })
            });

            setTimeout(() => {
              this.calculateDiscounts();
              this.calculateFinalPrice();
              this.loading = false;
            }, 500);
          })
        });
      });

    });
  }

  checkIsCancellable() {
    const today = moment();
    if (this.booking.has_cancellation_insurance) {
      if (this.cancelationOp !== null) {
        const todayPlusOpRem = today.subtract(this.cancelationOp, 'h');
        return todayPlusOpRem.isBefore(this.today);
      }
      return false;
    } else {
      if (this.cancelationOp !== null) {


        const todayPlusNoOpRem = today.subtract(this.cancelationNoOp, 'h');
        return todayPlusNoOpRem.isBefore(this.today);
      }
      return false;
    }
  }

  getAmountCourse(item: any, index: number) {
    if (this.courses[index].course_type === 2 && this.courses[index].is_flexible) {
      const priceRange = this.courses[index].price_range.find((a: any) => a[1] !== null);
      return priceRange[this.bookingUsers.filter((b: any) => b.course_id === this.courses[index].id).length];
    } else {
      return this.courses[index].price;
    }
  }


  getUniqueBookingUsers() {
    const clientIds = new Set();
    this.bookingUsersUnique = this.bookingUsers.filter((item: any) => {
      if (!clientIds.has(item.course_id) || !clientIds.has(item.client_id)) {
        clientIds.add(item.course_id);
        clientIds.add(item.client_id);
        return true;
      }
      return false;
    });
  }

  generateArray(paxes: number) {
    this.persons = [];
    for (let i = 1; i <= paxes; i++) {
      this.persons.push(i);
    }
  }

  ngOnDestroy() {
    if(this.subscription){
      this.subscription.unsubscribe();
    }
  }


  create() {

      setTimeout(() => {

        if (this.defaults.payment_method_id === 2 || this.defaults.payment_method_id === 3) {

          const bonuses: any = [];
          const extras: any = [];
          this.bonus.forEach((element: any) => {
            bonuses.push(
              {
                name: element.bonus.code,
                quantity: 1,
                price: -(element.bonus.quantity)
              }
            )
          });

          this.courseExtra.forEach((element: any) => {
            extras.push({name: element.name, quantity: 1, price: parseFloat(element.price)});
          });

          const basket = {
            payment_method_id: this.defaults.payment_method_id,
            price_base: {name: 'Price Base', quantity: 1, price: this.getBasePrice()},
            bonus: {total: this.bonus.length, bonuses: bonuses},
            reduction: {name: 'Reduction', quantity: 1, price: -(this.reduction)},
            boukii_care: {name: 'Boukii Care', quantity: 1, price: parseFloat(this.booking.price_boukii_care)},
            cancellation_insurance: {name: 'Cancellation Insurance', quantity: 1, price: parseFloat(this.booking.price_cancellation_insurance)},
            extras: {total: this.courseExtra.length, extras: extras},
            price_total: parseFloat(this.booking.price_total),
            pending_amount: parseFloat(this.bookingPendingPrice)
          }


          this.crudService.post('/slug/bookings/payments/' + this.id, basket)

            .subscribe((result: any) => {
              console.log((result));
              window.open(result.data, "_self");
            })
        } else {

          //modal de confirmacion
          this.crudService.update('/bookings', {paid: this.defaults.paid, paid_total: this.finalPrice, payment_method_id: this.defaults.payment_method_id}, this.id)
            .subscribe(() => {
              this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 1000});
              this.goTo('/bookings');
            })
        }
      }, 1000);

      /*this.crudService.update('/bookings', {paid: this.defaults.paid, payment_method_id: this.defaults.payment_method_id}, this.id)
        .subscribe((res) => {
          this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 3000});
          this.getData(true);
        })*/
  }

  update() {
    const booking = this.form.value;
    booking.id = this.defaults.id;

  }

  isCreateMode() {
    return this.mode === 'create';
  }

  isUpdateMode() {
    return this.mode === 'update';
  }

  displayFn(client: any): string {
    return client && (client?.first_name && client?.last_name) ? client?.first_name + ' ' + client?.last_name : client?.first_name;
  }

  displayFnMoniteurs(monitor: any): string {
    return monitor && monitor.first_name && monitor.last_name ? monitor.first_name + ' ' + monitor.last_name : '';
  }

  displayFnSport(sport: any): string {
    return sport && sport.name ? sport.name : '';
  }

  displayFnLevel(level: any): string {
    return level && level?.name && level?.annotation ? level?.annotation + ' ' + level?.name : level?.name;
  }

  displayFnTime(time: any): string {
    return time && time.name ? time.name : '';
  }

  generateTimes(): string[] {
    let times = [];
    let dt = new Date(2023, 0, 1, 8, 0, 0, 0);
    const end = new Date(2023, 0, 1, 17, 55, 0, 0);

    while (dt <= end) {
      const time = ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2);
      times.push(time);
      dt.setMinutes(dt.getMinutes() + 5); // Incrementa en 5 minutos
    }
    return times;
  }

  showDetailFn(id: number) {
    this.showDetail = id;
  }

  getClients() {
    return this.crudService.list('/clients', 1, 10000, 'desc', 'id', '&school_id='+this.schoolSettings.id, '&with[]=clientSports');/*
      .subscribe((data: any) => {
        this.clients = data.data;
        this.loading = false;

      })*/
  }

  getSportsType() {
    return this.crudService.list('/sport-types', 1, 1000);/*
      .subscribe((data) => {
        this.sportTypeData = data.data.reverse();
      });*/
  }

  getSports() {
    this.crudService.list('/school-sports', 1, 10000, 'asc', 'sport_id', '&school_id='+this.schoolSettings.id)
      .subscribe((sport) => {
        this.sportData = sport.data.reverse();
        this.sportData.forEach((element: any) => {
          this.crudService.get('/sports/'+element.sport_id)
            .subscribe((data) => {
              element.name = data.data.name;
              element.icon_selected = data.data.icon_selected;
              element.icon_unselected = data.data.icon_unselected;
              element.sport_type = data.data.sport_type;
            });
        });

      })

  }

  calculateAge(birthDateString: any) {
    if(birthDateString && birthDateString !== null) {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }

      return age;
    } else {
      return 0;
    }

  }

  getMonitors() {
    this.crudService.list('/monitors', 1, 10000, 'asc', 'first_name', '&school_id='+this.schoolSettings.id)
      .subscribe((data) => {
        this.monitors = data.data;
      })
  }

  addTimeToDate(timeString: any) {
    const match = timeString.match(/(\d+)h (\d+)min/);

    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);

        // Suponiendo que 'fecha' es tu fecha actual en Moment.js
        let fecha = moment();
        fecha.add(hours, 'hours').add(minutes, 'minutes');

        return fecha;
    } else {
        throw new Error('Formato de tiempo inválido');
    }
  }

  getSeason() {
    this.crudService.list('/seasons', 1, 10000, 'asc', 'id', '&school_id='+this.schoolSettings.id+'&is_active=1')
      .subscribe((season) => {
        this.season = season.data[0];
      })
  }

  getSchool() {
    this.crudService.get('/schools/'+this.schoolSettings.id)
      .subscribe((school) => {
        this.school = school.data;
        this.settings = JSON.parse(school.data.settings);
        this.selectedForfait = this.settings.extras.forfait.length > 0 ? this.settings.extras.forfait.length[0] : null;
      })
  }

  getLevelColor(id: any) {
    if (id && id !== null) {
      return this.levels.find((l: any) => l.id === id).color;

    }
  }

  getLevelOrder(id: any) {
    if (id && id !== null) {
      return this.levels.find((l: any) => l.id === id).degree_order;

    }
  }

  getLevelName(id: any): any {
    if (id && id !== null) {

      const level = this.levels.find((l: any) => l.id === id);
      return level?.annotation + ' - ' + level?.name;
    }
  }

  getMonitorAvatar(id: number) {

    if (id && id === null) {
      return this.userAvatar;
    } else {

      const monitor = this.monitors.find((m: any) => m.id === id);
      return monitor?.image;
    }
  }

  getMonitorName(id: number): any {
    if (id && id !== null) {

      const monitor = this.monitors.find((m: any) => m.id === id);

      return monitor?.first_name + ' ' + monitor?.last_name;
    }
  }

  getClientAvatar(id: number) {

    if (id === null) {
      return this.userAvatar;
    } else {

      const client = this.clients.find((m: any) => m.id === id);
      return client?.image;
    }
  }

  getClientName(id: number): any {
    if (id && id !== null) {

      const client = this.clients.find((m: any) => m.id === id);

      return client?.first_name + ' ' + client?.last_name;
    }
  }

  getClientDegree(id: number,sport_id: number) {
    if (id && id !== null && sport_id && sport_id !== null) {

      const client = this.clients.find((m: any) => m.id === id);
      const sportObject = client?.client_sports.find((obj: any) => obj.sport_id === sport_id);

      return sportObject?.degree_id;
    }
  }

  getClient(id: number) {
    if (id && id !== null) {

      const client = this.clients.find((m: any) => m.id === id);

      return client;
    }
  }


  getCourse(id: number) {

    if (id && id !== null) {
      const course = this.courses.find((m: any) => m.id === id);

      return course;
    }

  }


  setClientsNotes(event: any, bookingUsers: any) {

    bookingUsers.courseDates.forEach((element: any) => {
      this.crudService.update('/booking-users', {notes: event.target.value}, element.id)
      .subscribe(() => {

      })

      this.snackbar.open(this.translateService.instant('snackbar.booking_detail.notes_client'), 'OK', {duration:3000})
    });
  }

  setSchoolNotes(event: any, bookingUsers: any) {
    bookingUsers.courseDates.forEach((element: any) => {
      this.crudService.update('/booking-users', {notes_school: event.target.value}, element.id)
      .subscribe(() => {

      })

      this.snackbar.open(this.translateService.instant('snackbar.booking_detail.notes_school'), 'OK', {duration:3000})
    });
  }


  calculateHourEnd(hour: any, duration: any) {
    if(duration.includes('h') && duration.includes('min')) {
      const hours = duration.split(' ')[0].replace('h', '');
      const minutes = duration.split(' ')[1].replace('min', '');

      return moment(hour, 'HH:mm').add(hours, 'h').add(minutes, 'm').format('HH:mm');
    } else if(duration.includes('h')) {
      const hours = duration.split(' ')[0].replace('h', '');

      return moment(hour, 'HH:mm').add(hours, 'h').format('HH:mm');
    } else {
      const minutes = duration.split(' ')[0].replace('min', '');

      return moment(hour, 'HH:mm').add(minutes, 'm').format('HH:mm');
    }
  }


  getAvailableWeekDays(settings: any) {
    const data = JSON.parse(settings);
    let ret = null;
    if (data !== null) {
      if (data.weekDays.monday) {
        ret = ret === null ? 'Monday' : ret + ' - ' + 'Monday';
      }
      if (data.weekDays.tuesday) {
        ret = ret === null ? 'Tuesday' : ret + ' - ' + 'Tuesday';
      }
      if (data.weekDays.wednesday) {
        ret = ret === null ? 'Wednesday' : ret + ' - ' + 'Wednesday';
      }
      if (data.weekDays.thursday) {
        ret = ret === null ? 'Thursday' : ret + ' - ' + 'Thursday';
      }
      if (data.weekDays.friday) {
        ret = ret === null ? 'Friday' : ret + ' - ' + 'Friday';
      }
      if (data.weekDays.saturday) {
        ret = ret === null ? 'Saturday' : ret + ' - ' + 'Saturday';
      }
      if (data.weekDays.sunday) {
        ret = ret === null ? 'Sunday' : ret + ' - ' + 'Sunday';
      }
    }
    return ret;
  }

  calculateDiscounts() {
    if (this.courses.length > 0) {
      this.bookingsToCreate.forEach((b: any, idx: any) => {
        if (b.courseDates[0].status === 1) {if (this.courses[idx].is_flexible && this.courses[idx].course_type === 1) {
            const discounts = typeof this.courses[idx].discounts === 'string' ? JSON.parse(this.courses[idx].discounts) : this.courses[idx].discounts;
            discounts.forEach((element: any) => {
              if (element.date === b.courseDates.length) {
                this.discounts.push(this.getBasePrice(true) * (element.percentage / 100));
              }
            });
          }
        }
      });
    }
  }

  getTotalBook(bI: number, item: any) {

    if (this.courses[bI]?.course_type === 2 && this.courses[bI]?.is_flexible) {
      return this.getPrivateFlexPrice(item.courseDates);
    } else if (this.courses[bI]?.course_type === 1) {
      return item?.price_total;
    } else if (this.courses[bI]?.course_type === 2 && !this.courses[bI]?.is_flexible) {
      return this.courses[bI]?.price * item.courseDates.length;
    }
  }

  getBasePrice(noDiscount = false): any {
    let ret = 0;

    if (this.courses.length > 0) {
      this.bookingsToCreate.forEach((b: any, idx: any) => {
        if (b.courseDates[0].status === 1) {
          if (this.courses[idx].is_flexible && this.courses[idx].course_type === 2) {
            ret = ret + this.getPrivateFlexPrice(b.courseDates);
            b.price_total = this.getPrivateFlexPrice(b.courseDates);
          } else if (!this.courses[idx].is_flexible && this.courses[idx].course_type === 2) {
            ret = ret + parseFloat(this.courses[idx]?.price)* b.courseDates.length;
            b.price_total = parseFloat(this.courses[idx]?.price)* b.courseDates.length;
          } else if (this.courses[idx].is_flexible && this.courses[idx].course_type === 1) {
            const discounts = typeof this.courses[idx].discounts === 'string' ? JSON.parse(this.courses[idx].discounts) : this.courses[idx].discounts;
            let price = b?.courseDates[0].price * b.courseDates.length;
            let discount = 0;
            ret = ret + (b?.courseDates[0].price * b.courseDates.length);
            if (!noDiscount) {
              discounts.forEach((element: any) => {
                if (element.date === b.courseDates.length) {
                  ret = ret - (ret * (element.percentage / 100));
                  discount = price - (price * (element.percentage / 100));
                }
              });
            }
            ret = ret - discount;
            b.price_total = price;
          } else {
            ret = ret + b?.price_total
          }
        }

      });

      return ret;
    }

  }

  getBasePriceForAnulations(noDiscount = false): any {
    let ret = 0;

    if (this.courses.length > 0) {
      this.bookingsToCreate.forEach((b: any, idx: any) => {
          if (this.courses[idx].is_flexible && this.courses[idx].course_type === 2) {
            ret = ret + this.getPrivateFlexPrice(b.courseDates);
            b.price_total = this.getPrivateFlexPrice(b.courseDates);
          } else if (!this.courses[idx].is_flexible && this.courses[idx].course_type === 2) {
            ret = ret + parseFloat(this.courses[idx]?.price)* b.courseDates.length;
            b.price_total = parseFloat(this.courses[idx]?.price)* b.courseDates.length;
          } else if (this.courses[idx].is_flexible && this.courses[idx].course_type === 1) {
            const discounts = typeof this.courses[idx].discounts === 'string' ? JSON.parse(this.courses[idx].discounts) : this.courses[idx].discounts;
            ret = ret + (b?.courseDates[0].price * b.courseDates.length);
            if (!noDiscount) {
              discounts.forEach((element: any) => {
                if (element.date === b.courseDates.length) {
                  ret = ret - (ret * (element.percentage / 100));
                }
              });
            }

            b.price_total = ret;
          } else {
            ret = ret + b?.price_total
          }
      });

      return ret;
    }

  }

  deleteBooking() {
    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '1000px',  // Asegurarse de que no haya un ancho máximo
      panelClass: 'full-screen-dialog',  // Si necesitas estilos adicionales,
      data: {title: this.translateService.instant('bookings_page.cancelations.no_refund'), message: this.translateService.instant('bookings_page.cancelations.no_refund_text') + ': '
        + `<span style="#F53D7C;font-size: 20px;">` + this.finalPrice + ' ' +  this.booking.currency + `</span>`
      }
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      if (data) {
        this.loading = true;

        if (this.booking.paid && this.booking.payrexx_reference !== null) {
          this.crudService.create('/booking-logs', {booking_id: this.id, action: 'refund_boukii_pay', before_change: 'confirmed', user_id: this.user.id, reason: data.reason})
          .subscribe(() => {
            this.crudService.update('/bookings', {paid_total: this.booking.price_total}, this.booking.id)
            .subscribe(() => {
              this.crudService.post('/slug/bookings/refunds/'+this.id, {amount: this.finalPrice})
                .subscribe(() => {
                  this.crudService.update('/bookings', {status: 2}, this.booking.id)
                    .subscribe(() => {
                      this.crudService.post('/slug/bookings/cancel', {bookingUsers: this.bookingUsers.map((b: any) => b.id)})
                      .subscribe(() => {

                        this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 1000});
                        this.getData();
                      })
                    })
                })
            })
          })
        } else {
          this.crudService.create('/booking-logs', {booking_id: this.id, action: 'refund_boukii_pay', before_change: 'confirmed', user_id: this.user.id, reason: data.reason})
          .subscribe(() => {
            this.crudService.update('/bookings', {paid_total: this.booking.price_total}, this.booking.id)
            .subscribe(() => {
              this.crudService.update('/bookings', {status: 2}, this.booking.id)
                .subscribe(() => {
                  this.crudService.post('/slug/bookings/cancel', {bookingUsers: this.bookingUsers.map((b: any) => b.id)})
                  .subscribe(() => {

                    this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 1000});
                    this.getData();
                  })
                })
            })
          })
        }

        this.bookingUsers.forEach((element: any) => {
          this.crudService.update('/booking-users', {status: 2}, element.id)
          .subscribe(() => {

            /*this.bookingExtras.forEach(element => {
              this.crudService.delete('/booking-user-extras', element.id)
                .subscribe(() => {

                })
            });

            this.courseExtra.forEach(element => {
              this.crudService.delete('/course-extras', element.id)
                .subscribe(() => {

                })
            });*/
          })
        });
      }
    });

  }

  deletePartialBooking(index: number, book: any) {
    this.loading = true;

    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      width: '1000px',  // Asegurarse de que no haya un ancho máximo
      panelClass: 'full-screen-dialog',  // Si necesitas estilos adicionales,
      data: {title: this.translateService.instant('bookings_page.cancelations.no_refund'), message: this.translateService.instant('bookings_page.cancelations.no_refund_text') + ': '
      + '<span style="#F53D7C;font-size: 20px;">' + book.price_total + ' ' +  this.booking.currency + '</span>'}});

    dialogRef.afterClosed().subscribe((data: any) => {
      if (data) {
        this.loading = true;
        if (this.booking.paid && this.booking.payrexx_reference !== null) {
          this.crudService.create('/booking-logs', {booking_id: this.id, action: 'refund_boukii_pay', before_change: 'confirmed', user_id: this.user.id, reason: data.reason})
          .subscribe(() => {
            this.crudService.update('/bookings', {paid_total: this.booking.price_total}, this.booking.id)
            .subscribe(() => {
              this.crudService.post('/slug/bookings/refunds/'+this.id, {amount: this.bookingsToCreate[index].price_total})
                .subscribe(() => {
                  book.courseDates.forEach((element: any) => {
                    this.crudService.update('/booking-users', {status: 2}, element.id)
                    .subscribe(() => {
                    })
                  })

                  this.crudService.post('/slug/bookings/cancel', {bookingUsers: this.bookingUsers.map((b: any) => b.id)})
                    .subscribe(() => {
                    })
                  this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 1000});
                  this.getData();
              })
            })
          })
        } else {
          this.crudService.create('/booking-logs', {booking_id: this.id, action: 'refund_boukii_pay', before_change: 'confirmed', user_id: this.user.id, reason: data.reason})
          .subscribe(() => {
            this.crudService.update('/bookings', {paid_total: this.booking.price_total}, this.booking.id)
            .subscribe(() => {
              book.courseDates.forEach((element: any) => {
                this.crudService.update('/booking-users', {status: 2}, element.id)
                .subscribe(() => {
                })
              })

              this.crudService.post('/slug/bookings/cancel', {bookingUsers: this.bookingUsers.map((b: any) => b.id)})
                .subscribe(() => {
                })
              this.snackbar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', {duration: 1000});
              this.getData();
            })
          })
        }


        setTimeout(() => {
          if (this.bookingsToCreate.length === 0) {
            this.crudService.update('/bookings', {status: 2}, this.id)
            .subscribe(() => {
              this.getData(true);

            })

          } else {
            let price = parseFloat(this.booking.price_total);
            /*const bookingExtras = this.bookingExtras.filter((b) => b.booking_user_id === book.courseDates.id);
            const courseExtras = this.courseExtra.filter((b) => b.booking_user_id === book.courseDates.id);

            bookingExtras.forEach(element => {
              this.crudService.delete('/booking-user-extras', element.id)
                .subscribe(() => {

                })
            });

            courseExtras.forEach(element => {
              this.crudService.delete('/course-extras', element.id)
                .subscribe(() => {

                })
            });*/
            if (this.tva && !isNaN(this.tva)) {
              price = price + (price * this.tva);
            }

            if(this.booking.has_boukii_care) {
              // coger valores de reglajes
              price = price  + (this.boukiiCarePrice * 1 * this.bookingsToCreate[index].courseDates.length);
            }

            this.crudService.update('/bookings', {status: 3, paid_total: price}, this.id)
            .subscribe(() => {
              this.bookingsToCreate.splice(index, 1);
              this.getData(true);

            })

            /*this.crudService.update('/bookings', {status: 3}, this.id)
            .subscribe(() => {
              this.bookingsToCreate.splice(index, 1);
              this.getData(true);

            })*/
          }
        }, 1000);
      }
    });
  }

  generateRandomNumber() {
    const min = 10000000; // límite inferior para un número de 5 cifras
    const max = 99999999; // límite superior para un número de 5 cifras
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateRandomCode() {
    return "BOU-"+this.generateRandomNumber();
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  calculateRem(event: any) {
    if(event.source.checked) {
      this.opRem = this.getBasePrice() * this.cancellationInsurance;
      this.defaults.has_cancellation_insurance = event.source.checked;
      this.defaults.price_cancellation_insurance = this.getBasePrice() * this.cancellationInsurance;
      this.booking.price_cancellation_insurance = this.getBasePrice() * this.cancellationInsurance;
      this.calculateFinalPrice();
      this.crudService.update('/bookings', {price_cancellation_insurance: this.booking.price_cancellation_insurance, has_cancellation_insurance: true}, this.id)
        .subscribe(() => {
          this.snackbar.open(this.translateService.instant('op_rem_added'), 'OK', {duration: 3000});
        })
      return this.getBasePrice() *this.cancellationInsurance;
    } else {
      this.opRem = 0;
      this.defaults.has_cancellation_insurance = event.source.checked;
      this.defaults.price_cancellation_insurance = 0;
      this.booking.price_cancellation_insurance = 0;

      this.crudService.update('/bookings', {price_cancellation_insurance: 0, has_cancellation_insurance: false}, this.id)
        .subscribe(() => {
          this.snackbar.open(this.translateService.instant('op_rem_added'), 'OK', {duration: 3000});

        })
      this.calculateFinalPrice();
      return 0;
    }
  }

  calculateBoukiiCare(event: any) {
    if(event.source.checked) {
      this.boukiiCare = this.boukiiCarePrice * this.getBookingPaxes() * this.getBookingDates();
      this.calculateFinalPrice();
      this.defaults.has_boukii_care = event.source.checked;
      this.defaults.price_boukii_care = this.boukiiCarePrice * this.getBookingPaxes() * this.getBookingDates();
      this.booking.price_boukii_care = this.boukiiCarePrice * this.getBookingPaxes() * this.getBookingDates();

      this.crudService.update('/bookings', {price_boukii_care: this.booking.price_boukii_care, has_boukii_care: true}, this.id)
        .subscribe(() => {
          this.snackbar.open(this.translateService.instant('b_care_added'), 'OK', {duration: 3000});

        })
      return this.getBasePrice() + this.boukiiCarePrice;
    } else {
      this.boukiiCare = 0;
      this.calculateFinalPrice();
      this.defaults.has_boukii_care = event.source.checked;
      this.defaults.price_boukii_care = 0;
      this.booking.price_boukii_care = 0;

      this.crudService.update('/bookings', {price_boukii_care: 0, has_boukii_care: false}, this.id)
        .subscribe(() => {
          this.snackbar.open(this.translateService.instant('b_care_added'), 'OK', {duration: 3000});

        })
      return 0;
    }
  }

  getLanguage(id: any) {
    const lang: any = this.languages.find((c: any) => c.id == +id);
    return lang ? lang.code.toUpperCase() : 'NDF';
  }

  getLanguages() {
    this.crudService.list('/languages', 1, 1000)
      .subscribe((data) => {
        this.languages = data.data.reverse();

      })
  }

  getCountry(id: any) {
    const country = this.countries.find((c) => c.id == id);
    return country ? country.name : 'NDF';
  }

  calculateFinalPrice() {
    let price = this.getBasePrice();

    //forfait primero

    this.courseExtra.forEach((element: any) => {

        price = price + (+element.price);
    });

    if (this.booking.has_reduction) {
        price = price - this.booking.price_reduction;
    }

    if (this.bonus !== null && price > 0) {
      this.bonus.forEach((element: any) => {
        if (price > 0) {

          if (element.bonus.remaining_balance > price) {
            price = price - price;
          }  else {
            if (element.bonus.before) {
              price = price - element.bonus.currentPay;
            } else{
              price = price - element.bonus.remaining_balance;
            }

          }
        }
      });
    }

    if(this.booking.has_cancellation_insurance && this.cancellationInsurance > 0) {
      price = price + (this.getBasePrice() * this.cancellationInsurance);
    } else if (this.booking.has_cancellation_insurance) {
      price = price + parseFloat(this.booking.price_cancellation_insurance);
      this.tvaPrice = parseFloat(this.booking.price_cancellation_insurance);
    }

    if(this.booking.has_boukii_care && this.boukiiCarePrice > 0) {
      // coger valores de reglajes
      price = price  + (this.boukiiCarePrice * this.getBookingPaxes() * this.getBookingDates());
    } else if (this.booking.has_boukii_care) {
      price = price + parseFloat(this.booking.price_boukii_care);
      this.tvaPrice = parseFloat(this.booking.price_boukii_care);
    }

    // añadir desde reglajes el tva
    if (this.booking.status === 2) {
      this.finalPrice = parseFloat(this.booking.price_total);
      if (this.booking.has_tva) {
        this.tvaPrice = parseFloat(this.booking.price_tva);
      }
    } else {
      if ((this.tva && !isNaN(this.tva) || this.tva !== 0)) {
        this.finalPrice = price + (price * this.tva);
        this.tvaPrice = (price * this.tva);
      } else if (this.booking.has_tva) {
        this.tvaPrice = parseFloat(this.booking.price_tva);
        this.finalPrice = price + this.tvaPrice;

      } else {
        this.finalPrice = price;
      }
    }

    this.finalPriceNoTaxes = price;

    if (this.booking.paid_total) {

      this.bookingPendingPrice = this.finalPrice - parseFloat(this.booking.paid_total);
    } else {
      this.bookingPendingPrice = this.finalPrice;
    }
  }

  deleteBonus(index: number) {
    this.bonus.splice(index, 1);
    this.calculateFinalPrice();
  }


  getMonitorLang(id: number): any {
    if (id && id !== null) {

      const monitor = this.monitors.find((m: any) => m.id === id);

      return +monitor?.language1_id;
    }
  }

  getMonitorProvince(id: number): any {
    if (id && id !== null) {

      const monitor = this.monitors.find((m: any) => m.id === id);

      return +monitor?.province;
    }
  }

  getMonitorBirth(id: number) {
    if (id && id !== null) {

      const monitor = this.monitors.find((m: any) => m.id === id);

      return monitor?.birth_date;
    }
  }

  getCourseExtraForfait(forfait: any, data: any): any {
    const courseExtra = this.courseExtra.find((c: any) => c.course_id === data.course_id && c.course_date_id === data.course_date_id && forfait.id === c.name);
    if (courseExtra) {
      data.forfait = courseExtra;
      return true;
    }
  }

  convertToInt(value: any) {
    return parseFloat(value);
  }


  getCourseExtraForfaitPrice(data: any) {
    let ret = 0;
    this.courseExtra.forEach((c: any) => {

      if (c.course_id === data.course_id) {
        ret = ret + parseFloat(c.price);
        data.forfait = c;
      }
    });
    return ret;
  }

  getBookingPaxes(){
    return this.bookingUsersUnique.length;
  }

  getBookingDates(){
    let ret = 0;
    this.bookingsToCreate.forEach((element: any) => {
      ret = ret + element.courseDates.length;
    });

    return ret;
  }

  isNanValue(value: any) {
    return isNaN(value);
  }

  getPrivateFlexPrice(courseDates: any) {
    let ret = 0;
    courseDates.forEach((element: any) => {
      ret = ret + parseFloat(element.price);
    });

    return ret;
  }

  parseFloatValue(value: any) {
    return parseFloat(value);
  }

  onCloseBooking() {
    this.closeBooking.emit();
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
}
