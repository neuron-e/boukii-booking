import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'vex-user-detail-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class UserDetailDialogComponent {
  @Input() title: string = ""
  @Output() close = new EventEmitter()

}
