import {Component, Inject, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: "booking-form-details-colective-fix",
  templateUrl: "./form-details-colective-fix.component.html",
  styleUrls: ["./form-details-colective-fix.component.scss"],
})
export class FormDetailsColectiveFixComponent implements OnInit {
  @Input() course: any;
  @Input() utilizer: any;
  @Input() sportLevel: any;
  @Input() initialData: any;
  @Input() stepForm: FormGroup;
  @Input() selectedForm: FormGroup;
  possibleExtras;
  selectedExtras = [];
  totalExtrasPrice: string = "0 CHF"; // Muestra el precio total de los extras
  user: any;

  constructor(private fb: FormBuilder,   @Inject(MAT_DIALOG_DATA) public data: any,
              private dialogRef: MatDialogRef<FormDetailsColectiveFixComponent>) {
    this.course = data.course;
    this.utilizer = data.utilizer;
    this.sportLevel = data.sportLevel;
    this.initialData = data.initialData;
    this.stepForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.user = this.getStoredUser();
    this.initializeForm();
  }

  initializeForm() {
    this.possibleExtras = this.filterEnabledCourseExtras();
    // Obtener el FormArray existente
    const existingCourseDatesArray = this.stepForm.get('course_dates') as FormArray;
    this.selectedExtras = this.initialData?.[0]?.extras || [];
    // Si no existe el FormArray, lo inicializamos
    if (!existingCourseDatesArray) {
      const courseDatesArray = this.fb.array(
        this.course.course_dates.map((date, index) => {
          // Si hay datos iniciales, usamos esos datos para restaurar los valores seleccionados
          const initialExtras = this.initialData?.[index]?.extras || [];
          return this.createCourseDateGroup(date, initialExtras);
        }),
      );
      // Añadir el FormArray al formulario del padre
      this.stepForm.addControl('course_dates', courseDatesArray);
      if(this.selectedExtras && this.selectedExtras.length) {
        this.updateExtrasInForm();
      }
    }
  }

  createCourseDateGroup(courseDate: any, extras: any[] = []): FormGroup {
    const monitor = this.findMonitor(courseDate);
    return this.fb.group({
      selected: [true],
      date: [courseDate.date],
      startHour: [courseDate.hour_start],
      endHour: [courseDate.hour_end],
      price: null,
      currency: null,
      extras: [{ value: extras, disabled: !this.possibleExtras || !this.possibleExtras.length }] ,
      monitor: [monitor]
    });
  }

  findMonitor(courseDate: any): any {
    // Filtra los grupos que coinciden con el `degree_id` de this.sportLevel
    const matchingGroup = courseDate.course_groups.find(group => group.degree_id === this.sportLevel.id);

    if (matchingGroup) {
      // Busca el subgrupo que tiene menos participantes que el máximo permitido
      const availableSubgroup = matchingGroup.course_subgroups.find(subgroup =>
        subgroup.booking_users.length < subgroup.max_participants
      );

      // Retorna el monitor si lo encuentra
      return availableSubgroup?.monitor || null;
    }
  }

  onExtraChange(event: any) {
    this.selectedExtras = event.value; // Actualiza los extras seleccionados
    this.updateExtrasInForm();
  }

  updateExtrasInForm() {
    this.totalExtrasPrice = this.selectedExtras.reduce((acc, extra) => acc + parseFloat(extra.price || '0'), 0).toFixed(2) + ' ' + this.course.currency;

    const courseDatesArray = this.stepForm.get('course_dates') as FormArray;
    courseDatesArray.controls.forEach(group => {
      group.get('extras')?.setValue(this.selectedExtras);
    });
  }

  submitForm() {
    if (this.stepForm.valid) {
      // Cerrar el diálogo pasando los valores del formulario
      this.dialogRef.close(this.stepForm.value);

    }
  }
  isFormValid() {
    return this.stepForm.valid;
  }
  cancel() {
    this.dialogRef.close();
  }

  private getStoredUser(): any {
    try {
      const serializedUser = localStorage.getItem("boukiiUser");
      return serializedUser ? JSON.parse(serializedUser) : null;
    } catch {
      return null;
    }
  }

  private filterEnabledCourseExtras(): any[] {
    const courseExtras = Array.isArray(this.course?.course_extras) ? this.course.course_extras : [];
    if (!courseExtras.length) {
      return [];
    }
    const allowedKeys = this.getEnabledExtrasKeySet();

    if (!allowedKeys || !allowedKeys.size) {
      return courseExtras.filter(extra => extra?.status !== false);
    }

    return courseExtras.filter(extra => {
      const key = this.normalizeExtraKey(extra);
      if (!key) {
        return extra?.status !== false;
      }
      return allowedKeys.has(key);
    });
  }

  private getEnabledExtrasKeySet(): Set<string> | null {
    const settings = this.getSchoolSettings();
    const extras = settings?.extras;
    if (!extras) {
      return null;
    }
    const buckets = [extras.forfait, extras.food, extras.transport];
    const enabledItems = buckets
      .filter(bucket => Array.isArray(bucket))
      .flatMap(bucket => bucket as any[])
      .filter(item => item && item.status !== false);

    if (!enabledItems.length) {
      return new Set<string>();
    }

    return new Set(
      enabledItems
        .map(item => this.normalizeExtraKey(item))
        .filter((key): key is string => !!key)
    );
  }

  private getSchoolSettings(): any {
    const school = this.user?.schools?.[0];
    if (!school) {
      return null;
    }
    if (!school.settings) {
      return null;
    }
    return typeof school.settings === 'string' ? JSON.parse(school.settings) : school.settings;
  }

  private normalizeExtraKey(extra: any): string {
    if (!extra) {
      return '';
    }
    if (extra.id != null) {
      return String(extra.id);
    }
    if (extra.product != null) {
      return String(extra.product);
    }
    if (extra.name) {
      return String(extra.name).toLowerCase();
    }
    return '';
  }
}
