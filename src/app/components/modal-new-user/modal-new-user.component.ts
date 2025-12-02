import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';

@Component({
  selector: 'app-modal-new-user',
  templateUrl: './modal-new-user.component.html',
  styleUrls: ['./modal-new-user.component.scss'],
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
export class ModalNewUserComponent implements OnInit {

  @Input() isOpen: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() goLogin = new EventEmitter<void>();

  loginForm: FormGroup;
  langs: any[] = [
    { id: 1, lang: "english" },
    { id: 2, lang: "france" },
    { id: 3, lang: "german" },
    { id: 4, lang: "italian" },
    { id: 5, lang: "spanish" },
  ]

  schoolData: any;

  constructor(
    public themeService: ThemeService,
    private fb: FormBuilder,
    private clientService: ClientService,
    private crudService: ApiCrudService,
    private schoolService: SchoolService,
    private snackbar: MatSnackBar,
    public translateService: TranslateService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required], // Nueva confirmación de contraseña
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', [Validators.required, this.ageValidator]], // Validador de edad personalizada
      phone: ['', Validators.required],
      language1_id: [1, Validators.required],
      language2_id: [''],
      accepts_newsletter: [false],
      //language3_id: [''],
    }, {
      validators: this.passwordMatchValidator // Validador personalizado para comprobar la coincidencia de contraseñas
    });
  }

  ngOnInit(): void {
    this.schoolService.getSchoolData().subscribe(data => {
      this.schoolData = data?.data ?? null;
    });
  }

  onSubmit() {
    if (!this.loginForm || this.loginForm.invalid) return;
    const formData = this.loginForm.value;
    this.clientService.createClient(formData).subscribe(
      (resp) => {
        const createdClient = resp?.data;
        const clientId = createdClient?.id;

        if (clientId && this.schoolData?.id !== undefined) {
          const schoolId = this.schoolData.id;
          this.crudService
            .list('/clients-schools', 1, 1, 'desc', 'id', `&client_id=${clientId}&school_id=${schoolId}`)
            .subscribe({
              next: (csRes) => {
                const relation = csRes?.data?.[0];
                if (relation && 'id' in relation) {
                  this.crudService
                    .update('/clients-schools', { accepts_newsletter: !!formData.accepts_newsletter }, relation.id)
                    .subscribe({
                      next: () => {
                        this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
                        this.onClose.emit();
                      },
                      error: () => {
                        this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
                        this.onClose.emit();
                      }
                    });
                } else {
                  this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
                  this.onClose.emit();
                }
              },
              error: () => {
                this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
                this.onClose.emit();
              }
            });
        } else {
          this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
          this.onClose.emit();
        }
      },
      (error) => {
        let errorMessage = this.translateService.instant(error.error.message) || 'error.client.register';
        this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
      }
    );
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) return { passwordMismatch: true };
    return null;
  }

  // Validador personalizado para la edad mínima
  private ageValidator(control: AbstractControl): { [key: string]: any } | null {
    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();

    if (
      age < 18 ||
      (age === 18 && (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)))
    ) {
      return { ageInvalid: true }; // Retorna un error si la edad es menor a 18
    }

    return null;
  }

  closeModal() {
    this.onClose.emit();
  }
  displayLang = (d: any): string => {
    if (d === null || d === undefined || !Array.isArray(this.langs)) {
      return '';
    }
    const langId = typeof d === 'object' && d !== null ? d.id : d;
    const lang = this.langs.find((a: any) => a.id === langId);
    if (lang && lang.lang && this.translateService) {
      return this.translateService.instant(lang.lang);
    }
    return '';
  }
}
