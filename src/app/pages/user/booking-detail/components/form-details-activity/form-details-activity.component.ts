import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import * as moment from 'moment';
import {ApiCrudService} from '../../../../../services/crud.service';
import {UtilsService} from '../../../../../services/utils.service';


@Component({
  selector: 'booking-form-details-activity',
  templateUrl: './form-details-activity.component.html',
  styleUrls: ['./form-details-activity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    MatNativeDateModule,
    TranslateModule
  ]
})
export class FormDetailsActivityComponent implements OnInit {
  @Input() course: any;
  @Input() date: any;
  @Input() utilizers: any;
  @Input() sportLevel: any;
  @Input() initialData: any;
  @Output() stepCompleted = new EventEmitter<FormGroup>();
  @Output() prevStep = new EventEmitter();
  @Input() stepForm: FormGroup; // Recibe el formulario desde el padre
  @Input() addParticipantEvent!: boolean; // Recibe el evento como Input
  @Input() removeDateEvent!: boolean; // Recibe el evento como Input
  possibleHours;
  possibleMonitors;
  possibleExtras;
  possibleChangeMonitorSelection = [
    {
      description: "select_monitor_free",
      value: "free",
      icon: "done",
      class: "text-green",
    },
    {
      description: "select_monitor_posible",
      value: "posible",
      icon: "warning_amber",
      class: "text-yellow",
    },
    {
      description: "select_monitor_forbidden",
      value: "forbidden",
      icon: "error_outline",
      class: "text-red",
    },
  ];

  user;
  minDate: Date = new Date();
  season: any = [];
  holidays: any = [];
  myHolidayDates = [];
  currentGroups: any[] = []; // Para almacenar el grupo actual de cada ├¡ndice
  filteredExtras: any[][] = []; // Para almacenar extras filtrados por ├¡ndice


  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    public translateService: TranslateService,
    private crudService: ApiCrudService,
    public utilService: UtilsService
  ) {
    this.possibleMonitors = [];
  }

  ngOnChanges() {
    // Reacciona cuando el Input cambia
    if (this.addParticipantEvent) {
      // this.addCourseDate(); // Llamamos a la funci├│n para a├▒adir la fecha
    }
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem("boukiiUser"));
    this.possibleExtras = this.filterEnabledCourseExtras();
    this.getSeason();
    this.initializeForm();
    this.possibleHours = this.utilService.generateCourseHours(
      this.course.hour_min,
      this.course.hour_max,
      this.course.minDuration,
      '5min'
    );
  }

  getSeason() {
    this.utilService.getSeason(this.user.schools[0].id).subscribe((season) => {
      this.season = season;
      this.holidays = this.utilService.getHolidays();
      this.holidays.forEach((element) => {
        this.myHolidayDates.push(moment(element).toDate());
      });
    });
  }

  isRow1Complete(): boolean {
    const dateGroup = this.courseDates.at(0);
    return dateGroup.get('date').valid && dateGroup.get('startHour').valid && dateGroup.get('duration').valid;
  }

  inUseDatesFilter = (d: Date): boolean => {
    return this.utilService.inUseDatesFilter(d, this.myHolidayDates, this.course);
  };

  initializeForm() {
    this.stepForm.addControl('course_dates', this.fb.array([this.createCourseDateGroup()]));
  }

  createCourseDateGroup(initialData: any = null): FormGroup {
    let formattedDate = this.date ? this.date.format('YYYY-MM-DD') : null;
    const courseDateGroup = this.fb.group({
      selected: [initialData ? initialData.selected : true],
      date: [initialData ? initialData.date : formattedDate, Validators.required],
      startHour: [initialData ? initialData.startHour : null, Validators.required],
      endHour: [initialData ? initialData.endHour : null, Validators.required],
      duration: [this.course.duration, Validators.required],
      price: [initialData ? initialData.price : null],
      currency: this.course.currency,
      monitor: [initialData ? initialData.monitor : null],
      changeMonitorOption: [initialData ? initialData.changeMonitorOption : null],
      groups: this.fb.array([this.createGroupForm()])
    });

    this.subscribeToFormChanges(courseDateGroup);
    return courseDateGroup;
  }

  onGroupChange(index: number) {
   // const selectedGroupName = this.formArray.at(index).get('groupName').value;
    /*const selectedGroup = this.course.settings.groups.find(group => group.groupName === selectedGroupName);

    // Actualiza el grupo actual para ese ├¡ndice
    this.currentGroups[index] = selectedGroup;

    // Filtrar los extras para ese grupo
    this.filteredExtras[index] = this.course.course_extras.filter(extra => extra.group === selectedGroupName);
*/  }

  getGroupPrice(groupName: string): number {
    const group = this.course.settings.groups.find(g => g.groupName === groupName);
    return group ? group.price : 0;
  }

  createGroupForm(initialData: any = null): FormGroup {
    return this.fb.group({
      groupName: [initialData ? initialData.groupName : '', Validators.required],
      paxes: [initialData ? initialData.paxes : 1, [Validators.required, Validators.min(1)]],
      pricePerPax: [initialData ? initialData.pricePerPax : 0, Validators.required],
      price: [0], // Aseg├║rate de incluir este campo
      availableExtras: [[]],
      extras: [[]],
      totalExtraPrice: [0], // Campo para almacenar el precio total de extras
      totalPrice: [0] // Campo para almacenar el precio total
    });
  }

  removeGroup(courseIndex: number): void {
    const groupsArray = this.getGroupsArray(courseIndex);
    if (groupsArray.length > 1) {
      groupsArray.removeAt(groupsArray.length - 1); // Elimina el ├║ltimo grupo, por ejemplo.
    }
  }


  addGroup(courseIndex: number): void {
    const groupsArray = this.getGroupsArray(courseIndex);
    groupsArray.push(this.createGroupForm());
  }

  getGroupsArray(courseIndex: number): FormArray {
    return this.stepForm.get('course_dates')['controls'][courseIndex].get('groups') as FormArray;
  }

  // Acceso al form array de course_dates
  get courseDates(): FormArray {
    return this.stepForm.get('course_dates') as FormArray;
  }

  calculateTotalPrice(courseIndex: number) {
    const groupsArray = this.getGroupsArray(courseIndex);
    let totalPrice = 0;

    for (let i = 0; i < groupsArray.length; i++) {
      const group = groupsArray.at(i);
      const paxes = group.get('paxes').value;
      const pricePerPax = group.get('pricePerPax').value;
      const extras = group.get('extras').value;

      let totalExtraPrice = extras.reduce((acc, extra) => acc + extra.price, 0);
      totalPrice += paxes * (pricePerPax + totalExtraPrice);

      group.get('totalExtraPrice').setValue(totalExtraPrice);
    }

    return totalPrice;
  }

  updateGroupPrice(groupIndex: number): void {
    const courseIndex = 0; // Asumiendo que est├ís trabajando con el primer curso (├¡ndice 0)
    const group = this.getGroupsArray(courseIndex).at(groupIndex);

    // Obtener valores necesarios
    const paxes = group.get('paxes').value;
    const pricePerPax = group.get('price').value; // Aseg├║rate de que este campo est├® definido en tu FormGroup
    const extras = group.get('extras').value;

    // Calcular el precio total de los extras
    const totalExtraPrice = extras.reduce((acc, extra) => acc + extra.price, 0);

    // Calcular el precio total
    const totalPrice = paxes * (pricePerPax + totalExtraPrice);

    // Establecer valores en el FormGroup
    group.get('totalExtraPrice').setValue(totalExtraPrice);
    group.get('totalPrice').setValue(totalPrice); // Aseg├║rate de que este campo est├® definido en tu FormGroup
  }


  subscribeToFormChanges(courseDateGroup: FormGroup) {
    courseDateGroup.get('startHour').valueChanges.subscribe(() => {
      this.updateEndHour(courseDateGroup);
      this.getMonitorsAvailable(courseDateGroup);
    });

    courseDateGroup.get('date').valueChanges.subscribe(() => {
      if (courseDateGroup.get('duration').value && courseDateGroup.get('startHour').value) {
        this.getMonitorsAvailable(courseDateGroup);
      }
    });
  }

  calculateTotalExtrasPrice(utilizerGroup: FormGroup) {
    const selectedExtras = utilizerGroup.get('extras').value;
    let totalPrice = 0;
    selectedExtras.forEach((extra) => {
      totalPrice += extra.price;
    });
    utilizerGroup.get('totalExtraPrice').setValue(totalPrice);
  }

  getMonitorsAvailable(dateGroup) {
    const rq = {
      sportId: this.course.sport_id,
      minimumDegreeId: this.sportLevel.id,
      startTime: dateGroup.get('startHour').value,
      endTime: this.utilService.calculateEndHour(dateGroup.get('startHour').value, dateGroup.get('duration').value),
      date: moment(dateGroup.get('date').value).format('YYYY-MM-DD'),
      clientIds: this.utilizers.map((utilizer) => utilizer.id)
    };
    this.crudService.post('/admin/monitors/available', rq).subscribe((data) => {
      this.possibleMonitors = data.data;
      if (data.data.length === 0) {
        this.snackbar.open(
          this.translateService.instant('snackbar.booking.no_match'),
          'OK',
          { duration: 3000 }
        );
      }
    });
  }

  updateEndHour(courseDateGroup: FormGroup) {
    const startHour = courseDateGroup.get('startHour').value;
    const duration = courseDateGroup.get('duration').value;

    if (startHour && duration) {
      const endHour = this.utilService.calculateEndHour(startHour, duration);
      courseDateGroup.get('endHour').setValue(endHour, { emitEvent: false });
    }
  }

  getUtilizersArray(courseIndex: number): FormArray {
    return this.stepForm.get('course_dates').get(courseIndex.toString()).get('groups') as FormArray;
  }

  private filterEnabledCourseExtras(): any[] {
    const courseExtras = Array.isArray(this.course?.course_extras) ? this.course.course_extras : [];
    const allowedKeys = this.getEnabledExtrasKeySet();

    if (!allowedKeys) {
      return courseExtras.filter(extra => extra?.status !== false);
    }

    if (!allowedKeys.size) {
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
