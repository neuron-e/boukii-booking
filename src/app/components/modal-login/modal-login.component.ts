import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';

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

  isForgotPass:boolean=false;

  constructor(public themeService: ThemeService) { }

  ngOnInit(): void {
  }

  closeModal() {
    this.isForgotPass=false;
    this.onClose.emit();
  }

}
