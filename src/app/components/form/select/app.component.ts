import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-select',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ComponenteSelectComponent implements OnInit {
  @Input() control!: string
  @Input() value!: string
  @Input() label!: string
  @Input() type: "number" | "text" | "tel" | "email" = "text"
  @Input() form!: FormGroup
  @Input() required: boolean = false

  @Input() table!: any
  @Input() id!: string
  @Input() name!: string
  @Input() name2!: string


  @Output() do = new EventEmitter()

  ngOnInit(): void {
    if (this.form && this.control) {
      this.required = this.form.get(this.control)?.hasValidator(Validators.required) || false
    }
  }
  
  displayFn = (value: any): string => this.id && this.name && this.name2 ? this.table.find((a: any) => a[this.id] === value)[this.name] + " " + this.table.find((a: any) => a[this.id] === value)[this.name2] : this.id && this.name ? this.table.find((a: any) => a[this.id] === value)[this.name] : value

}
