import { Component, OnInit, ViewChild, EventEmitter, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { _MatTableDataSource } from '@angular/material/table';
import { Observable, map, startWith, Subject, retry, of, tap, forkJoin, switchMap, Subscription, combineLatest, filter, take } from 'rxjs';
import { catchError, takeUntil, finalize } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import * as moment from 'moment';
import { PasswordService } from 'src/app/services/password.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../services/cart.service';
import { ScreenSizeService } from 'src/app/services/screen.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild('userDetail') userDetailComponent: any;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  sportCard: any[] = [];
  selectedSport: any;
  selectedSports: any[] = [];
  clientSport: any = [];
  allLevels: any = [];
  allClientLevels: any = [];
  schoolSports: any = [];
  goals: any = [];
  evaluationFullfiled: any = [];
  evaluations: any = [];
  countries = MOCK_COUNTRIES;
  languages: any = [];
  selectedLanguages: any = [];
  userLogged: any;
  schoolData: any;
  schoolSettings: any = null;
  sportsCurrentData = new _MatTableDataSource([]);
  filteredSports: Observable<any[]>;
  sportsControl = new FormControl();
  loading = true;
  id: any;
  bookingId: any = null;
  bookingSelectionChanged = new EventEmitter<number>();
  selectedBooking: boolean = false;
  selectedBookingData: any = null;

  panelOpenState = false;
  bookings: any = [];

  displayedColumns: string[] = ['icon', 'booking_users[0].course.name', 'dates', 'has_cancellation_insurance',
    'has_boukii_care', 'payment_method', 'payment_status', 'cancelation_status', 'price_total'];
  mainId: any;
  private readonly bookingIncludes: string[] = [
    'bookingUsers.course.sport',
    'bookingUsers.course.courseDates',
    'bookingUsers.course.courseIntervals',
    'bookingUsers.course.courseExtras',
    'bookingUsers.courseDate',
    'bookingUsers.client',
    'bookingUsers.bookingUserExtras.courseExtra',
    'bookingUsers.degree',
    'bookingUsers.monitor',
    'clientMain',
    'payments',
    'vouchersLogs.voucher'
  ];

  defaults: any;
  defaultsUser: any;
  defaultsObservations: any;
  clientSchool = [];
  clientUsers: any[] = [];

  screenWidth!: number;
  private screenWidthSubscription!: Subscription;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService, private crudService: ApiCrudService, private dialog: MatDialog,
    private schoolService: SchoolService, private passwordGen: PasswordService, private snackbar: MatSnackBar, private translateService: TranslateService, private activatedRoute: ActivatedRoute, private cartService: CartService, public screenSizeService: ScreenSizeService) { }

  ngOnInit(): void {

    this.screenWidthSubscription = this.screenSizeService.getScreenWidth().subscribe(width => this.screenWidth = width);

    this.initializeData();

    this.handleBookingStatusMessages();

  }



  private initializeData(): void {

    this.loading = true;

    combineLatest([

      this.schoolService.getSchoolData(),

      this.authService.getUserData()

    ])

      .pipe(

        takeUntil(this.destroy$),

        filter(([school, user]) => !!school && !!user),

        take(1),

        tap(([school, user]) => {

          this.schoolData = school && school.data ? school.data : school;

          this.userLogged = user;

          this.mainId = user && Array.isArray(user.clients) && user.clients.length ? user.clients[0].id : null;

          this.id = this.mainId;

        }),

        switchMap(() => forkJoin([

          this.fetchSchoolSettings(),

          this.fetchDegrees(),

          this.fetchClientDetails(),

          this.fetchBookings(),

          this.fetchClientUtilisateurs()

        ])),

        finalize(() => this.loading = false)

      )

      .subscribe({

        error: (error: any) => {

          console.error('Error initializing user component', error);

          this.loading = false;

        }

      });

  }



  private handleBookingStatusMessages(): void {

    this.activatedRoute.queryParams

      .pipe(takeUntil(this.destroy$))

      .subscribe(params => {

        const status = params['status'];

        if (status === 'success') {

          this.snackbar.open(this.translateService.instant('Booking completed successfully!'), 'Close', {

            duration: 3000,

            verticalPosition: 'top'

          });

          this.cartService.carData.next(null);

          if (this.schoolData && this.schoolData.slug) {

            localStorage.removeItem(this.schoolData.slug + '-cart');

          }

        } else if (status === 'cancel' || status === 'failed') {

          this.snackbar.open(this.translateService.instant('Payment error: Booking could not be completed'), 'Close', {

            duration: 3000,

            verticalPosition: 'top'

          });

        }

      });

  }



  onTabChange(index: number) {
    if (index === 0) {
      this.userDetailComponent.changeClientDataB(this.defaults.id);
    } else if (index === 1) {
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
    }
  }
  private fetchSchoolSettings(): Observable<void> {
    return of(null).pipe(
      tap(() => this.loadSchoolSettings()),
      map(() => void 0)
    );
  }


  private fetchDegrees(): Observable<void> {
    if (!this.schoolData || !this.schoolData.id) {
      this.allLevels = [];
      return of(void 0);
    }

    return this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&active=1')
      .pipe(
        tap((data: any) => {
          this.allLevels = data && data.data ? data.data : [];
        }),
        catchError((error: any) => {
          console.error('Error loading degrees:', error);
          this.allLevels = [];
          return of(void 0);
        }),
        map(() => void 0)
      );
  }

  private fetchClientDetails(): Observable<void> {
    if (!this.id) {
      return of(void 0);
    }

    const includes = [
      'user',
      'clientSports.degree.degreesSchoolSportGoals',
      'clientSports.sport',
      'evaluations.evaluationFulfilledGoals.degreeSchoolSportGoal.degree',
      'evaluations.degree',
      'observations'
    ];

    return this.crudService.get('/clients/' + this.id, includes)
      .pipe(
        tap((client: any) => {
          const clientData = client && client.data ? client.data : null;
          if (!clientData) {
            return;
          }

          this.defaults = clientData;
          this.defaultsUser = clientData.user;
          this.evaluations = Array.isArray(clientData.evaluations) ? clientData.evaluations : [];
          this.evaluationFullfiled = [];
          this.evaluations.forEach((ev: any) => {
            if (ev && Array.isArray(ev.evaluation_fulfilled_goals)) {
              ev.evaluation_fulfilled_goals.forEach((element: any) => this.evaluationFullfiled.push(element));
            }
          });

          const sports = Array.isArray(clientData.client_sports) ? clientData.client_sports : [];
          this.clientSport = sports.filter((sport: any) => sport && sport.school_id === (this.schoolData && this.schoolData.id));
          this.selectedSport = this.clientSport.length ? this.clientSport[0] : null;
          this.goals = [];
          this.clientSport.forEach((element: any) => {
            element.level = element.degree;
          });

          const observations = Array.isArray(clientData.observations) ? clientData.observations : [];
          this.defaultsObservations = observations.length > 0 ? observations[0] : {
            id: null,
            general: '',
            notes: '',
            historical: '',
            client_id: null,
            school_id: null
          };
        }),
        switchMap(() => {
          const loaders: Observable<any>[] = [
            this.getLanguages().pipe(
              catchError((error: any) => {
                console.error('Error loading languages:', error);
                this.languages = [];
                this.selectedLanguages = [];
                return of([]);
              })
            ),
            this.getClientSchool().pipe(
              catchError((error: any) => {
                console.error('Error fetching client school:', error);
                this.clientSchool = [];
                return of([]);
              })
            ),
            this.getSchoolSportDegrees().pipe(
              catchError((error: any) => {
                console.error('Error loading school sports:', error);
                this.schoolSports = [];
                return of([]);
              })
            )
          ];

          return forkJoin(loaders);
        }),
        map(() => void 0),
        catchError((error: any) => {
          console.error('Error loading client data:', error);
          return of(void 0);
        })
      );
  }

  private fetchBookings(): Observable<void> {
    if (!this.mainId) {
      this.bookings = [];
      return of(void 0);
    }

    const filter = '&client_main_id=' + this.mainId;

    return this.crudService.list('/bookings', 1, 100, 'desc', 'id', '', '', null, filter, this.bookingIncludes)
      .pipe(
        tap((response: any) => {
          this.bookings = response && response.data ? response.data : [];
          this.processBookingsData();
          this.refreshSelectedBooking();
        }),
        catchError((error: any) => {
          console.error('Error loading bookings:', error);
          this.bookings = [];
          this.refreshSelectedBooking();
          return of(void 0);
        }),
        map(() => void 0)
      );
  }

  private fetchClientUtilisateurs(): Observable<void> {
    if (!this.id) {
      this.clientUsers = [];
      this.clients_utilizers = null;
      return of(void 0);
    }

    return this.crudService.list('/slug/clients/' + this.id + '/utilizers', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(
        tap((data: any) => {
          this.clientUsers = data && Array.isArray(data.data) ? data.data : [];
        }),
        switchMap(() => this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id', '&main_id=' + this.id)),
        tap((data: any) => {
          this.clients_utilizers = data;
          const utilizerEntries = data && Array.isArray(data.data) ? data.data : [];
          utilizerEntries.forEach((element: any) => {
            this.clientUsers.forEach((cl: any) => {
              if (cl && element && element.client_id === cl.id) {
                cl.utilizer_id = element.id;
              }
            });
          });
        }),
        map(() => void 0),
        catchError((error: any) => {
          console.error('Error loading client utilizers:', error);
          return of(void 0);
        })
      );
  }

  getData(showLoading: boolean = true): void {
    if (showLoading) {
      this.loading = true;
    }

    this.fetchClientDetails()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          if (showLoading) {
            this.loading = false;
          }
        })
      )
      .subscribe();
  }


  async getClientSchoolold() {
    try {
      const data: any = await this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
      this.clientSchool = data.data;
    } catch (error) {
      console.error(error);
    }
  }

  getClientSchool() {
    return this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(
        map((data) => {
          if (!data.data.length) console.error("No Client School")
          this.clientSchool = data.data;
        })
      );
  }

  async getClientObservations() {
    try {
      const data: any = await this.crudService.list('/client-observations', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
      this.defaultsObservations = data.data.length > 0 ? data.data[0] : {
        id: null,
        general: '',
        notes: '',
        historical: '',
        client_id: null,
        school_id: null
      };
    } catch (error) {
      console.error(error);
    }
  }
  clients_utilizers: any
  getClientUtilisateurs() {
    this.crudService.list('/slug/clients/' + this.id + '/utilizers', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientUsers = data.data;
        this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id', '&main_id=' + this.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.clients_utilizers = data
            data.data.forEach((element: any) => {
              this.clientUsers.forEach((cl: any) => {
                if (element.client_id === cl.id) {
                  cl.utilizer_id = element.id;
                }
              });
            });
          })

      })
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  goBack(url: string) {
    this.router.navigate(['/' + this.activatedRoute.snapshot.params['slug']]);
  }

  selectBooking(id: number) {
    this.bookingId = id;
    this.refreshSelectedBooking();

    if (this.selectedBooking) {
      this.bookingSelectionChanged.emit(this.bookingId);
    }
  }

  hideBooking() {
    this.selectedBooking = false;
    this.bookingId = null;
    this.selectedBookingData = null;
  }

  private refreshSelectedBooking(): void {
    if (!this.bookingId) {
      this.selectedBookingData = null;
      this.selectedBooking = false;
      return;
    }

    const id = Number(this.bookingId);
    const match = Array.isArray(this.bookings)
      ? this.bookings.find((booking: any) => booking && Number(booking.id) === id)
      : null;

    if (match) {
      this.selectedBookingData = match;
      this.selectedBooking = true;
    } else {
      this.selectedBookingData = null;
      this.selectedBooking = false;
      this.bookingId = null;
    }
  }

  getMinMaxDates(data: any[]): { minDate: string, maxDate: string, days: number } {
    let days = 0;
    if (data.length === 0) {
      return { minDate: '', maxDate: '', days: days };
    }

    let minDate = new Date(data[0].date);
    let maxDate = new Date(data[0].date);

    data.forEach(item => {
      const currentDate = new Date(item.date);
      if (currentDate < minDate) {
        minDate = currentDate;
      }
      if (currentDate > maxDate) {
        maxDate = currentDate;
      }
      days = days + 1;
    });

    return { minDate: minDate.toISOString(), maxDate: maxDate.toISOString(), days: days };
  }

  getMinMaxHours(data: any[]): { minHour: string, maxHour: string } {
    if (data.length === 0) {
      return { minHour: '', maxHour: '' };
    }
    let minHour: any = null;
    let maxHour: any = null;
    if (data[0] && data[0].course && data[0].course.course_type === 2) {
      minHour = data[0].hour_start;
      maxHour = this.calculateHourEnd(data[0].hour_start, data[0].course.duration);

    } else if (data[0] && data[0].hour_start && data[0].hour_end) {
      minHour = data[0].hour_start;
      maxHour = data[0].hour_end.replace(':00', '');

      data.forEach(item => {
        if (item.hour_start < minHour) {
          minHour = item.hour_start;
        }
        if (item.hour_end > maxHour) {
          maxHour = item.hour_end.replace(':00', '');
        }
      });
    }

    if (minHour) { minHour = minHour.replace(':00', ''); }

    return { minHour, maxHour };
  }

  getPaymentMethod(id: number | string) {
    if (id === null || id === undefined || id === '') {
      return this.translateService.instant('payment_no_payment');
    }

    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (!Number.isNaN(numericId)) {
      switch (numericId) {
        case 1:
          return 'CASH';
        case 2:
          return 'BOUKII PAY';
        case 3:
          return 'ONLINE';
        case 4:
          return 'AUTRE';
        case 5:
          return this.translateService.instant('payment_no_payment');
        default:
          break;
      }
    }

    if (typeof id === 'string' && id.trim().length > 0) {
      return id.toUpperCase();
    }

    return this.translateService.instant('payment_no_payment');
  }

  calculateHourEnd(hour: any, duration: any) {
    if (duration.includes('h') && duration.includes('min')) {
      const hours = duration.split(' ')[0].replace('h', '');
      const minutes = duration.split(' ')[1].replace('min', '');

      return moment(hour, 'HH:mm').add(hours, 'h').add(minutes, 'm').format('HH:mm');
    } else if (duration.includes('h')) {
      const hours = duration.split(' ')[0].replace('h', '');

      return moment(hour, 'HH:mm').add(hours, 'h').format('HH:mm');
    } else {
      const minutes = duration.split(' ')[0].replace('min', '');

      return moment(hour, 'HH:mm').add(minutes, 'm').format('HH:mm');
    }
  }

  private loadSchoolSettings(): void {
    if (!this.schoolData) {
      this.schoolSettings = null;
      return;
    }

    const settings = this.schoolData.booking_settings
      || this.schoolData.bookingSettings
      || (this.schoolData.settings && this.schoolData.settings.booking);

    this.schoolSettings = settings || null;
  }

  getBookings(): void {
    this.loading = true;

    const filter = '&client_main_id=' + this.mainId;

    this.crudService.list('/bookings', 1, 100, 'desc', 'id', '', '', null, filter, this.bookingIncludes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.bookings = response && response.data ? response.data : [];
          this.processBookingsData();
          this.refreshSelectedBooking();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading bookings:', error);
          this.loading = false;
          this.refreshSelectedBooking();
        }
      });
  }

  private processBookingsData(): void {
    const normalizedBookings = Array.isArray(this.bookings) ? this.bookings : [];
    this.bookings = normalizedBookings.map((booking: any) => {
      const bookingUsers = booking && Array.isArray(booking.booking_users) ? booking.booking_users : [];
      const groupedActivities = this.groupBookingUsersByCourse(bookingUsers);

      return {
        ...booking,
        grouped_activities: groupedActivities,
        total_dates: this.calculateTotalDates(bookingUsers),
        total_extras: this.calculateTotalExtras(bookingUsers),
        can_edit: this.canEditBooking(booking),
        can_cancel: this.canCancelBooking(booking),
        can_partial_cancel: this.canPartialCancelBooking(booking)
      };
    });
  }

  private groupBookingUsersByCourse(bookingUsers: any[]): any[] {
    const safeUsers = Array.isArray(bookingUsers) ? bookingUsers : [];
    const grouped = new Map<number, any>();

    safeUsers.forEach((user: any) => {
      if (!user) {
        return;
      }

      const courseId = typeof user.course_id === 'number'
        ? user.course_id
        : (user.course_id || (user.course && user.course.id));
      if (courseId === undefined || courseId === null) {
        return;
      }

      if (!grouped.has(courseId)) {
        grouped.set(courseId, {
          course: user.course || null,
          sport: user.course && user.course.sport ? user.course.sport : null,
          dates: [],
          clients: [],
          total: 0
        });
      }

      const group = grouped.get(courseId);
      const extras = Array.isArray(user.booking_user_extras) ? user.booking_user_extras : [];

      group.dates.push({
        date: user.course_date && user.course_date.date ? user.course_date.date : user.date,
        hour_start: user.hour_start,
        hour_end: user.hour_end,
        price: parseFloat(user.price || '0'),
        extras: extras,
        monitor: user.monitor,
        status: user.status
      });

      if (user.client && !group.clients.find((c: any) => c && c.id === user.client_id)) {
        group.clients.push(user.client);
      }

      group.total += parseFloat(user.price || '0');
      extras.forEach((extra: any) => {
        const extraPrice = extra && extra.course_extra && extra.course_extra.price !== undefined
          ? extra.course_extra.price
          : extra && extra.price !== undefined
            ? extra.price
            : 0;
        group.total += parseFloat(extraPrice || '0');
      });
    });

    return Array.from(grouped.values());
  }

  private calculateTotalDates(bookingUsers: any[]): number {
    const safeUsers = Array.isArray(bookingUsers) ? bookingUsers : [];
    const uniqueDates = new Set<string>();

    safeUsers.forEach((user: any) => {
      if (!user) {
        return;
      }
      const dateValue = user.course_date && user.course_date.date ? user.course_date.date : user.date;
      const key = (dateValue || '') + '-' + (user.hour_start || '') + '-' + (user.hour_end || '');
      uniqueDates.add(key);
    });

    return uniqueDates.size;
  }

  private calculateTotalExtras(bookingUsers: any[]): number {
    const safeUsers = Array.isArray(bookingUsers) ? bookingUsers : [];
    return safeUsers.reduce((total: number, user: any) => {
      const extras = user && Array.isArray(user.booking_user_extras) ? user.booking_user_extras : [];
      const extrasTotal = extras.reduce((sum: number, extra: any) => {
        const extraPrice = extra && extra.course_extra && extra.course_extra.price !== undefined
          ? extra.course_extra.price
          : extra && extra.price !== undefined
            ? extra.price
            : 0;
        return sum + parseFloat(extraPrice || '0');
      }, 0);
      return total + extrasTotal;
    }, 0);
  }

  private canEditBooking(booking: any): boolean {
    if (!booking || booking.status === 2) {
      return false;
    }

    if (!booking.paid) {
      return true;
    }

    const course = this.resolveBookingCourse(booking);
    if (!course) {
      return false;
    }

    if (course.course_type === 2 && !course.is_flexible) {
      return true;
    }

    return !!course.is_flexible;
  }

  private canCancelBooking(booking: any): boolean {
    return !!(booking && booking.status !== 2);
  }

  private canPartialCancelBooking(booking: any): boolean {
    if (!this.canCancelBooking(booking)) {
      return false;
    }
    const course = this.resolveBookingCourse(booking);
    return !!(course && course.is_flexible && course.course_type === 1);
  }

  private resolveBookingCourse(booking: any): any {
    if (!booking) {
      return null;
    }
    if (booking.grouped_activities && booking.grouped_activities.length > 0) {
      const firstGroup = booking.grouped_activities[0];
      if (firstGroup && firstGroup.course) {
        return firstGroup.course;
      }
    }
    if (booking.booking_users && booking.booking_users.length > 0) {
      const firstUser = booking.booking_users[0];
      if (firstUser && firstUser.course) {
        return firstUser.course;
      }
    }
    return null;
  }

  getResolvedCourse(booking: any): any {
    return this.resolveBookingCourse(booking);
  }

  getBookingSportImage(booking: any): string | null {
    const sport = this.resolveBookingSport(booking);
    if (!sport) {
      return null;
    }

    const candidates = [
      sport.image,
      sport.picture,
      sport.icon_image,
      sport.iconImage,
      sport.icon_url,
      sport.iconUrl,
      sport.icon_path,
      sport.iconPath
    ];

    const match = candidates.find((value: any) => typeof value === 'string' && value.trim().length > 0) || null;
    return match;
  }

  getBookingSportIcon(booking: any): string {
    const sport = this.resolveBookingSport(booking);
    return sport && sport.icon ? sport.icon : 'sports';
  }

  private resolveBookingSport(booking: any): any {
    const course = this.resolveBookingCourse(booking);
    if (course && course.sport) {
      return course.sport;
    }

    if (booking && booking.grouped_activities && booking.grouped_activities.length > 0) {
      const firstGroup = booking.grouped_activities[0];
      if (firstGroup && firstGroup.sport) {
        return firstGroup.sport;
      }
    }

    if (booking && booking.booking_users && booking.booking_users.length > 0) {
      const firstUser = booking.booking_users[0];
      if (firstUser && firstUser.course && firstUser.course.sport) {
        return firstUser.course.sport;
      }
    }

    return null;
  }

  getStatusClass(booking: any): string {
    if (!booking) {
      return '';
    }
    if (booking.status === 2) {
      return 'status-cancelled';
    }
    if (!booking.paid) {
      return 'status-pending';
    }
    if (this.isBookingComplete(booking)) {
      return 'status-completed';
    }
    return 'status-confirmed';
  }

  getStatusLabel(booking: any): string {
    if (!booking) {
      return '';
    }
    if (booking.status === 2) {
      return 'cancelled';
    }
    if (!booking.paid) {
      return 'pending_payment';
    }
    if (this.isBookingComplete(booking)) {
      return 'completed';
    }
    return 'confirmed';
  }

  private isBookingComplete(booking: any): boolean {
    if (!booking || !Array.isArray(booking.booking_users)) {
      return false;
    }
    const today = moment();
    return booking.booking_users
      .map((user: any) => {
        if (!user) {
          return null;
        }
        return user.course_date && user.course_date.date ? user.course_date.date : user.date;
      })
      .filter((value: any) => !!value)
      .every((date: string) => moment(date).isBefore(today));
  }

  goToCourses(): void {
    if (this.schoolData && this.schoolData.slug) {
      this.router.navigate(['/' + this.schoolData.slug]);
    }
  }

  onBookingUpdated(updatedBooking: any): void {
    if (!updatedBooking || !updatedBooking.id) {
      this.getBookings();
      return;
    }

    const index = this.bookings.findIndex((b: any) => b && b.id === updatedBooking.id);
    if (index !== -1) {
      this.bookings[index] = updatedBooking;
      this.processBookingsData();
      this.refreshSelectedBooking();
    } else {
      this.getBookings();
    }
  }

  onBookingCancelled(cancelledBooking: any): void {
    if (!cancelledBooking || !cancelledBooking.id) {
      this.getBookings();
      return;
    }

    const index = this.bookings.findIndex((b: any) => b && b.id === cancelledBooking.id);
    if (index !== -1) {
      this.bookings[index] = cancelledBooking;
      this.processBookingsData();
      this.refreshSelectedBooking();
    } else {
      this.getBookings();
    }
  }

  private getFirstDate(booking: any): string | null {
    if (!booking || !Array.isArray(booking.booking_users)) {
      return null;
    }
    const dates = booking.booking_users
      .map((bu: any) => {
        if (!bu) {
          return null;
        }
        return bu.course_date && bu.course_date.date ? bu.course_date.date : bu.date;
      })
      .filter((value: any) => !!value)
      .sort();
    return dates.length > 0 ? dates[0] : null;
  }

  setInitLanguages() {
    this.selectedLanguages = [];
    this.languages.forEach((element: any) => {
      if (element.id === this.defaults.language1_id || element.id === this.defaults.language2_id || element.id === this.defaults.language3_id
        || element.id === this.defaults.language4_id || element.id === this.defaults.language5_id || element.id === this.defaults.language6_id) {
        this.selectedLanguages.push(element);
      }
    });
  }

  calculateAge(birthDateString: string) {
    if (birthDateString && birthDateString !== null) {
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

  getLanguage(id: any) {
    const lang = this.languages.find((c: any) => c.id == +id);
    return lang ? lang.code.toUpperCase() : 'NDF';
  }

  getCountry(id: any) {
    const country = this.countries.find((c) => c.id == +id);
    return country ? country.name : 'NDF';
  }

  async getLanguagesold(user: any) {
    try {
      const data: any = await this.crudService.list('/languages', 1, 1000).toPromise();
      this.languages = data.data.reverse();
      this.setInitLanguages();
    } catch (error) {
      console.error(error);
    }
  }

  getLanguages() {
    return this.crudService.list('/languages', 1, 1000).pipe(
      tap((data) => {
        this.languages = data.data.reverse();
        this.setInitLanguages();
      })
    );
  }



  selectSportEvo(sport: any) {
    this.allClientLevels = [];
    this.selectedSport = sport;

    if (Array.isArray(this.schoolSports)) {
      this.schoolSports.forEach((element: any) => {
        if (this.selectedSport && this.selectedSport.sport_id === element.sport_id) {
          this.selectedSport.degrees = element.degrees;
        }
      });
    }

    const selectedDegrees = this.selectedSport && Array.isArray(this.selectedSport.degrees) ? this.selectedSport.degrees : [];
    selectedDegrees.forEach((element: any) => {
      element.inactive_color = this.lightenColor(element.color, 30);
      this.allClientLevels.push(element);
    });

    console.log(this.selectedSport);

    if (Array.isArray(this.allClientLevels)) {
      this.allClientLevels.sort((a: any, b: any) => a.degree_order - b.degree_order);
    }

    if (sport && sport.level) {
      for (const i in this.allClientLevels) {
        // Inicializa el array para cada grado (degree)
        this.sportCard[+i] = {
          degree: this.allClientLevels[i], // Almacenar el degree
          goals: [] // Inicializar los goals como un array vacÃ­o
        };

        // Buscar los goals correspondientes a cada degree y asignarlos
        this.goals.forEach((element: any) => {
          if (element.degree_id === this.allClientLevels[i].id) {
            this.sportCard[+i].goals.push(element);
          }
        });
      }
    }
  }

  lightenColor(hexColor: any, percent: any) {

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

    return '#' + r + g + b;
  }


  getClientSport() {
    return this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='
      + this.id + "&school_id=" + this.schoolData.id, '', null, '', ['degree.degreesSchoolSportGoals'])
      .pipe(
        switchMap((data) => {
          if (!data.data.length) console.error("No Client Sport")
          this.clientSport = data.data;
          this.selectedSport = this.clientSport[0];
          this.goals = [];
          this.clientSport.forEach((element: any) => {
            element.level = element.degree;
          });
          return this.getSchoolSportDegrees();
        })
      );
  }

  getDegrees() {
    this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&active=1')
      .subscribe((data) => {
        this.allLevels = data.data;
      })
  }

  getGoals() {
    this.clientSport.forEach((cs: any) => {

      cs.degrees.forEach((dg: any) => {
        this.crudService.list('/degrees-school-sport-goals', 1, 10000, 'desc', 'id', '&degree_id=' + dg.id)
          .subscribe((data) => {

            data.data.forEach((element: any) => {

              this.goals.push(element);
            });

          })
      });

    });
  }

  async getSchoolSportDegreesold() {
    try {
      const sport: any = await this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id=' + this.schoolData.id).toPromise();
      this.schoolSports = sport.data;

      for (let [idx, element] of sport.data.entries()) {
        const data: any = await this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&sport_id=' + element.sport_id).toPromise();
        this.schoolSports[idx].degrees = data.data;
      }
    } catch (error) {
      console.error(error);
    }
  }

  getSchoolSportDegrees() {
    return this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id=' +
      this.schoolData.id, '', null, '', ['sport', 'degrees.degreesSchoolSportGoals'])
      .pipe(
        map((sport) => {
          this.schoolSports = sport.data;
          this.schoolSports.forEach((sport: any) => {
            sport.name = sport.sport.name;
            sport.icon_selected = sport.sport.icon_selected;
            sport.icon_unselected = sport.sport.icon_unselected;
            sport.degrees.forEach((degree: any) => {
              degree.degrees_school_sport_goals.forEach((goal: any) => {
                this.goals.push(goal);
              });
            });

            this.clientSport.forEach((element: any) => {
              if (element.sport_id === sport.sport_id) {
                element.name = sport.name;
                element.icon_selected = sport.icon_selected;
                element.icon_unselected = sport.icon_unselected;
                element.degrees = sport.degrees;
              }
            });
          });
          this.sportsCurrentData.data = this.clientSport;
          const availableSports: any = [];
          this.schoolSports.forEach((element: any) => {
            if (!this.sportsCurrentData.data.find((s: any) => s.sport_id === element.sport_id)) {
              availableSports.push(element);
            }
          });

          this.filteredSports = this.sportsControl.valueChanges.pipe(
            startWith(''),
            map((sport: string | null) => sport ? this._filterSports(sport) : availableSports.slice())
          );

          this.selectSportEvo(this.clientSport[0])
          //return this.getGoals();
        })
      );
  }


  getSports() {
    this.crudService.list('/sports', 1, 10000, 'desc', 'id', '&school_id=' + this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data.data.forEach((element: any) => {
          this.schoolSports.forEach((sport: any) => {
            if (element.id === sport.sport_id) {
              sport.name = element.name;
              sport.icon_selected = element.icon_selected;
              sport.icon_unselected = element.icon_unselected;
            }
          });
        });

        this.schoolSports.forEach((element: any) => {

          this.clientSport.forEach((sport: any) => {
            if (element.sport_id === sport.sport_id) {
              sport.name = element.name;
              sport.icon_selected = element.icon_selected;
              sport.icon_unselected = element.icon_unselected;
              sport.degrees = element.degrees;
            }
          });
        });

        this.getGoals();

        this.sportsCurrentData.data = this.clientSport;

        const availableSports: any = [];
        this.schoolSports.forEach((element: any) => {
          if (!this.sportsCurrentData.data.find((s: any) => s.sport_id === element.sport_id)) {
            availableSports.push(element);
          }
        });
        this.filteredSports = this.sportsControl.valueChanges.pipe(
          startWith(''),
          map((sport: string | null) => sport ? this._filterSports(sport) : availableSports.slice())
        );

      })
  }

  private _filterSports(value: any): any[] {
    const filterValue = typeof value === 'string'
      ? value.toLowerCase()
      : (value && value.name ? value.name.toLowerCase() : '');

    if (!Array.isArray(this.schoolSports)) {
      return [];
    }

    return this.schoolSports.filter((sport: any) => {
      if (!sport || !sport.name) {
        return false;
      }
      return sport.name.toLowerCase().indexOf(filterValue) === 0;
    });
  }

  isModalAddUser: boolean = false

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    if (this.screenWidthSubscription) {
      this.screenWidthSubscription.unsubscribe();
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

  // async getEvaluations() {
  //   this.crudService.list('/evaluations', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
  //     .subscribe((data) => {
  //       this.evaluations = data.data;
  //       data.data.forEach((evaluation: any) => {
  //         this.crudService.list('/evaluation-fulfilled-goals', 1, 10000, 'desc', 'id', '&evaluation_id=' + evaluation.id)
  //           .subscribe((ev: any) => {
  //             ev.data.forEach((element: any) => {
  //               this.evaluationFullfiled.push(element);
  //             });
  //           });
  //       });
  //     })
  // }

  getEvaluationsData(level:any): any {
    let ret: any = [];

    this.evaluations.forEach((element: any) => {
      if (element.degree_id === level.id) {
        ret.push(element);
      }
    });

    return ret;
  }

  //changeLevel(nextLevel: any) {
  //  this.selectedGoal = [];
  //  this.sportIdx = this.sportIdx + nextLevel;
  //  if (this.sportIdx < 0) {
  //    this.sportIdx = this.allClientLevels.length - 1;
  //  } else if (this.sportIdx >= this.allClientLevels.length) {
  //    this.sportIdx = 0;
  //  }
  //  this.allClientLevels.sort((a: any, b: any) => a.degree_order - b.degree_order);
  //  this.selectedSport.level = this.allClientLevels[this.sportIdx];
  //  this.goals.forEach((element: any) => {
  //    if (element.degree_id === this.allClientLevels[this.sportIdx].id) {
  //      this.selectedGoal.push(element);
  //    }
  //  });
  //}

  getGoalImage(goal: any): string {
    let ret = '';
    if (goal.length > 0) {
      this.allClientLevels.forEach((element: any) => {
        if (element.id === goal[0].degree_id) {
          ret = element.image;
        }
      });
    }
    return ret;
  }
  @ViewChild('sliderContainer', { static: false }) sliderContainer!: ElementRef;
  centeredCardIndex: number = 0;

  scrollLeft(num: number) {
    this.sliderContainer.nativeElement.scrollBy({ left: num * 300, behavior: 'smooth' });
  }
  onScroll() {
    this.updateCenteredCardIndex();
  }

  private updateCenteredCardIndex() {
    const container = this.sliderContainer.nativeElement;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    const cards = container.querySelectorAll('app-user-detail-sport-card');
    cards.forEach((card: HTMLElement, index: number) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.centeredCardIndex = closestIndex;
  }

}






















