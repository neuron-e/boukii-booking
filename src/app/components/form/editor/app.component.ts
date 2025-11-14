import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-form-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularEditorModule,
    MatFormFieldModule,
    TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ComponenteInputComponent implements OnInit {
  @Input() control!: string
  @Input() name!: string
  @Input() value!: string
  @Input() type: "number" | "text" | "date" | "tel" | "email" = "text"
  @Input() form!: FormGroup
  @Input() required: boolean = false
  @Output() do = new EventEmitter()

  get c(): { [key: string]: AbstractControl } { return this.form.controls; }

  constructor(private translateService: TranslateService,) { }

  ngOnInit(): void {
    if (this.form && this.control) {
      this.required = this.form.get(this.control)?.hasValidator(Validators.required) || false
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.c[controlName];
    if (control.errors) {
      for (const errorKey in control.errors) {
        if (control.errors.hasOwnProperty(errorKey)) {
          const params = control.errors[errorKey];
          return this.translateService.instant(`errors.${errorKey}`, params);
        }
      }
    }
    return '';
  }

}
