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
import { DiscountState } from '../../services/booking.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import { ApiCrudService } from 'src/app/services/crud.service';
import {UtilsService} from '../../services/utils.service';

type IntervalIdentifier = string | number;

type IntervalReservableWindow = {
  start: Date | null;
  end: Date | null;
};

type IntervalReservableInfo = {
  start: Date | null;
  end: Date | null;
  isReservable: boolean;
  statusKey: string | null;
  statusParams: Record<string, any> | null;
  windowKey: string | null;
  windowParams: Record<string, any> | null;
};

type IntervalRuleDescriptor = {
  icon: string;
  key: string;
  params?: Record<string, any>;
  tooltipKey?: string;
  tooltipParams?: Record<string, any>;
};

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
  currentMonth: number;
  currentYear: number;
  days: any[] = [];

  // Getter para días de la semana traducidos
  get weekdays(): string[] {
    return [
      this.translateService.instant('day_mon'),
      this.translateService.instant('day_tue'),
      this.translateService.instant('day_wed'),
      this.translateService.instant('day_thu'),
      this.translateService.instant('day_fri'),
      this.translateService.instant('day_sat'),
      this.translateService.instant('day_sun')
    ];
  }

  // Helper para obtener el nombre del día traducido por número (0=domingo, 1=lunes, etc.)
  getWeekdayName(dayNumber: number): string {
    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    return this.translateService.instant(dayKeys[dayNumber]);
  }

  // Helper para obtener el nombre del día desde una fecha string
  getWeekdayNameFromDate(dateString: string): string {
    const dateObj = new Date(dateString);
    return this.getWeekdayName(dateObj.getDay());
  }

  activeDates: string[] = [];
  isModalAddUser: boolean = false;

  selectedHour: string = '';
  selectedDuration: any = null;
  availableDurations: string[] = [];
  availableHours: any[] = [];
  private readonly DEFAULT_PRIVATE_LEAD_MINUTES = 30;

  schoolData: any;
  settings: any;
  settingsExtras: any
  selectedDates: any = [];
  selectedCourseDates: any = [];
  collectivePrice: any = 0;

  // Variables para descuentos visuales
  appliedDiscountAmount: number = 0;
  originalPrice: number = 0;
  hasActiveDiscount: boolean = false;
  discountsByInterval: { intervalId: string; intervalName: string; discountAmount: number; discountPercentage: number }[] = [];
  discountSource: 'backend' | 'legacy' | 'error' = 'legacy';
  canonicalDiscountState?: DiscountState;

  // Control de la visualización de intervalos
  expandedIntervals: { [key: string]: boolean } = {};
  dateSelectionError: string = '';

  // Mapa para rastrear qué intervalo fue seleccionado para cada fecha
  private dateToIntervalMap: Map<string, string> = new Map();

  // Cache para evitar re-renderizado
  private cachedIntervalGroups: any[] | null = null;
  selectedIntervalId: string | null = null;

  defaultImage = '../../../assets/images/PAGINA-LOGIN-BOUKII-SCHOOLSMALL.jpg';

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
      // Normalizar price_range para flex privados
      if (this.course.course_type == 2 && this.course.is_flexible && typeof this.course.price_range === 'string') {
        try {
          this.course.price_range = JSON.parse(this.course.price_range);
        } catch {
          this.course.price_range = [];
        }
      }
      // Asegurar price_range como array
      if (this.course.course_type == 2 && this.course.is_flexible && !Array.isArray(this.course.price_range)) {
        this.course.price_range = [];
      }
      if (this.hasIntervals()) {
        // Inicializar intervalos cerrados por defecto
        // Los intervalos se abrirán al hacer click en ellos
      }
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
      // Normalizar price_range si viene como string en privados flex
      if (this.course.course_type == 2 && this.course.is_flexible && typeof this.course.price_range === 'string') {
        try {
          this.course.price_range = JSON.parse(this.course.price_range);
        } catch {
          this.course.price_range = [];
        }
      }
    if (this.course.course_type == 2) {
      this.availableHours = this.getAvailableHours();
      this.selectedHour = this.availableHours.length ? this.availableHours[0] : '';
      if (this.course.is_flexible) {
        this.availableDurations = this.getAvailableDurations(this.selectedHour);
        this.selectedDuration = this.availableDurations.length ? this.availableDurations[0] : null;
        this.selectedDuration = this.normalizeDurationValue(this.selectedDuration);
        this.updatePrice();
      } else {
        this.selectedDuration = this.normalizeDurationValue(this.course.duration);
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
      }
      this.collectivePrice = this.course.price;
    });

  }

  // Determina si debemos mostrar el curso por intervalos
  shouldDisplayByIntervals(): boolean {
    return this.hasIntervals() && this.course.course_type == 1;
  }

  // Determina si debemos mostrar el curso por semanas (flexible pero sin intervalos)
  shouldDisplayByWeeks(): boolean {
    return !this.hasIntervals() && this.course.is_flexible && this.course.course_type == 1;
  }

  // Determina si debemos mostrar el listado simple de fechas (no flexible, sin intervalos)
  shouldDisplaySimpleDates(): boolean {
    return !this.hasIntervals() && !this.course.is_flexible && this.course.course_type == 1;
  }

  // Método para verificar si el curso tiene intervalos configurados
  hasIntervals(): boolean {
    if (!this.course) {
      return false;
    }

    if (this.course?.intervals_config_mode === 'independent' && Array.isArray(this.course?.course_intervals) && this.course.course_intervals.length > 0) {
      return true;
    }

    const settings = this.getCourseSettings();
    if (settings?.intervals && Array.isArray(settings.intervals) && settings.intervals.length > 0) {
      return true;
    }

    return false;
  }

  // Alternar el estado de expansión de un intervalo
  toggleInterval(intervalId: IntervalIdentifier): void {
    const key = this.normalizeIntervalId(intervalId);
    if (!key) {
      return;
    }
    this.expandedIntervals[key] = !this.expandedIntervals[key];
  }

  // Verifica si un intervalo está expandido
  isIntervalExpanded(intervalId: IntervalIdentifier): boolean {
    const key = this.normalizeIntervalId(intervalId);
    if (!key) {
      return false;
    }
    return this.expandedIntervals[key] === true;
  }

  // Toggle para expandir/contraer un intervalo
  toggleIntervalExpanded(intervalId: IntervalIdentifier): void {
    const key = this.normalizeIntervalId(intervalId);
    if (!key) {
      return;
    }

    // Simplemente alternar el estado de expandido/colapsado
    // NO limpiar las fechas seleccionadas cuando se colapsa
    this.expandedIntervals[key] = !this.expandedIntervals[key];

    // Si se está expandiendo, marcar como intervalo seleccionado activo
    if (this.expandedIntervals[key]) {
      this.selectedIntervalId = key;
    }

    this.dateSelectionError = '';
  }

  // Método para obtener fechas agrupadas por intervalos
  getIntervalGroups(): any[] {
    // Usar cache para evitar re-renderizado
    if (this.cachedIntervalGroups !== null) {
      return this.cachedIntervalGroups;
    }

    if (!this.hasIntervals() || !this.course?.course_dates) {
      console.log('DEBUG: getIntervalGroups failed', {
        hasIntervals: this.hasIntervals(),
        course_dates: !!this.course?.course_dates,
        settings: this.course?.settings
      });
      return [];
    }

    const result = [];

    if (this.course?.intervals_config_mode === 'independent' && Array.isArray(this.course?.course_intervals) && this.course.course_intervals.length > 0) {
      this.course.course_intervals.forEach(interval => {
        const intervalId = this.normalizeIntervalId(interval?.id);
        if (!intervalId) {
          return;
        }

        const reservableInfo = this.getIntervalReservableInfoFromRaw(interval);

        const intervalDatesAll = this.course.course_dates
          .filter(date => this.dateBelongsToInterval(date, intervalId))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (intervalDatesAll.length > 0) {
          const firstDate = new Date(intervalDatesAll[0].date);
          const lastDate = new Date(intervalDatesAll[intervalDatesAll.length - 1].date);
          const weekdays = this.getUniqueWeekdaysFromDates(intervalDatesAll);
          const commonTime = this.getCommonTime(intervalDatesAll);
          const bookingMode = interval.booking_mode === 'package' || this.isPackageInterval(intervalId) ? 'package' : 'flexible';

          result.push({
            id: intervalId,
            name: interval.name || 'Intervalo',
            startDate: firstDate,
            endDate: lastDate,
            weekdays,
            time: commonTime,
            count: intervalDatesAll.length,
            dates: intervalDatesAll,
            bookingMode,
            reservableStartDate: reservableInfo.start,
            reservableEndDate: reservableInfo.end,
            reservableWindowKey: reservableInfo.windowKey,
            reservableWindowParams: reservableInfo.windowParams,
            reservableStatusKey: reservableInfo.statusKey,
            reservableStatusParams: reservableInfo.statusParams,
            isReservableNow: reservableInfo.isReservable,
            configMode: interval.config_mode || 'inherit',
            dateGenerationMethod: interval.date_generation_method || null,
            consecutiveDays: interval.consecutive_days_count ?? null
          });
        }
      });
    } else {
      const settings = this.getCourseSettings();
      const intervals = settings?.intervals && Array.isArray(settings.intervals) ? settings.intervals : [];

      intervals.forEach(interval => {
        const intervalId = this.normalizeIntervalId(interval?.id);
        if (!intervalId) {
          return;
        }

        const reservableInfo = this.getIntervalReservableInfoFromRaw(interval);

        const intervalDatesAll = this.course.course_dates
          .filter(date => this.dateBelongsToInterval(date, intervalId))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (intervalDatesAll.length > 0) {
          const firstDate = new Date(intervalDatesAll[0].date);
          const lastDate = new Date(intervalDatesAll[intervalDatesAll.length - 1].date);
          const weekdays = this.getUniqueWeekdaysFromDates(intervalDatesAll);
          const commonTime = this.getCommonTime(intervalDatesAll);
          const bookingMode = this.isPackageInterval(intervalId) ? 'package' : 'flexible';

          result.push({
            id: intervalId,
            name: interval.name || 'Intervalo',
            startDate: firstDate,
            endDate: lastDate,
            weekdays,
            time: commonTime,
            count: intervalDatesAll.length,
            dates: intervalDatesAll,
            bookingMode,
            reservableStartDate: reservableInfo.start,
            reservableEndDate: reservableInfo.end,
            reservableWindowKey: reservableInfo.windowKey,
            reservableWindowParams: reservableInfo.windowParams,
            reservableStatusKey: reservableInfo.statusKey,
            reservableStatusParams: reservableInfo.statusParams,
            isReservableNow: reservableInfo.isReservable
          });
        }
      });
    }

    // Guardar en cache
    this.cachedIntervalGroups = result;
    return result;
  }

  // Invalidar cache cuando cambien las fechas
  private invalidateIntervalGroupsCache(): void {
    this.cachedIntervalGroups = null;
  }

  // TrackBy para evitar re-renderizado innecesario
  trackByIntervalId(index: number, interval: any): any {
    return interval.id;
  }

  trackByDate(index: number, date: any): any {
    return date.date || date;
  }

  // Obtener configuraciones del curso
  getCourseSettings(): any {
    if (!this.course || !this.course.settings) return {};

    return typeof this.course.settings === 'string'
      ? JSON.parse(this.course.settings)
      : this.course.settings;
  }

  private buildCartSettingsSnapshot(): any {
    const settings = this.getCourseSettings();
    let intervals = Array.isArray(settings?.intervals) ? settings.intervals : [];

    if (!intervals.length) {
      const fallbackIntervals = this.buildCartIntervalsSnapshot();
      if (!fallbackIntervals) {
        return null;
      }
      intervals = fallbackIntervals;
    }

    return {
      intervals: intervals.map((interval: any) => ({
        id: interval?.id,
        name: interval?.name,
        discounts: Array.isArray(interval?.discounts)
          ? interval.discounts.map((discount: any) => ({
              dates: discount?.dates ?? discount?.days ?? discount?.date ?? discount?.min_days ?? discount?.count ?? 0,
              type: discount?.type ?? discount?.discount_type ?? 'percentage',
              value: discount?.value ?? discount?.discount ?? discount?.discount_value ?? 0
            }))
          : []
      }))
    };
  }

  private buildCartIntervalsSnapshot(): any[] | null {
    const sourceIntervals = Array.isArray(this.course?.course_intervals)
      ? this.course.course_intervals
      : (Array.isArray((this.course as any)?.courseIntervals) ? (this.course as any).courseIntervals : null);

    if (!sourceIntervals || sourceIntervals.length === 0) {
      return null;
    }

    return sourceIntervals.map((interval: any) => ({
      id: interval?.id,
      name: interval?.name,
      discounts: Array.isArray(interval?.discounts)
        ? interval.discounts.map((discount: any) => ({
            dates: discount?.dates ?? discount?.days ?? discount?.date ?? discount?.min_days ?? discount?.count ?? 0,
            type: discount?.type ?? discount?.discount_type ?? 'percentage',
            value: discount?.value ?? discount?.discount ?? discount?.discount_value ?? 0
          }))
        : []
    }));
  }

  private getGlobalReservableWindow(): IntervalReservableWindow {
    const settings = this.getCourseSettings();

    const startCandidate =
      this.course?.date_start_res ??
      (this.course as any)?.bookable_start_date ??
      settings?.date_start_res ??
      settings?.globalReservableStartDate ??
      settings?.reservableStartDate ??
      null;

    const endCandidate =
      this.course?.date_end_res ??
      (this.course as any)?.bookable_end_date ??
      settings?.date_end_res ??
      settings?.globalReservableEndDate ??
      settings?.reservableEndDate ??
      null;

    return {
      start: this.parseReservableDate(startCandidate),
      end: this.parseReservableDate(endCandidate)
    };
  }

  private shouldUseGlobalReservableWindow(): boolean {
    if (!this.course) {
      return false;
    }

    if (this.course?.intervals_config_mode === 'independent') {
      return false;
    }

    const globalWindow = this.getGlobalReservableWindow();
    return Boolean(globalWindow.start || globalWindow.end);
  }

  private normalizeIntervalId(value: IntervalIdentifier | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
  }

  private getLegacyInterval(intervalId: IntervalIdentifier | null | undefined): any {
    const normalizedId = this.normalizeIntervalId(intervalId);
    if (!normalizedId) {
      return null;
    }

    const settings = this.getCourseSettings();
    if (settings?.intervals && Array.isArray(settings.intervals)) {
      return settings.intervals.find((interval: any) =>
        this.normalizeIntervalId(interval?.id) === normalizedId
      ) || null;
    }

    return null;
  }

  private getIntervalEntity(intervalId: IntervalIdentifier | null | undefined): any {
    const normalizedId = this.normalizeIntervalId(intervalId);
    if (!normalizedId) {
      return null;
    }

    if (this.course?.intervals_config_mode === 'independent' && Array.isArray(this.course?.course_intervals)) {
      const found = this.course.course_intervals.find((interval: any) =>
        this.normalizeIntervalId(interval?.id) === normalizedId
      );
      if (found) {
        return found;
      }
    }

    return this.getLegacyInterval(intervalId);
  }
  private toBoolean(value: any): boolean | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      if (isNaN(value)) {
        return null;
      }
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return null;
      }
      if (['true', '1', 'yes', 'y', 'si'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
    }
    return null;
  }

  private toNumber(value: any): number | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private readIntervalField(source: any, ...keys: string[]): any {
    if (!source) {
      return undefined;
    }
    for (const key of keys) {
      if (source[key] !== undefined) {
        return source[key];
      }
    }
    return undefined;
  }

  private getIntervalConsecutiveDaysValue(source: any): number | null {
    const raw = this.readIntervalField(source, 'consecutive_days_count', 'consecutiveDaysCount', 'consecutive_days', 'consecutiveDays');
    return this.toNumber(raw);
  }

  private getIntervalMaxSelectableDatesValue(source: any): number | null {
    const raw = this.readIntervalField(source, 'max_selectable_dates', 'maxSelectableDates');
    return this.toNumber(raw);
  }

  private intervalLimitsSelectableDates(source: any): boolean {
    const raw = this.readIntervalField(source, 'limit_available_dates', 'limitAvailableDates');
    const parsed = this.toBoolean(raw);
    return parsed === true;
  }

  getIntervalRules(intervalId: IntervalIdentifier | null): IntervalRuleDescriptor[] {
    const normalized = this.normalizeIntervalId(intervalId);
    if (!normalized) {
      return [];
    }

    const intervalEntity = this.getIntervalEntity(normalized);
    const settings = this.getCourseSettings();
    const ruleSource = intervalEntity || this.getLegacyInterval(normalized) || settings;

    const rules: IntervalRuleDescriptor[] = [];

    if (this.isPackageInterval(normalized)) {
      rules.push({
        icon: 'layers',
        key: 'booking_interval_rule_package'
      });
    }

    if (this.mustBeConsecutive(normalized)) {
      // IGNORAR consecutive_days_count completamente
      // Solo indicar que las fechas deben ser consecutivas, sin especificar cantidad
      rules.push({
        icon: 'date_range',
        key: 'booking_dates_must_be_consecutive'
      });
    }

    if (this.mustStartFromFirst(normalized)) {
      rules.push({
        icon: 'play_arrow',
        key: 'must_start_first_day',
        tooltipKey: 'first_day_info'
      });
    }

    const limitDates = this.intervalLimitsSelectableDates(ruleSource);
    const maxSelectable = this.getIntervalMaxSelectableDatesValue(ruleSource);
    if (limitDates && maxSelectable && maxSelectable > 0) {
      rules.push({
        icon: 'format_list_numbered',
        key: 'booking_interval_rule_max_dates',
        params: { count: maxSelectable }
      });
    }

    return rules;
  }

  getSelectedIntervalRules(): IntervalRuleDescriptor[] {
    return this.getIntervalRules(this.selectedIntervalId);
  }

  getIntervalDisplayName(intervalId: IntervalIdentifier | null): string {
    const normalized = this.normalizeIntervalId(intervalId);
    if (!normalized) {
      return '';
    }
    const intervalEntity = this.getIntervalEntity(normalized);
    if (intervalEntity?.name) {
      return intervalEntity.name;
    }
    return '';
  }

  private dateBelongsToInterval(date: any, intervalId: IntervalIdentifier | null | undefined): boolean {
    const normalizedId = this.normalizeIntervalId(intervalId);
    if (!date || !normalizedId) {
      return false;
    }

    const dateIntervalId = this.normalizeIntervalId(
      date?.course_interval_id !== undefined && date?.course_interval_id !== null
        ? date.course_interval_id
        : date?.interval_id
    );

    return dateIntervalId === normalizedId;
  }

  isPackageInterval(intervalId: IntervalIdentifier | null | undefined): boolean {
    const interval = this.getIntervalEntity(intervalId);
    if (interval?.booking_mode) {
      return interval.booking_mode === 'package';
    }

    if (interval?.mustBookAll === true) {
      return true;
    }

    return false;
  }

  private parseReservableDate(value: any): Date | null {
    if (!value && value !== 0) {
      return null;
    }

    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    if (typeof value === 'number') {
      const dateFromNumber = new Date(value);
      if (!isNaN(dateFromNumber.getTime())) {
        return new Date(dateFromNumber.getFullYear(), dateFromNumber.getMonth(), dateFromNumber.getDate());
      }
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const normalized = trimmed.split('T')[0].replace(/\//g, '-');
      const parts = normalized.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map((p) => parseInt(p, 10));
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month - 1, day);
        }
      }

      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
    }

    return null;
  }

  private extractReservableWindow(raw: any): IntervalReservableWindow {
    if (!raw) {
      return { start: null, end: null };
    }

    const start = this.parseReservableDate(raw?.reservable_start_date ?? raw?.reservableStartDate ?? raw?.bookable_start_date ?? raw?.bookableStartDate);
    const end = this.parseReservableDate(raw?.reservable_end_date ?? raw?.reservableEndDate ?? raw?.bookable_end_date ?? raw?.bookableEndDate);

    return { start, end };
  }

  private formatReservableDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    return this.formatDate(date);
  }

  private buildReservableWindowMessage(window: IntervalReservableWindow): { key: string | null; params: Record<string, any> | null } {
    const startLabel = this.formatReservableDate(window.start);
    const endLabel = this.formatReservableDate(window.end);

    if (startLabel && endLabel) {
      return { key: 'booking_interval_window', params: { startDate: startLabel, endDate: endLabel } };
    }
    if (startLabel) {
      return { key: 'booking_interval_window_from', params: { startDate: startLabel } };
    }
    if (endLabel) {
      return { key: 'booking_interval_window_until', params: { endDate: endLabel } };
    }
    return { key: null, params: null };
  }

  private evaluateReservableWindow(window: IntervalReservableWindow): { isReservable: boolean; statusKey: string | null; statusParams: Record<string, any> | null } {
    const today = new Date(this.today);
    today.setHours(0, 0, 0, 0);

    if (window.start) {
      const start = new Date(window.start);
      start.setHours(0, 0, 0, 0);
      if (today < start) {
        return {
          isReservable: false,
          statusKey: 'booking_interval_not_open_yet',
          statusParams: { startDate: this.formatReservableDate(start) }
        };
      }
    }

    if (window.end) {
      const end = new Date(window.end);
      end.setHours(0, 0, 0, 0);
      if (today > end) {
        return {
          isReservable: false,
          statusKey: 'booking_interval_closed',
          statusParams: { endDate: this.formatReservableDate(end) }
        };
      }
    }

    return { isReservable: true, statusKey: null, statusParams: null };
  }

  private getIntervalReservableInfoFromRaw(raw: any): IntervalReservableInfo {
    const globalWindow = this.getGlobalReservableWindow();
    const forceGlobalWindow = this.shouldUseGlobalReservableWindow();

    let window = forceGlobalWindow ? globalWindow : this.extractReservableWindow(raw);

    if (!forceGlobalWindow && (!window.start && !window.end) && (globalWindow.start || globalWindow.end)) {
      window = globalWindow;
    }

    const evaluation = this.evaluateReservableWindow(window);
    const windowMessage = this.buildReservableWindowMessage(window);

    return {
      start: window.start,
      end: window.end,
      isReservable: evaluation.isReservable,
      statusKey: evaluation.statusKey,
      statusParams: evaluation.statusParams,
      windowKey: windowMessage.key,
      windowParams: windowMessage.params
    };
  }

  private getIntervalReservableInfo(intervalId: string | null): IntervalReservableInfo {
    if (!intervalId) {
      return this.getIntervalReservableInfoFromRaw(null);
    }
    const interval = this.getIntervalEntity(intervalId);
    return this.getIntervalReservableInfoFromRaw(interval);
  }

  private isIntervalReservableNow(intervalId: string | null): boolean {
    return this.getIntervalReservableInfo(intervalId).isReservable;
  }



  private sortDateStrings(dateStrings: string[]): string[] {
    return Array.from(new Set(dateStrings)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }

  private areDatesConsecutive(dateStrings: string[], availableDates?: string[]): boolean {
    const sorted = this.sortDateStrings(dateStrings);
    if (sorted.length <= 1) {
      return true;
    }

    // Si se proporcionan las fechas disponibles del intervalo, validar consecutividad dentro de esas fechas
    if (availableDates && availableDates.length > 0) {
      const sortedAvailable = this.sortDateStrings(availableDates);

      // Encontrar los índices de las fechas seleccionadas dentro de las disponibles
      const selectedIndices = sorted.map(date => sortedAvailable.indexOf(date)).filter(idx => idx !== -1);

      // Verificar que los índices sean consecutivos (sin saltos)
      for (let i = 1; i < selectedIndices.length; i++) {
        if (selectedIndices[i] !== selectedIndices[i - 1] + 1) {
          return false;
        }
      }
      return true;
    }

    // Fallback: validar días naturales consecutivos (compatibilidad con código antiguo)
    for (let i = 1; i < sorted.length; i++) {
      if (moment(sorted[i]).diff(moment(sorted[i - 1]), 'days') !== 1) {
        return false;
      }
    }
    return true;
  }

  private syncExtrasWithSelectedDates(): void {
    const allowedDates = new Set(this.selectedDates);
    Object.keys(this.selectedForfaits).forEach(date => {
      if (!allowedDates.has(date)) {
        delete this.selectedForfaits[date];
      }
    });
  }

  private validateIntervalSelection(intervalId: string): boolean {
    const reservableInfo = this.getIntervalReservableInfo(intervalId);
    if (!reservableInfo.isReservable) {
      this.dateSelectionError = this.translateService.instant(reservableInfo.statusKey ?? 'booking_interval_not_available', reservableInfo.statusParams ?? {});
      return false;
    }

    const availableFutureDates = this.getIntervalDates(intervalId);
    if (availableFutureDates.length === 0) {
      this.dateSelectionError = this.translateService.instant('no_future_dates');
      return false;
    }

    const availableSet = new Set(availableFutureDates.map(date => date.date));
    const cleanedSelection = this.sortDateStrings(this.selectedDates.filter(date => availableSet.has(date)));

    if (cleanedSelection.length === 0) {
      this.dateSelectionError = this.translateService.instant('no_dates_selected');
      return false;
    }

    const interval = this.getIntervalEntity(intervalId);
    const intervalSource = interval || this.getLegacyInterval(intervalId) || this.getCourseSettings();
    const limitDates = this.intervalLimitsSelectableDates(intervalSource);
    const maxSelectable = this.getIntervalMaxSelectableDatesValue(intervalSource);
    if (limitDates && maxSelectable && maxSelectable > 0 && cleanedSelection.length > maxSelectable) {
      this.dateSelectionError = this.translateService.instant('booking_interval_max_dates_error', { count: maxSelectable });
      return false;
    }

    if (this.isPackageInterval(intervalId)) {
      const missingDates = availableFutureDates.filter(date => !cleanedSelection.includes(date.date));
      if (missingDates.length > 0) {
        this.dateSelectionError = this.translateService.instant('booking_package_requires_all_dates');
        return false;
      }
    }

    if (this.mustStartFromFirst(intervalId)) {
      const firstAvailable = availableFutureDates[0];
      if (firstAvailable && !cleanedSelection.includes(firstAvailable.date)) {
        this.dateSelectionError = this.translateService.instant('booking_must_start_from_first_day');
        return false;
      }
    }

    if (this.mustBeConsecutive(intervalId)) {
      // Obtener las fechas disponibles del intervalo para validar consecutividad dentro del intervalo
      const intervalDatesArray = availableFutureDates.map(d => d.date);
      if (!this.areDatesConsecutive(cleanedSelection, intervalDatesArray)) {
        this.dateSelectionError = this.translateService.instant('booking_dates_must_be_consecutive');
        return false;
      }
      // IGNORAR consecutive_days_count - no validar cantidad específica
      // Solo validar que sean consecutivas
    }

    // NO sobrescribir selectedDates - mantener fechas de todos los intervalos
    // this.selectedDates = cleanedSelection;
    // this.syncExtrasWithSelectedDates();
    this.dateSelectionError = '';
    return true;
  }

  private validateFlexibleSelectionBeforeBooking(): boolean {
    if (!this.course?.is_flexible || this.course.course_type !== 1) {
      return true;
    }

    if (this.hasIntervals()) {
      // Obtener todos los intervalos únicos de las fechas seleccionadas
      const selectedIntervalIds = new Set<string>();
      this.selectedDates.forEach((dateStr: string) => {
        const intervalId = this.dateToIntervalMap.get(dateStr);
        if (intervalId) {
          selectedIntervalIds.add(intervalId);
        }
      });

      if (selectedIntervalIds.size === 0) {
        this.dateSelectionError = this.translateService.instant('no_dates_selected');
        return false;
      }

      // Validar cada intervalo seleccionado
      for (const intervalId of selectedIntervalIds) {
        if (!this.validateIntervalSelection(intervalId)) {
          return false;
        }
      }

      return true;
    }

    if (!this.selectedDates || this.selectedDates.length === 0) {
      this.dateSelectionError = this.translateService.instant('no_dates_selected');
      return false;
    }

    const ordered = this.sortDateStrings(this.selectedDates);

    if (this.mustStartFromFirst()) {
      const firstAvailable = (this.course?.course_dates || [])
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .find((d: any) => {
          const dActive = d.active === undefined || d.active === true || d.active === 1;
          return dActive && this.isDateInFuture(d.date);
        });
      if (firstAvailable && !ordered.includes(firstAvailable.date)) {
        this.dateSelectionError = this.translateService.instant('booking_must_start_from_first_day');
        return false;
      }
    }

    if (this.mustBeConsecutive()) {
      // Obtener las fechas disponibles del curso para validar consecutividad dentro de esas fechas
      const availableCourseDates = (this.course?.course_dates || [])
        .filter((d: any) => {
          const dActive = d.active === undefined || d.active === true || d.active === 1;
          return dActive && this.isDateInFuture(d.date);
        })
        .map((d: any) => d.date);

      if (!this.areDatesConsecutive(ordered, availableCourseDates)) {
        this.dateSelectionError = this.translateService.instant('booking_dates_must_be_consecutive');
        return false;
      }
    }

    this.selectedDates = ordered;
    this.syncExtrasWithSelectedDates();
    this.dateSelectionError = '';
    return true;
  }

  // Verificar si los días deben ser consecutivos
  mustBeConsecutive(intervalId?: string | null): boolean {
    if (intervalId) {
      const interval = this.getIntervalEntity(intervalId);
      if (interval) {
        if (interval.booking_mode === 'package') {
          return true;
        }

        if (interval.config_mode === 'custom') {
          return interval.date_generation_method === 'consecutive';
        }
      }

      const legacyInterval = this.getLegacyInterval(intervalId);
      if (legacyInterval?.mustBeConsecutive !== undefined) {
        return legacyInterval.mustBeConsecutive === true;
      }
    }

    const settings = this.getCourseSettings();
    return settings.mustBeConsecutive === true;
  }

  // Verificar si debe comenzar desde el primer día
  mustStartFromFirst(intervalId?: string | null): boolean {
    if (intervalId) {
      const interval = this.getIntervalEntity(intervalId);
      if (interval) {
        if (interval.booking_mode === 'package') {
          return true;
        }

        if (interval.config_mode === 'custom') {
          return interval.date_generation_method === 'first_day';
        }
      }

      const legacyInterval = this.getLegacyInterval(intervalId);
      if (legacyInterval?.mustStartFromFirst !== undefined) {
        return legacyInterval.mustStartFromFirst === true;
      }
    }

    const settings = this.getCourseSettings();
    return settings.mustStartFromFirst === true;
  }



  // Método para agrupar fechas por semanas cuando es flexible sin intervalos
  getWeekGroups(): any[] {
    if (this.hasIntervals() || !this.course.course_dates) {
      console.log('DEBUG: getWeekGroups failed', {
        hasIntervals: this.hasIntervals(),
        course_dates: !!this.course?.course_dates,
        isFlexible: this.course?.is_flexible
      });
      return [];
    }

    // Incluir todas las fechas y ordenar (se marcarán como no seleccionables las pasadas)
    const orderedDates = this.course.course_dates
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (orderedDates.length === 0) {
      return [];
    }

    // Agrupar por semanas
    const weekGroups = [];
    let currentGroup = null;

    orderedDates.forEach(date => {
      const dateObj = new Date(date.date);
      // Obtener el lunes de esta semana
      const mondayOfWeek = new Date(dateObj);
      mondayOfWeek.setDate(dateObj.getDate() - dateObj.getDay() + (dateObj.getDay() === 0 ? -6 : 1));
      const mondayString = mondayOfWeek.toISOString().split('T')[0];

      if (!currentGroup || currentGroup.mondayString !== mondayString) {
        // Crear un nuevo grupo para esta semana
        currentGroup = {
          id: 'week_' + mondayString,
          mondayString: mondayString,
          startDate: dateObj,
          endDate: dateObj,
          dates: [date],
          weekdays: [dateObj.getDay()]
        };
        weekGroups.push(currentGroup);
      } else {
        // Añadir a grupo existente
        currentGroup.dates.push(date);
        currentGroup.endDate = dateObj;
        if (!currentGroup.weekdays.includes(dateObj.getDay())) {
          currentGroup.weekdays.push(dateObj.getDay());
        }
      }
    });

    // Procesar los grupos para el formato final
    return weekGroups.map(group => {
      // Calcular la fecha de fin de semana (domingo)
      const endOfWeek = new Date(group.startDate);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - (endOfWeek.getDay() || 7)));

      // Verificar si todas las fechas tienen el mismo horario
      const commonTime = this.getCommonTime(group.dates);

      return {
        id: group.id,
        name: this.translateService.instant('week_of') + ' ' + this.formatDate(group.startDate),
        startDate: group.startDate,
        endDate: group.dates[group.dates.length - 1].date < endOfWeek ?
          new Date(group.dates[group.dates.length - 1].date) : endOfWeek,
        weekdays: group.weekdays.sort(),
        time: commonTime,
        count: group.dates.length,
        dates: group.dates
      };
    });
  }

  // Obtener todas las fechas (pasadas y futuras) sin agrupar (para cursos no flexibles sin intervalos)
  getFutureDates(): any[] {
    if (!this.course || !this.course.course_dates) {
      console.log('DEBUG: No course or course_dates', { course: !!this.course, course_dates: !!this.course?.course_dates });
      return [];
    }

    const allDates = this.course.course_dates
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allDates;
  }



  compareISOWithToday(isoDate: string): boolean {
    // Parse YYYY-MM-DD as a local date to avoid UTC offset issues
    if (!isoDate) return false;
    const parts = isoDate.split('-').map((p: string) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return false;
    const isoDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isoDateObj.getTime() >= today.getTime();
  }
  // Obtener días de la semana únicos de un conjunto de fechas
  private getUniqueWeekdaysFromDates(dates): number[] {
    const uniqueDays = new Set<number>();

    dates.forEach(date => {
      const day = new Date(date.date).getDay();
      uniqueDays.add(day);
    });

    return Array.from(uniqueDays).sort();
  }

  // Verificar si todas las fechas tienen el mismo horario y retornarlo
  private getCommonTime(dates): string {
    if (!dates || dates.length === 0) return '';

    const firstStartTime = dates[0].hour_start;
    const firstEndTime = dates[0].hour_end;

    const allSameTime = dates.every(date =>
      date.hour_start === firstStartTime && date.hour_end === firstEndTime
    );

    if (allSameTime) {
      return `${firstStartTime}h-${firstEndTime}h`;
    }

    return this.translateService.instant('various_times');
  }

  // Formatear fecha para visualización
  private formatDate(date: Date): string {
    return `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }

  // Convertir array de números de días a nombres de días
  formatWeekdays(days: number[]): string {
    if (!days || days.length === 0) return '';

    // Si son todos los días
    if (days.length === 7) {
      return this.translateService.instant('all_days');
    }

    // Si son días laborables
    if (days.length === 5 &&
      days.includes(1) && days.includes(2) && days.includes(3) &&
      days.includes(4) && days.includes(5) &&
      !days.includes(0) && !days.includes(6)) {
      return this.translateService.instant('weekdays');
    }

    // Si es fin de semana
    if (days.length === 2 && days.includes(0) && days.includes(6) &&
      !days.includes(1) && !days.includes(2) && !days.includes(3) &&
      !days.includes(4) && !days.includes(5)) {
      return this.translateService.instant('weekend');
    }

    // Caso general: listar los días usando traducciones
    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    const dayNames = days.map(day => this.translateService.instant(dayKeys[day]));

    if (dayNames.length === 1) {
      return dayNames[0];
    }

    const lastDay = dayNames.pop();
    return dayNames.join(', ') + ' ' + this.translateService.instant('and') + ' ' + lastDay;
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
      this.selectedHour = this.availableHours.length ? this.availableHours[0] : '';
      if (this.course.is_flexible) this.updateAvailableDurations(this.selectedHour);
    }
  }

  addBookingToCart() {
    let canonicalPricing: any = null;
    if (this.course.course_type === 1 && this.course.is_flexible) {
      canonicalPricing = this.canonicalDiscountState ? {
        ...this.canonicalDiscountState
      } : {
        originalPrice: this.originalPrice,
        totalDiscount: this.appliedDiscountAmount,
        finalPrice: this.collectivePrice,
        intervals: this.discountsByInterval,
        source: this.discountSource || 'legacy'
      };
      if (!this.validateFlexibleSelectionBeforeBooking()) {
        return;
      }
    }
    let bookingUsers: any = [];
    if (this.course.course_type == 2) {
      if (this.course.is_flexible) {
        let course_date = this.findMatchingCourseDate();
        if (!course_date) {
          this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
          return;
        }
        const bookingDate = this.normalizeDateForApi(course_date?.date);
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
            'date': bookingDate,
            'hour_start': this.selectedHour,
            'hour_end':  this.calculateEndTime(this.selectedHour, this.utilService.parseDurationToMinutes(this.selectedDuration)),
            'extra': this.selectedForfait
          });
        });
      } else {
        let course_date = this.findMatchingCourseDate();
        if (!course_date) {
          this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
          return;
        }
        const bookingDate = this.normalizeDateForApi(course_date?.date);
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
            'date': bookingDate,
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
            // NO filtrar por intervalo activo - permitir fechas de todos los intervalos seleccionados
            // La verificación de selectedDates ya garantiza que son fechas válidas

            // Encuentra el grupo correspondiente al nivel seleccionado
            let courseGroup = date.course_groups.find((i: any) => i.degree_id == this.selectedLevel.id);
            let courseSubgroup = courseGroup.course_subgroups[0];

            // Encuentra los extras de la fecha
            const dateExtras = this.selectedForfaits[date.date] || [];  // Verifica si hay extras para esa fecha

            // Agrega los usuarios con los extras correspondientes
            // OPTIMIZADO: Solo guardar IDs y datos necesarios, no objetos completos
            const courseSnapshot: any = {
              id: this.course.id,
              name: this.course.name,
              course_type: this.course.course_type,
              is_flexible: this.course.is_flexible,
              currency: this.course.currency,
              price: this.course.price,
              sport_id: this.course.sport_id,
              sport: this.course.sport ? {
                id: this.course.sport.id,
                name: this.course.sport.name,
                icon_collective: this.course.sport.icon_collective,
                icon_prive: this.course.sport.icon_prive,
                icon_activity: this.course.sport.icon_activity
              } : null
            };
            const settingsSnapshot = this.buildCartSettingsSnapshot();
            if (settingsSnapshot) {
              courseSnapshot.settings = settingsSnapshot;
            }
            const intervalsSnapshot = this.buildCartIntervalsSnapshot();
            if (intervalsSnapshot) {
              courseSnapshot.course_intervals = intervalsSnapshot;
            }
            bookingUsers.push({
              'course': courseSnapshot,
              'canonicalPricing': canonicalPricing,
              'client': {
                id: this.selectedUser.id,
                first_name: this.selectedUser.first_name,
                last_name: this.selectedUser.last_name
              },
              'course_date': {
                id: date.id,
                date: date.date,
                hour_start: date.hour_start,
                hour_end: date.hour_end,
                course_interval_id: this.getCartIntervalIdForDate(date)
              },
              'group': { id: courseGroup.id, name: courseGroup.name },
              'subGroup': { id: courseSubgroup.id, name: courseSubgroup.name },
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
          // OPTIMIZADO: Solo guardar IDs y datos necesarios
          const courseSnapshot: any = {
            id: this.course.id,
            name: this.course.name,
            course_type: this.course.course_type,
            is_flexible: this.course.is_flexible,
            currency: this.course.currency,
            price: this.course.price
          };
          const settingsSnapshot = this.buildCartSettingsSnapshot();
          if (settingsSnapshot) {
            courseSnapshot.settings = settingsSnapshot;
          }
          const intervalsSnapshot = this.buildCartIntervalsSnapshot();
          if (intervalsSnapshot) {
            courseSnapshot.course_intervals = intervalsSnapshot;
          }
          bookingUsers.push({
            'course': courseSnapshot,
            'client': {
              id: this.selectedUser.id,
              first_name: this.selectedUser.first_name,
              last_name: this.selectedUser.last_name
            },
              'course_date': {
                id: date.id,
                date: date.date,
                hour_start: date.hour_start,
                hour_end: date.hour_end,
                course_interval_id: this.getCartIntervalIdForDate(date)
              },
            'group': { id: courseGroup.id, name: courseGroup.name },
            'subGroup': { id: courseSubgroup.id, name: courseSubgroup.name },
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
    // Validación local contra el carrito para evitar solapes antes de llamar a backend
    const overlapMsg = this.getOverlapMessage(bookingUsers);
    if (overlapMsg) {
      this.snackbar.open(overlapMsg, 'OK', { duration: 3000 });
      return;
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
        console.error('Overlap check error - Full object:', error);
        console.log('Error.error:', error.error);
        console.log('Error.errors:', error.errors);
        console.log('Direct access:', error?.errors?.overlaps);

        // Show detailed error message with overlap information if available
        let errorMessage = 'snackbar.booking.overlap';

        // Try different paths to access overlaps
        let overlaps = null;

        if (error?.errors?.overlaps && Array.isArray(error.errors.overlaps)) {
          overlaps = error.errors.overlaps;
          console.log('Found overlaps in error.errors.overlaps:', overlaps);
        } else if (error?.error?.errors?.overlaps && Array.isArray(error.error.errors.overlaps)) {
          overlaps = error.error.errors.overlaps;
          console.log('Found overlaps in error.error.errors.overlaps:', overlaps);
        }

        // If we found overlaps, format and display them
        if (overlaps && overlaps.length > 0) {
          const overlapDetails = overlaps.map((o: any) => {
            const formattedDate = new Date(o.date).toLocaleDateString('fr-FR');

            // Get translated course name
            let courseName = o.course_name || 'N/A';
            if (o.course_translations) {
              const translations = typeof o.course_translations === 'string'
                ? JSON.parse(o.course_translations)
                : o.course_translations;

              const currentLang = this.translateService.currentLang;
              if (translations && translations[currentLang] && translations[currentLang].name) {
                courseName = translations[currentLang].name;
              }
            }

            return `\n• ${courseName}\n  ${formattedDate} ${o.hour_start}-${o.hour_end}`;
          }).join('');

          console.log('Formatted overlap details:', overlapDetails);

          this.snackbar.open(
            this.translateService.instant(errorMessage) + overlapDetails,
            'OK',
            { duration: 8000 }
          );
          return;
        }

        console.log('No overlaps found, showing generic message');

        // Show generic overlap message
        this.snackbar.open(
          this.translateService.instant(errorMessage),
          'OK',
          { duration: 3000 }
        );
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

    return matchingDate ? { ...matchingDate } : null;
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

  // Validar si una selección de fecha es válida según restricciones
  validateDateSelection(dateStr: string, intervalId: string | null): boolean {
    if (!intervalId) {
      return true;
    }

    const intervalDates = this.getIntervalDates(intervalId);
    if (intervalDates.length === 0) {
      this.dateSelectionError = '';
      return true;
    }

    const selectedIntervalDates = intervalDates
      .filter(date => this.selectedDates.includes(date.date))
      .map(date => date.date);
    const intervalSource = this.getIntervalEntity(intervalId) || this.getLegacyInterval(intervalId) || this.getCourseSettings();
    const limitDates = this.intervalLimitsSelectableDates(intervalSource);
    const maxSelectable = this.getIntervalMaxSelectableDatesValue(intervalSource);
    if (limitDates && maxSelectable && maxSelectable > 0) {
      const alreadySelected = selectedIntervalDates.includes(dateStr);
      if (!alreadySelected && selectedIntervalDates.length >= maxSelectable) {
        this.dateSelectionError = this.translateService.instant('booking_interval_max_dates_error', { count: maxSelectable });
        return false;
      }
    }

    if (this.mustStartFromFirst(intervalId) && selectedIntervalDates.length === 0) {
      if (dateStr !== intervalDates[0].date) {
        this.dateSelectionError = this.translateService.instant('booking_must_start_from_first_day');
        return false;
      }
    }

    if (this.mustBeConsecutive(intervalId) && selectedIntervalDates.length > 0) {
      const intervalDateStrings = intervalDates.map(d => d.date);

      const selectedIndices = selectedIntervalDates.map(d => intervalDateStrings.indexOf(d)).filter(i => i >= 0);
      const candidateIndex = intervalDateStrings.indexOf(dateStr);

      const allIndices = [...selectedIndices, candidateIndex].sort((a, b) => a - b);

      const firstIdx = allIndices[0];
      const lastIdx = allIndices[allIndices.length - 1];
      const expectedLength = lastIdx - firstIdx + 1;

      if (expectedLength !== allIndices.length) {
        this.dateSelectionError = this.translateService.instant('dates_must_be_consecutive');
        return false;
      }
    }

    this.dateSelectionError = '';
    return true;
  }

  // Validar selección para cursos SIN intervalos (consecutividad sobre el orden del curso)
  private validateDateSelectionNoInterval(dateStr: string): boolean {
    const ordered = (this.course?.course_dates || [])
      .slice()
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d: any) => d.date);

    // Si debe empezar por el primer día y no hay ninguna fecha seleccionada
    if (this.mustStartFromFirst() && (this.selectedDates?.length || 0) === 0) {
      const firstAvailable = (this.course?.course_dates || [])
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .find((d: any) => (d.active === undefined || d.active === true || d.active === 1) && this.isDateInFuture(d.date));
      if (!firstAvailable || dateStr !== firstAvailable.date) {
        this.dateSelectionError = this.translateService.instant('booking_must_start_from_first_day');
        return false;
      }
    }

    if (this.mustBeConsecutive() && (this.selectedDates?.length || 0) > 0) {
      const selectedIndices = this.selectedDates
        .map((d: string) => ordered.indexOf(d))
        .filter((i: number) => i >= 0);
      const candidateIndex = ordered.indexOf(dateStr);
      const all = [...selectedIndices, candidateIndex].sort((a, b) => a - b);
      const firstIdx = all[0];
      const lastIdx = all[all.length - 1];
      const expectedLength = lastIdx - firstIdx + 1;
      if (expectedLength !== all.length) {
        this.dateSelectionError = this.translateService.instant('dates_must_be_consecutive');
        return false;
      }
    }

    this.dateSelectionError = '';
    return true;
  }

  // Obtener fechas de un intervalo específico
  getIntervalDates(intervalId: string | null, options: { includePast?: boolean } = {}): any[] {
    if (!intervalId || !this.course || !this.course.course_dates) return [];

    const includePast = options.includePast === true;

    return this.course.course_dates
      .filter(date => this.dateBelongsToInterval(date, intervalId))
      .filter(date => includePast || this.isDateInFuture(date.date))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  isDateInFuture(dateStr: string): boolean {
    if (!dateStr) return false;
    const parts = dateStr.split('-').map((p: string) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some(isNaN)) return false;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setHours(0, 0, 0, 0);
    const today = new Date(this.today);
    today.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }



  validateDateDeselection(dateStr: string, intervalId: string | null): boolean {
    if (!intervalId) {
      return true;
    }

    if (this.mustBeConsecutive(intervalId)) {
      const intervalDates = this.getIntervalDates(intervalId);
      const selectedIntervalDates = intervalDates
        .filter(date => this.selectedDates.includes(date.date))
        .map(date => date.date);

      if (selectedIntervalDates.length > 2) {
        const sortedDates = [...selectedIntervalDates].sort((a, b) =>
          new Date(a).getTime() - new Date(b).getTime()
        );

        if (dateStr !== sortedDates[0] && dateStr !== sortedDates[sortedDates.length - 1]) {
          this.dateSelectionError = this.translateService.instant('cant_remove_middle_date');
          return false;
        }
      }
    }

    if (this.mustStartFromFirst(intervalId)) {
      const intervalDates = this.getIntervalDates(intervalId);
      if (intervalDates.length > 0 && dateStr === intervalDates[0].date) {
        const hasOtherDates = this.selectedDates.some(d =>
          d !== dateStr && this.getIntervalForDate(d) === intervalId
        );

        if (hasOtherDates) {
          this.dateSelectionError = this.translateService.instant('cant_remove_first_day');
          return false;
        }
      }
    }

    this.dateSelectionError = '';
    return true;
  }

  // Validar des-selección para cursos SIN intervalos
  private validateDateDeselectionNoInterval(dateStr: string): boolean {
    if (this.mustBeConsecutive()) {
      const ordered = (this.course?.course_dates || [])
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d: any) => d.date);
      const selectedOrdered = (this.selectedDates || [])
        .slice()
        .sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
      if (selectedOrdered.length > 2) {
        const first = selectedOrdered[0];
        const last = selectedOrdered[selectedOrdered.length - 1];
        if (dateStr !== first && dateStr !== last) {
          this.dateSelectionError = this.translateService.instant('cant_remove_middle_date');
          return false;
        }
      }
    }
    // Si debe empezar por el primer día y se intenta quitar el primero con otros seleccionados
    if (this.mustStartFromFirst()) {
      const ordered = (this.course?.course_dates || [])
        .slice()
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((d: any) => d.date);
      const first = ordered[0];
      if (dateStr === first) {
        const hasOther = (this.selectedDates || []).some(d => d !== dateStr);
        if (hasOther) {
          this.dateSelectionError = this.translateService.instant('cant_remove_first_day');
          return false;
        }
      }
    }
    this.dateSelectionError = '';
    return true;
  }
  // Determinar si un intervalo está habilitado para selección
  isIntervalEnabled(intervalId: IntervalIdentifier): boolean {
    const normalized = this.normalizeIntervalId(intervalId);
    if (!normalized) {
      return false;
    }
    return !this.selectedIntervalId || this.selectedIntervalId === normalized;
  }

  // Determinar si un intervalo está seleccionado
  isIntervalSelected(intervalId: IntervalIdentifier): boolean {
    const normalized = this.normalizeIntervalId(intervalId);
    if (!normalized) {
      return false;
    }
    return this.selectedIntervalId === normalized;
  }
  isDateSelected(dateStr: string): boolean {
    return this.selectedDates.includes(dateStr);
  }

  getIntervalForDate(dateStr: string): string | null {
    const target = moment(dateStr).format('YYYY-MM-DD');
    const date = this.course.course_dates.find(d => moment(d.date).format('YYYY-MM-DD') === target);
    if (!date) {
      return null;
    }
    return this.normalizeIntervalId(date.course_interval_id ?? date.interval_id);
  }

  selectDate(checked: boolean, date: any, intervalId?: IntervalIdentifier) {
    const normalizedIntervalId = intervalId !== undefined ? this.normalizeIntervalId(intervalId) : null;

    if (normalizedIntervalId && this.isPackageInterval(normalizedIntervalId)) {
      return;
    }

    const index = this.selectedDates.findIndex((d: any) => d === date);
    if (index === -1 && checked) {
      if (this.hasIntervals() && normalizedIntervalId) {
        const valid = this.validateDateSelection(date, normalizedIntervalId);
        if (!valid) {
          return;
        }
      } else if (!this.hasIntervals()) {
        const valid = this.validateDateSelectionNoInterval(date);
        if (!valid) {
          return;
        }
      }
      this.selectedDates.push(date);

      // Guardar el intervalo asociado a esta fecha
      if (normalizedIntervalId) {
        const dateKey = date?.date ?? date;
        this.dateToIntervalMap.set(dateKey, normalizedIntervalId);
      }
    } else if (!checked) {
      if (this.hasIntervals() && normalizedIntervalId) {
        const valid = this.validateDateDeselection(date, normalizedIntervalId);
        if (!valid) {
          return;
        }
      } else if (!this.hasIntervals()) {
        const valid = this.validateDateDeselectionNoInterval(date);
        if (!valid) {
          return;
        }
      }
      if (index >= 0) {
        this.selectedDates.splice(index, 1);
        // Remover del mapa también
        const dateKey = date?.date ?? date;
        this.dateToIntervalMap.delete(dateKey);
      }
    }

    this.selectedDates = this.sortDateStrings(this.selectedDates);
    this.syncExtrasWithSelectedDates();
    this.updateCollectivePrice();
    // NO invalidar cache aquí - solo cambiamos selectedDates, no los grupos
  }

  discounts: any[] = []

  // Obtener información sobre descuentos disponibles
  getAvailableDiscounts(): any[] {
    if (!this.course?.discounts && !this.course?.interval_discounts) {
      return [];
    }

    try {
      // Si usa descuentos globales
      if (!this.course?.use_interval_discounts && this.course?.discounts) {
        const discountsStr = typeof this.course.discounts === 'string'
          ? this.course.discounts
          : JSON.stringify(this.course.discounts);
        const discounts = JSON.parse(discountsStr);

        if (Array.isArray(discounts)) {
          return discounts.map(d => ({
            days: d.date || d.days,
            value: d.discount || d.value,
            type: d.type === 2 ? 'fixed' : 'percentage'
          })).sort((a, b) => a.days - b.days);
        }
      }

      // Si usa descuentos por intervalo
      if (this.course?.use_interval_discounts && this.course?.interval_discounts) {
        const intervalDiscountsStr = typeof this.course.interval_discounts === 'string'
          ? this.course.interval_discounts
          : JSON.stringify(this.course.interval_discounts);
        const intervalDiscounts = JSON.parse(intervalDiscountsStr);

        // Retornar todos los descuentos de todos los intervalos
        const allDiscounts: any[] = [];
        Object.keys(intervalDiscounts).forEach(intervalKey => {
          const discounts = intervalDiscounts[intervalKey];
          if (Array.isArray(discounts)) {
            discounts.forEach(d => {
              allDiscounts.push({
                days: d.date || d.days,
                value: d.discount || d.value,
                type: d.type === 2 ? 'fixed' : 'percentage',
                interval: intervalKey
              });
            });
          }
        });

        return allDiscounts.sort((a, b) => a.days - b.days);
      }
    } catch (error) {
      console.error('Error parsing discounts:', error);
    }

    return [];
  }

  // Obtener el próximo descuento alcanzable
  getNextDiscount(): any | null {
    const availableDiscounts = this.getAvailableDiscounts();
    if (availableDiscounts.length === 0) {
      return null;
    }

    const currentDays = this.selectedDates?.length || 0;
    const nextDiscount = availableDiscounts.find(d => d.days > currentDays);

    return nextDiscount || null;
  }

  // Verificar si hay descuentos configurados para este curso
  hasDiscountsConfigured(): boolean {
    return this.getAvailableDiscounts().length > 0;
  }

  // Obtener descuentos disponibles para un intervalo específico
  getIntervalDiscounts(intervalId: string | null): any[] {
    if (!intervalId) {
      return [];
    }

    // Si usa descuentos globales, retornar esos
    if (!this.course?.use_interval_discounts && this.course?.discounts) {
      try {
        const discountsStr = typeof this.course.discounts === 'string'
          ? this.course.discounts
          : JSON.stringify(this.course.discounts);
        const discounts = JSON.parse(discountsStr);
        if (Array.isArray(discounts)) {
          return discounts.map(d => ({
            dates: d.date || d.days || d.dates,
            value: d.discount || d.value,
            type: d.type === 2 || d.type === 'fixed' ? 'fixed' : 'percentage'
          })).sort((a, b) => a.dates - b.dates);
        }
      } catch (error) {
        console.error('Error parsing global discounts:', error);
      }
      return [];
    }

    // Si no usa descuentos por intervalo, buscar en settings
    const settings = this.getCourseSettings();
    if (settings?.intervals) {
      const interval = settings.intervals.find((i: any) => String(i.id) === String(intervalId));
      if (interval?.discounts && Array.isArray(interval.discounts)) {
        return interval.discounts.map((d: any) => ({
          dates: d.date || d.days || d.dates,
          value: d.discount || d.value,
          type: d.type === 2 || d.type === 'fixed' ? 'fixed' : 'percentage'
        })).sort((a: any, b: any) => a.dates - b.dates);
      }
    }

    return [];
  }

  // Obtener el descuento aplicado actualmente para un intervalo
  getAppliedIntervalDiscount(intervalId: string | null): any | null {
    if (!intervalId) {
      return null;
    }

    const selectedDatesInInterval = this.selectedDates.filter(date =>
      this.getIntervalForDate(date) === intervalId
    );
    const daysCount = selectedDatesInInterval.length;

    if (daysCount === 0) {
      return null;
    }

    const discounts = this.getIntervalDiscounts(intervalId);
    if (discounts.length === 0) {
      return null;
    }

    // Encontrar el descuento aplicable más alto
    let appliedDiscount = null;
    for (const discount of discounts) {
      if (daysCount >= discount.dates) {
        appliedDiscount = discount;
      }
    }

    return appliedDiscount;
  }

  // Obtener el próximo descuento alcanzable para un intervalo
  getNextIntervalDiscount(intervalId: string | null): any | null {
    if (!intervalId) {
      return null;
    }

    const selectedDatesInInterval = this.selectedDates.filter(date =>
      this.getIntervalForDate(date) === intervalId
    );
    const daysCount = selectedDatesInInterval.length;

    const discounts = this.getIntervalDiscounts(intervalId);
    if (discounts.length === 0) {
      return null;
    }

    // Encontrar el siguiente descuento no alcanzado
    return discounts.find(d => d.dates > daysCount) || null;
  }

  updateCollectivePrice() {
    const basePrice = parseFloat(this.course?.price || 0);
    const selectedCount = this.selectedDates?.length || 0;
    const participantCount = this.selectedUserMultiple?.length || 1;
    this.discountSource = 'legacy';

    if (selectedCount === 0 || basePrice <= 0) {
      this.originalPrice = 0;
      this.appliedDiscountAmount = 0;
      this.collectivePrice = 0;
      this.discountsByInterval = [];
      this.hasActiveDiscount = false;
      this.canonicalDiscountState = undefined;
      return;
    }

    this.bookingService
      .computeDiscountState(this.course, this.selectedDates, basePrice, participantCount)
      .subscribe((state: DiscountState) => {
        if (!state) {
          console.warn('[booking-discount-api] No discount state available, keeping legacy zeros');
          this.originalPrice = basePrice * selectedCount;
          this.appliedDiscountAmount = 0;
          this.collectivePrice = this.originalPrice;
          this.discountsByInterval = [];
          this.hasActiveDiscount = false;
          this.canonicalDiscountState = undefined;
          return;
        }

        this.canonicalDiscountState = state;
        this.discountSource = state.source || 'legacy';
        this.originalPrice = Number(state.originalPrice || 0);
        this.appliedDiscountAmount = Math.max(0, Number(state.totalDiscount || 0));
        this.hasActiveDiscount = this.appliedDiscountAmount > 0;
        this.collectivePrice = Math.max(0, Number(state.finalPrice || 0));

        const settings = this.getCourseSettings();
        this.discountsByInterval = (state.intervals || []).map((item: any) => {
          let intervalName = item.intervalName || ('Intervalo ' + item.intervalId);
          if (settings?.intervals && item.intervalId != null) {
            const interval = settings.intervals.find((i: any) => String(i.id) === String(item.intervalId));
            if (interval && interval.name) intervalName = interval.name;
          }
          return {
            intervalId: item.intervalId,
            intervalName,
            discountAmount: Number(item.discountAmount || 0),
            discountPercentage: Number(item.discountPercentage || 0)
          };
        });

        // Debug trace once per recalculation for validation
        console.info('[booking-discount-api] canonical state', {
          source: this.discountSource,
          originalPrice: this.originalPrice,
          totalDiscount: this.appliedDiscountAmount,
          finalPrice: this.collectivePrice,
          intervals: this.discountsByInterval
        });
      });
  }

  generateNumberArray(max: number): number[] {
    return Array.from({ length: max }, (v, k) => k + 1);
  }

  filteredPriceRange(formatted: boolean = false) {
    const selectedPax = this.selectedUserMultiple.length || 1; // Obtener el número de paxes seleccionados (mínimo 1)
    let priceRange = this.course.price_range;
    if (typeof priceRange === 'string') {
      try {
        priceRange = JSON.parse(priceRange);
      } catch {
        priceRange = [];
      }
    }

    return priceRange
      .filter((range: any) => {
        const priceKeys = Object.keys(range).filter((key) => key !== 'intervalo');
        const hasAnyPrice = priceKeys.some((k) => range[k] !== null && range[k] !== undefined);
        return hasAnyPrice;
      })
      .map((range: any) => {
        // Convertir el intervalo en minutos
        const parts = (range.intervalo || '').split(' ');
        let minutes = 0;
        for (const part of parts) {
          if (part.endsWith('h')) {
            minutes += parseInt(part) * 60;
          } else if (part.endsWith('m') || part.endsWith('min')) {
            minutes += parseInt(part);
          }
        }

        // Si no se pudo parsear, usar duración fija del curso
        if (minutes <= 0 && this.course?.duration) {
          minutes = this.utilService.parseDurationToMinutes(this.course.duration);
        }

        return minutes;
      })
      .filter((minutes: number) => minutes > 0)
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
    const durations = this.filteredPriceRange(false);
    const unique = Array.from(new Set(durations));
    return unique.map((minutes: number) => this.convertToDuration(minutes));
  }

  getFormattedDuration(duration: number): string {
    return `${duration} min`;  // Formatea el valor con el sufijo "min"
  }

  getAvailableHours(): string[] {
    const hours: string[] = [];
    let course_date = this.course.course_dates[0];

    if (this.selectedDateReservation) {
      const match = this.findMatchingCourseDate();
      if (match) {
        course_date = match;
      }
    }

    if (!course_date) {
      this.availableHours = [];
      this.selectedHour = '';
      return [];
    }

    const durations = this.getPrivateDurationsInMinutes();
    const durationMinutes = this.getSelectedDurationMinutes(durations);

    if (!durations.length || durationMinutes <= 0) {
      this.availableHours = [];
      this.selectedHour = '';
      return [];
    }

    const maxDuration = Math.max(...durations);
    const startSource = this.course.is_flexible ? (this.course?.hour_min || course_date.hour_start) : course_date.hour_start;
    const endSource = this.course.is_flexible ? (this.course?.hour_max || course_date.hour_end) : course_date.hour_end;
    const hourStartMinutes = this.parseTimeToMinutes(startSource || '00:00');
    const hourEndMinutes = this.parseTimeToMinutes(endSource || '23:59');
    if (hourEndMinutes <= hourStartMinutes || maxDuration <= 0) {
      this.availableHours = [];
      this.selectedHour = '';
      return [];
    }
    const stepMinutes = this.getPrivateStepMinutes(durations);
    const bufferMinutes = this.getPrivateLeadMinutes();
    const today = new Date();
    const courseDateObj = new Date(course_date.date);
    const isToday = courseDateObj.toDateString() === today.toDateString();
    const minStartDate = isToday ? new Date(today.getTime() + bufferMinutes * 60000) : null;

    for (let minute = hourStartMinutes; minute <= hourEndMinutes - durationMinutes; minute += stepMinutes) {
      const startDate = this.buildDateTime(course_date.date, minute);
      if (isToday && minStartDate && startDate < minStartDate) {
        continue;
      }
      if (startDate < today) {
        continue;
      }
      hours.push(this.formatMinutesToTime(minute));
    }

    this.availableHours = hours;
    if (this.availableHours.indexOf(this.selectedHour) === -1) {
      this.selectedHour = hours.length === 1 ? hours[0] : '';
    }
    return hours;
  }

  onHourSelected(value: string) {
    this.selectedHour = value || '';
    if (this.course.is_flexible) {
      this.updateAvailableDurations(this.selectedHour);
    }
    this.updatePrice();
    this.checkLocalOverlapSelection();
  }

  onDurationSelected(value: string) {
    this.selectedDuration = this.normalizeDurationValue(value);
    if (this.course.is_flexible) {
      this.updateAvailableDurations(this.selectedHour);
    }
    this.updatePrice();
    this.checkLocalOverlapSelection();
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
    if (!selectedHour) {
      this.availableDurations = this.getAvailableDurations(selectedHour);
      this.selectedDuration = this.availableDurations.length ? this.availableDurations[0] : '';
      this.selectedDuration = this.normalizeDurationValue(this.selectedDuration);
      this.getAvailableHours();
      return;
    }
    this.availableDurations = this.getAvailableDurations(selectedHour);

    // Verificar si la duración seleccionada está disponible en la lista filtrada
    const isSelectedDurationAvailable = this.availableDurations
      .some((range: any) => range === this.normalizeDurationValue(this.selectedDuration));

    if (!isSelectedDurationAvailable && this.availableDurations.length > 0) {
      // Si la duración seleccionada no está disponible, seleccionamos la primera opción
      this.selectedDuration = this.normalizeDurationValue(this.availableDurations[0]);
    }

    // Actualizamos el precio basado en la duración seleccionada
    this.updatePrice();
    // Recalcular horas disponibles según la nueva duración
    this.getAvailableHours();
  }

  private getSelectedDurationMinutes(durations: number[] = []): number {
    // Priorizar la duración seleccionada en pantalla
    if (this.selectedDuration) {
      const parsed = this.utilService.parseDurationToMinutes(this.selectedDuration.toString());
      if (parsed > 0) {
        return parsed;
      }
    }
    // Fallback al mínimo disponible
    if (durations && durations.length) {
      return Math.min(...durations.filter((d) => d > 0));
    }
    return 0;
  }

  private normalizeDurationValue(value: any): string {
    if (typeof value === 'string' && (value.includes('h') || value.includes('m'))) {
      return value.trim();
    }
    const minutes = typeof value === 'number' ? value : this.utilService.parseDurationToMinutes(String(value || ''));
    if (minutes > 0) {
      return this.convertToDuration(minutes);
    }
    return '';
  }

  private normalizeDateForApi(date: any): string {
    if (!date) return '';
    // ISO / Date object
    const asString = date.toString();

    // Formato dd/MM/yyyy
    const slashParts = asString.split('/');
    if (slashParts.length === 3) {
      const [dd, mm, yyyy] = slashParts;
      if (dd && mm && yyyy) {
        return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }

    // ISO-like
    const parsed = new Date(asString);
    if (!isNaN(parsed.getTime())) {
      const yyyy = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, '0');
      const dd = String(parsed.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    try {
      const parts = asString.split('T')[0];
      return parts;
    } catch {
      return '';
    }
  }

  private hasLocalOverlap(newBookingUsers: any[]): boolean {
    return !!this.getOverlapMessage(newBookingUsers);
  }

  private getOverlapMessage(newBookingUsers: any[]): string | null {
    try {
      const cartStorage = localStorage.getItem(this.schoolData.slug + '-cart');
      if (!cartStorage) return null;

      const cart = JSON.parse(cartStorage);
      const cartArray = this.transformCartToArray(cart);

      for (const cartItem of cartArray) {
        for (const detail of cartItem.details) {
          for (const newBu of newBookingUsers) {
            const sameClient = String(detail.client_id) === String(newBu.client_id);
            // normalizar fechas para comparar
            const existingDate = this.normalizeDateForApi(detail.date);
            const incomingDate = this.normalizeDateForApi(newBu.date);
            const sameDate = existingDate && incomingDate && existingDate === incomingDate;
            if (!sameClient || !sameDate) continue;

            const startA = this.parseTimeToMinutes(detail.hour_start);
            const endA = this.parseTimeToMinutes(detail.hour_end);
            const startB = this.parseTimeToMinutes(newBu.hour_start);
            const endB = this.parseTimeToMinutes(newBu.hour_end);

            if (startA < endB && startB < endA) {
              const courseName = detail?.course?.name || detail?.course_name || this.translateService.instant('snackbar.booking.overlap');
              const baseMsg = this.translateService.instant('snackbar.booking.overlap');
              return `${baseMsg} ${courseName} (${existingDate} ${detail.hour_start}-${detail.hour_end})`;
            }
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private checkLocalOverlapSelection(): void {
    if (this.course.course_type !== 2) return;
    if (!this.selectedDateReservation || !this.selectedHour || !this.selectedDuration) return;

    const courseDate = this.findMatchingCourseDate();
    if (!courseDate) return;

    const normalizedDate = this.normalizeDateForApi(courseDate.date);
    const durationMinutes = this.utilService.parseDurationToMinutes(this.selectedDuration);
    if (durationMinutes <= 0) return;

    const newBookingUsers = [];
    const users = this.selectedUserMultiple?.length ? this.selectedUserMultiple : [this.selectedUser];

    users.forEach((user: any, index: number) => {
      if (!user) return;
      newBookingUsers.push({
        client_id: user.id,
        date: normalizedDate,
        hour_start: this.selectedHour,
        hour_end: this.calculateEndTime(this.selectedHour, durationMinutes)
      });
    });

    const overlapMsg = this.getOverlapMessage(newBookingUsers);
    if (overlapMsg) {
      this.snackbar.open(overlapMsg, 'OK', { duration: 3000 });
      // reset selección para forzar nueva elección
      this.selectedHour = '';
      if (this.course.is_flexible) {
        this.selectedDuration = '';
      }
      this.getAvailableHours();
      if (this.course.is_flexible) {
        this.updateAvailableDurations(this.selectedHour);
      }
      this.updatePrice();
    }
  }

  private transformCartToArray(cart: any): any[] {
    const cartArray = [];
    if (!cart || typeof cart !== 'object') {
      return cartArray;
    }

    for (const courseId of Object.keys(cart)) {
      const courseEntry = cart[courseId];
      if (!courseEntry || typeof courseEntry !== 'object') continue;

      for (const userId of Object.keys(courseEntry)) {
        if (!courseEntry.hasOwnProperty(userId)) continue;
        cartArray.push({
          userId,
          courseId,
          details: courseEntry[userId]
        });
      }
    }
    return cartArray;
  }

  private getPrivateLeadMinutes(): number {
    const lead = this.settings?.booking?.private_min_lead_minutes;
    const parsed = Number(lead);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
    return this.DEFAULT_PRIVATE_LEAD_MINUTES;
  }

  private getPrivateDurationsInMinutes(): number[] {
    if (!this.course) return [];

    let priceRange = this.course.price_range;
    if (typeof priceRange === 'string') {
      try {
        priceRange = JSON.parse(priceRange);
      } catch {
        priceRange = [];
      }
    }

    if (this.course.is_flexible && Array.isArray(priceRange) && priceRange.length) {
      // Tomar sólo intervalos con precio para el número de pax seleccionado (o cualquiera si no coincide)
      return priceRange
        .filter((range: any) => {
          const keys = Object.keys(range).filter(k => k !== 'intervalo');
          return keys.some(k => range[k] !== null && range[k] !== undefined);
        })
        .map((range: any) => this.utilService.parseDurationToMinutes(range.intervalo))
        .filter((minutes: number) => minutes > 0);
    }

    const fixedMinutes = this.utilService.parseDurationToMinutes(this.course.duration);
    return fixedMinutes > 0 ? [fixedMinutes] : [];
  }

  private parseTimeToMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMins = mins.toString().padStart(2, '0');
    return `${paddedHours}:${paddedMins}`;
  }

  private buildDateTime(date: string, minutes: number): Date {
    const base = new Date(date);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    base.setHours(hours, mins, 0, 0);
    return base;
  }

  private getPrivateStepMinutes(durations: number[]): number {
    if (!durations || durations.length === 0) return 5;
    if (durations.length === 1) return 5;
    const sorted = [...durations].sort((a, b) => a - b);
    let minDiff = Number.MAX_SAFE_INTEGER;
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i] - sorted[i - 1];
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
      }
    }
    if (!isFinite(minDiff) || minDiff === Number.MAX_SAFE_INTEGER) return 5;
    return Math.max(5, minDiff);
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

  // Seleccionar un intervalo para reservar fechas
  selectInterval(intervalId: IntervalIdentifier): void {
    const normalizedId = this.normalizeIntervalId(intervalId);
    if (!normalizedId) {
      return;
    }
    const reservableInfo = this.getIntervalReservableInfo(normalizedId);
    if (!reservableInfo.isReservable) {
      this.dateSelectionError = this.translateService.instant(reservableInfo.statusKey ?? 'booking_interval_not_available', reservableInfo.statusParams ?? {});
      return;
    }

    if (this.selectedIntervalId === normalizedId) {
      this.clearDatesFromInterval(normalizedId);
      this.selectedIntervalId = null;
      this.dateSelectionError = '';
      this.updateCollectivePrice();
      return;
    }

    if (this.selectedIntervalId) {
      // No limpiar fechas del intervalo anterior - permitir selección múltiple
      // this.clearDatesFromInterval(this.selectedIntervalId);
    }

    this.selectedIntervalId = normalizedId;
    // Eliminado: this.selectedDates = []; - Mantener fechas de otros intervalos
    this.dateSelectionError = '';

    if (this.isPackageInterval(normalizedId)) {
      const availableFutureDates = this.getIntervalDates(normalizedId);
      const packageDates = availableFutureDates
        .filter(date => this.isDateAvailable(date.date, normalizedId))
        .map(date => date.date);

      if (packageDates.length === 0) {
        this.selectedDates = [];
        this.dateToIntervalMap.clear();
        this.syncExtrasWithSelectedDates();
        this.dateSelectionError = this.translateService.instant('no_future_dates');
      } else if (packageDates.length !== availableFutureDates.length) {
        this.selectedDates = [];
        this.dateToIntervalMap.clear();
        this.syncExtrasWithSelectedDates();
        this.dateSelectionError = this.translateService.instant('booking_package_requires_all_dates');
      } else {
        this.selectedDates = this.sortDateStrings(packageDates);
        // Poblar el mapa con todas las fechas del paquete
        packageDates.forEach(date => {
          this.dateToIntervalMap.set(date, normalizedId);
        });
        this.syncExtrasWithSelectedDates();
      }
    } else {
      this.syncExtrasWithSelectedDates();
    }

    this.updateCollectivePrice();
  }

  // Verificar si una fecha está disponible para seleccionar
  isDateAvailable(dateStr: string, intervalId?: IntervalIdentifier): boolean {
    const normalizedIntervalId = intervalId !== undefined ? this.normalizeIntervalId(intervalId) : null;

    if (this.hasIntervals() && this.selectedIntervalId && normalizedIntervalId && normalizedIntervalId !== this.selectedIntervalId) {
      return false;
    }

    const dateObj = this.course?.course_dates?.find((d: any) => d.date === dateStr);
    const isActive = dateObj ? (dateObj.active === undefined || dateObj.active === true || dateObj.active === 1) : false;
    if (!isActive) {
      return false;
    }

    // Verificar si la fecha es futura
    if (!this.isDateInFuture(dateStr)) {
      return false;
    }

    // Si debe empezar desde la primera fecha y no hay fechas seleccionadas
    const shouldStartFromFirst = this.hasIntervals() && normalizedIntervalId
      ? this.mustStartFromFirst(normalizedIntervalId)
      : this.mustStartFromFirst();

    if (shouldStartFromFirst && (this.selectedDates?.length || 0) === 0) {
      // Obtener todas las fechas ordenadas del intervalo o curso
      let allDatesOrdered: any[];
      if (this.hasIntervals() && normalizedIntervalId) {
        allDatesOrdered = this.getIntervalDates(normalizedIntervalId, { includePast: true });
      } else {
        allDatesOrdered = (this.course?.course_dates || [])
          .slice()
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }

      // Encontrar la primera fecha disponible (activa y futura)
      const firstAvailable = allDatesOrdered.find((d: any) => {
        const dActive = d.active === undefined || d.active === true || d.active === 1;
        return dActive && this.isDateInFuture(d.date);
      });

      if (!firstAvailable) {
        return false;
      }

      // Solo permitir seleccionar la primera fecha disponible
      return dateStr === firstAvailable.date;
    }

    // Si debe ser consecutiva y ya hay fechas seleccionadas
    const shouldBeConsecutive = this.hasIntervals() && normalizedIntervalId
      ? this.mustBeConsecutive(normalizedIntervalId)
      : this.mustBeConsecutive();

    if (shouldBeConsecutive && (this.selectedDates?.length || 0) > 0) {
      // Obtener fechas del intervalo
      let intervalDateStrings: string[];
      if (this.hasIntervals() && normalizedIntervalId) {
        const intervalDates = this.getIntervalDates(normalizedIntervalId);
        intervalDateStrings = intervalDates.map(d => d.date);
      } else {
        intervalDateStrings = (this.course?.course_dates || [])
          .slice()
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((d: any) => d.date);
      }

      // Obtener índices de fechas ya seleccionadas
      const selectedIndices = this.selectedDates
        .map((d: string) => intervalDateStrings.indexOf(d))
        .filter((i: number) => i >= 0)
        .sort((a: number, b: number) => a - b);

      if (selectedIndices.length === 0) {
        return true; // No hay restricción si no hay fechas seleccionadas
      }

      // Índice de la fecha candidata
      const candidateIndex = intervalDateStrings.indexOf(dateStr);
      if (candidateIndex < 0) {
        return false;
      }

      // Solo permitir fechas inmediatamente antes o después del rango actual
      const minIndex = selectedIndices[0];
      const maxIndex = selectedIndices[selectedIndices.length - 1];

      return candidateIndex === minIndex - 1 || candidateIndex === maxIndex + 1;
    }

    return true;
  }

  // Limpiar fechas de un intervalo específico
  clearDatesFromInterval(intervalId: IntervalIdentifier | null): void {

    const normalizedId = this.normalizeIntervalId(intervalId);

    if (!normalizedId) {

      return;

    }

    const intervalDates = this.getIntervalDates(normalizedId).map(date => date.date);

    this.selectedDates = this.selectedDates.filter(date => !intervalDates.includes(date));

    this.selectedDates = this.sortDateStrings(this.selectedDates);

    this.syncExtrasWithSelectedDates();

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
    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    const dayNames: string[] = Array.from(uniqueDays).map(day => this.translateService.instant(dayKeys[day]));
    if (dayNames.length === 0) return "";
    if (dayNames.length === 1) return dayNames[0];
    const lastDay = dayNames.pop();
    return dayNames.join(", ") + " " + this.translateService.instant('and') + " " + lastDay;
  }

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

      if (this.course.course_type === 1 && this.course.is_flexible) {

        if (!this.validateFlexibleSelectionBeforeBooking()) {
          // Validation failed - error message is already set in dateSelectionError and displayed in UI
          console.error('Validation failed:', this.dateSelectionError);
          // Scroll to top of extras section to show error
          const extrasSection = document.querySelector('.extras-section');
          if (extrasSection) {
            extrasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;

        }

        this.selectedCourseDates = this.findMatchingCourseDates();

      } else if(this.course.course_type === 2) {

        let course_date = this.findMatchingCourseDate();
        if (!course_date) {
          this.snackbar.open(this.translateService.instant('snackbar.booking.overlap'), 'OK', { duration: 3000 });
          return;
        }

        const duration = this.utilService.parseDurationToMinutes(this.selectedDuration);
        const courseDatePayload = {
          ...course_date,
          hour_start: this.selectedHour,
          hour_end: this.calculateEndTime(this.selectedHour, duration),
          date: this.normalizeDateForApi(course_date.date)
        };

        this.selectedCourseDates = [courseDatePayload];

      } else {

        this.selectedCourseDates = this.course.course_dates;

      }

      this.confirmModal = true
      this.courseFlux--
    }
    this.courseFlux++
  }

  findMatchingCourseDates() {

    // NO filtrar por intervalo activo - queremos TODAS las fechas seleccionadas
    // independientemente del intervalo al que pertenezcan
    const selectedSet = new Set(this.selectedDates);

    const matchingDates = this.course.course_dates

      .filter((courseDate: any) => {

        // Solo verificar si la fecha está en selectedDates
        return selectedSet.has(courseDate.date);

      })

      .map((courseDate: any) => {
        // Crear una copia del objeto para no mutar el original
        const dateCopy = { ...courseDate };

        // Si tenemos el intervalo en el mapa, asignarlo
        const intervalFromMap = this.dateToIntervalMap.get(courseDate.date);
        if (intervalFromMap) {
          dateCopy.course_interval_id = intervalFromMap;
        }

        return dateCopy;
      })

      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  // Get the user's degree_id for the course sport (used to render current level)
  getUserSportDegreeId(user: any): number {
    try {
      const sportId = this.course?.sport?.id;
      if (!user || !Array.isArray(user?.sports) || !sportId) return 0;
      const entry = user.sports.find((s: any) => (s?.id ?? s?.sport_id) === sportId);
      return entry?.pivot?.degree_id || 0;
    } catch {
      return 0;
    }
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
      // Ã¢ÂÅ’ Se elimina el extra
      this.selectedForfaits[date].splice(index, 1);
      this.updatePrice();
      return false;
    } else {
      // Ã¢Å“â€¦ Se agrega el extra
      this.selectedForfaits[date].push(extra);
      this.updatePrice();
      return true;
    }
  }

  isExtraSelected(extra: any, date: string): boolean {
    return this.selectedForfaits[date]?.some(e => e.name === extra.name) ?? false;
  }

  find = (table: any[], value: string, variable: string, variable2?: string) => table.find((a: any) => variable2 ? a[variable][variable2] === value : a[variable] === value)

  // Función para obtener el día de la semana de una fecha específica
  getWeekday(date: string): string {
    const dateObj = new Date(date);
    return this.getWeekdayName(dateObj.getDay());
  }

  // Agrupar fechas seleccionadas por intervalo para el resumen
  getSelectedDatesByInterval(): any[] {
    if (!this.course?.is_flexible || !this.hasIntervals() || this.selectedDates.length === 0) {
      return [];
    }

    const intervals = new Map<string, any>();

    this.selectedDates.forEach((dateStr: string) => {
      const intervalId = this.dateToIntervalMap.get(dateStr);
      if (!intervalId) return;

      const intervalIdStr = String(intervalId);

      if (!intervals.has(intervalIdStr)) {
        // Buscar nombre del intervalo
        const settings = this.getCourseSettings();
        let intervalName = 'Intervalo ' + intervalIdStr;

        if (settings?.intervals) {
          const intervalConfig = settings.intervals.find((i: any) => String(i.id) === intervalIdStr);
          if (intervalConfig && intervalConfig.name) {
            intervalName = intervalConfig.name;
          }
        }

        intervals.set(intervalIdStr, {
          id: intervalIdStr,
          name: intervalName,
          dates: []
        });
      }

      intervals.get(intervalIdStr).dates.push(dateStr);
    });

    return Array.from(intervals.values());
  }

  private getCartIntervalIdForDate(date: any): number | null {
    if (!date) {
      return null;
    }

    const dateKey = date?.date ?? date;
    const mapped = this.dateToIntervalMap?.get(dateKey);
    if (mapped !== undefined && mapped !== null) {
      const numeric = Number(mapped);
      return isNaN(numeric) ? null : numeric;
    }

    if (date?.course_interval_id !== undefined && date?.course_interval_id !== null) {
      const numeric = Number(date.course_interval_id);
      return isNaN(numeric) ? null : numeric;
    }

    return null;
  }

  // Función para limpiar todas las fechas seleccionadas
  clearAllDates(): void {
    this.selectedDates = [];
    this.dateToIntervalMap.clear();
    this.updatePrice();
  }

}















