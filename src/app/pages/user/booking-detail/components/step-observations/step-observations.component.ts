import {Component, OnInit, Output, EventEmitter, Input, Inject} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: "booking-step-observations",
  templateUrl: "./step-observations.component.html",
  styleUrls: ["./step-observations.component.scss"],
})
export class StepObservationsComponent implements OnInit {
  @Input() initialData: any;
  @Output() stepCompleted = new EventEmitter<FormGroup>();
  @Output() prevStep = new EventEmitter();
  stepForm: FormGroup;

  constructor(private fb: FormBuilder,  @Inject(MAT_DIALOG_DATA) public data: any,
              private dialogRef: MatDialogRef<StepObservationsComponent>) {
    this.initialData = data.initialData;
  }

  ngOnInit(): void {
    this.stepForm = this.fb.group({
      clientObs: [this.initialData ? this.initialData.clientObs : ''],
      schoolObs: [this.initialData ? this.initialData.schoolObs : ''],
    });
  }

  isFormValid() {
    return this.stepForm.valid;
  }

  handlePrevStep() {
    this.prevStep.emit();
  }

  completeStep() {
    if (this.isFormValid()) {
      this.stepCompleted.emit(this.stepForm);
    }
  }

  submitForm() {
    if (this.stepForm.valid) {
      // Cerrar el diálogo pasando los valores del formulario
      this.dialogRef.close(this.stepForm.value);
    }
  }
  cancel() {
    this.dialogRef.close();
  }
}
