import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { ClientService } from '../../services/client.service';
import {ApiCrudService} from '../../services/crud.service';

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
  @Input() schoolData: any;
  @Input() appliedBonus:any = [];
  @Output() onClose = new EventEmitter<any>();

  code: string;

  @Input() bonuses: any;
  bonus: any;

  constructor(public themeService: ThemeService, private clientService: ClientService,
              private crudService: ApiCrudService) { }

  ngOnInit(): void {

  }

  searchVoucher() {
/*    let storageSlug = localStorage.getItem(this.schoolData.slug + '-boukiiUser');
    if (storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.getClientVoucher(this.code, userLogged.clients[0].id).subscribe(res => {
        this.onClose.emit(res);
      }, error => {
        console.log(error);
      })
    }*/
    let storageSlug = localStorage.getItem(this.schoolData.slug + '-boukiiUser');
    if (storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.crudService.list('/vouchers', 1, 10000, 'desc', 'id', '&school_id=' +
        this.schoolData.id + '&client_id=' + userLogged.clients[0].id + '&payed=0')
        .subscribe((data: any) => {
          this.bonuses = data.data;
        })
    }

  }

  isInUse(id: number) {
    let inUse = false;
    this.appliedBonus.forEach((element: any) => {
      if (element.id === id) {
        inUse = true;
      }
    });

    return inUse;
  }

  closeModal() {
    this.appliedBonus = [this.bonus];

    this.onClose.emit(this.bonus);
  }

}
