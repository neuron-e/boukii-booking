import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-select',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class ComponenteSelectComponent implements OnInit {
  @Input() control!: string;
  @Input() value!: string | number;
  @Input() label!: string;
  @Input() type: "number" | "text" | "tel" | "email" = "text";
  @Input() form!: FormGroup;
  @Input() required: boolean = false;
  @Input() readonly: boolean = false;

  @Input() table!: any;
  @Input() id!: string;
  @Input() name!: string;
  @Input() name2!: string;
  @Input() suffix: string = "";

  @Output() do = new EventEmitter();

  ngOnInit(): void {
    if (this.form && this.control) {
      this.required = this.form.get(this.control)?.hasValidator(Validators.required) || false;
    }
  }

  emit(event:any) {
    console.log(event)
    this.do.emit(event);
  }

  displayFn = (value: any): string => {
    const selectedItem = this.table.find((a: any) => a[this.id] === value);
    if (!selectedItem) return value + this.suffix;
    const displayValue = this.name2
      ? `${selectedItem[this.name]} ${selectedItem[this.name2]}`
      : selectedItem[this.name];
    return displayValue + this.suffix;
  };
}
