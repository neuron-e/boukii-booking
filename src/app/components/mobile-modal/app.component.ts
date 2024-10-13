import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-modal',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class MobileModalComponent {
  @Input() title: string = ""
  @Output() Close = new EventEmitter()
}
