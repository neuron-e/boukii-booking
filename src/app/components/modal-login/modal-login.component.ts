import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-modal-login',
  templateUrl: './modal-login.component.html',
  styleUrls: ['./modal-login.component.scss'],
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
export class ModalLoginComponent implements OnInit {

  @Input() isOpen: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  loginForm: FormGroup;
  isForgotPass:boolean=false;

  constructor(public themeService: ThemeService, private fb: FormBuilder, private authService: AuthService,
              private snackbar: MatSnackBar, private translateService: TranslateService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value)
        .then((res: any) => {
          if (res) {
            this.closeModal();
          } else {
            let errorMessage = this.translateService.instant('error.client.register');
            this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
          }
        })
        .catch(error => {
          let errorMessage = this.translateService.instant(error.error.message) || 'error.client.register';
          this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
        });
      console.log(this.loginForm.value);
    }
  }


  closeModal() {
    this.isForgotPass=false;
    this.onClose.emit();
  }

}
