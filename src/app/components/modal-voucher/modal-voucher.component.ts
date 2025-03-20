import {Component, OnInit, EventEmitter, Input, Output, SimpleChanges, OnChanges} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { ClientService } from '../../services/client.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import {SchoolService} from '../../services/school.service';

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
export class ModalVoucherComponent implements OnInit, OnChanges  {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Input() voucher: any;
  @Output() onClose = new EventEmitter<any>();
  bonuses: any[];
  code: string;
  bonus: any;

  constructor(public themeService: ThemeService, private clientService: ClientService,
              private crudService: ApiCrudService, private schoolService: SchoolService) { }

  ngOnInit(): void {
    this.bonus = null;
    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          let storageSlug = localStorage.getItem(this.slug + '-boukiiUser');
          if (storageSlug) {
            let userLogged = JSON.parse(storageSlug);
            this.crudService.list('/vouchers', 1, 10000, 'desc', 'id', '&school_id=' + data.data.id
              + '&client_id=' + userLogged.clients[0].id + '&payed=0')
              .subscribe((res) => {
                this.bonuses = res.data;
              })
          }
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      console.log('El modal se ha abierto');
      this.bonus = null;
    }
  }

  searchVoucher() {
    let storageSlug = localStorage.getItem(this.slug + '-boukiiUser');
    if (storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.getClientVoucher(this.code, userLogged.clients[0].id).subscribe(res => {
        this.bonuses = [...res.data];
      }, error => {      })
    }

  }

  confirmSelection() {
    if (this.bonus) {
      this.onClose.emit(this.bonus);
    }
  }

  closeModal() {
    this.onClose.emit();
  }
  isInUse(id: number) {
    let inUse = id == this.voucher?.id;
    //this.defaults.appliedBonus.forEach(element => {
    //  if (element.bonus.id === id) {
    //    inUse = true;
    //  }
    //});

    return inUse;
  }
}
