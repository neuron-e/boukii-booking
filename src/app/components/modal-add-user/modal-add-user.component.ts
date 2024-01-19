import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {ClientService} from '../../services/client.service';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-modal-add-user',
  templateUrl: './modal-add-user.component.html',
  styleUrls: ['./modal-add-user.component.scss'],
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
export class ModalAddUserComponent implements OnInit {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Output() onClose = new EventEmitter<void>();

  firstName: string = '';
  lastName: string = '';
  birthDate: string = '';
  language: string = '1';

  constructor(public themeService: ThemeService, private clientService: ClientService,
              private authService: AuthService) { }

  ngOnInit(): void {
  }

  closeModal() {
    const utilizerData = {
      name: this.firstName,
      last_name: this.lastName,
      birth_date: this.birthDate,
      language1_id: this.language,
    };

    // Obtener el ID del cliente principal de donde sea necesario
    let storageSlug = localStorage.getItem(this.slug+ '-boukiiUser');
    if(storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.createUtilizer(utilizerData, userLogged.clients[0].id).subscribe(
        (res) => {
          userLogged.clients[0].utilizers.push(utilizerData);

          this.authService.user.next(userLogged);

          // Actualiza el objeto completo del usuario en localStorage.
          localStorage.setItem(this.slug + '-boukiiUser', JSON.stringify(userLogged));

          this.onClose.emit();
        },
        (error) => {
          console.log(error);
        }
      );
    }



  }

}
