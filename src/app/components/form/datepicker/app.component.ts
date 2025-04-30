import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-form-datepicker',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ComponenteComponent implements OnInit {
  @Input() control!: string
  @Input() value: Date = new Date()
  @Input() name!: string
  @Input() form!: FormGroup
  @Input() required: boolean = false
  @Input() startAt: Date = new Date()
  @Input() min: Date = new Date(1900, 1, 1)
  @Input() max: Date = new Date(2099, 12, 31);
  @Output() do = new EventEmitter()

  get c(): { [key: string]: AbstractControl } { return this.form.controls; }

  ngOnInit(): void {
    const offset = new Date(this.value).getTimezoneOffset();
    this.value = new Date(new Date(this.value).getTime() - offset * 60 * 1000);
    if (this.form && this.control) {
      this.required = this.form.get(this.control)?.hasValidator(Validators.required) || false
    }
  }

  constructor(private dateAdapter: DateAdapter<Date>, private TranslateService: TranslateService) {
    dateAdapter.getFirstDayOfWeek = () => 1
    this.dateAdapter.getFirstDayOfWeek = () => 1
    this.dateAdapter.setLocale('es-ES');
    dateAdapter.setLocale('es-ES');
  }

  getErrorMessage(controlName: string): string {
    const control = this.c[controlName];
    if (control.errors) {
      for (const errorKey in control.errors) {
        if (control.errors.hasOwnProperty(errorKey)) {
          const params = control.errors[errorKey];
          return this.TranslateService.instant(`errors.${errorKey}`, params);
        }
      }
    }
    return '';
  }
  getLocalISOString(event: any) {
    let date = event
    const offset = date.value.getTimezoneOffset();
    date.value = new Date(date.value.getTime() - offset * 60 * 1000).toISOString();
    this.value = date.value;
    this.do.emit(date);
  }
}
