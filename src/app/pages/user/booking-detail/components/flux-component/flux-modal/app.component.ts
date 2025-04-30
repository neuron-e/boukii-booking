import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vex-flux-modal',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class FluxModalComponent {
  ShowCard: boolean = false
  @Output() Close = new EventEmitter();
  @Input() width: number = 670
  @Input() title: string = ""
}


