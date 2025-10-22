import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, delay, EMPTY, forkJoin, mergeMap, Observable} from 'rxjs';
import {ApiCrudService} from './crud.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends ApiService {
  private bookingDataSubject = new BehaviorSubject<any | null>(null);
  public editData: any;

  constructor(http: HttpClient, route: ActivatedRoute, private crudService: ApiCrudService) {
    super(http, route);
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

        // Aplicar descuentos por múltiples fechas si están configurados
        if (activity.course.discounts && activity.dates.length > 1) {
          const discountAmount = this.calculateMultiDateDiscount(activity.course, activity.dates.length);
          if (discountAmount > 0) {
            price -= (discountAmount * activity.utilizers.length);
          }
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

  calculateMultiDateDiscount(course: any, totalDates: number): number {
    if (!course.discounts) {
      return 0;
    }

    try {
      let discounts;
      if (typeof course.discounts === 'string') {
        discounts = JSON.parse(course.discounts);
      } else {
        discounts = course.discounts;
      }

      if (!discounts || !Array.isArray(discounts)) {
        return 0;
      }

      // Buscar el descuento que corresponde al número de fechas seleccionadas
      const applicableDiscount = discounts.find(discount => discount.date === totalDates);

      if (applicableDiscount) {
        const basePrice = parseFloat(course.price || 0);

        // Soporte para formato nuevo (type + discount) y viejo (percentage)
        if (applicableDiscount.type !== undefined) {
          // Formato nuevo
          if (applicableDiscount.type === 1) { // Porcentaje
            return (basePrice * totalDates * applicableDiscount.discount) / 100;
          } else { // Cantidad fija
            return applicableDiscount.discount;
          }
        } else if (applicableDiscount.percentage !== undefined) {
          // Formato viejo - mantener compatibilidad
          return (basePrice * totalDates * applicableDiscount.percentage) / 100;
        }
      }

      return 0;
    } catch (error) {
      console.error('Error calculating multi-date discount:', error);
      return 0;
    }
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

