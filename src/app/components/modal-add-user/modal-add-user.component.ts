import { Component, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ApiCrudService } from '../../services/crud.service';

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
export class ModalAddUserComponent {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Output() onClose = new EventEmitter<void>();
  langs: any[] = [
    { id: 1, lang: "france" },
    { id: 2, lang: "english" },
    { id: 3, lang: "spanish" },
  ]
  addUserForm: FormGroup;
  filteredLanguages: Observable<any[]>;
  selectedLanguages: any = [];
  maxSelection = 6;
  languages = [];

  constructor(public themeService: ThemeService, private clientService: ClientService,
    private authService: AuthService, private fb: FormBuilder, private snackbar: MatSnackBar,
    private translateService: TranslateService, private crudService: ApiCrudService) {
    this.addUserForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', Validators.required],
      language1_id: ['', Validators.required]
    })
  }


  onSubmit() {
    if (!this.addUserForm || this.addUserForm.invalid) return;
    const formData = this.addUserForm.value;
    let storageSlug = localStorage.getItem(this.slug + '-boukiiUser');
    if (storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.createUtilizer(formData, userLogged.clients[0].id).subscribe(
        (res) => {
          userLogged.clients[0].utilizers.push(res.data);
          this.authService.user.next(userLogged);
          localStorage.setItem(this.slug + '-boukiiUser', JSON.stringify(userLogged));
          this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
          this.onClose.emit();
        },
        (error) => {
          let errorMessage = this.translateService.instant(error.error.message) || 'error.client.register';
          this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
        }
      );
    }
    this.closeModal()
  }

  closeModal() {
    this.onClose.emit();
  }

  displayFn(d: any): string {
    const langs: any[] = [
      { id: 1, lang: "france" },
      { id: 2, lang: "english" },
      { id: 3, lang: "spanish" },
    ]
    if (d) return langs.find((a: any) => a.id == d).lang
    return ''
  }
}
