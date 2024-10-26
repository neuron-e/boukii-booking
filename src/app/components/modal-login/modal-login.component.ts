import {Component, OnInit, EventEmitter, Input, Output, OnDestroy} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SchoolService } from '../../services/school.service';
import {Subscription} from 'rxjs';

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
export class ModalLoginComponent implements OnInit, OnDestroy  {

  @Input() isOpen: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  loginForm: FormGroup;
  mailRecover = '';
  isForgotPass: boolean = false;
  private schoolDataSubscription: Subscription | undefined;

  constructor(public themeService: ThemeService, private fb: FormBuilder, private authService: AuthService,
    private snackbar: MatSnackBar, private translateService: TranslateService, private schoolService: SchoolService) {
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
    }
  }

  sendMail() {
    this.schoolDataSubscription = this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          let schoolData = data;
          if (this.mailRecover) {
            let requestData = {
              email: this.mailRecover,
              type: 2,
              school_id: schoolData.id
            };
            this.authService.sendMailPassword(requestData)
              .then((res: any) => {
                if (res) {
                  this.closeModal();
                  this.snackbar.open(this.translateService.instant('email_send'), 'OK', { duration: 3000 });
                } else {
                  //TODO: cambiar el texto
                  let errorMessage = this.translateService.instant('error.client.register');
                  this.snackbar.open(this.translateService.instant(errorMessage), 'OK', { duration: 3000 });
                }
              })
              .catch(error => {
                this.showErrorSnackbar();
              });
          }
        }
      },
      error => {
        this.showErrorSnackbar();
      }
    );
  }

  private showErrorSnackbar() {
    const errorMessage = this.translateService.instant('error.send_mail');
    this.snackbar.open(errorMessage, 'OK', {  duration: 3000  });
    this.closeModal();
  }


  closeModal() {
    if (this.schoolDataSubscription) {
      this.schoolDataSubscription.unsubscribe(); // Desuscribirse al cerrar el modal
    }
    this.isForgotPass = false;
    this.onClose.emit();
  }

  ngOnDestroy(): void {
    if (this.schoolDataSubscription) {
      this.schoolDataSubscription.unsubscribe(); // Desuscribirse cuando el componente se destruye
    }
  }

}
