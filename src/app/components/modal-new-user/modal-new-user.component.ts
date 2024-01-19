import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClientService} from '../../services/client.service';

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

  constructor(public themeService: ThemeService, private fb: FormBuilder, private clientService: ClientService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required], // Nueva confirmación de contraseña
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', Validators.required],
      phone: ['', Validators.required],
      country: ['', Validators.required],
      province: ['', Validators.required],
      language1: ['', Validators.required],
      language2: ['', Validators.required],
      language3: ['', Validators.required],
    }, {
      validators: this.passwordMatchValidator // Validador personalizado para comprobar la coincidencia de contraseñas
    });
  }

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.loginForm && this.loginForm.invalid) {
      return;
    }

    const formData = this.loginForm ? this.loginForm.value : null;
    this.clientService.createClient(formData).subscribe(
      (res) => {
        console.log('Cliente creado exitosamente:', res);
        this.onClose.emit();
      },
      (error) => {
        console.error('Error al crear el cliente:', error);
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

  closeModal() {
    this.onClose.emit();
  }

}
