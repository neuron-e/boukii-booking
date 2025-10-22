import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SchoolService } from '../../services/school.service';
import { BookingService } from '../../services/booking.service';
import { CartService } from '../../services/cart.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiCrudService } from 'src/app/services/crud.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DiscountCodeService } from '../../services/discount-code.service';
import { DiscountCodeValidationResponse } from '../../interface/discount-code';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  isModalVoucher: boolean = false;
  isModalConditions: boolean = false;
  isDiscountCodeModalOpen: boolean = false;
  mobileHidden: boolean = false
  vouchers: any[] = []; // Changed from single voucher to array
  appliedDiscountCode: DiscountCodeValidationResponse | null = null;
  hasInsurance = false;
  hasBoukiiCare = false;
  hasTva = false;
  totalPrice: number = 0;
  totalNotaxes: number = 0;
  usedVoucherAmount: number = 0;
  discountCodeAmount: number = 0;
  user: any;
  cart: any[];
  schoolData: any;
  settings: any;
  cancellationInsurance: any;
  boukiiCarePrice: any;
  tva: any;
  loading = true;
  conditionsAccepted = false;
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
  conditionsHTML: string = "<h1>Conditions générales École Suisse de ski</h1>\n" +
    "\n" +
    "<h2>1. Intervenants</h2>\n" +
    "L’ESS Charmey s’engage à certifier que tous ses moniteurs sont aptes et compétents pour exercer l’enseignement du ski ou autres disciplines assimilées. Tous les moniteurs de l’ESS Charmey ont suivi une formation validée par Swiss Snowsports, Jeunesse et Sport et/ou par l’École Suisse de Ski de Charmey.&nbsp;Toute autre formation équivalente peut être prise en compte lors de l’admission d’un nouveau collaborateur.<br>\n" +
    "&nbsp;\n" +
    "<h2>2. Tarifs</h2>\n" +
    "Les tarifs de l’ESS Charmey sont affichés sur notre site internet, sur les confirmations de réservation ainsi que sur les divers documents de communication de l’école de ski.<br>\n" +
    "Les tarifs indiqués comprennent la prestation d’enseignement dispensée par les moniteurs de l’ESS Charmey et excluent toute autre prestation (assurance, forfait remontées mécaniques, matériel, transport et repas sauf prestations mentionnées).<br>\n" +
    "&nbsp;\n" +
    "<h2>3. Paiement</h2>\n" +
    "Les leçons sont encaissées à la réservation.<br>\n" +
    "Vous avez la possibilité d’effectuer le paiement grâce aux différents moyens cités ci-dessous :\n" +
    "<ul>\n" +
    "\t<li>Sur notre site internet : Postcard, Visa, Twint, Mastercard, American Express,</li>\n" +
    "\t<li>Sur place :&nbsp;Cartes bancaires (Maestro, Postcard, Visa Mastercard),&nbsp;Espèces,&nbsp;Bon cadeau,&nbsp;Twint</li>\n" +
    "</ul>\n" +
    "&nbsp;\n" +
    "\n" +
    "<h2>4. Conditions spécifiques aux cours</h2>\n" +
    "\n" +
    "<ul>\n" +
    "\t<li>Les cours collectifs ont lieu à partir de 4 participants excepté pour certains cours collectifs spéciaux durant lesquels le nombre de participants minimal peut être abaissé.</li>\n" +
    "\t<li>Si le nombre d’élèves est jugé insuffisant pour organiser un cours collectif, celui-ci&nbsp;peut être annulé. Dans ce cas, les participants seront avertis individuellement.</li>\n" +
    "\t<li>La durée du cours comprend les déplacements et attentes aux remontées mécaniques. Le moniteur n’est pas tenu d’attendre les retardataires au départ des cours collectifs.</li>\n" +
    "\t<li>Les cours collectifs sont dispensés en français.</li>\n" +
    "\t<li>En cours particulier, le moniteur parlera la langue souhaitée par l’élève dans la mesure de nos disponibilités.</li>\n" +
    "</ul>\n" +
    "&nbsp;\n" +
    "\n" +
    "<h2>5. Annulation ou interruption du fait de l’ESS Charmey</h2>\n" +
    "L’ESS Charmey se réserve le droit de reporter ou d’annuler un ou plusieurs cours aux conditions suivantes :\n" +
    "\n" +
    "<ul>\n" +
    "\t<li>Conditions météorologiques exceptionnelles</li>\n" +
    "\t<li>Fermeture du domaine skiable</li>\n" +
    "\t<li>Impossibilité d’accéder à la station par la route</li>\n" +
    "\t<li>Nombre de participants insuffisant pour organiser un cours collectif</li>\n" +
    "\t<li>Dans le cas où l’ESS Charmey n’est plus en mesure de fournir les prestations réservées par le client.</li>\n" +
    "</ul>\n" +
    "Si les conditions ne permettent pas de réaliser les cours à Charmey, ils peuvent être déplacés dans une autre station. Dans ce cas, les clients seront avertis au plus vite et le déplacement est de leur responsabilité.<br>\n" +
    "Si les cours sont annulés, l’ESS Charmey s’engage à reporter les cours annulés, à fournir un bon cadeau ou rembourser les clients.<br>\n" +
    "&nbsp;\n" +
    "<h2>6. Annulation ou interruption du fait du client</h2>\n" +
    "L’inscription au cours n’est valable que pour les dates, horaires et prestations indiquées sur la confirmation de réservation.<br>\n" +
    "En cas d’absence de l’élève au début du cours, le prix de celui-ci ne sera pas remboursé et le cours ne sera pas échangé contre un autre.<br>\n" +
    "Toute demande d’annulation de cours sera prise en considération et remboursée selon conditions ci-dessous. Il est recommandé de souscrire à l'option remboursement lors de l’achat de vos cours (détail ci-dessous).\n" +
    "<ul>\n" +
    "\t<li>Plus de 48 heures avant le cours : déplacement ou annulation sans frais</li>\n" +
    "\t<li>Moins de 48 heures avant le cours : déplacement ou annulation seulement avec l'option remboursement.</li>\n" +
    "</ul>\n" +
    "En cas de maladie ou accident, le client s’engage à avertir de l’absence dès que possible, au plus tard 1 heure avant le début du cours.<br>\n" +
    "&nbsp;\n" +
    "<h2>7. Responsabilité</h2>\n" +
    "L’ESS Charmey décline toute responsabilité en cas d’accident. Chaque participant doit être au bénéfice de sa propre assurance accident. Le port du casque est fortement recommandé durant tous nos cours.<br>\n" +
    "&nbsp;\n" +
    "<h2>8. Droit à l’image</h2>\n" +
    "Le client donne à TéléCharmey SA l’autorisation de publier, d’exposer ou de diffuser la ou les photographies et vidéos prises durant les cours. Cette autorisation vaut pour tout usage (publications, site internet, …).<br>\n" +
    "Si vous ne souhaitez pas donner votre autorisation, prière de nous en avertir.<br>\n" +
    "&nbsp;\n" +
    "<h2>9. Conflits</h2>\n" +
    "Les parties s’efforceront de résoudre à l’amiable les difficultés éventuelles pouvant survenir dans l’exécution du contrat. Si un accord à l’amiable ne pouvait être trouvé, seul le droit suisse serait applicable.<br>\n" +
    "&nbsp;\n" +
    "<h1>Conditions générales de vente</h1>\n" +
    "\n" +
    "<h2>1. Services vendus</h2>\n" +
    "Les présentes conditions générales de vente s’appliquent de plein droit à tout achat de services (cours de ski, snowboard, etc.) par l’intermédiaire de notre site internet et définissent les modalités de notre intervention ainsi que les obligations respectives des parties.<br>\n" +
    "&nbsp;\n" +
    "<h2>2. Commande</h2>\n" +
    "Toute validation de la commande sur notre site et du paiement effectué implique l’adhésion, sans réserve, aux présentes conditions générales.<br>\n" +
    "Toute commande s’effectue au moyen de notre bon de commande en ligne, dûment rempli dans toutes les zones obligatoires (indiquées avec un astérisque). Le défaut de renseignement entraîne la non-validation de la commande.<br>\n" +
    "Les services commandés demeurent la propriété de l’ESS Charmey jusqu’au complet paiement du prix.<br>\n" +
    "&nbsp;\n" +
    "<h2>3. Prix</h2>\n" +
    "Les prix de nos produits sont libellés en CHF. Toutes les commandes sont payables en CHF. La TVA est incluse dans le prix et l’avis de débit de votre organisme payeur attestera votre règlement.<br>\n" +
    "L’ESS Charmey se réserve le droit de modifier ses prix à tout moment sans préavis. Cependant, les prestations seront facturées sur la base des tarifs en vigueur au jour de l’enregistrement des commandes, sous réserve des places disponibles.<br>\n" +
    "En cas de commande depuis un pays autre que la Suisse, si des droits ou taxes locales sont exigibles, le paiement de ces droits et taxes est à la charge du client. À aucun moment l’ESS Charmey ne sera redevable de ces sommes. Toute démarche administrative qui y serait relative est exclusivement effectuée par vos soins.<br>\n" +
    "&nbsp;\n" +
    "<h2>4. Paiement</h2>\n" +
    "Le prix est payable en totalité au moment de la commande, par les moyens de paiement mis en place sur notre site internet (carte bancaire Visa, Mastercard, Postcard, Twint). Les paiements en ligne sont sécurisés par le système de paiement Boukii Pay.<br>\n" +
    "&nbsp;\n" +
    "<h2>5. Disponibilité</h2>\n" +
    "Nos offres de prestations et de prix sont valables tant qu’elles sont visibles sur le site, dans la limite des places disponibles.<br>\n" +
    "En cas d’indisponibilité de prestation après avoir passé votre commande, nous vous en informerons par email ou par téléphone dans les meilleurs délais. Vous pourrez alors demander l’annulation ou le remboursement de votre commande.<br>\n" +
    "&nbsp;\n" +
    "<h2>6. Livraison</h2>\n" +
    "Les prestations commandées (inscriptions) seront prises en compte dès le paiement reçu. L’acheteur sera informé immédiatement en cas de modification majeure.<br>\n" +
    "&nbsp;\n" +
    "<h2>7. Droit de rétractation</h2>\n" +
    "Conformément au droit suisse, toute personne ayant passé une commande sur un site suisse dispose d’un délai de 7 jours [calendaires] pour faire valoir son droit de rétractation. Le délai démarre à compter de la date de validation de votre paiement.<br>\n" +
    "&nbsp;\n" +
    "<h2>8. Protection des données</h2>\n" +
    "Les informations communiquées par le client sont indispensables au traitement de sa commande et seront transmises à l’éditeur pour la mise en service de son abonnement. Le client dispose d’un droit d’accès et de rectification de ces informations en s’adressant à l’éditeur : École Suisse de Ski de Charmey.<br>\n" +
    "Votre adresse mail peut être utilisée à des fins de marketing, ce à quoi vous pouvez à tout moment faire opposition.<br>\n" +
    "&nbsp;\n" +
    "<h2>9. Propriété intellectuelle</h2>\n" +
    "Tous les textes, commentaires et images reproduits sur le site https://www.charmey.ch/ sont réservés au titre des droits d’auteur ainsi qu’au titre de la propriété intellectuelle et pour le monde entier. Toute reproduction totale ou partielle des contenus indiqués est strictement interdite.<br>\n" +
    "&nbsp;\n" +
    "<h2>10. Responsabilité</h2>\n" +
    "Les services proposés sont conformes à la législation suisse en vigueur.<br>\n" +
    "L’ESS Charmey ne saurait être tenue pour responsable de l’inexécution du contrat conclu en cas d’événement de force majeure, de perturbation ou grève totale ou partielle notamment des moyens de transport et/ou moyens de communication, inondation, incendie. L’ESS Charmey pourra rembourser le paiement dans le cas d’annulation par sa faute de prestations tout ou parties qui ne pourraient être reportés à une date ultérieure dans le cas où il n’y a plus de possibilités d’exécution des prestations payées.<br>\n" +
    "&nbsp;\n" +
    "<h2>11. Droit applicable et litiges</h2>\n" +
    "Le présent contrat est soumis à la loi suisse. La langue du présent contrat est la langue française. En cas de litige, les tribunaux suisses seront seuls compétents.<br>\n" +
    "&nbsp;\n" +
    "<h2>12. Modification des conditions générales de vente</h2>\n" +
    "L’École Suisse de Ski de Charmey se réserve la faculté de modifier à tout moment les présentes conditions générales de vente.<br>\n" +
    "Les conditions générales de vente applicables sont celles figurant en ligne au jour de la commande.\n" +
    "<h2>&nbsp;</h2>";

  constructor(private router: Router, public themeService: ThemeService, private schoolService: SchoolService,
    private bookingService: BookingService, private activatedRoute: ActivatedRoute,
    private cartService: CartService, private translateService: TranslateService,
    private crudService: ApiCrudService, private snackBar: MatSnackBar,
    private discountCodeService: DiscountCodeService) { }

  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.settings = typeof data.data.settings === 'string' ? JSON.parse(data.data.settings) : data.data.settings;

          this.cancellationInsurance = parseFloat(this.settings?.taxes?.cancellation_insurance_percent);
    // BOUKII CARE DESACTIVADO -           this.boukiiCarePrice = parseInt(this.settings?.taxes?.boukii_care_price);
          this.tva = parseFloat(this.settings?.taxes?.tva);
          this.hasTva = this.tva && !isNaN(this.tva) || this.tva > 0

          this.activatedRoute.queryParams.subscribe(params => {
            const status = params['status'];

            if (status === 'success') {
              // Mostrar snackbar de éxito
              this.snackBar.open(this.translateService.instant('Booking completed successfully!'), 'Close', {
                duration: 3000, // Duración del snackbar en milisegundos
              });

              // Limpiar el carrito
              this.cartService.carData.next(null);
              localStorage.removeItem(this.schoolData?.slug + '-cart'); // Limpiar el carrito del local storage

            } else if (status === 'cancel' || status === 'failed') {
              // Mostrar snackbar de error
              this.snackBar.open(this.translateService.instant('Payment error: Booking could not be completed'), 'Close', {
                duration: 3000,
              });
            }
          });
          let storageSlug = localStorage.getItem(this.schoolData.slug + '-boukiiUser');
          if (storageSlug) {
            this.user = JSON.parse(storageSlug);
            this.cart = this.transformCartToArray(JSON.parse(localStorage.getItem(this.schoolData.slug + '-cart') ?? '{}'));
          }
          this.loading = false;
          this.updateTotal();
        }
      }
    );
  }

  isNanValue(value: any) {
    return isNaN(value);
  }

  sendBooking() {
    this.loading = true;

    const extras: any[] = [];

    this.getExtras().forEach((element: any) => {
      extras.push({
        name: element.id,
        quantity: 1,
        price: element.price + ((element.price * element.tva) / 100)
      });
    });

    const discountInfo = this.appliedDiscountCode?.discount_code || null;
    const discountAmount = this.discountCodeAmount || 0;
    const grossPriceTotal = this.totalPrice + this.usedVoucherAmount + discountAmount;

    const basket: any = {
      payment_method_id: 2,
      price_base: { name: 'Price Base', quantity: 1, price: this.getBasePrice() },
      bonus: {
        total: this.usedVoucherAmount,
        bonuses: this.vouchers.map(voucher => ({
          name: voucher.code,
          quantity: 1,
          price: -parseFloat(voucher.reducePrice)
        }))
      },
      cancellation_insurance: { name: 'Cancellation Insurance', quantity: 1, price: this.hasInsurance ? this.getInsurancePrice() : 0 },
      extras: { total: this.getExtras().length, extras },
      tva: { name: 'TVA', quantity: 1, price: (this.tva && !isNaN(this.tva)) || this.tva > 0 ? this.totalNotaxes * this.tva : 0 },
      price_total: this.totalPrice,
      paid_total: 0,
      pending_amount: this.totalPrice,
      redirectUrl: location.origin + location.pathname.replace('cart', 'user')
    };

    if (discountInfo) {
      basket.discount_code = {
        code: discountInfo.code,
        amount: discountAmount
      };
    }

    const bookingData = {
      school_id: this.schoolData.id,
      client_main_id: this.user.clients[0].id,
      price_total: grossPriceTotal,
      has_cancellation_insurance: this.hasInsurance,
      price_cancellation_insurance: this.hasInsurance ? this.getInsurancePrice() : 0,
      has_tva: this.hasTva,
      price_tva: this.hasTva ? this.totalNotaxes * this.tva : 0,
      cart: this.getCleanedCartDetails(),
      vouchers: this.vouchers,
      voucherAmount: this.usedVoucherAmount,
      discount_code_id: discountInfo?.id ?? null,
      discount_code_amount: discountAmount,
      source: 'web',
      basket: JSON.stringify(basket),
      status: 3
    };

    this.bookingService.setBookingData(bookingData);

    this.bookingService.createBooking(bookingData).subscribe(
      (response: any) => {
        if (this.totalPrice > 0) {
          this.crudService.post('/slug/bookings/payments/' + response.booking_id, basket)
            .subscribe((result: any) => {
              window.open(result.data, '_self');
            });
        } else {
          window.location.href = window.location.origin + window.location.pathname + '?status=success';
        }
      },
      error => {
        console.error('Error al crear la reserva', error);
        this.loading = false;
      }
    );
  }

  getCleanedCartDetails() {
    // Clonar y limpiar cada ítem del carrito
    return this.cart.map(cartItem => {
      // Clonar cada detalle y eliminar propiedades no deseadas
      const cleanedDetails = cartItem.details.map((detail: any) => {
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
    if (voucher) {
      // Check if voucher is already added
      const isVoucherAlreadyAdded = this.vouchers.some(v => v.id === voucher.id);

      if (!isVoucherAlreadyAdded) {
        // Calculate remaining total after previous vouchers
        const remainingTotal = this.calculateRemainingTotal();
        const amountToUse = Math.min(voucher.remaining_balance, remainingTotal);
        voucher.reducePrice = amountToUse; // Asignar cuánto del voucher se usará
        voucher.remaining_balance -= amountToUse; // Asignar cuánto del voucher se usará
        this.vouchers.push(voucher);
        this.updateTotal();
      } else {
        // Show error that voucher is already added
        this.snackBar.open(
          this.translateService.instant('Voucher already added'),
          'Close',
          { duration: 3000 }
        );
      }
    }
    this.isModalVoucher = false;
  }

  calculateRemainingTotal(): number {
    let basePrice = this.getBasePrice();
    let insurancePrice = this.hasInsurance ? this.getInsurancePrice() : 0;
    let boukiiCarePrice = this.hasBoukiiCare ? this.getBoukiiCarePrice() : 0;
    let extrasPrice = this.getExtrasPrice();
    let totalPriceNoTaxes = basePrice + extrasPrice + insurancePrice + boukiiCarePrice;

    // Subtract already used voucher amounts
    const usedVoucherTotal = this.vouchers.reduce((total, voucher) =>
      total + parseFloat(voucher.reducePrice), 0);

    return totalPriceNoTaxes - usedVoucherTotal;
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

  // Resolve client's degree_id for a given sport, handling multiple shapes
  getClientDegreeId(client: any, sportId: number): number {
    try {
      if (!client || !sportId) return 0;

      // If client has client_sports array
      if (Array.isArray(client.client_sports) && client.client_sports.length) {
        const entry = client.client_sports.find((cs: any) => (cs?.sport_id ?? cs?.id) === sportId);
        return entry?.degree_id || entry?.degree?.id || 0;
      }

      // If client has a generic sports array with pivot
      if (Array.isArray(client.sports) && client.sports.length) {
        const entry = client.sports.find((s: any) => (s?.sport_id ?? s?.id) === sportId);
        return entry?.pivot?.degree_id || entry?.degree_id || entry?.degree?.id || 0;
      }

      return 0;
    } catch {
      return 0;
    }
  }

  getInsurancePrice() {
    return (this.getBasePrice() + this.getExtrasPrice()) * this.cancellationInsurance;
  }

  getExtrasPrice() {
    let ret = 0;
    if (this.cart) {
      this.cart.forEach((cart: any) => {
        cart.details.forEach((detail: any) => {
          if (detail.extra && detail.extra.price) {
            ret = ret + parseFloat(detail.extra.price) + (parseFloat(detail.extra.price) * (parseFloat(detail.extra.tva) / 100))
          }
        });
      });
    }
    return ret;
  }

  getExtras() {
    let ret: any = [];
    this.cart.forEach((cart: any) => {
      cart.details.forEach((detail: any) => {
        if (detail.extra && detail.extra.price) {
          ret.push(detail.extra);
        }
      });
    });

    return ret;
  }

  getTotalBasePrice(details: any[]): number {
    return details.reduce((total, detail) => total + parseFloat(detail.course.price), 0) / details.length;
  }

  getTotalItemPrice(details: any[]): number {
    return details.reduce((total, detail) => total + parseFloat(detail.price) + parseFloat(detail?.extra?.price) + (parseFloat(detail?.extra?.price) * (parseFloat(detail?.extra?.tva) / 100)), 0);
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

  removeVoucher(voucherToRemove: any) {
    this.vouchers = this.vouchers.filter(v => v.id !== voucherToRemove.id);
    this.updateTotal();
  }

  getBasePrice() {
    let total = 0;
    this.cart?.forEach(cartItem => {
      if (cartItem.details[0].course.course_type == 1) {
        if (!cartItem.details[0].course.is_flexible) {
          total += parseFloat(cartItem.details[0].course.price);
        } else {
          total += cartItem.details[0].price;
        }
      } else {
        total += this.getTotalBasePrice(cartItem.details);
      }
    });
    return total;
  }

  getTotalCoursesPrice() {
    let total = 0;
    this.cart?.forEach(cartItem => {

      if (cartItem.details[0].course.course_type == 1) {
        if (!cartItem.details[0].course.is_flexible) {
          total += parseFloat(cartItem.details[0].course.price) + this.getTotalItemExtraPrice(cartItem.details);
        } else {
          //TODO: Revisar con flexible
          total += this.getTotalItemPrice(cartItem.details);
        }
      } else {
        if (cartItem.details[0].course.is_flexible) {
          total += this.getTotalItemPrice(cartItem.details);
        } else {
          //TODO: Revisar sin flexible
        }
      }
    });
    return total;
  }

  updateTotal() {
    let basePrice = this.getBasePrice();
    let insurancePrice = this.hasInsurance ? this.getInsurancePrice() : 0;
    let boukiiCarePrice = this.hasBoukiiCare ? this.getBoukiiCarePrice() : 0;
    let extrasPrice = this.getExtrasPrice();
    let totalPriceNoTaxes = basePrice + extrasPrice + insurancePrice + boukiiCarePrice;

    let totalPrice = this.tva && !isNaN(this.tva) && this.tva > 0
      ? totalPriceNoTaxes * (1 + this.tva)
      : totalPriceNoTaxes;

    let remainingTotal = totalPrice;

    // Primero, ajustar el uso de los vouchers existentes
    for (const voucher of this.vouchers) {
      if (voucher.reducePrice > remainingTotal) {
        // Si el voucher está usando más de lo necesario, reducirlo
        let difference = voucher.reducePrice - remainingTotal;
        voucher.reducePrice -= difference;
        voucher.remaining_balance += difference; // Devolver saldo al voucher
        remainingTotal = 0;
      } else {
        remainingTotal -= voucher.reducePrice;
      }
    }

    // Si aún queda saldo por cubrir, intentar usar más vouchers
    if (remainingTotal > 0) {
      for (const voucher of this.vouchers) {
        if (remainingTotal <= 0) break; // Salir si ya no queda saldo pendiente

        let availableAmount = voucher.remaining_balance;
        if (availableAmount > 0) {
          let amountToUse = Math.min(availableAmount, remainingTotal);
          voucher.reducePrice += amountToUse;
          voucher.remaining_balance -= amountToUse;
          remainingTotal -= amountToUse;
        }
      }
    }

    // Si un voucher tiene `reducePrice` en 0, removerlo
    this.vouchers = this.vouchers.filter(voucher => voucher.reducePrice > 0);

    // Aplicar descuento de código promocional después de vouchers
    if (this.discountCodeAmount > 0) {
      remainingTotal = Math.max(0, remainingTotal - this.discountCodeAmount);
    }

    // Actualizar valores finales
    this.usedVoucherAmount = this.vouchers.reduce((sum, v) => sum + v.reducePrice, 0);
    this.totalPrice = remainingTotal; // Total a pagar despu�s de vouchers y discount code
    this.totalNotaxes = totalPriceNoTaxes;

    const grossTotal = this.totalPrice + this.usedVoucherAmount + this.discountCodeAmount;
    this.bookingService.setBookingData({
      price_total: grossTotal,
      vouchers: this.vouchers,
      discount_code_amount: this.discountCodeAmount,
      discount_code_id: this.appliedDiscountCode?.discount_code?.id ?? null
    });
  }

  getBoukiiCarePrice() {
    let dates = 0;
    let paxes = 0;
    this.cart.forEach(element => {
      dates = dates + element.details.length;
      paxes = paxes + element.userId.split('-').length;
    });

    return dates * paxes * this.boukiiCarePrice;
  }

  goBack(url: string) {
    this.router.navigate(['/' + this.activatedRoute.snapshot.params['slug']]);
  }

  deleteCartItem(cartItem: any) {
    const indexToRemove = this.cart.findIndex(item =>
      item.courseId === cartItem.courseId && item.userId === cartItem.userId
    );

    if (indexToRemove !== -1) {
      this.cart.splice(indexToRemove, 1);
      let cartArray = this.transformArrayToCart(this.cart);
      localStorage.setItem(this.schoolData.slug + '-cart', JSON.stringify(cartArray));

      this.cartService.carData.next(cartArray);
    }
    this.updateTotal();
  }

  getCourseName(course: any) {
    if (!course.translations || course.translations === null) {
      return course.name;
    } else {
      const translations = typeof course.translations === 'string' ?
        JSON.parse(course.translations) : course.translations;
      return translations[this.translateService.currentLang].name || course.name;
    }
  }

  getSportName(sportId: number): string | null {
    const sport = this.schoolData.sports.find((s: any) => s.id === sportId);
    return sport ? sport.name : null;
  }

  // ===== Discount Code Methods =====

  openDiscountModal(): void {
    this.isDiscountCodeModalOpen = true;
  }

  closeDiscountModal(): void {
    this.isDiscountCodeModalOpen = false;
  }

  applyDiscountCode(validationResult: DiscountCodeValidationResponse): void {
    if (validationResult && validationResult.valid) {
      this.appliedDiscountCode = validationResult;
      this.discountCodeAmount = validationResult.discount_amount;

      this.bookingService.setBookingData({
        price_total: this.totalPrice + this.usedVoucherAmount + validationResult.discount_amount,
        vouchers: this.vouchers,
        discount_code_amount: validationResult.discount_amount,
        discount_code_id: validationResult.discount_code?.id ?? null,
        });

      this.updateTotal();

      this.snackBar.open(
        this.translateService.instant('text_code_valid') + ': -CHF ' + validationResult.discount_amount.toFixed(2),
        'Close',
        { duration: 3000 }
      );
    }
  }
  }

  removeDiscountCode(): void {
    this.appliedDiscountCode = null;
    this.discountCodeAmount = 0;

    this.bookingService.setBookingData({
      price_total: this.totalPrice + this.usedVoucherAmount,
      vouchers: this.vouchers,
      discount_code_amount: 0,
      discount_code_id: null,
    });

    this.updateTotal();

    this.snackBar.open(
      this.translateService.instant('text_code_removed'),
      'Close',
      { duration: 2000 }
    );
  }

}
