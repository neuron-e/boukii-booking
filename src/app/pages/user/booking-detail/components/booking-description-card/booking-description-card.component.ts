import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormDetailsPrivateComponent } from '../form-details-private/form-details-private.component';
import { FormDetailsColectiveFlexComponent } from '../form-details-colective-flex/form-details-colective-flex.component';
import { FormDetailsColectiveFixComponent } from '../form-details-colective-fix/form-details-colective-fix.component';
import { StepObservationsComponent } from '../step-observations/step-observations.component';
import {TranslateService} from '@ngx-translate/core';
import {BookingService} from '../../../../../services/booking.service';
import {LangService} from '../../../../../services/langService';
import {UtilsService} from '../../../../../services/utils.service';



export interface BookingDescriptionCardDate {
  date: string;
  startHour: string;
  endHour: string;
  price: string;
  currency: string;
  changeMonitorOption?: any;
  monitor?: Record<string, any>;
  utilizer?: Record<string, any>[];
  utilizers?: Record<string, any>[];
  booking_users?: any[];
  extras?: Record<string, any>[];
}

@Component({
  selector: "booking-detail-description-card",
  templateUrl: "./booking-description-card.component.html",
  styleUrls: ["./booking-description-card.component.scss"],
})
export class BookingDescriptionCard {
  @Output() editActivity = new EventEmitter();
  @Output() deleteActivity = new EventEmitter();

  @Input() utilizers: any;
  @Input() sport: any;
  @Input() sportLevel: any;
  @Input() allLevels: any;
  @Input() course: any;
  @Input()
  set dates(value: any[]) {
    this._dates = value || [];
    this.extractUniqueMonitors();
  }

  get dates(): any[] {
    return this._dates;
  }
  @Input() monitors: any;
  @Input() clientObs: any;
  @Input() schoolObs: any;
  @Input() groupedActivities: any;
  @Input() total: any;
  @Input() summaryMode = false;
  @Input() isDetail = false;
  @Input() status = 1;
  @Input() index: number = 1;
  @Input() canEditBooking = false;
  @Input() canCancelActivity = false;
  uniqueMonitors: any[] = []; // Monitores únicos
  private _dates: any[] = [];

  // Datos únicos extraídos (coherente con admin)
  formattedMonitors: { unique: any[]; byDate: Map<string, any> } = { unique: [], byDate: new Map() };

  constructor(
    public translateService: TranslateService,
    public bookingService: BookingService,
    protected langService: LangService,
    protected utilsService: UtilsService,
    public dialog: MatDialog
  ) {
    this.extractUniqueMonitors();
  }

  formatDate(date: string) {
    return this.utilsService.formatDate(date);
  }

  private extractUniqueMonitors() {
    const uniqueMap = new Map<number, any>();
    const byDate = new Map<string, any>();

    if (this.dates.length) {
      this.dates.forEach(date => {
        if (date.monitor && date.monitor.id) {
          // Añadir a únicos
          if (!uniqueMap.has(date.monitor.id)) {
            uniqueMap.set(date.monitor.id, {
              id: date.monitor.id,
              name: date.monitor.name || '',
              ...date.monitor
            });
          }

          // Mapear por fecha
          byDate.set(date.date, date.monitor);
        }
      });
    }

    // Mantener compatibilidad con propiedad legacy
    this.uniqueMonitors = Array.from(uniqueMap.values());

    // Formato consistente con admin
    this.formattedMonitors = {
      unique: this.uniqueMonitors,
      byDate
    };
  }

  hasExtrasForDate(date: any): boolean {
    // Verifica si hay utilizadores para la fecha y si al menos uno tiene extras
    return date.utilizers?.some((utilizer: any) => utilizer.extras && utilizer.extras.length > 0) || false;
  }

  calculateDiscountedPrice(date: any, index: number): number {
    let price = this.bookingService.calculateDatePrice(this.course, date, true); // Asegúrate de convertir el precio a número

    if (this.course && this.course.discounts) {
      try {
        let discountsData = this.course.discounts;

        // Si discountsData es una cadena con comillas extra ('"[]"'), la limpiamos
        if (typeof discountsData === 'string') {
          discountsData = discountsData.replace(/^"|"$/g, ''); // Quita las comillas exteriores
          discountsData = JSON.parse(discountsData || '[]'); // Si es "" se convierte en []
        }

        const discounts = Array.isArray(discountsData) ? discountsData : [];

        discounts.forEach(discount => {
          if (discount.date === index + 1) { // Index + 1 porque los índices en arrays comienzan en 0
            price -= (price * (discount.percentage / 100));
          }
        });

      } catch (error) {
        console.error("Error al parsear los descuentos:", error);
      }
    }

    return price;
  }

  shouldShowPrice(course: any, date: any, index: number): boolean {
    // Si es course_type !== 1 y no es flexible, mostrar solo en la primera fecha
    if (course.course_type === 1 && !course.is_flexible) {
      return index === 0;
    }

    // En otros casos, mostrar el precio normalmente
    return true;
  }


  isDiscounted(date: any, index: number): boolean {
    const price = parseFloat(date.price);

    if (this.course && this.course.discounts) {
      try {
        const discounts = typeof this.course.discounts === 'string' ? JSON.parse(this.course.discounts) : [];
        return Array.isArray(discounts) && discounts.some(discount => discount.date === index + 1);
      } catch (error) {
        console.error("Error al parsear discounts:", error);
        return false;
      }
    }

    return false;
  }

  getExtraDescription(dateExtra) {
    return dateExtra.map((extra) => extra?.description).join(", ");
  }

  getExtraName(dateExtra) {
    return dateExtra.map((extra) => extra?.name).join(", ");
  }

  getExtraPrice(dateExtra) {
    return dateExtra.map((extra) => extra?.price).join(", ");
  }

  sendEditForm(dates: any, course: any, utilizers: any = []) {
    if (course.course_type == 2) {
      this.openPrivateDatesForm(dates, course, utilizers);
    } else if (course.course_type == 1) {
      if (course.is_flexible) {
        this.openCollectiveFlexDatesForm(dates, course, utilizers)
      } else {
        this.openCollectiveFixDatesForm(dates, course, utilizers)
      }
    }
  }



  private openPrivateDatesForm(dates: any, course: any, utilizers: any = []) {
    const dialogRef = this.dialog.open(FormDetailsPrivateComponent, {
      width: "800px",
      panelClass: "customBookingDialog",
      data: {
        utilizers: utilizers,
        sport: course.sport,
        sportLevel: this.sportLevel,
        course: course,
        groupedActivities: this.groupedActivities,
        initialData: dates
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Aquí manejas los datos actualizados que provienen del modal
        this.dates = result.course_dates;
        this.total = this.dates[0].price
        result.total = this.total;
        this.editActivity.emit(result);
        // Aquí puedes tomar los datos y hacer lo que necesites con ellos
        // Por ejemplo, enviarlos al backend o actualizar la UI
        //this.updateBooking(result);
      } else {
        this.editActivity.emit(result);
      }
    });
  }

  private openCollectiveFlexDatesForm(dates: any, course: any, utilizers: any = []) {
    const dialogRef = this.dialog.open(FormDetailsColectiveFlexComponent, {
      width: "800px",
      height: "800px",
      panelClass: "customBookingDialog",
      data: {
        utilizer: utilizers[0],
        sport: course.sport,
        sportLevel: this.sportLevel,
        course: course,
        groupedActivities: this.groupedActivities,
        initialData: dates
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Aquí manejas los datos actualizados que provienen del modal
        this.dates = result.course_dates;
        this.total = this.dates.reduce((acc, date) =>
          acc + parseFloat(date.price), 0).toFixed(2);
        result.total = this.total;
        this.editActivity.emit(result);
        // Aquí puedes tomar los datos y hacer lo que necesites con ellos
        // Por ejemplo, enviarlos al backend o actualizar la UI
        //this.updateBooking(result);
      } else {
        this.editActivity.emit(result);
      }
    });
  }

  private openCollectiveFixDatesForm(dates: any, course: any, utilizers: any = []) {
    const dialogRef = this.dialog.open(FormDetailsColectiveFixComponent, {
      width: "800px",
      panelClass: "customBookingDialog",
      data: {
        utilizer: utilizers[0],
        sport: course.sport,
        sportLevel: this.sportLevel,
        course: course,
        groupedActivities: this.groupedActivities,
        initialData: dates
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Aquí manejas los datos actualizados que provienen del modal
        this.dates = result.course_dates;
        this.total = this.dates.reduce((acc, date) =>
          acc + parseFloat(date.price), 0).toFixed(2);
        result.total = this.total;
        this.editActivity.emit(result);
        // Aquí puedes tomar los datos y hacer lo que necesites con ellos
        // Por ejemplo, enviarlos al backend o actualizar la UI
        //this.updateBooking(result);
      } else {
        this.editActivity.emit(result);
      }
    });
  }

  openObservationsForm(clientObs: any, schoolObs: any) {
    const dialogRef = this.dialog.open(StepObservationsComponent, {
      width: "800px",
      panelClass: "customBookingDialog",
      data: {
        initialData: {
          clientObs: clientObs,
          schoolObs: schoolObs
        }
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Aquí manejas los datos actualizados que provienen del modal
        this.schoolObs = result.schoolObs;
        this.clientObs = result.clientObs;
        this.editActivity.emit(result);
        //this.updateBooking(result);
      }
    });
  }



  protected readonly parseFloat = parseFloat;

  getClientLevel(client: any, sportId?: number | null) {
    if (!client || sportId === undefined || sportId === null) {
      return null;
    }

    if (!Array.isArray(client.client_sports) || client.client_sports.length === 0) {
      return null;
    }

    const normalizedSportId = Number(sportId);
    if (Number.isNaN(normalizedSportId)) {
      return null;
    }

    try {
      return this.utilsService.getClientDegreeByClient(client, normalizedSportId);
    } catch (error) {
      return null;
    }
  }
}
