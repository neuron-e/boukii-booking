import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {MatDialog} from '@angular/material/dialog';

import {Observable, Subscription} from 'rxjs';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {LangService} from '../../../../../services/langService';
import {UtilsService} from '../../../../../services/utils.service';
import {ApiCrudService} from '../../../../../services/crud.service';
import {BookingService} from '../../../../../services/booking.service';
import {SchoolService} from '../../../../../services/school.service';


@Component({
  selector: 'booking-detail-reservation-detail',
  templateUrl: './booking-reservation-detail.component.html',
  styleUrls: ['./booking-reservation-detail.component.scss'],
})
export class BookingReservationDetailComponent implements OnInit {
  @Input() client: any;
  @Input() activities: any;
  @Input() hideBotton = false;
  @Input() bookingData: any;
  @Input() allLevels: any;
  @Input() canCancelBooking = false;
  @Output() endClick = new EventEmitter();
  @Output() deleteActivity = new EventEmitter();
  @Output() editClick = new EventEmitter();
  @Output() payClick = new EventEmitter();
  @Output() addClick = new EventEmitter();
  @Input() activitiesChanged: Observable<void>;  // Recibimos el observable
  @Output() closeDetail = new EventEmitter<void>();

  private activitiesChangedSub: Subscription;

  cancellationInsurancePercent: number;
  price_tva: number;
    // BOUKII CARE DESACTIVADO -   price_boukii_care: number;
  school: any;
  settings: any;


  constructor(
    protected langService: LangService,
    protected utilsService: UtilsService,
    private snackbar: MatSnackBar,
    private crudService: ApiCrudService,
    private translateService: TranslateService,
    private router: Router,
    private dialog: MatDialog,
    private schoolService: SchoolService,
    private bookingService: BookingService
  ) {
  }

  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.school = data.data;
          this.settings = typeof this.school.settings === 'string' ? JSON.parse(this.school.settings) : this.school.settings;
          this.cancellationInsurancePercent = parseFloat(this.settings?.taxes?.cancellation_insurance_percent);
    // BOUKII CARE DESACTIVADO -           this.price_boukii_care = parseInt(this.settings?.taxes?.boukii_care_price, 10);
          this.price_tva = parseFloat(this.settings?.taxes?.tva);
          this.loadExistingVouchers();
          //this.bookingData = this.bookingService.getBookingData() || this.initializeBookingData();
          this.recalculateBonusPrice();
          this.updateBookingData();
          this.activitiesChangedSub = this.activitiesChanged.subscribe((res: any) => {
            if (res) {
              this.bookingData = res;
            }
            this.loadExistingVouchers();
            this.recalculateBonusPrice();
            this.updateBookingData();
          });
        }
      }
    );
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  emitClose() {
    this.closeDetail.emit(); // Emitimos el evento cuando se haga clic en la X
  }

  sendMailInfo() {
    this.crudService
      .post("/admin/bookings/mail/" + this.bookingData.id, {
        paid: this.bookingData.paid,
        is_info: true,
      })
      .subscribe(
        (data) => {
          this.snackbar.open(
            this.translateService.instant("snackbar.booking_detail.send_mail"),
            "OK",
            { duration: 1000 }
          );
        },
        (error) => {
          this.snackbar.open(
            this.translateService.instant(
              "snackbar.booking_detail.send_mail.error"
            ),
            "OK",
            { duration: 1000 }
          );
        }
      );
  }

  loadExistingVouchers() {
    this.bookingData.vouchers = [];
    if (this.bookingData.vouchers_logs && Array.isArray(this.bookingData.vouchers_logs)) {
      this.bookingData.vouchers_logs.forEach(log => {
        this.bookingData.vouchers.push({
          bonus: {
            id: log.id,
            voucher_id: log.voucher_id,
            reducePrice: parseFloat(log.amount),
            code: log.voucher.code,
            remaining_balance: log.voucher.remaining_balance,
            is_old: true
          }
        });
      });
    }
  }

  sumActivityTotal(): number {
    if (!this.activities || !Array.isArray(this.activities)) {
      return 0;
    }
    return this.activities.reduce((acc: any, item: any) => {
      // Solo suma si el status es 1
      if (item.status != 2) {
        const numericValue = typeof item.total === 'number'
          ? item.total
          : parseFloat(item.total.toString().replace(/[^d.-]/g, '')) || 0;

        return acc + numericValue;
      }
      return acc; // Si no es status 1, retorna el acumulador sin sumar
    }, 0);
  }

  updateBookingData() {
    // CRITICAL: Backend es la fuente unica de verdad para price_total.
    // NO recalcular ni sobrescribir price_total aqui.
    // El backend (BookingPriceCalculatorService) es el UNICO responsable de calcular precios.
    // Frontend SOLO visualiza, NUNCA recalcula.
    // Ver: ops/decisions/ADR-0001-pricing-centralization.md
    
    // ELIMINADO (2025-11-14): this.bookingData.price_total = this.calculateTotal();
    // Razon: Causaba discrepancias entre frontend/backend y errores en pasarela de pago (ej: reserva 5608)
    
    this.bookingService.setBookingData(this.bookingData);
  }

  calculateRem(event: any) {
    if (event.source.checked) {
      this.bookingData.price_cancellation_insurance = this.sumActivityTotal() * this.cancellationInsurancePercent;
      this.bookingData.has_cancellation_insurance = event.source.checked;
    } else {
      this.bookingData.price_cancellation_insurance = 0;
      this.bookingData.has_cancellation_insurance = event.source.checked;
    }
    this.updateBookingData();
    this.recalculateBonusPrice();
  }

  recalculateBonusPrice() {
    let remainingPrice = this.getDisplayPriceTotal() - this.calculateTotalVoucherPrice();
    if (remainingPrice !== 0 && this.bookingData.vouchers && Array.isArray(this.bookingData.vouchers)) {
      this.bookingData.vouchers.forEach(voucher => {
        if (!voucher.bonus.is_old) {
          const availableBonus = voucher.bonus.remaining_balance - voucher.bonus.reducePrice;

          if (remainingPrice > 0) {
            if (availableBonus >= remainingPrice) {
              voucher.bonus.reducePrice += remainingPrice;
              remainingPrice = 0;
            } else {
              voucher.bonus.reducePrice += availableBonus;
              remainingPrice -= availableBonus;
            }
          } else {
            const adjustedReducePrice = voucher.bonus.reducePrice + remainingPrice;

            if (adjustedReducePrice >= 0) {
              voucher.bonus.reducePrice = adjustedReducePrice;
              remainingPrice = 0;
            } else {
              remainingPrice -= voucher.bonus.reducePrice; // Reduce remainingPrice solo por lo que hay en reducePrice.
              voucher.bonus.reducePrice = 0; // Aseguramos que nunca sea negativo.
            }
          }
        }
      });
    }

    this.updateBookingData();
  }

  private parseBasket(): any | null {
    const basket = (this.bookingData as any)?.basket;
    if (!basket) {
      return null;
    }
    if (typeof basket === 'string') {
      try {
        return JSON.parse(basket);
      } catch {
        return null;
      }
    }
    return basket;
  }

  getDisplayPriceTotal(): number {
    const basket = this.parseBasket();
    const raw = basket?.price_total ?? this.bookingData?.price_total ?? 0;
    const num = Number(raw);
    return isNaN(num) ? 0 : num;
  }


  recalculateTva() {
    const basePrice = this.sumActivityTotal()
      + parseFloat(this.bookingData.price_cancellation_insurance)
      - parseFloat(this.bookingData.price_reduction)
    // BOUKII CARE DESACTIVADO -       + parseFloat(this.bookingData.price_boukii_care);

    this.bookingData.price_tva = basePrice * this.price_tva;
  }

  calculateTotal() {
    this.recalculateTva();
    return this.sumActivityTotal() + parseFloat(this.bookingData.price_cancellation_insurance)
      - parseFloat(this.bookingData.price_reduction)
    // BOUKII CARE DESACTIVADO -       + parseFloat(this.bookingData.price_boukii_care)
      + parseFloat(this.bookingData.price_tva);
  }

  calculateTotalVoucherPrice(): number {

    if(this.bookingData.vouchers) {
      return this.bookingData.vouchers.reduce((acc, item) => acc + parseFloat(item.bonus.reducePrice), 0);
    }
    return 0
  }

  //TODO: review this and use other modal
  /*  addBonus(): void {
      const dialogRef = this.dialog.open(AddDiscountBonusModalComponent, {
        width: '600px',
        data: {
          client_id: this.client.id,
          school_id: this.school.id,
          currentPrice: this.bookingData.price_total - this.calculateTotalVoucherPrice(),
          appliedBonus: this.bookingData.vouchers,
          currency: this.activities[0].course.currency,
        },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.bookingData.vouchers.push(result);
          this.updateBookingData();
          this.recalculateBonusPrice();
        }
      });
    }*/

  /*  addReduction(): void {
      const dialogRef = this.dialog.open(AddReductionModalComponent, {
        width: '530px',
        data: { currentPrice: this.bookingData.price_total, currency: this.activities[0].course.currency },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.bookingData.reduction = result;
          this.bookingData.has_reduction = true;
          this.bookingData.reduction.appliedPrice = result.totalDiscount;
          this.bookingData.price_reduction = this.bookingData.reduction.appliedPrice;
          this.updateBookingData();
          this.recalculateBonusPrice();
        }
      });
    }*/

  deleteReduction(): void {
    this.bookingData.reduction = null;
    this.bookingData.price_reduction = 0;
    this.updateBookingData();
    this.recalculateBonusPrice();
  }

  deleteBonus(index: number): void {
    this.bookingData.vouchers.splice(index, 1);
    this.updateBookingData();
    this.recalculateBonusPrice();
  }

  private calculateReduction(): number {
    return this.bookingData.reduction.type === 1
      ? (this.sumActivityTotal() * this.bookingData.reduction.discount) / 100
      : Math.min(this.bookingData.reduction.discount, this.sumActivityTotal());
  }

  calculateMultiDateDiscounts(): { activity: any, discountAmount: number }[] {
    const discounts: { activity: any, discountAmount: number }[] = [];

    if (this.activities && Array.isArray(this.activities)) {
      this.activities.forEach(activity => {
        if (activity.course?.course_type === 1 &&
            activity.course?.is_flexible &&
            activity.dates?.length > 1) {

          const discountAmount = this.bookingService.calculateMultiDateDiscount(
            activity.course,
            activity.dates
          );

          if (discountAmount > 0) {
            discounts.push({
              activity: activity,
              discountAmount: discountAmount * (activity.utilizers?.length || 1)
            });
          }
        }
      });
    }

    return discounts;
  }

  getTotalMultiDateDiscounts(): number {
    return this.calculateMultiDateDiscounts().reduce((total, discount) => {
      return total + discount.discountAmount;
    }, 0);
  }

  getCurrency(): string {
    if (!this.activities || !Array.isArray(this.activities) || this.activities.length === 0) {
      return '';
    }
    return this.activities[0]?.course?.currency || '';
  }
  protected readonly isNaN = isNaN;
  protected readonly parseFloat = parseFloat;
  protected readonly Math = Math;
}
