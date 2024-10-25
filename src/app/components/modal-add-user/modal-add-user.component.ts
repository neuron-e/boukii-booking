import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {ClientService} from '../../services/client.service';
import {AuthService} from '../../services/auth.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {map, Observable, startWith} from 'rxjs';
import {ApiCrudService} from '../../services/crud.service';

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

  languagesControl = new FormControl([]);
  firstName: string = '';
  lastName: string = '';
  birthDate: string = '';
  language: string = '1';

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
      birth_date: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    this.getLanguages();
  }

  getSelectedLanguageNames(): string {
    return this.selectedLanguages.map((language: any) => language.name).join(', ');
  }
  toggleSelectionLanguages(language: any): void {
    if (this.selectedLanguages.length < this.maxSelection) {

      const index = this.selectedLanguages.findIndex((l: any) => l.code === language.code);
      if (index >= 0) {
        this.selectedLanguages.splice(index, 1);
      } else {
        this.selectedLanguages.push({ id: language.id, name: language.name, code: language.code });
      }
    } else {
      this.snackbar.open(this.translateService.instant('snackbar.admin.langs'), 'OK', {duration: 3000});
    }
  }


  getLanguages() {
    this.crudService.list('/languages', 1, 1000)
      .subscribe((data) => {
        this.languages = data.data.reverse();
        this.filteredLanguages = this.languagesControl.valueChanges.pipe(
          startWith(''),
          map(language => (language ? this._filterLanguages(language) : this.languages.slice()))
        );

      })
  }


  private _filterLanguages(value: any): any[] {
    const filterValue = value?.toLowerCase();
    return this.languages.filter((language: any) => language?.name.toLowerCase().includes(filterValue));
  }

  onSubmit() {
    if (!this.addUserForm || this.addUserForm.invalid) {
      return;
    }

    const formData = this.addUserForm.value;
    this.setLanguagesUtilizateur(this.selectedLanguages, formData)

    let storageSlug = localStorage.getItem(this.slug+ '-boukiiUser');
    if(storageSlug) {
      let userLogged = JSON.parse(storageSlug);
      this.clientService.createUtilizer(formData, userLogged.clients[0].id).subscribe(
        (res) => {
          userLogged.clients[0].utilizers.push(res.data);

          this.authService.user.next(userLogged);

          // Actualiza el objeto completo del usuario en localStorage.
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
  }

  setLanguagesUtilizateur(langs: any, dataToModify: any) {
    if (langs.length >= 1) {

      dataToModify.language1_id = langs[0].id;
    } if (langs.length >= 2) {

      dataToModify.language2_id = langs[1].id;
    } if (langs.length >= 3) {

      dataToModify.language3_id = langs[2].id;
    } if (langs.length >= 4) {

      dataToModify.language4_id = langs[3].id;
    } if (langs.length >= 5) {

      dataToModify.language5_id = langs[4].id;
    } if (langs.length === 6) {

      dataToModify.language6_id = langs[5].id;
    }
  }

  closeModal() {
    this.onClose.emit();
  }

}
