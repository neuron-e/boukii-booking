import {Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {  MatDialog } from '@angular/material/dialog';

import {ActivatedRoute, Router} from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as moment from 'moment';

type CancellationValidation = {
  can_cancel: boolean;
  can_partial_cancel: boolean;
  hours_until_first_date: number;
  cancellation_fee: number;
  refund_amount: number;
  error_message?: string;
};

type EditRules = {
  can_edit: boolean;
  allowed_changes: {
    add_dates: boolean;
    remove_dates: boolean;
    change_date: boolean;
    change_time: boolean;
    add_extras: boolean;
    remove_extras: boolean;
  };
  requires_payment: boolean;
  restrictions: string[];
};

import {BookingService} from '../../../services/booking.service';
import {ApiCrudService} from '../../../services/crud.service';
import {CancelPartialBookingModalComponent} from './components/cancel-partial-booking/cancel-partial-booking.component';
import {CancelBookingModalComponent} from './components/cancel-booking/cancel-booking.component';
import {SchoolService} from '../../../services/school.service';

@Component({
  selector: 'booking-detail-v2',
  templateUrl: './booking-detail.component.html',
  styleUrls: ['./booking-detail.component.scss']
})
export class BookingDetailV2Component implements OnInit, OnChanges {
  payModal: boolean = false;
  deleteModal: boolean = false
  deleteFullModal: boolean = false
  endModal: boolean = false
  deleteIndex: number = 1
  mainClient: any;
  allLevels: any;
  bookingData$ = new BehaviorSubject<any>(null);
  bookingData:any;
  groupedActivities: any[] = [];
  id: number;
  user: any;
  paymentMethod: number = 1; // Valor por defecto
  step: number = 1;  // Paso inicial
  selectedPaymentOption: string = 'Tarjeta';
  isPaid = false;
  paymentOptions: any[] = [
    { type: 'Tarjeta', value: 4, translation: this.translateService.instant('credit_card') },
    { type: 'Efectivo', value: 1,  translation: this.translateService.instant('payment_cash') },
    { type: 'Boukii Pay', value: 2, translation: 'Boukii Pay' }
  ];

  private activitiesChangedSubject = new Subject<void>();
  schoolData: any = null;
  activitiesChanged$ = this.activitiesChangedSubject.asObservable();

  private preloadedBookingData: any = null;
  private pendingBookingId: number | null = null;
  private currentBookingId: number | null = null;
  private isComponentReady = false;

  cancellationSettings: any = null;
  editSettings: any = null;
  private cancellationValidation: CancellationValidation | null = null;
  allowPartialCancellation = false;
  allowFullCancellation = false;
  canEditBooking = false;

  @Input() incData: any;
  @Input()
  set bookingId(value: number | null) {
    if (value === null || value === undefined) {
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return;
    }
    this.pendingBookingId = numeric;
    if (this.isComponentReady) {
      this.loadBooking('selection');
    }
  }

  @Input('bookingData')
  set bookingDataInput(value: any) {
    if (value && typeof value === 'object') {
      this.preloadedBookingData = value;
    }
  }

  @Output() closeBooking = new EventEmitter<void>();
  @Output() bookingUpdated = new EventEmitter<any>();
  @Output() bookingCancelled = new EventEmitter<any>();
  constructor(
    public translateService: TranslateService,
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    public bookingService: BookingService,
    private crudService: ApiCrudService,
    private router: Router,
    private schoolService: SchoolService,
    private snackBar: MatSnackBar
  ) {

  }

  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(data => {
      if (!data) {
        return;
      }

      this.schoolData = data.data;
      const storedUser = localStorage.getItem('boukiiUser');
      this.user = storedUser ? JSON.parse(storedUser) : null;
      this.isComponentReady = true;

      if (this.pendingBookingId === null) {
        const resolvedId = this.resolveBookingIdFromContext();
        if (resolvedId !== null) {
          this.pendingBookingId = resolvedId;
        }
      }

      this.getDegrees();

      if (this.pendingBookingId !== null) {
        this.loadBooking('init');
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['incData'] && !changes['incData'].firstChange) {
      const newValue = changes['incData'].currentValue;
      if (newValue && newValue.id !== undefined && newValue.id !== null) {
        const numeric = Number(newValue.id);
        if (!Number.isNaN(numeric)) {
          this.pendingBookingId = numeric;
          if (this.isComponentReady) {
            this.loadBooking('selection');
          }
        }
      }
    }
  }

  closeBookingDetail() {
    this.closeBooking.emit();
  }

  getDegrees() {
    const user = JSON.parse(localStorage.getItem("boukiiUser"))
    this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order',
      '&school_id=' + this.schoolData.id + '&active=1')
      .subscribe((data) => this.allLevels = data.data)
  }

  private resolveBookingIdFromContext(): number | null {
    if (this.pendingBookingId !== null) {
      return this.pendingBookingId;
    }

    const preloadedId = this.preloadedBookingData?.id;
    if (preloadedId !== undefined && preloadedId !== null) {
      const numeric = Number(preloadedId);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    if (this.incData && this.incData.id !== undefined && this.incData.id !== null) {
      const numeric = Number(this.incData.id);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    const routeId = this.activatedRoute.snapshot.params['id'];
    if (routeId) {
      const numeric = Number(routeId);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    return null;
  }

  private loadBooking(trigger: 'init' | 'selection' | 'update' | 'cancel' = 'init'): void {
    const resolvedId = this.resolveBookingIdFromContext();
    if (resolvedId === null) {
      return;
    }

    if (this.currentBookingId === resolvedId && trigger === 'selection') {
      return;
    }

    this.currentBookingId = resolvedId;
    this.id = resolvedId;
    this.pendingBookingId = resolvedId;

    this.crudService
      .get(`/bookings/${resolvedId}`, [
        'user',
        'clientMain.clientSports',
        'vouchersLogs.voucher',
        'bookingUsers.course.courseDates.courseGroups.courseSubgroups',
        'bookingUsers.course.courseExtras',
        'bookingUsers.bookingUserExtras.courseExtra',
        'bookingUsers.client.clientSports',
        'bookingUsers.courseDate',
        'bookingUsers.monitor.monitorSportsDegrees',
        'bookingUsers.degree',
        'payments',
        'bookingLogs'
      ])
      .subscribe({
        next: (response) => {
          this.applyBookingData(response.data, trigger);
        },
        error: (error) => {
          console.error('Error loading booking detail', error);
        }
      });
  }

  private applyBookingData(data: any, trigger: 'init' | 'selection' | 'update' | 'cancel'): void {
    if (!data) {
      return;
    }

    this.bookingData = data;
    this.bookingData$.next(data);
    this.groupedActivities = Array.isArray(data.grouped_activities)
      ? data.grouped_activities
      : this.groupBookingUsersByGroupId(data);
    this.mainClient = data.client_main || data.clientMain || null;

    this.resolveSettings();
    this.refreshCapabilities();

    this.activitiesChangedSubject.next(data);

    if (trigger === 'cancel') {
      this.bookingCancelled.emit(data);
    }

    this.bookingUpdated.emit(data);
  }

  private resolveSettings(): void {
    const parsedSchoolSettings = this.parseSettings(this.schoolData?.settings);
    const bookingSettings = this.parseSettings(this.bookingData?.booking_settings) || this.parseSettings(this.bookingData?.bookingSettings);
    const clientMain = this.bookingData?.client_main || this.bookingData?.clientMain;
    const clientSettings = this.parseSettings(clientMain?.booking_settings) || this.parseSettings(clientMain?.settings);

    const cancellationCandidates = [
      this.parseSettings(this.bookingData?.cancellation_settings),
      bookingSettings?.cancellation_settings,
      clientSettings?.cancellation_settings,
      parsedSchoolSettings?.booking?.cancellation_settings,
      parsedSchoolSettings?.cancellation_settings
    ];

    this.cancellationSettings = this.findFirstObject(cancellationCandidates);

    const editCandidates = [
      this.parseSettings(this.bookingData?.edit_settings),
      bookingSettings?.edit_settings,
      clientSettings?.edit_settings,
      parsedSchoolSettings?.booking?.edit_settings,
      parsedSchoolSettings?.edit_settings
    ];

    this.editSettings = this.findFirstObject(editCandidates);
  }

  private parseSettings(value: any): any {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn('Failed to parse settings', error);
        return null;
      }
    }

    return value;
  }

  private findFirstObject(values: any[]): any {
    for (const value of values) {
      if (!value) {
        continue;
      }

      const parsed = this.parseSettings(value);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }

    return null;
  }

  private refreshCapabilities(): void {
    this.cancellationValidation = this.validateCancellation(this.bookingData);
    this.allowFullCancellation = !!this.cancellationValidation?.can_cancel;
    this.allowPartialCancellation = !!this.cancellationValidation?.can_partial_cancel;

    const editRules = this.getEditRules(this.bookingData);
    this.canEditBooking = editRules.can_edit;
  }

  private validateCancellation(booking: any): CancellationValidation {
    const fallback: CancellationValidation = {
      can_cancel: false,
      can_partial_cancel: false,
      hours_until_first_date: 0,
      cancellation_fee: 0,
      refund_amount: 0
    };

    if (!booking) {
      return fallback;
    }

    if (booking.status === 2) {
      return {
        ...fallback,
        error_message: 'booking_already_cancelled'
      };
    }

    const settings = this.cancellationSettings || {};
    const allowCancellation = settings.allow_cancellation !== undefined ? !!settings.allow_cancellation : true;
    const allowPartial = settings.allow_partial_cancellation !== undefined ? !!settings.allow_partial_cancellation : true;
    const minHours = settings.min_hours_before_cancellation !== undefined ? Number(settings.min_hours_before_cancellation) : 0;
    const feePercentage = settings.cancellation_fee_percentage !== undefined ? Number(settings.cancellation_fee_percentage) : 0;

    const firstDate = this.getFirstDate(booking);
    const hoursUntil = firstDate ? moment(firstDate).diff(moment(), 'hours', true) : Number.POSITIVE_INFINITY;

    if (!allowCancellation) {
      return {
        ...fallback,
        hours_until_first_date: Number.isFinite(hoursUntil) ? hoursUntil : 0,
        error_message: 'cancellation_not_allowed'
      };
    }

    if (Number.isFinite(hoursUntil) && minHours > 0 && hoursUntil < minHours) {
      return {
        ...fallback,
        hours_until_first_date: hoursUntil,
        error_message: 'cancellation_too_late'
      };
    }

    const priceTotal = this.safeToNumber(booking.price_total);
    const cancellationFee = priceTotal * (feePercentage / 100);
    const refundAmount = booking.paid ? Math.max(priceTotal - cancellationFee, 0) : 0;

    const course = this.resolveBookingCourse(booking);
    const canPartial = allowPartial && !!course && !!course.is_flexible && course.course_type === 1;

    return {
      can_cancel: true,
      can_partial_cancel: canPartial,
      hours_until_first_date: Number.isFinite(hoursUntil) ? hoursUntil : 0,
      cancellation_fee: cancellationFee,
      refund_amount: refundAmount
    };
  }

  private getFirstDate(booking: any): string | null {
    if (!booking || !Array.isArray(booking.booking_users)) {
      return null;
    }

    const dates = booking.booking_users
      .map((bookingUser: any) => {
        if (!bookingUser) {
          return null;
        }

        if (bookingUser.course_date && bookingUser.course_date.date) {
          return bookingUser.course_date.date;
        }

        return bookingUser.date || null;
      })
      .filter((value: any) => !!value)
      .sort();

    return dates.length > 0 ? dates[0] : null;
  }

  private getHoursUntilFirstDate(booking: any): number {
    const firstDate = this.getFirstDate(booking);
    if (!firstDate) {
      return Number.POSITIVE_INFINITY;
    }

    return moment(firstDate).diff(moment(), 'hours', true);
  }

  private getEditRules(booking: any): EditRules {
    const base: EditRules = {
      can_edit: false,
      allowed_changes: {
        add_dates: false,
        remove_dates: false,
        change_date: false,
        change_time: false,
        add_extras: false,
        remove_extras: false
      },
      requires_payment: false,
      restrictions: []
    };

    if (!booking) {
      return base;
    }

    const course = this.resolveBookingCourse(booking);
    if (!course) {
      return base;
    }

    const isPaid = !!booking.paid;
    const isPrivate = course.course_type === 2;
    const isFlex = !!course.is_flexible;

    let rules: EditRules;

    if (!isPaid) {
      rules = {
        can_edit: true,
        allowed_changes: {
          add_dates: true,
          remove_dates: true,
          change_date: true,
          change_time: true,
          add_extras: true,
          remove_extras: true
        },
        requires_payment: false,
        restrictions: []
      };
    } else if (isPrivate && !isFlex) {
      rules = {
        can_edit: true,
        allowed_changes: {
          add_dates: false,
          remove_dates: false,
          change_date: true,
          change_time: true,
          add_extras: false,
          remove_extras: false
        },
        requires_payment: false,
        restrictions: ['same_duration']
      };
    } else if (isPrivate && isFlex) {
      rules = {
        can_edit: true,
        allowed_changes: {
          add_dates: true,
          remove_dates: true,
          change_date: true,
          change_time: true,
          add_extras: true,
          remove_extras: true
        },
        requires_payment: true,
        restrictions: ['follow_interval_rules', 'check_availability']
      };
    } else if (!isPrivate && !isFlex) {
      rules = {
        can_edit: false,
        allowed_changes: {
          add_dates: false,
          remove_dates: false,
          change_date: false,
          change_time: false,
          add_extras: false,
          remove_extras: false
        },
        requires_payment: false,
        restrictions: ['fixed_package_cannot_edit']
      };
    } else {
      rules = {
        can_edit: true,
        allowed_changes: {
          add_dates: true,
          remove_dates: true,
          change_date: false,
          change_time: false,
          add_extras: true,
          remove_extras: true
        },
        requires_payment: true,
        restrictions: ['follow_interval_rules', 'consecutive_dates', 'check_capacity']
      };
    }

    const editSettings = this.editSettings || {};
    if (editSettings.allow_edit === false) {
      rules.can_edit = false;
      rules.restrictions = [...rules.restrictions, 'settings_disabled'];
    }

    if (isPaid && editSettings.allow_edit_with_payment === false) {
      rules.requires_payment = false;
    }

    const hoursUntil = this.getHoursUntilFirstDate(booking);
    const minHoursEdit = editSettings.min_hours_before_edit !== undefined
      ? Number(editSettings.min_hours_before_edit)
      : undefined;

    if (rules.can_edit && minHoursEdit !== undefined && Number.isFinite(hoursUntil) && hoursUntil < minHoursEdit) {
      rules.can_edit = false;
      rules.restrictions = [...rules.restrictions, 'min_hours_before_edit'];
    }

    return rules;
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

    if (Array.isArray(this.groupedActivities) && this.groupedActivities.length > 0) {
      const firstGroup = this.groupedActivities[0];
      if (firstGroup && firstGroup.course) {
        return firstGroup.course;
      }
    }

    return null;
  }

  private safeToNumber(value: any, fallback = 0): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    const numeric = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  groupBookingUsersByGroupId(booking: any) {
    this.mainClient = booking.client_main;
    const groupedActivities = Object.values(booking.booking_users.reduce((acc: any, user: any) => {
      const groupId = user.group_id;
      const courseType = user.course.course_type;

      if (!acc[groupId]) {
        acc[groupId] = {
          sport: user.course.sport,
          course: user.course,
          sportLevel: user.degree,
          dates: [],
          monitors: [],
          utilizers: [],
          clientObs: user.notes,
          total: user.price,
          status: user.status,
          statusList: [] // Nuevo array para almacenar los status de los usuarios
        };
      }

      acc[groupId].statusList.push(user.status);

      // Determinar el nuevo status basado en los valores de statusList
      const uniqueStatuses = new Set(acc[groupId].statusList);

      if (uniqueStatuses.size === 1) {
        acc[groupId].status = [...uniqueStatuses][0]; // Si todos son iguales, asignamos ese mismo status
      } else {
        acc[groupId].status = 3; // Si hay mezcla de 1 y 2, el status del grupo es 3
      }

      const isUserAlreadyAdded = acc[groupId].utilizers.some(utilizer =>
        utilizer.first_name === user.client.first_name &&
        utilizer.last_name === user.client.last_name
      );

      if (!isUserAlreadyAdded) {
        acc[groupId].utilizers.push({
          id: user.client_id,
          first_name: user.client.first_name,
          last_name: user.client.last_name,
          image: user.client.image || null,
          birth_date: user.client.birth_date,
          language1_id: user.client.language1_id,
          country: user.client.country,
          extras: []
        });
      }
      const dateIndex = acc[groupId].dates.findIndex((date: any) =>
        date.id === user.course_date_id &&
        date.startHour === user.hour_start &&
        date.endHour === user.hour_end
      );
      if (dateIndex === -1) {
        acc[groupId].dates.push({
          id: user.course_date_id,
          date: user.course_date?.date,
          startHour: user.hour_start,
          endHour: user.hour_end,
          duration: user.formattedDuration,
          currency: booking.currency,
          monitor: user.monitor,
          utilizers: [],
          extras: [],
          booking_users: [],
        });
      }
      const currentDate = acc[groupId].dates.find((date: any) =>
        date.id === user.course_date_id &&
        date.startHour === user.hour_start &&
        date.endHour === user.hour_end
      );
      currentDate.booking_users.push(user);
      if (courseType !== 1) {
        const isUserAlreadyAdded = currentDate.utilizers.some(utilizer =>
          utilizer.first_name === user.client.first_name &&
          utilizer.last_name === user.client.last_name
        );

        if (!isUserAlreadyAdded) {
          currentDate.utilizers.push({
            id: user.client_id,
            first_name: user.client.first_name,
            last_name: user.client.last_name,
            image: user.client.image || null,
            birth_date: user.client.birth_date,
            language1_id: user.client.language1_id,
            country: user.client.country,
            extras: []
          });
        }
        const utilizer = currentDate.utilizers.find(utilizer =>
          utilizer.first_name === user.client.first_name &&
          utilizer.last_name === user.client.last_name
        );
        if (user.booking_user_extras && user.booking_user_extras.length > 0) utilizer.extras.push(...user.booking_user_extras.map((extra: any) => (extra.course_extra)));
      }
      if (courseType === 1 && user.booking_user_extras && user.booking_user_extras.length > 0) currentDate.extras.push(...user.booking_user_extras.map((extra: any) => (extra.course_extra)));

      if (user.monitor_id) acc[groupId].monitors.push(user.monitor_id);
      return acc;
    }, {}));
    groupedActivities.forEach((groupedActivity: any) => {
      groupedActivity.total = this.bookingService.calculateActivityPrice(groupedActivity);
    });

    return groupedActivities;
  }

  editActivity(data: any, index: any) {
    if (!this.canEditBooking) {
      this.snackBar.open(this.translateService.instant('booking_edit_not_allowed'), 'OK', { duration: 4000 });
      return;
    }

    if (data && data.course_dates) {
      const originalTotal = this.safeToNumber(this.groupedActivities[index]?.total);
      const newTotal = this.safeToNumber(data.total);

      if (newTotal - originalTotal > 0.01) {
        this.snackBar.open(this.translateService.instant('booking_edit_price_increase_not_allowed'), 'OK', { duration: 4000 });
        return;
      }

      this.crudService.post('/admin/bookings/update', {
        dates: data.course_dates,
        total: newTotal,
        group_id: this.groupedActivities[index].dates[0].booking_users[0].group_id,
        booking_id: this.currentBookingId
      }).subscribe({
        next: () => {
          this.loadBooking('update');
          this.snackBar.open(this.translateService.instant('snackbar.booking_detail.update'), 'OK', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error updating booking', error);
          this.snackBar.open(this.translateService.instant('snackbar.error'), 'OK', { duration: 3000 });
        }
      });

      return;
    }

    if (data && data.clientObs !== undefined) {
      this.groupedActivities[index].clientObs = data.clientObs;
      this.editObservations(this.groupedActivities[index].dates[0].booking_users[0].id, data);
      return;
    }

    this.loadBooking('update');
  }

  editObservations(bookingUserId:number, data:any) {
    this.crudService
      .update("/booking-users", { notes: data.clientObs }, bookingUserId)
      .subscribe(() => {
        this.snackBar.open(
          this.translateService.instant("snackbar.booking_detail.notes_client"),
          "OK",
          { duration: 3000 }
        );
      }, error => {
        console.error(error);
      });
  }

  private showCancellationNotAllowed(messageKey?: string): void {
    const key = messageKey || 'cancellation_not_allowed';
    this.snackBar.open(this.translateService.instant(key), 'OK', { duration: 4000 });
  }

  hasOtherActiveGroups(currentGroup: any): boolean {
    // Cuenta cuántas actividades tienen status 1 (activas)
    const activeGroupsCount = this.groupedActivities.filter(
      group => group.status === 1
    ).length;

    // Si el grupo actual tiene status 1 y hay más de una actividad activa,
    // significa que hay otras actividades activas además de la actual
    return currentGroup.status === 1 && activeGroupsCount > 1;
  }

  processDelete(index: number) {
    this.deleteIndex = index;
    const group = this.groupedActivities[index];
    const validation = this.validateCancellation(this.bookingData);

    if (!validation.can_cancel) {
      this.showCancellationNotAllowed(validation.error_message);
      return;
    }

    const hasOtherActive = this.hasOtherActiveGroups(group);

    if (!hasOtherActive) {
      this.processFullDelete(validation);
      return;
    }

    if (!validation.can_partial_cancel) {
      this.showCancellationNotAllowed('partial_cancellation_not_allowed');
      return;
    }

    if (this.bookingData.paid) {
      const dialogRef = this.dialog.open(CancelPartialBookingModalComponent, {
        width: '1000px',
        panelClass: 'full-screen-dialog',
        data: {
          itemPrice: group.total,
          booking: this.bookingData,
        },
      });

      dialogRef.afterClosed().subscribe((data: any) => {
        if (data) {
          this.bookingService.processCancellation(
            data, this.bookingData, hasOtherActive, this.user, group
          ).subscribe({
            next: () => {
              this.loadBooking('cancel');
              this.snackBar.open(
                this.translateService.instant('snackbar.booking_detail.update'),
                'OK',
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error processing cancellation:', error);
              this.snackBar.open(
                this.translateService.instant('snackbar.error'),
                'OK',
                { duration: 3000 }
              );
            }
          });
        }
      });
    } else {
      this.deleteModal = true;
    }
  }



  processFullDelete(validation?: CancellationValidation) {
    const effectiveValidation = validation || this.validateCancellation(this.bookingData);

    if (!effectiveValidation.can_cancel) {
      this.showCancellationNotAllowed(effectiveValidation.error_message);
      return;
    }

    if (this.bookingData.paid) {
      const dialogRef = this.dialog.open(CancelBookingModalComponent, {
        width: '1000px',
        panelClass: 'full-screen-dialog',
        data: {
          itemPrice: this.bookingData.price_total,
          booking: this.bookingData,
        },
      });

      dialogRef.afterClosed().subscribe((data: any) => {
        if (data) {
          this.bookingService.processCancellation(
            data, this.bookingData, false, this.user, null,
            this.bookingData.booking_users.map((b: any) => b.id), this.bookingData.price_total
          ).subscribe({
            next: () => {
              this.loadBooking('cancel');
              this.snackBar.open(
                this.translateService.instant('snackbar.booking_detail.update'),
                'OK',
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error processing cancellation:', error);
              this.snackBar.open(
                this.translateService.instant('snackbar.error'),
                'OK',
                { duration: 3000 }
              );
            }
          });
        }
      });
    } else {
      this.deleteFullModal = true;
    }
  }



  cancelFull() {
    const validation = this.validateCancellation(this.bookingData);

    if (!validation.can_cancel) {
      this.showCancellationNotAllowed(validation.error_message);
      this.deleteFullModal = false;
      return;
    }

    const bookingUserIds = this.bookingData.booking_users.map((b: any) => b.id);
    this.crudService.post('/admin/bookings/cancel',
      { bookingUsers: bookingUserIds })
      .subscribe({
        next: (response) => {
          const bookingData = {
            ...response.data,
            vouchers: response.data.voucher_logs
          };
          this.bookingData$.next(bookingData);
          this.loadBooking('cancel');
          this.snackBar.open(this.translateService.instant('snackbar.booking_detail.delete'), 'OK', { duration: 3000 });
          this.deleteFullModal = false;
        },
        error: (error) => {
          console.error('Error cancelling booking', error);
          this.snackBar.open(this.translateService.instant('snackbar.error'), 'OK', { duration: 3000 });
        }
      });
  }



  cancelActivity(index: any) {
    const validation = this.validateCancellation(this.bookingData);

    if (!validation.can_cancel) {
      this.showCancellationNotAllowed(validation.error_message);
      this.deleteModal = false;
      return;
    }

    if (!validation.can_partial_cancel) {
      this.showCancellationNotAllowed('partial_cancellation_not_allowed');
      this.deleteModal = false;
      return;
    }

    const group = this.groupedActivities[index];
    const bookingUserIds = group.dates.flatMap((date: any) => date.booking_users.map((b: any) => b.id));
    this.crudService.post('/admin/bookings/cancel',
      { bookingUsers: bookingUserIds })
      .subscribe({
        next: (response) => {
          const bookingData = {
            ...response.data,
            vouchers: response.data.voucher_logs
          };
          this.bookingData$.next(bookingData);
          this.loadBooking('cancel');
          this.snackBar.open(this.translateService.instant('snackbar.booking_detail.delete'), 'OK', { duration: 3000 });
          this.deleteModal = false;
        },
        error: (error) => {
          console.error('Error cancelling activity', error);
          this.snackBar.open(this.translateService.instant('snackbar.error'), 'OK', { duration: 3000 });
        }
      });
  }



  // Método para finalizar la reserva
  finalizeBooking(): void {
    let bookingData = this.bookingData;
    bookingData.selectedPaymentOption = this.selectedPaymentOption
    bookingData.payment_method_id = this.paymentMethod
    bookingData.paid = false
    bookingData.paid_total = 0

    // bookingData.cart = this.bookingService.setCart(this.groupedActivities.flatMap(activity => activity.dates), this.bookingService.getBookingData());

    if(this.paymentMethod === 1) {
      // Mapear la opción seleccionada con el método de pago
      if (this.selectedPaymentOption === 'Efectivo') {
        bookingData.payment_method_id = 1;
      } else if (this.selectedPaymentOption === 'Boukii Pay') {
        bookingData.payment_method_id = 2;
      } else if (this.selectedPaymentOption === 'Tarjeta') {
        bookingData.payment_method_id = 4;
      }
    }

    if (this.bookingService.calculatePendingPrice() === 0) {
      bookingData.paid = true;
      bookingData.paid_total = bookingData.price_total - this.calculateTotalVoucherPrice();
    }
    // Si es pago en efectivo o tarjeta, guardar si fue pagado
    if (bookingData.payment_method_id === 1 || bookingData.payment_method_id === 4) {
      bookingData.paid_total = bookingData.price_total - this.calculateTotalVoucherPrice();
      bookingData.paid = true;
    }


    // Enviar la reserva a la API
    this.crudService.post(`/admin/bookings/update/${this.id}/payment`, bookingData)
      .subscribe(
        (result: any) => {
          // Manejar pagos en línea
          if (bookingData.payment_method_id === 2 || bookingData.payment_method_id === 3) {
            this.crudService.post(`/admin/bookings/payments/${this.id}`, result.data.basket)
              .subscribe(
                (paymentResult: any) => {
                  if (bookingData.payment_method_id === 2) {
                    window.open(paymentResult.data, "_self");
                  } else {
                    this.snackBar.open(this.translateService.instant('snackbar.booking_detail.send_mail'),
                      'OK', { duration: 1000 });
                  }
                },
                (error) => {
                  this.showErrorSnackbar(this.translateService.instant('snackbar.booking.payment.error'));
                }
              );
          } else {
            this.snackBar.open(this.translateService.instant('snackbar.booking_detail.update'),
              'OK', { duration: 3000 });
            this.payModal = false;
            this.bookingData$.next(result.data);
            this.bookingData = result.data;
          }
        },
        (error) => {
          this.showErrorSnackbar(this.translateService.instant('snackbar.booking.payment.error'));
        }
      );
  }

  calculateTotalVoucherPrice(): number {
    return this.bookingData.vouchers ? this.bookingData.vouchers.reduce( (e, i) => e + parseFloat(i.bonus.reducePrice), 0) : 0
  }


  onPaymentMethodChange(event: any) {
    // Lógica para manejar el cambio de método de pago
    if (event.value === 1) {
      // Si se selecciona 'Pago directo', establecer un valor predeterminado o comportamiento necesario
      this.selectedPaymentOption = null; // Resetear la opción de pago seleccionada si es necesario
    } else {
      // Para otros métodos de pago, puedes asignar flags específicos
      this.selectedPaymentOption = event.value; // Ejemplo: asignar el método seleccionado
    }
  }
  cancelPaymentStep() {
    if(this.step == 1) {
      this.payModal = false;
    }
    this.step = 1;  // Regresar al paso 1
    this.isPaid = false;  // Resetear isPaid
  }


  showErrorSnackbar(message: string): void {
    this.snackBar.open(message, "OK", {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }


}


