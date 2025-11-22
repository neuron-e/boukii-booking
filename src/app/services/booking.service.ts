import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, catchError, delay, EMPTY, forkJoin, mergeMap, Observable, of} from 'rxjs';
import {ApiCrudService} from './crud.service';
import * as moment from 'moment';

export interface IntervalDiscountSummary {
  intervalId: number | string;
  intervalName: string | null;
  discountPercentage: number;
  discountAmount: number;
  days: number;
}

export interface MultiIntervalDiscountResult {
  originalPrice: number;
  totalDiscount: number;
  finalPrice: number;
  intervals: IntervalDiscountSummary[];
  source: 'backend' | 'legacy' | 'error';
}

export interface DiscountState extends MultiIntervalDiscountResult {}

@Injectable({
  providedIn: 'root'
})
export class BookingService extends ApiService {
  private bookingDataSubject = new BehaviorSubject<any | null>(null);
  public editData: any;

  constructor(http: HttpClient, route: ActivatedRoute, private crudService: ApiCrudService) {
    super(http, route);
  }

  /**
   * Try to resolve a backend-friendly interval id from various shapes (string from settings, numeric from DB).
   * Returns null if resolution is not possible so callers can fallback gracefully.
   */
  private resolveBackendIntervalId(course: any, rawIntervalId: any): number | null {
    if (rawIntervalId === null || rawIntervalId === undefined) {
      return null;
    }

    // If it is already numeric or numeric string, return parsed value
    const numeric = Number(rawIntervalId);
    if (!isNaN(numeric) && isFinite(numeric)) {
      return numeric;
    }

    // Try to map by settings interval -> course_intervals ordering or name
    const settings = this.parseCourseSettings(course?.settings);
    const courseIntervals = Array.isArray(course?.course_intervals) ? course.course_intervals : null;

    if (settings?.intervals && Array.isArray(settings.intervals) && courseIntervals && courseIntervals.length > 0) {
      const idx = settings.intervals.findIndex((i: any) => String(i?.id) === String(rawIntervalId));
      if (idx >= 0 && courseIntervals[idx]?.id !== undefined) {
        const candidate = Number(courseIntervals[idx].id);
        if (!isNaN(candidate)) {
          return candidate;
        }
      }

      // Try matching by name
      const settingsInterval = settings.intervals.find((i: any) => String(i?.id) === String(rawIntervalId));
      if (settingsInterval?.name) {
        const foundByName = courseIntervals.find((ci: any) => ci?.name === settingsInterval.name);
        if (foundByName?.id !== undefined) {
          const candidate = Number(foundByName.id);
          if (!isNaN(candidate)) {
            return candidate;
          }
        }
      }
    }

    return null;
  }

  checkOverlap(bookingUsers: any) {
    const url = this.baseUrl + '/slug/bookings/checkbooking';
    return this.http.post(url, {'bookingUsers': bookingUsers}, { headers: this.getHeaders() });
  }

  createBooking(bookingData: any) {
    const url = this.baseUrl + '/slug/bookings';
    return this.http.post(url, bookingData, { headers: this.getHeaders() });
  }


  setBookingData(data: any) {
    this.bookingDataSubject.next(data);
  }

  getBookingData(): any | null {
    return this.bookingDataSubject.value;
  }

  calculatePendingPrice(): number {
    const totalVouchers =  this.getBookingData().vouchers.reduce((acc, item) => acc + item.bonus.reducePrice, 0);
    const total =  this.getBookingData().price_total - totalVouchers;

    return total > 0 ? total : 0; // Si el precio total es negativo o cero, devolver 0.
  }

  calculateActivityPrice(activity: any): number {
    let price = 0;

    if (activity.course.course_type === 1) {
      if (!activity.course.is_flexible) {
        price = parseFloat(activity.course.price || 0) * activity.utilizers.length;
      } else {
        price = parseFloat(activity.course.price || 0) * activity.dates.length * activity.utilizers.length;

        // Aplicar descuentos considerando los intervalos
        const discountAmount = this.calculateMultiDateDiscount(activity.course, activity.dates);
        if (discountAmount > 0) {
          price -= (discountAmount * activity.utilizers.length);
        }
      }
    } else {
      activity.dates.forEach(date => {
        price += this.calculateDatePrice(activity.course, date);
      });
    }

    return Math.max(0, price); // Asegurar que el precio no sea negativo
  }

  calculateDatePrice(course: any, date: any, showCancelled = false): number {
    let datePrice = 0;
    let extraPrice = 0;

    const validUsers = showCancelled
      ? date.booking_users
      : date.booking_users.filter((user: any) => user.status === 1);

    if (validUsers.length > 0) {
      if (course.course_type === 1) {
        datePrice = parseFloat(course.price || 0);
      } else {
        if (course.is_flexible) {
          const duration = date.duration;
          const selectedUtilizers = date.utilizers.length;

          const interval = course.price_range.find(range => range.intervalo === duration);
          if (interval) {
            datePrice += parseFloat(interval[selectedUtilizers] || 0);
          }
        } else {
          datePrice += parseFloat(course.price || 0) * date.utilizers.length;
        }
      }

      // Calcular extras solo para esta fecha
      extraPrice = date.extras?.reduce((sum: number, extra: any) => {
        return sum + (parseFloat(extra?.price) || 0);
      }, 0) || 0;
    }

    return datePrice + extraPrice;
  }

  calculateMultiDateDiscount(course: any, selectedDates: any[]): number {
    if (!course || !Array.isArray(selectedDates) || selectedDates.length === 0) {
      return 0;
    }

    const basePrice = parseFloat(course.price || 0);
    if (!basePrice) {
      return 0;
    }

    // Primero verificar si hay descuentos por intervalo en settings.intervals
    const settings = typeof course.settings === 'string' ? JSON.parse(course.settings) : course.settings;
    if (settings?.intervals && Array.isArray(settings.intervals)) {
      const hasIntervalDiscounts = settings.intervals.some((interval: any) =>
        interval.discounts && Array.isArray(interval.discounts) && interval.discounts.length > 0
      );

      if (hasIntervalDiscounts) {
        return this.calculateDiscountFromSettings(course, selectedDates, basePrice, settings);
      }
    }

    // Usar nueva estructura si use_interval_discounts está activo
    if (course?.use_interval_discounts && course?.interval_discounts) {
      return this.calculateMultiDateDiscountNew(course, selectedDates, basePrice);
    }

    // Método legacy
    const { globalRules, intervalRules } = this.getIntervalDiscountRules(course);
    if (globalRules.size === 0 && intervalRules.size === 0) {
      return 0;
    }

    const counters: Record<string, number> = {};

    const dateEntries = selectedDates
      .map(date => {
        const normalizedDate = typeof date === 'string' ? date : (date?.date ?? date);
        return {
          date: normalizedDate,
          intervalId: this.resolveIntervalId(date)
        };
      })
      .filter(entry => !!entry.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    let discountTotal = 0;

    for (const entry of dateEntries) {
      const intervalKey = entry.intervalId !== null && entry.intervalId !== undefined
        ? entry.intervalId.toString()
        : 'global';
      counters[intervalKey] = (counters[intervalKey] ?? 0) + 1;
      const dayIndex = counters[intervalKey];
      const discountedPrice = this.applyIntervalDiscount(
        basePrice,
        entry.intervalId,
        dayIndex,
        globalRules,
        intervalRules
      );
      discountTotal += (basePrice - discountedPrice);
    }

    return Number(discountTotal.toFixed(2));
  }

  /**
   * WS1-F1: Delegates multi-interval discount calculation to backend API so admin/public stay aligned.
   * See thoughts/shared/research/2025-11-21_WS1_courses-intervals-monitors.md.
   */
  calculateMultiIntervalDiscountViaApi(
    course: any,
    dateEntries: Array<{ date: string; course_interval_id: number | string | null }>,
    basePrice: number,
    participants: number = 1
  ): Observable<MultiIntervalDiscountResult | null> {
    if (!course?.id || !Array.isArray(dateEntries) || dateEntries.length === 0) {
      console.warn('[booking-discount-api] No course/id or empty dateEntries, fallback to legacy');
      return of(null);
    }

    // Build payload grouped by interval; try to resolve missing interval IDs from course_dates.
    const intervalMap = new Map<number, { num_days: number }>();
    for (const entry of dateEntries) {
      let intervalIdRaw = entry?.course_interval_id ?? null;
      // Try to resolve a real interval ID accepted by backend
      let intervalId: number | null = this.resolveBackendIntervalId(course, intervalIdRaw);

      if ((intervalId === null || intervalId === undefined) && Array.isArray(course?.course_dates)) {
        const entryISO = moment(entry.date).format('YYYY-MM-DD');
        const match = course.course_dates.find((d: any) => {
          const dISO = moment(d?.date).format('YYYY-MM-DD');
          return d?.date && dISO === entryISO;
        });
        intervalId = this.resolveBackendIntervalId(course, match?.course_interval_id ?? match?.interval_id ?? null);
      }
      if (intervalId === null || intervalId === undefined) {
        console.warn('[booking-discount-api] Missing course_interval_id for date, skipping', entry);
        continue;
      }
      const current = intervalMap.get(intervalId) || { num_days: 0 };
      current.num_days += 1;
      intervalMap.set(intervalId, current);
    }

    if (intervalMap.size === 0) {
      console.warn('[booking-discount-api] No interval mapping available after resolving dates, falling back to legacy');
      return of(null);
    }

    const intervals = Array.from(intervalMap.entries()).map(([intervalId, info]) => ({
      course_id: course.id,
      interval_id: intervalId,
      num_days: info.num_days,
      base_price: basePrice * info.num_days,
      ...(participants && participants > 1 ? { num_participants: participants } : {})
    }));

    const url = `${this.baseUrl}/bookings/calculate-multi-interval-discount`;
    return this.http.post(url, { intervals }, { headers: this.getHeaders() }).pipe(
      mergeMap((response: any) => {
        const data = response?.data || response;
        if (!data || !Array.isArray(data.intervals)) {
          console.warn('[booking-discount-api] Invalid response shape', response);
          return of(null);
        }

        const intervalSummaries: IntervalDiscountSummary[] = data.intervals.map((item: any) => {
          const intervalId = Number(item.interval_id);
          const discountDetails = item?.discount_details || {};

          // Resolve interval name from course settings if available
          let intervalName: string | null = null;
          try {
            const settings = typeof course?.settings === 'string' ? JSON.parse(course.settings) : course?.settings;
            if (settings?.intervals && Array.isArray(settings.intervals)) {
              const found = settings.intervals.find((i: any) => String(i.id) === String(intervalId));
              intervalName = found?.name ?? null;
            }
          } catch {}

          return {
            intervalId,
            intervalName,
            discountPercentage: discountDetails?.discount_type === 'percentage'
              ? Number(discountDetails?.discount_value || 0)
              : 0,
            discountAmount: Number(item.discount_amount || 0),
            days: Number(item.num_days || 0)
          } as IntervalDiscountSummary;
        });

        const result: MultiIntervalDiscountResult = {
          originalPrice: Number(data.total_base_price ?? 0),
          totalDiscount: Number(data.total_discount_amount ?? 0),
          finalPrice: Number(data.total_final_price ?? 0),
          intervals: intervalSummaries,
          source: 'backend'
        };

        if (isNaN(result.finalPrice) || isNaN(result.originalPrice)) {
          return of(null);
        }

        return of(result);
      }),
      catchError(err => {
        console.error('[booking-discount-api] CRITICAL: Multi-interval discount API call failed', {
          endpoint: '/bookings/calculate-multi-interval-discount',
          error: err?.message || err?.error?.message || 'Unknown error',
          status: err?.status,
          statusText: err?.statusText,
          timestamp: new Date().toISOString(),
          fallbackWillAttempt: 'local_canonical_or_error'
        });
        return of(null);
      })
    );
  }

  /**
   * Compute canonical discount state, preferring backend and falling back to legacy client calc.
   */
  computeDiscountState(
    course: any,
    selectedDates: string[],
    basePrice: number,
    participants: number = 1
  ): Observable<DiscountState> {
    const dateEntries = selectedDates.map(dateStr => ({
      date: dateStr,
      course_interval_id: this.resolveIntervalIdForDate(course, dateStr)
    }));

    return this.calculateMultiIntervalDiscountViaApi(course, dateEntries, basePrice, participants).pipe(
      mergeMap(result => {
        if (result) {
          return of(result);
        }

        const fallback = this.computeLocalCanonicalDiscount(course, dateEntries, basePrice, participants);
        if (fallback) {
          console.warn('[booking-discount-api] Using local canonical fallback (interval-wide) because backend discount API was unavailable/invalid');
          return of(fallback);
        }

        // Error: neither API nor local config available
        // Return original price without discount to avoid incorrect calculation
        console.error('[booking-discount-api] CRITICAL: Both backend API and local configuration unavailable. ' +
          'Unable to calculate discounts reliably. Showing price without discounts.', {
          course: course?.id,
          dateCount: selectedDates.length,
          timestamp: new Date().toISOString(),
          fallbackAttempted: true
        });

        const originalPrice = basePrice * selectedDates.length * (participants || 1);

        return of({
          originalPrice,
          totalDiscount: 0,
          finalPrice: originalPrice,
          intervals: [],
          source: 'error' as const
        } as DiscountState);
      })
    );
  }

  private computeLocalCanonicalDiscount(
    course: any,
    dateEntries: Array<{ date: string; course_interval_id: string | number | null }>,
    basePrice: number,
    participants: number = 1
  ): DiscountState | null {
    if (!course || !Array.isArray(dateEntries) || dateEntries.length === 0 || !basePrice) {
      return null;
    }

    const settings = this.parseCourseSettings(course?.settings);
    const intervalConfig = new Map<string, { name?: string | null; discounts: any[] }>();

    if (course?.intervals_config_mode === 'independent' && Array.isArray(course?.course_intervals)) {
      course.course_intervals.forEach((interval: any) => {
        if (interval?.id !== undefined) {
          intervalConfig.set(String(interval.id), {
            name: interval?.name,
            discounts: Array.isArray(interval?.discounts) ? interval.discounts : []
          });
        }
      });
    }

    if (settings?.intervals && Array.isArray(settings.intervals)) {
      settings.intervals.forEach((interval: any) => {
        const key = String(interval?.id);
        if (!intervalConfig.has(key)) {
          intervalConfig.set(key, {
            name: interval?.name,
            discounts: Array.isArray(interval?.discounts) ? interval.discounts : []
          });
        }
      });
    }

    if (intervalConfig.size === 0) {
      return null;
    }

    const grouped = new Map<string, { days: number }>();
    dateEntries.forEach(entry => {
      const key = entry?.course_interval_id !== undefined && entry?.course_interval_id !== null
        ? String(entry.course_interval_id)
        : null;
      if (!key || !intervalConfig.has(key)) {
        return;
      }
      const current = grouped.get(key) || { days: 0 };
      current.days += 1;
      grouped.set(key, current);
    });

    if (grouped.size === 0) {
      return null;
    }

    const intervals: IntervalDiscountSummary[] = [];
    let totalDiscount = 0;
    const totalDays = dateEntries.length;
    const pax = participants && participants > 0 ? participants : 1;

    grouped.forEach((info, key) => {
      const config = intervalConfig.get(key);
      if (!config) return;
      const rules = (config.discounts || []).map((d: any) => ({
        days: d.date || d.days || d.dates || d.min_days || d.count || 0,
        type: (d.type === 2 || d.type === 'fixed' || d.discount_type === 'fixed_amount') ? 'fixed' : 'percentage',
        value: d.discount || d.value || d.discount_value || 0
      })).filter(r => r.days > 0);

      if (!rules.length) return;

      const matched = rules
        .filter(r => info.days >= r.days)
        .sort((a, b) => b.days - a.days)[0];

      if (!matched) return;

      const intervalBase = basePrice * info.days * pax;
      let discountAmount = 0;
      if (matched.type === 'percentage') {
        discountAmount = intervalBase * (matched.value / 100);
      } else {
        discountAmount = matched.value * info.days * pax;
      }

      discountAmount = Number(discountAmount.toFixed(2));
      totalDiscount += discountAmount;

      const intervalIdNumber = Number(key);
      const intervalIdValue: number | string = !isNaN(intervalIdNumber) ? intervalIdNumber : key;
      intervals.push({
        intervalId: intervalIdValue,
        intervalName: config.name || null,
        discountPercentage: matched.type === 'percentage' ? matched.value : 0,
        discountAmount,
        days: info.days
      });
    });

    const originalPrice = basePrice * totalDays * pax;
    return {
      originalPrice: Number(originalPrice.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      finalPrice: Number(Math.max(0, originalPrice - totalDiscount).toFixed(2)),
      intervals,
      source: 'legacy'
    };
  }

  private resolveIntervalIdForDate(course: any, dateStr: string): string | number | null {
    if (!course?.course_dates) return null;
    const target = moment(dateStr).format('YYYY-MM-DD');
    const match = course.course_dates.find((d: any) => moment(d?.date).format('YYYY-MM-DD') === target);
    if (!match) return null;
    return match.course_interval_id ?? match.interval_id ?? null;
  }

  private calculateMultiDateDiscountNew(course: any, selectedDates: any[], basePrice: number): number {
    const intervalDiscountsData = this.parseIntervalDiscounts(course.interval_discounts);
    if (intervalDiscountsData.size === 0) {
      return 0;
    }

    // Construir un mapa de fechas a claves de intervalo
    const dateToIntervalMap = new Map<string, string>();
    Object.keys(JSON.parse(typeof course.interval_discounts === 'string' ? course.interval_discounts : JSON.stringify(course.interval_discounts))).forEach(intervalKey => {
      const [startDate, endDate] = intervalKey.split('_');
      // Asignar cada fecha seleccionada a su intervalo
      selectedDates.forEach(date => {
        const normalizedDate = typeof date === 'string' ? date : (date?.date ?? date);
        if (normalizedDate && this.isDateInRange(normalizedDate, startDate, endDate)) {
          dateToIntervalMap.set(normalizedDate, intervalKey);
        }
      });
    });

    // Contar fechas por intervalo
    const counters: Record<string, number> = {};
    const dateEntries = selectedDates
      .map(date => {
        const normalizedDate = typeof date === 'string' ? date : (date?.date ?? date);
        return {
          date: normalizedDate,
          intervalKey: dateToIntervalMap.get(normalizedDate) || null
        };
      })
      .filter(entry => !!entry.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    let discountTotal = 0;

    for (const entry of dateEntries) {
      if (!entry.intervalKey) {
        continue; // Sin descuento para esta fecha
      }

      const key = entry.intervalKey;
      counters[key] = (counters[key] ?? 0) + 1;
      const dayIndex = counters[key];

      // Obtener descuentos para este intervalo
      const discounts = intervalDiscountsData.get(entry.intervalKey);
      if (!discounts) {
        continue;
      }

      // Buscar el descuento aplicable para este índice de día
      const applicableDiscount = discounts
        .filter(d => dayIndex >= d.day)
        .sort((a, b) => b.day - a.day)[0];

      if (!applicableDiscount) {
        continue;
      }

      // Aplicar descuento
      let discountedPrice = basePrice;
      if (applicableDiscount.type === 'percentage') {
        discountedPrice = basePrice - (basePrice * applicableDiscount.value / 100);
      } else {
        discountedPrice = basePrice - applicableDiscount.value;
      }

      discountTotal += (basePrice - Math.max(0, discountedPrice));
    }

    return Number(discountTotal.toFixed(2));
  }

  calculateDiscountBreakdown(course: any, selectedDates: any[]): any[] {
    if (!course || !Array.isArray(selectedDates) || selectedDates.length === 0) {
      return [];
    }

    const basePrice = parseFloat(course.price || 0);
    if (!basePrice) {
      return [];
    }

    const settings = typeof course.settings === 'string' ? JSON.parse(course.settings) : course.settings;
    if (!settings?.intervals || !Array.isArray(settings.intervals)) {
      return [];
    }

    // Preparar configuración de descuentos por intervalo
    const intervalDiscountConfigs = new Map<string, any[]>();
    settings.intervals.forEach((interval: any) => {
      if (interval.discounts && Array.isArray(interval.discounts) && interval.discounts.length > 0) {
        intervalDiscountConfigs.set(String(interval.id), interval.discounts);
      }
    });

    if (intervalDiscountConfigs.size === 0) {
      return [];
    }

    // Agrupar fechas por intervalo y contar
    const intervalCounters = new Map<string, number>();
    const intervalDiscounts = new Map<string, number>();
    const intervalPercentages = new Map<string, number>();

    const dateEntries = selectedDates
      .map(date => {
        const dateStr = typeof date === 'string' ? date : (date?.date ?? date);
        const intervalId = date?.course_interval_id !== undefined && date?.course_interval_id !== null
          ? String(date.course_interval_id)
          : null;
        return { date: dateStr, intervalId };
      })
      .filter(entry => !!entry.date && !!entry.intervalId)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calcular descuento por cada fecha
    for (const entry of dateEntries) {
      if (!entry.intervalId) continue;

      const intervalKey = entry.intervalId;
      const currentCount = (intervalCounters.get(intervalKey) || 0) + 1;
      intervalCounters.set(intervalKey, currentCount);

      const discountRules = intervalDiscountConfigs.get(intervalKey);
      if (!discountRules || discountRules.length === 0) {
        continue;
      }

      const applicableDiscount = discountRules
        .filter((d: any) => currentCount >= (d.dates || d.days || d.date || 0))
        .sort((a: any, b: any) => (b.dates || b.days || b.date || 0) - (a.dates || a.days || a.date || 0))[0];

      if (!applicableDiscount) {
        continue;
      }

      const discountValue = applicableDiscount.value || applicableDiscount.discount || 0;
      const discountType = applicableDiscount.type === 2 || applicableDiscount.type === 'fixed' ? 'fixed' : 'percentage';

      let discountAmount = 0;
      if (discountType === 'percentage') {
        discountAmount = basePrice * (discountValue / 100);
        intervalPercentages.set(intervalKey, discountValue);
      } else {
        discountAmount = discountValue;
      }

      const currentDiscount = intervalDiscounts.get(intervalKey) || 0;
      intervalDiscounts.set(intervalKey, currentDiscount + discountAmount);
    }

    // Convertir a array de resultados
    const breakdown: any[] = [];
    intervalDiscounts.forEach((discountAmount, intervalId) => {
      breakdown.push({
        intervalId: intervalId,
        discountAmount: Number(discountAmount.toFixed(2)),
        discountPercentage: intervalPercentages.get(intervalId) || 0
      });
    });

    return breakdown;
  }

  private calculateDiscountFromSettings(course: any, selectedDates: any[], basePrice: number, settings: any): number {
    const breakdown = this.calculateDiscountBreakdown(course, selectedDates);
    return breakdown.reduce((sum, item) => sum + item.discountAmount, 0);
  }

  private isDateInRange(date: string, startDate: string, endDate: string): boolean {
    const dateMoment = moment(date);
    const startMoment = moment(startDate);
    const endMoment = moment(endDate);
    return dateMoment.isSameOrAfter(startMoment) && dateMoment.isSameOrBefore(endMoment);
  }

  private parseCourseSettings(settings: any): any {
    if (!settings) return {};
    try {
      return typeof settings === 'string' ? JSON.parse(settings) : settings;
    } catch {
      return {};
    }
  }

  private getIntervalDiscountRules(course: any): {
    globalRules: Map<number, { type: 'percentage' | 'fixed'; value: number }>;
    intervalRules: Map<number, Map<number, { type: 'percentage' | 'fixed'; value: number }>>;
  } {
    const globalRules = new Map<number, { type: 'percentage' | 'fixed'; value: number }>();

    // Si no se usan descuentos por intervalo, cargar descuentos globales
    if (!course?.use_interval_discounts) {
      for (const rule of this.parseGlobalDiscounts(course?.discounts)) {
        globalRules.set(rule.day, { type: rule.type, value: rule.value });
      }
    }

    const intervalRules = new Map<number, Map<number, { type: 'percentage' | 'fixed'; value: number }>>();

    // Si se usan descuentos por intervalo, cargar desde interval_discounts
    if (course?.use_interval_discounts && course?.interval_discounts) {
      const intervalDiscountsData = this.parseIntervalDiscounts(course.interval_discounts);

      intervalDiscountsData.forEach((discounts, intervalKey) => {
        const rules = new Map<number, { type: 'percentage' | 'fixed'; value: number }>();
        discounts.forEach(discount => {
          rules.set(discount.day, { type: discount.type, value: discount.value });
        });
        if (rules.size > 0) {
          intervalRules.set(this.intervalKeyToId(intervalKey), rules);
        }
      });
    } else {
      // Método legacy: usar course_intervals
      const intervals = Array.isArray(course?.course_intervals)
        ? course.course_intervals
        : (Array.isArray(course?.courseIntervals) ? course.courseIntervals : []);

      intervals.forEach((interval: any) => {
        if (!interval || interval.id === undefined || interval.id === null) {
          return;
        }

        const rules = new Map<number, { type: 'percentage' | 'fixed'; value: number }>();
        if (Array.isArray(interval?.discounts)) {
          interval.discounts.forEach((discount: any) => {
            const day = Number(discount?.days ?? discount?.min_days ?? 0);
            if (!day || day < 1) {
              return;
            }
            const type = (discount?.type === 'fixed' || discount?.type === 'fixed_amount' || discount?.discount_type === 'fixed_amount')
              ? 'fixed'
              : 'percentage';
            const value = Number(discount?.value ?? discount?.discount_value ?? 0) || 0;
            rules.set(day, { type, value });
          });
        }

        if (rules.size > 0) {
          intervalRules.set(Number(interval.id), rules);
        }
      });
    }

    return { globalRules, intervalRules };
  }

  private parseIntervalDiscounts(rawIntervalDiscounts: any): Map<string, Array<{ day: number; type: 'percentage' | 'fixed'; value: number }>> {
    const result = new Map<string, Array<{ day: number; type: 'percentage' | 'fixed'; value: number }>>();

    if (!rawIntervalDiscounts) {
      return result;
    }

    let intervalDiscountsObj: any = {};

    if (typeof rawIntervalDiscounts === 'string') {
      try {
        intervalDiscountsObj = JSON.parse(rawIntervalDiscounts);
      } catch (error) {
        console.warn('Could not parse interval_discounts JSON', error);
        return result;
      }
    } else if (typeof rawIntervalDiscounts === 'object') {
      intervalDiscountsObj = rawIntervalDiscounts;
    }

    // intervalDiscountsObj tiene formato: {"2024-06-01_2024-06-30": [{"date":5,"discount":10,"type":1}]}
    Object.keys(intervalDiscountsObj).forEach(intervalKey => {
      const discountsArray = intervalDiscountsObj[intervalKey];
      if (!Array.isArray(discountsArray)) {
        return;
      }

      const parsedDiscounts = discountsArray
        .map(discount => {
          const day = Number(discount?.date ?? discount?.day ?? 0);
          if (!day || day < 1) {
            return null;
          }

          let type: 'percentage' | 'fixed' = 'percentage';
          let value = 0;

          if (discount?.type === 2 || discount?.type === 'fixed' || discount?.type === 'fixed_amount') {
            type = 'fixed';
          } else {
            type = 'percentage';
          }
          value = Number(discount?.discount ?? discount?.value ?? 0) || 0;

          return { day, type, value };
        })
        .filter(rule => rule !== null) as Array<{ day: number; type: 'percentage' | 'fixed'; value: number }>;

      if (parsedDiscounts.length > 0) {
        result.set(intervalKey, parsedDiscounts);
      }
    });

    return result;
  }

  private intervalKeyToId(intervalKey: string): number {
    // Crear un ID numérico basado en la clave del intervalo
    // Por ejemplo "2024-06-01_2024-06-30" -> hash numérico
    let hash = 0;
    for (let i = 0; i < intervalKey.length; i++) {
      hash = ((hash << 5) - hash) + intervalKey.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private parseGlobalDiscounts(rawDiscounts: any): Array<{ day: number; type: 'percentage' | 'fixed'; value: number }> {
    if (!rawDiscounts) {
      return [];
    }

    let discountsArray: any[] = [];

    if (typeof rawDiscounts === 'string') {
      try {
        const parsed = JSON.parse(rawDiscounts);
        if (Array.isArray(parsed)) {
          discountsArray = parsed;
        }
      } catch (error) {
        console.warn('Could not parse course discounts JSON', error);
        discountsArray = [];
      }
    } else if (Array.isArray(rawDiscounts)) {
      discountsArray = rawDiscounts;
    } else {
      return [];
    }

    return discountsArray
      .map(discount => {
        const day = Number(discount?.date ?? discount?.day);
        if (!day || day < 1) {
          return null;
        }

        let type: 'percentage' | 'fixed' = 'percentage';
        let value = 0;

        if (discount?.type !== undefined) {
          if (discount.type === 2 || discount.type === 'fixed' || discount.type === 'fixed_amount') {
            type = 'fixed';
          } else {
            type = 'percentage';
          }
          value = Number(discount?.discount ?? 0) || 0;
        } else if (discount?.percentage !== undefined) {
          type = 'percentage';
          value = Number(discount.percentage) || 0;
        } else if (discount?.discount !== undefined) {
          type = 'percentage';
          value = Number(discount.discount) || 0;
        } else if (discount?.reduccion !== undefined) {
          type = 'percentage';
          value = Number(discount.reduccion) || 0;
        } else {
          return null;
        }

        return { day, type, value };
      })
      .filter(rule => rule !== null) as Array<{ day: number; type: 'percentage' | 'fixed'; value: number }>;
  }

  private applyIntervalDiscount(
    basePrice: number,
    intervalId: number | null | undefined,
    dayIndex: number,
    globalRules: Map<number, { type: 'percentage' | 'fixed'; value: number }>,
    intervalRules: Map<number, Map<number, { type: 'percentage' | 'fixed'; value: number }>>
  ): number {
    let rule: { type: 'percentage' | 'fixed'; value: number } | undefined;

    if (intervalId !== null && intervalId !== undefined) {
      const intervalRule = intervalRules.get(Number(intervalId));
      if (intervalRule) {
        rule = intervalRule.get(dayIndex);
      }
    }

    if (!rule) {
      rule = globalRules.get(dayIndex);
    }

    if (!rule) {
      return basePrice;
    }

    if (rule.type === 'percentage') {
      return Math.max(0, basePrice - (basePrice * rule.value / 100));
    }

    return Math.max(0, basePrice - rule.value);
  }

  private resolveIntervalId(date: any): number | null {
    if (!date) {
      return null;
    }

    if (date?.course_interval_id !== undefined && date?.course_interval_id !== null) {
      return Number(date.course_interval_id);
    }

    if (date?.interval_id !== undefined && date?.interval_id !== null) {
      return Number(date.interval_id);
    }

    if (date?.courseDate?.course_interval_id !== undefined && date.courseDate.course_interval_id !== null) {
      return Number(date.courseDate.course_interval_id);
    }

    return null;
  }

  updateBookingData(partialData: Partial<any>) {
    const currentData = this.getBookingData();
    if (currentData) {
      const updatedData = { ...currentData, ...partialData };
      this.setBookingData(updatedData);
    }
  }

  setCart(normalizedDates, bookingData: any) {
    let cart = [];
    let group_id = 0;
    normalizedDates.forEach(item => {
      group_id++;
      // Inicializar variables para el cálculo del precio
      let totalExtrasPrice = 0;
      item.utilizers.forEach(utilizer => {
        item.dates.forEach(date => {
          let bookingUser: any = {};
          bookingUser.client_id = utilizer.id;
          bookingUser.group_id = group_id;
          bookingUser.monitor_id = item.monitor ? item.monitor.id : null;

          // Obtener los valores desde bookingData
          let reduction = bookingData.price_reduction || 0;
          let cancellationInsurance = bookingData.price_cancellation_insurance || 0;
    // BOUKII CARE DESACTIVADO -           let boukiiCare =bookingData.price_boukii_care || 0;
          let tva = bookingData.price_tva || 0;

          // Calcular el valor total de los vouchers
          let totalVoucherDiscount = 0;
          if (bookingData.vouchers && bookingData.vouchers.length > 0) {
            bookingData.vouchers.forEach(voucher => {
              if (voucher.bonus && voucher.bonus.reducePrice) {
                totalVoucherDiscount += parseFloat(voucher.bonus.reducePrice || 0); // Asumimos que 'reducePrice' contiene el monto del descuento
              }
            });
          }

          let extras = [];

          // Recolectar los extras y calcular su precio total
          if (item.course.course_type == 2) {
            let utilizers =  date.utilizers.find(u =>
              u.first_name == utilizer.first_name && u.last_name == utilizer.last_name);
            if(utilizers && utilizers.extras && utilizers.extras.length) {
              utilizers.extras.forEach(extra => {
                let extraPrice = parseFloat(extra.price);
                totalExtrasPrice += extraPrice;
                extras.push({
                  course_extra_id: extra.id,
                  name: extra.name,
                  quantity: extra.quantity,
                  price: extraPrice
                });
              });
            }
          } else {
            if(date.extras &&  date.extras.length) {
              date.extras.forEach(extra => {
                let extraPrice = parseFloat(extra.price);
                totalExtrasPrice += extraPrice;
                extras.push({
                  course_extra_id: extra.id,
                  name: extra.name,
                  quantity: extra.quantity,
                  price: extraPrice
                });
              });
            }
          }

          // Asignar valores al objeto de usuario de la reserva
          bookingUser.price_base = parseFloat(item.totalSinExtras); // Precio base calculado
          bookingUser.extra_price = parseFloat(item.extrasTotal); // Precio base calculado
          bookingUser.price = parseFloat(item.total.replace(/[^\d.-]/g, '')); // Precio total (base + extras)
          bookingUser.currency = item.course.currency;
          bookingUser.course_id = item.course.id;
          bookingUser.course_name = item.course.name;
          bookingUser.notes_school = item.schoolObs;
          bookingUser.notes = item.clientObs;
          bookingUser.course_type = item.course.course_type;
          bookingUser.currency = item.course.currency;
          bookingUser.degree_id = item.sportLevel.id;
          bookingUser.course_date_id = item.course.course_dates.find(d =>
            moment(d.date).format('YYYY-MM-DD') == moment(date.date).format('YYYY-MM-DD')).id;
          bookingUser.hour_start = date.startHour;
          bookingUser.hour_end = date.endHour;

          // Asignar los extras al usuario de la reserva
          bookingUser.extras = extras;

          // Añadir el usuario con la reserva completa al carrito
          cart.push(bookingUser);
        });
      });

    });

    return cart;
  }
  resetBookingData() {
    this.bookingDataSubject.next({
      school_id: 0,
      client_main_id: 0,
      user_id: 0,
      price_total: 0,
      has_cancellation_insurance: false,
    // BOUKII CARE DESACTIVADO -       has_boukii_care: false,
      has_reduction: false,
      has_tva: false,
      price_cancellation_insurance: 0,
      price_reduction: 0,
    // BOUKII CARE DESACTIVADO -       price_boukii_care: 0,
      price_tva: 0,
      source: 'admin',
      payment_method_id: null,
      paid_total: 0,
      paid: false,
      notes: '',
      notes_school: '',
      selectedPaymentOption: '',
      paxes: 0,
      status: 0,
      color: '',
      vouchers: [],  // Reset de vouchers
      reduction: null,  // Reset de reduction
      basket: null,  // Reset de reduction
      cart:  null
    });
  }

  private createBookingLog(logData: any): Observable<any> {
    return this.crudService.create('/booking-logs', logData);
  }

  private createPayment(paymentData: any): Observable<any> {
    return this.crudService.create('/payments', paymentData);
  }

  private updateBookingUserStatus(bookingUsers: any[], status: number): Observable<any> {
    return forkJoin(
      bookingUsers.map(user =>
        this.crudService.update('/booking-users', { status }, user.id)
      )
    );
  }

  private cancelBookingUsers(bookingUserIds: number[]): Observable<any> {
    return this.crudService.post('/admin/bookings/cancel', {
      bookingUsers: bookingUserIds
    });
  }

  private handleNoRefund(bookingId: number, bookingUsers: any[], bookTotalPrice: number, userData: any): Observable<any> {
    const operations = [
      this.createBookingLog({
        booking_id: bookingId,
        action: 'no_refund',
        before_change: 'confirmed',
        user_id: userData.id
      }),
      this.createPayment({
        booking_id: bookingId,
        school_id: userData.schools[0].id,
        amount: bookTotalPrice,
        status: 'no_refund',
        notes: 'no refund applied'
      }),
      this.cancelBookingUsers(bookingUsers)
    ];

    return forkJoin(operations);
  }

  private handleBoukiiPay(bookingId: number, bookTotalPrice: number, bookingUsers: any[], userData: any, reason: string): Observable<any> {
    const operations: Observable<any>[] = [
      this.createBookingLog({
        booking_id: bookingId,
        action: 'refund_boukii_pay',
        before_change: 'confirmed',
        user_id: userData.id,
        reason: reason
      })
    ];

    operations.push(
      this.crudService.post(`/admin/bookings/refunds/${bookingId}`, {
        amount: bookTotalPrice
      })
    );


    operations.push(
      this.cancelBookingUsers(bookingUsers)
    );

    return forkJoin(operations);
  }

  private handleCashRefund(bookingId: number, bookingUsers: any[], bookTotalPrice: number, userData: any, reason: string): Observable<any> {
    const operations = [
      this.createBookingLog({
        booking_id: bookingId,
        action: 'refund_cash',
        before_change: 'confirmed',
        user_id: userData.id,
        description: reason
      }),
      this.createPayment({
        booking_id: bookingId,
        school_id: userData.schools[0].id,
        amount: bookTotalPrice,
        status: 'refund',
        notes: 'other'
      }),
      this.cancelBookingUsers(bookingUsers)
    ];

    return forkJoin(operations);
  }

  private handleVoucherRefund(bookingId: number, bookingUsers: any[], bookTotalPrice: number, userData: any, clientMainId: number): Observable<any> {
    const voucherData: any = {
      code: 'BOU-' + this.generateRandomNumber(),
      quantity: bookTotalPrice,
      remaining_balance: bookTotalPrice,
      payed: false,
      client_id: clientMainId,
      school_id: userData.schools[0].id
    };

    return forkJoin([
      this.createBookingLog({
        booking_id: bookingId,
        action: 'voucher_refund',
        before_change: 'confirmed',
        user_id: userData.id
      }),
      this.cancelBookingUsers(bookingUsers),
      this.createPayment({
        booking_id: bookingId,
        school_id: userData.schools[0].id,
        amount: bookTotalPrice,
        status: 'refund',
        notes: 'voucher'
      }),
      this.crudService.create('/vouchers', voucherData).pipe(
        mergeMap(result =>
          this.crudService.create('/vouchers-logs', {
            voucher_id: result.data.id,
            booking_id: bookingId,
            amount: -voucherData.quantity
          })
        )
      )
    ]);
  }

  processCancellation(
    data: any,
    bookingData: any,
    isPartial = false,
    user: any,
    group: any,
    bookingUserIds:any = null,
    total:any = null
  ): Observable<any> {
    if (!data) return EMPTY;
    const bookingUserIdsFinal = group
      ? group.dates.flatMap(date => date.booking_users.map(b => b.id))
      : bookingUserIds;

    const totalFinal = group ? group.total : total; // Si group no está, usar data.total

    const initialLog: any = {
      booking_id: bookingData.id,
      action: 'partial_cancel',
      description: 'partial cancel booking',
      user_id: user.id,
      before_change: 'confirmed',
      school_id: user.schools[0].id
    };

    let cancellationOperation: Observable<any>;

    switch (data.type) {
      case 'no_refund':
        cancellationOperation = this.handleNoRefund(
          bookingData.id,
          bookingUserIdsFinal,
          totalFinal,
          user
        );
        break;

      case 'boukii_pay':
        cancellationOperation = this.handleBoukiiPay(
          bookingData.id,
          totalFinal,
          bookingUserIdsFinal,
          user,
          data.reason
        );
        break;

      case 'refund':
        cancellationOperation = this.handleCashRefund(
          bookingData.id,
          bookingUserIdsFinal,
          totalFinal,
          user,
          data.reason
        );
        break;

      case 'refund_gift':
        cancellationOperation = this.handleVoucherRefund(
          bookingData.id,
          bookingUserIdsFinal,
          totalFinal,
          user,
          bookingData.client_main_id
        );
        break;

      default:
        return EMPTY;
    }

    return this.createBookingLog(initialLog).pipe(
      mergeMap(() => cancellationOperation),
      delay(1000),
      mergeMap(() => {
        const status = isPartial ? 3 : 2;
        return this.crudService.update('/bookings', { status }, bookingData.id);
      })
    );
  }

  private generateRandomNumber(): string {
    return Math.random().toString(36).substring(2, 15);
  }

}

