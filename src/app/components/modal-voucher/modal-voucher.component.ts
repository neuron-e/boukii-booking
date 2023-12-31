import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {ClientService} from '../../services/client.service';

@Component({
  selector: 'app-modal-voucher',
  templateUrl: './modal-voucher.component.html',
  styleUrls: ['./modal-voucher.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ]),
  ]
})
export class ModalVoucherComponent implements OnInit {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Output() onClose = new EventEmitter<any>();

  code:string;

  constructor(public themeService: ThemeService, private clientService: ClientService) { }

  ngOnInit(): void {

  }

  searchVoucher() {
    let storageSlug = localStorage.getItem(this.slug+ '-boukiiUser');
    if(storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.getClientVoucher(this.code, userLogged.clients[0].id).subscribe(res => {
        this.onClose.emit(res);
      }, error => {
        console.log(error);
      })
    }

  }

  closeModal() {
    this.onClose.emit();
  }

}
