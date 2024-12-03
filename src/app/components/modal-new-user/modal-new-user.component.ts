import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClientService} from '../../services/client.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';

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

  loginForm: FormGroup;

  constructor(public themeService: ThemeService, private fb: FormBuilder, private clientService: ClientService,
              private snackbar: MatSnackBar, private translateService: TranslateService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required], // Nueva confirmación de contraseña
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', [Validators.required, this.ageValidator]], // Validador de edad personalizada
      phone: ['', Validators.required],
      language1_id: ['', Validators.required],
      language2_id: [''],
      language3_id: [''],
    }, {
      validators: this.passwordMatchValidator // Validador personalizado para comprobar la coincidencia de contraseñas
    });
  }

  ngOnInit(): void {
  }

  onSubmit() {
    if (!this.loginForm || this.loginForm.invalid) {
      return;
    }

    const formData = this.loginForm.value;

    this.clientService.createClient(formData).subscribe(
      (res) => {
        this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });
        this.onClose.emit();
      },
      (error) => {
        let errorMessage = this.translateService.instant(error.error.message) || 'error.client.register';
        this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
      }
    );
  }

  // Validador personalizado para comprobar la coincidencia de contraseñas
  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

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

}
