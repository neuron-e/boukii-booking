import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import {SchoolService} from '../../services/school.service';
import {BookingService} from '../../services/booking.service';
import {CartService} from '../../services/cart.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  isModalVoucher:boolean=false;
  isModalConditions:boolean=false;
  voucher: any;
  hasInsurance = false;
  hasBoukiiCare = false;
  hasTva = false;
  totalPrice: number = 0;
  usedVoucherAmount: number = 0;
  user: any;
  cart: any[];
  schoolData: any;
  settings: any;
  cancellationInsurance: any;
  boukiiCarePrice: any;
  tva: any;

  conditionsHTML:string = "Inscriptions / Réservations / Responsabilités<br><br>• Les inscriptions aux cours s’effectuent soit par le site internet, par téléphone ou directement sur place auprès de nos bureaux.<br><br>• Si votre séjour se déroule durant les périodes de vacances scolaires, nous vous conseillons de réserver vos cours au minimum un mois à l’avance.<br><br>• En cas de manque de neige, les cours collectifs de Noël, Nouvel-An, Jeunesse et Lève-tôt, seront déplacés aux Diablerets ou dans une station Magic Pass la plus proche.<br><br>• Le paiement total de nos prestations en cours collectifs/privés est dû au moment de votre réservation, il valide votre inscription.";

  constructor(private router: Router, public themeService: ThemeService, private schoolService: SchoolService,
              private bookingService: BookingService, private activatedRoute: ActivatedRoute,
              private cartService: CartService, private translateService: TranslateService) { }

  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = JSON.parse(data.data.settings);

          this.cancellationInsurance = parseFloat(this.settings?.taxes?.cancellation_insurance_percent);
          this.boukiiCarePrice = parseInt(this.settings?.taxes?.boukii_care_price);
          this.tva = parseFloat(this.settings?.taxes?.tva);

          this.hasInsurance = this.cancellationInsurance && !isNaN(this.cancellationInsurance) || this.cancellationInsurance > 0
          this.hasBoukiiCare = this.boukiiCarePrice && !isNaN(this.boukiiCarePrice) || this.boukiiCarePrice > 0
          this.hasTva = this.tva && !isNaN(this.tva) || this.tva > 0

          let storageSlug = localStorage.getItem(this.schoolData.slug+ '-boukiiUser');
          if(storageSlug) {
            this.user = JSON.parse(storageSlug);
            this.cart = this.transformCartToArray(JSON.parse(localStorage.getItem(this.schoolData.slug+'-cart') ?? '{}'));
          }
          this.totalPrice = this.getTotalCoursesPrice() + (this.tva && !isNaN(this.tva) ? this.getTotalCoursesPrice() * this.tva : 0);
        }
      }
    );
  }

  isNanValue(value: any) {
    return isNaN(value);
  }

  sendBooking() {
    const bookingData = {
      // Preparar los datos del booking
      school_id: this.schoolData.id,
      client_main_id: this.user.clients[0].id,
      price_total: this.totalPrice,
      has_cancellation_insurance: this.hasInsurance,
      price_cancellation_insurance: this.hasInsurance ? this.getInsurancePrice() : 0,
      has_boukii_care: this.hasInsurance,
      price_boukii_care: this.boukiiCarePrice ? this.boukiiCarePrice() : 0,
      has_tva: this.hasTva,
      price_tva: this.hasTva ? this.getTotalCoursesPrice() * this.tva : 0,
      cart: this.getCleanedCartDetails(),
      voucher: this.voucher,
      voucherAmount: this.usedVoucherAmount,
      source: 'web'

      // ... otros campos requeridos
    };

    console.log(bookingData);

    this.bookingService.createBooking(bookingData).subscribe(
      response => {
        console.log('Reserva creada con éxito', response);
        // Manejar respuesta exitosa
      },
      error => {
        console.error('Error al crear la reserva', error);
        // Manejar error
      }
    );
  }

  getCleanedCartDetails() {
    // Clonar y limpiar cada ítem del carrito
    return this.cart.map(cartItem => {
      // Clonar cada detalle y eliminar propiedades no deseadas
      const cleanedDetails = cartItem.details.map((detail:any) => {
        // Crea una copia del objeto detail
        const cleanedDetail = { ...detail };

        // Elimina las propiedades no deseadas
        delete cleanedDetail.course;
        delete cleanedDetail.client;
        delete cleanedDetail.course_date;
        delete cleanedDetail.group;
        delete cleanedDetail.subGroup;

        return cleanedDetail;
      });

      // Devolver una copia del ítem del carrito con los detalles limpios
      return { ...cartItem, details: cleanedDetails };
    });
  }


  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  openModalVoucher() {
    this.isModalVoucher = true;
  }

  closeModalVoucher(voucher: any) {
    if(voucher) {
      this.voucher = voucher.data;
    }
    this.isModalVoucher = false;
    this.updateTotal(); // Actualiza el total cuando se cierra el modal del cupón
  }

  openModalConditions() {
    this.isModalConditions = true;
  }

  closeModalConditions() {
    this.isModalConditions = false;
  }

  transformCartToArray(cart: any): any[] {
    const cartArray = [];
    for (const courseId in cart) {
      if (cart.hasOwnProperty(courseId)) {
        for (const userId in cart[courseId]) {
          if (cart[courseId].hasOwnProperty(userId)) {
            cartArray.push({
              userId: userId,
              courseId: courseId,
              details: cart[courseId][userId]
            });
          }
        }
      }
    }
    return cartArray;
  }

  transformArrayToCart(cartArray: any[]): any {
    const cartObject: any = {};

    for (const cartItem of cartArray) {
      const { userId, courseId, details } = cartItem;

      if (!cartObject[courseId]) {
        cartObject[courseId] = {};
      }

      cartObject[courseId][userId] = details;
    }

    return cartObject;
  }

  getUniqueDates(details: any[]): any[] {
    const uniqueDatesMap = new Map();

    details.forEach(detail => {
      // Crear una clave única para cada objeto date basada en la fecha y hora
      const uniqueKey = detail.date + '-' + detail.hour_start + '-' + detail.hour_end;

      if (!uniqueDatesMap.has(uniqueKey)) {
        uniqueDatesMap.set(uniqueKey, detail);
      }
    });

    return Array.from(uniqueDatesMap.values());
  }

  getUniqueClients(details: any[]): any[] {
    const uniqueClientsMap = new Map();
    details.forEach(detail => {
      uniqueClientsMap.set(detail.client.id, detail.client);
    });
    return Array.from(uniqueClientsMap.values());
  }

  getInsurancePrice() {
    return this.getTotalCoursesPrice() * this.cancellationInsurance;
  }

  getTotalItemPrice(details: any[]): number {
    return details.reduce((total, detail) => total + parseFloat(detail.price) + parseFloat(detail.extra.price) + (parseFloat(detail.extra.price) * (parseFloat(detail.extra.tva) / 100)), 0);
  }

  getTotalItemExtraPrice(details: any[]): number {
    return details.reduce((total, detail) => {
      if (detail.extra && 'price' in detail.extra && 'tva' in detail.extra) {
        const price = parseFloat(detail.extra.price);
        const tva = parseFloat(detail.extra.tva);
        const extraPrice = price + (price * (tva / 100));
        if (!isNaN(extraPrice)) {
          return total + extraPrice;
        }
      }
      return total;
    }, 0);
  }

  getBasePrice() {
    let ret = 0;

    this.cart.forEach(element => {
      ret = ret + ((!element.courseDates[0].course.is_flexible && element.courseDates[0].course.course_type === 2)
      ? element.price_total * element.courseDates.length : element.price_total);
    });

    return ret;
  }

  getTotalCoursesPrice() {
    let total = 0;
    this.cart?.forEach(cartItem => {

      if(cartItem.details[0].course.course_type ==1) {
        if(!cartItem.details[0].course.is_flexible) {
          total += parseFloat(cartItem.details[0].course.price) + this.getTotalItemExtraPrice(cartItem.details);
        } else {
          //TODO: Revisar con flexible
          total += this.getTotalItemPrice(cartItem.details);
        }
      } else {
        if(cartItem.details[0].course.is_flexible) {
          total += this.getTotalItemPrice(cartItem.details);
        } else {
          //TODO: Revisar sin flexible
        }
      }
    });
    return total;
  }

  updateTotal() {
    let basePrice = this.getTotalCoursesPrice();
    let insurancePrice = this.hasInsurance ? this.getInsurancePrice() : 0;
    let boukiiCarePrice = this.hasBoukiiCare ? this.getBoukiiCarePrice() : 0;
    let totalPrice = basePrice;

    if (this.voucher) {
      let voucherAmount = parseFloat(this.voucher.remaining_balance);
      if (totalPrice <= voucherAmount) {
        // Si el total es menor o igual al saldo del cupón
        this.usedVoucherAmount = totalPrice;
        totalPrice = 0;
      } else {
        // Si el total es mayor al saldo del cupón
        this.usedVoucherAmount = voucherAmount;
        totalPrice -= voucherAmount;
      }
    } else {
      this.usedVoucherAmount = 0;
    }

    if (this.tva && !isNaN(this.tva)) {

      totalPrice = (totalPrice + insurancePrice + boukiiCarePrice) + (totalPrice + insurancePrice + boukiiCarePrice) * this.tva;
    } else {
      totalPrice = totalPrice + insurancePrice + boukiiCarePrice;
    }
    this.totalPrice = totalPrice;
  }

  getBoukiiCarePrice() {
    let ret = 0;
    this.cart.forEach(element => {
      ret = ret + (this.boukiiCarePrice * element.details.length);
    });

    return ret;
  }

  goBack(url: string) {
    this.router.navigate(['/'+this.activatedRoute.snapshot.params['slug']]);
  }

  deleteCartItem(cartItem: any) {
    console.log(cartItem);
    console.log(this.cart);

    const indexToRemove = this.cart.findIndex(item =>
      item.courseId === cartItem.courseId && item.userId === cartItem.userId
    );

    if (indexToRemove !== -1) {
      this.cart.splice(indexToRemove, 1);
      let cartArray = this.transformArrayToCart(this.cart);
      console.log(cartArray);
      localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cartArray));

      this.cartService.carData.next(cartArray);
    }
  }

  getCourseName(course: any) {
    if (!course.translations || course.translations === null) {
      return course.name;
    } else {
      const translations = JSON.parse(course.translations);
      return translations[this.translateService.currentLang].name;
    }
  }
}
