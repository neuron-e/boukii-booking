import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  isModalVoucher:boolean=false;
  isModalConditions:boolean=false;

  conditionsHTML:string = "Inscriptions / Réservations / Responsabilités<br><br>• Les inscriptions aux cours s’effectuent soit par le site internet, par téléphone ou directement sur place auprès de nos bureaux.<br><br>• Si votre séjour se déroule durant les périodes de vacances scolaires, nous vous conseillons de réserver vos cours au minimum un mois à l’avance.<br><br>• En cas de manque de neige, les cours collectifs de Noël, Nouvel-An, Jeunesse et Lève-tôt, seront déplacés aux Diablerets ou dans une station Magic Pass la plus proche.<br><br>• Le paiement total de nos prestations en cours collectifs/privés est dû au moment de votre réservation, il valide votre inscription.";

  constructor(private router: Router, public themeService: ThemeService) { }

  ngOnInit(): void {
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  openModalVoucher() {
    this.isModalVoucher = true;
  }

  closeModalVoucher() {
    this.isModalVoucher = false;
  }

  openModalConditions() {
    this.isModalConditions = true;
  }

  closeModalConditions() {
    this.isModalConditions = false;
  }

}
