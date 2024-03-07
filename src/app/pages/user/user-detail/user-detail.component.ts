import { ChangeDetectorRef, Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTable, _MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Observable, map, startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import { ApiCrudService } from 'src/app/services/crud.service';
import { PasswordService } from 'src/app/services/password.service';
import { MOCK_PROVINCES } from 'src/app/services/province-data';
import { SchoolService } from 'src/app/services/school.service';
import { AddClientUserModalComponent } from '../add-client-user/add-client-user.component';
import { ConfirmModalComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent {

private destroy$: Subject<boolean> = new Subject<boolean>();

@ViewChild('sportsCurrentTable') currentSportsTable: MatTable<any>;

  showInfo = true;
  showPersonalInfo = true;
  showAddressInfo: boolean = true;
  showSportInfo: boolean = true;
  editInfo = false;
  editPersonalInfo = false;
  editAddressInfo: boolean = false;
  editSportInfo: boolean = false;
  countries: any = MOCK_COUNTRIES;
  provinces: any = MOCK_PROVINCES;

  displayedCurrentColumns: string[] = ['name', 'level', 'delete'];
  displayedColumns: string[] = ['name', 'date'];

  imagePreviewUrl: any;
  formInfoAccount: UntypedFormGroup;
  formPersonalInfo: UntypedFormGroup;
  formSportInfo: UntypedFormGroup;
  formOtherInfo: UntypedFormGroup;
  myControlStations = new FormControl();
  myControlCountries = new FormControl();
  myControlProvinces = new FormControl();
  levelForm = new FormControl();

  filteredStations: Observable<any[]>;
  filteredCountries: Observable<any[]>;
  filteredProvinces: Observable<any[]>;
  filteredLevel: Observable<any[]>;
  filteredSports: Observable<any[]>;

  sportsControl = new FormControl();
  selectedNewSports: any[] = [];
  selectedSports: any[] = [];
  sportsData: any = new _MatTableDataSource([]);
  sportsCurrentData: any = new _MatTableDataSource([]);
  stations: any = [];

  languagesControl = new FormControl([]);
  languages: any = [];
  schoolSports: any = [];
  filteredLanguages: Observable<any[]>;
  selectedLanguages: any = [];
  deletedItems = [];
  clientUsers: any = [];
  selectedGoal: any = [];

  today: Date;
  minDate: Date;
  loading = true;
  editing = false;
  coloring = true;
  selectedTabIndex = 0;
  selectedTabPreviewIndex = 0;

  mockCivilStatus: string[] = ['Single', 'Mariée', 'Veuf', 'Divorcé'];

  mainClient: any;
  currentImage: any;
  defaults: any = {
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    birth_date: null,
    phone: null,
    telephone: null,
    address: null,
    cp: null,
    city: null,
    province: null,
    country: null,
    image: null,
    language1_id:null,
    language2_id:null,
    language3_id:null,
    language4_id:null,
    language5_id:null,
    language6_id:null,
    user_id: null,
    station_id: null,
    active_station: null
  }
  @Output() idChange = new EventEmitter<any>();
  @Input() idParent: any;

  defaultsObservations = {
    id: null,
    general: '',
    notes: '',
    historical: '',
    client_id: null,
    school_id: null
  }

  defaultsUser: any = {
    id: null,
    username: null,
    email: null,
    password: null,
    image: null,
    type: 'client',
    active: false,
  }


  groupedByColor = {};
  colorKeys: string[] = []; // Aquí almacenaremos las claves de colores
  user: any;
  id: any;

  allLevels: any = [];
  selectedSport: any;
  clientSport: any = [];
  clients: any = [];
  clientSchool: any = [];
  goals = [];
  mainId: any;
  showDetail: boolean = false;
  detailData: any;
  entity = '/booking-users';
  schoolData: any;

  constructor(private fb: UntypedFormBuilder, private cdr: ChangeDetectorRef, private crudService: ApiCrudService, private router: Router,
     private activatedRoute: ActivatedRoute, private snackbar: MatSnackBar, private dialog: MatDialog, private passwordGen: PasswordService,
     private translateService: TranslateService, private authService: AuthService, private schoolService: SchoolService) {

    this.today = new Date();
    this.minDate = new Date(this.today);
    this.colorKeys = Object.keys(this.groupedByColor);
  }

  ngOnInit(): void {

    this.schoolService.getSchoolData().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;

          if (this.idParent) {
            this.getData(this.idParent);
          }
          else{
            this.getData();
          }
        }
      }
    );
  }

  changeClientData(id: any) {
    this.loading = true;
    this.id = id;
    this.idChange.emit(id);
    //this.getData(id, true);
  }

  changeClientDataB(id: any) {
    this.loading = true;
    this.id = id;
    this.getData(id, true);
  }

  getData(id = null, onChangeUser = false) {

    this.authService.getUserData().pipe(takeUntil(this.destroy$)).subscribe(data => {

    if (data !== null) {
        this.mainId = data.clients[0].id;
        this.mainClient = data;
        const getId = id === null ? this.mainId : id;
        this.id = getId;

      this.crudService.get('/clients/'+ getId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.defaults = data.data;

        this.currentImage = data.data.image;
        /*
        if (!onChangeUser) {
          this.mainClient = data.data;
        }
        */

        this.crudService.get('/users/'+data.data.user_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((user)=> {


            this.getSchoolSportDegrees();
            this.getLanguages();
            this.getStations();
            this.getClientSchool();
            this.getClientSport();
            this.getClients();
            this.getClientObservations();

            if (!onChangeUser) {
              this.getClientUtilisateurs();
            }
            this.defaultsUser = user.data;

            this.formInfoAccount = this.fb.group({
              image: [''],
              name: ['', Validators.required],
              surname: ['', Validators.required],
              email: ['', [Validators.required, Validators.email]],
              username: [''],
              password: [''],

            });

            this.formPersonalInfo = this.fb.group({
              fromDate: [''],
              phone: [''],
              mobile: ['', Validators.required],
              address: [''],
              postalCode: [''],
              lang: [''],
              country: this.myControlCountries,
              province: this.myControlProvinces

            });

            this.formSportInfo = this.fb.group({
              sportName: [''],
            });

            this.formOtherInfo = this.fb.group({
              summary: [''],
              notes: [''],
              hitorical: ['']
            });

            if(!onChangeUser) {

              this.filteredCountries = this.myControlCountries.valueChanges.pipe(
                startWith(''),
                map(value => typeof value === 'string' ? value : value.name),
                map(name => name ? this._filterCountries(name) : this.countries.slice())
              );

              this.myControlCountries.valueChanges.subscribe(country => {
                this.myControlProvinces.setValue('');  // Limpia la selección anterior de la provincia
                this.filteredProvinces = this._filterProvinces(country?.id);
              });

              /*this.filteredLevel = this.levelForm.valueChanges.pipe(
                startWith(''),
                map((value: any) => typeof value === 'string' ? value : value?.annotation),
                map(annotation => annotation ? this._filterLevel(annotation) : this.mockLevelData.slice())
              );*/

              this.filteredLanguages = this.languagesControl.valueChanges.pipe(
                startWith(''),
                map(language => (language ? this._filterLanguages(language) : this.languages.slice()))
              );

            }
            setTimeout(() => {

              this.myControlStations.setValue(this.stations.find((s: any) => s.id === this.defaults.active_station)?.name);
              this.myControlCountries.setValue(this.countries.find((c: any) => c.id === +this.defaults.country));
              this.myControlProvinces.setValue(this.provinces.find((c: any) => c.id === +this.defaults.province));
              this.languagesControl.setValue(this.languages.filter((l: any) => l.id === (this.defaults?.language1_id ||
              this.defaults?.language2_id || this.defaults?.language3_id || this.defaults?.language4_id
              || this.defaults?.language5_id || this.defaults?.language6_id)));

              this.loading = false;

            }, 500);

          })
        })
      }
    })
  }

  getSchoolSportDegrees() {
    this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((sport) => {
        this.schoolSports = sport.data;
        sport.data.forEach((element: any, idx: any) => {
          this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&sport_id='+element.sport_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.schoolSports[idx].degrees = data.data;
          });
        });
      })
  }


  getSports() {
    this.crudService.list('/sports', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data.data.forEach((element: any) => {
          this.schoolSports.forEach((sport: any) => {
            if(element.id === sport.sport_id) {
              sport.name = element.name;
              sport.icon_selected = element.icon_selected;
              sport.icon_unselected = element.icon_unselected;
            }
          });
        });

        this.schoolSports.forEach((element: any) => {

          this.clientSport.forEach((sport: any) => {
            if(element.sport_id === sport.sport_id) {
              sport.name = element.name;
              sport.icon_selected = element.icon_selected;
              sport.icon_unselected = element.icon_unselected;
              sport.degrees = element.degrees;
            }
          });
        });


        this.sportsCurrentData.data = this.clientSport;

        const availableSports: any = [];
        this.schoolSports.forEach((element: any) => {
          if(!this.sportsCurrentData.data.find((s: any) => s.sport_id === element.sport_id)) {
            availableSports.push(element);
          }
        });
        this.filteredSports = this.sportsControl.valueChanges.pipe(
          startWith(''),
          map((sport: string | null) => sport ? this._filterSports(sport) : availableSports.slice())
        );
      })
  }

  getDegrees() {
    this.clientSport.forEach((element: any) => {
      this.crudService.get('/degrees/'+element.degree_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          element.level = data.data;
        })
    });
  }

  getClientObservations() {
    this.crudService.list('/client-observations', 1, 10000, 'desc', 'id', '&client_id='+this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if(data.data.length > 0) {

          this.defaultsObservations = data.data[0];
        } else {
          this.defaultsObservations = {
            id: null,
            general: '',
            notes: '',
            historical: '',
            client_id: null,
            school_id: null
          }
        }
      })
  }

  getClientSchool() {
    this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id='+this.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      this.clientSchool = data.data;

    })
  }

  getClientSport() {
    this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='+this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientSport = data.data;
        this.selectedSport = this.clientSport[0];
        this.getSports();
        this.getDegrees();
      })
  }

  onFileChanged(event: Event) {
    const file: any = (event.target !== null ? event.target as HTMLInputElement : null);
    if (file !== null) {
      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
        this.defaults.image = reader.result;
        this.defaultsUser.image = reader.result;
      };

      reader.readAsDataURL(file);
    }
  }

  passwordValidator(formControl: FormControl) {
    const { value } = formControl;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    if (hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar) {
      return null;
    } else {
      return { passwordStrength: true };
    }
  }

  getStations() {
    this.crudService.list('/stations-schools', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((station) => {
        station.data.forEach((element:any) => {
          this.crudService.get('/stations/'+element.station_id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
              this.stations.push(data.data);

            })
        });
      })
  }


  getLanguages() {
    this.crudService.list('/languages', 1, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.languages = data.data.reverse();
        this.setInitLanguages();
      })
  }

  /**Countries */

  private _filterCountries(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.countries.filter((country: any) => country.name.toLowerCase().includes(filterValue));
  }

  private _filterProvinces(countryId: number): Observable<any[]> {
    return this.myControlProvinces.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value.name),
      map(name => name ? this._filter(name, countryId) : this.provinces.filter((p: any) => p.country_id === countryId).slice())
    );
  }

  private _filter(name: string, countryId: number): any[] {
    const filterValue = name.toLowerCase();
    return this.provinces.filter((province: any) => province.country_id === countryId && province.name.toLowerCase().includes(filterValue));
  }

  private _filterLanguages(value: any): any[] {
    const filterValue = value.toLowerCase();
    return this.languages.filter((language: any) => language?.name.toLowerCase().includes(filterValue));
  }

  private _filterSports(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value?.name?.toLowerCase();
    return this.schoolSports.filter((sport: any) => sport?.name.toLowerCase().indexOf(filterValue) === 0);
  }

  displayFnCountry(country: any): string {
    return country && country.name ? country.name : '';
  }

  displayFnProvince(province: any): string {
    return province && province.name ? province.name : '';
  }

  displayFnLevel(level: any): string {
    return level && level?.name && level?.annotation ? level?.name + ' - ' + level?.annotation : level?.name;
  }

  updateSelectedSports(selected: any[]) {
    this.selectedSports = selected.map(sport => ({
      sportName: sport.name,
      sportId: sport.id,
      level: null
    }));
  }

  toggleSelection(event: any, sport: any): void {

    if (event.isUserInput) {

      const index = this.selectedNewSports.findIndex(s => s.sport_id === sport.sport_id);
      if (index >= 0) {
        this.selectedNewSports.splice(index, 1);
      } else {
        this.selectedNewSports.push(sport);
      }

      // Crear una nueva referencia para el array
      this.selectedNewSports = [...this.selectedNewSports];

      // Actualizar los datos de la tabla
      this.sportsData.data = this.selectedNewSports;

      // Detectar cambios manualmente para asegurarse de que Angular reconozca los cambios
      this.cdr.detectChanges();
    }
  }

  getSelectedSportsNames(): string {
    return this.sportsControl.value?.map((sport: any) => sport.name).join(', ') || '';
  }

  toggleSelectionLanguages(language: any): void {
    const index = this.selectedLanguages.findIndex((l: any) => l.code === language.code);
    if (index >= 0) {
      this.selectedLanguages.splice(index, 1);
    } else {
      this.selectedLanguages.push({ name: language.name, code: language.code, id: language.id });
    }
    console.log(this.selectedLanguages);
  }

  getSelectedLanguageNames(): string {
    return this.selectedLanguages.map((language: any) => language.name).join(', ');
  }

  getClientUtilisateurs() {
    this.crudService.list('/slug/clients/' + this.mainId +'/utilizers', 1, 10000, 'desc', 'id','&client_id='+this.mainId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientUsers = data.data;
        this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id','&main_id='+this.mainId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          data.data.forEach((element: any) => {
            this.clientUsers.forEach((cl: any) => {
              if (element.client_id === cl.id) {
                cl.utilizer_id = element.id;
              }
            });
          });
        })

      })
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  setLanguages() {
    if (this.selectedLanguages.length >= 1) {

      this.defaults.language1_id = this.selectedLanguages[0].id;
    } if (this.selectedLanguages.length >= 2) {

      this.defaults.language2_id = this.selectedLanguages[1].id;
    } if (this.selectedLanguages.length >= 3) {

      this.defaults.language3_id = this.selectedLanguages[2].id;
    } if (this.selectedLanguages.length >= 4) {

      this.defaults.language4_id = this.selectedLanguages[3].id;
    } if (this.selectedLanguages.length >= 5) {

      this.defaults.language5_id = this.selectedLanguages[4].id;
    } if (this.selectedLanguages.length === 6) {

      this.defaults.language6_id = this.selectedLanguages[5].id;
    }
  }

  setInitLanguages() {

    this.languages.forEach((element: any) => {
      if(element.id === this.defaults.language1_id || element.id === this.defaults.language2_id || element.id === this.defaults.language3_id
        || element.id === this.defaults.language4_id || element.id === this.defaults.language5_id || element.id === this.defaults.language6_id) {
          this.selectedLanguages.push(element);
        }
    });
  }

  removeSport(idx: number, element: any) {

    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      maxWidth: '100vw',  // Asegurarse de que no haya un ancho máximo
      panelClass: 'full-screen-dialog',  // Si necesitas estilos adicionales,
      data: {message: 'Do you want to remove this item? This action will be permanetly', title: 'Delete monitor course'}
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      if (data) {

        this.crudService.delete('/client-sports', element.id)
          .subscribe(() => {
            //this.deletedItems.push(this.sportsCurrentData.data[idx]);
            this.sportsCurrentData.data.splice(idx, 1);
            this.currentSportsTable.renderRows();
          })
      }
    });

  }

  updateLevel(clientSport: any, level: any) {
    this.crudService.update('/client-sports', {client_id: clientSport.id, sport_id: clientSport.sport_id, degree_id: level.id, school_id: this.schoolData.id}, clientSport.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.snackbar.open(this.translateService.instant('snackbar.client.level_updated'), 'OK', {duration: 3000});
      })
  }

  setActive(event: any) {
    this.defaultsUser.active = event.checked;
  }

  save() {
    this.setLanguages();

    if (this.currentImage === this.defaults.image) {
      delete this.defaults.image;
      delete this.defaultsUser.image;
    }

    this.crudService.update('/users', this.defaultsUser, this.defaultsUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.defaults.user_id = user.data.id;

        this.crudService.update('/clients', this.defaults, this.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((client) => {
            this.snackbar.open(this.translateService.instant('snackbar.client.update'), 'OK', {duration: 3000});

            this.defaultsObservations.client_id = client.data.id;
            this.defaultsObservations.school_id = this.schoolData.id;
            if (this.defaultsObservations.id) {
              this.crudService.update('/client-observations', this.defaultsObservations, this.defaultsObservations.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe((obs) => {
                console.log('client observation created');
              })

            }

              this.sportsData.data.forEach((element: any) => {

                this.crudService.create('/client-sports', {client_id: client.data.id, sport_id: element.sport_id, degree_id: element.level.id, school_id: this.schoolData.id})
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    console.log('client sport created');
                  })
              });

              this.sportsCurrentData.data.forEach((element: any) => {

                this.crudService.update('/client-sports', {client_id: client.data.id, sport_id: element.sport_id, degree_id: element.level.id, school_id: this.schoolData.id}, element.id)
                  .pipe(takeUntil(this.destroy$))
                  .subscribe(() => {
                    console.log('client sport updated');
                  })
              });

              setTimeout(() => {
                //this.router.navigate(['/clients']);
                this.editing = false;
                this.editSportInfo = false;
                this.sportsData.data = [];
                this.getData(this.id);

              }, 2000);
          })
      })
  }

  onTabChange(event: any) {
    if(event.index === 1) {
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
      this.selectedTabIndex = 0;
      this.selectedTabPreviewIndex = 1;
      this.editing = false;
    }
  }

  selectSportEvo(sport: any) {
    this.coloring = true;
    this.allLevels = [];
    this.selectedGoal = [];
    this.selectedSport = sport;

    this.schoolSports.forEach((element: any) => {
      if (this.selectedSport.sport_id === element.sport_id) {
        this.selectedSport.degrees = element.degrees;
      }
    });

    this.selectedSport.degrees.forEach((element: any) => {
      element.inactive_color = this.lightenColor(element.color, 30);
      this.allLevels.push(element);
    });

    this.allLevels.sort((a: any, b: any) => a.degree_order - b.degree_order);

    this.goals.forEach((element: any) => {
      if (element.degree_id === sport.level.id) {

        this.selectedGoal.push(element);
      }
    });
    this.coloring = false;
  }

  lightenColor(hexColor:any, percent:any) {

    let r:any = parseInt(hexColor.substring(1, 3), 16);
    let g:any = parseInt(hexColor.substring(3, 5), 16);
    let b:any = parseInt(hexColor.substring(5, 7), 16);

    // Increase the lightness
    r = Math.round(r + (255 - r) * percent / 100);
    g = Math.round(g + (255 - g) * percent / 100);
    b = Math.round(b + (255 - b) * percent / 100);

    // Convert RGB back to hex
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return '#' + r + g + b;
  }

  canAddUtilisateur(date: string): boolean {
    const dateBirth = moment(date);
    const today = moment();
    const diff = today.diff(dateBirth, 'years');

    return diff >= 18;
}

  addUtilisateur() {

    if (this.canAddUtilisateur(this.defaults.birth_date)) {
      const dialogRef = this.dialog.open(AddClientUserModalComponent, {
        width: '600px',  // Asegurarse de que no haya un ancho máximo
        panelClass: 'full-screen-dialog',  // Si necesitas estilos adicionales,
        data: {id: this.schoolData.id}
      });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
        if (data) {

          if(data.action === 'add') {
            this.crudService.create('/clients-utilizers', {client_id: data.ret, main_id: parseInt(this.id)})
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              this.getClientUtilisateurs();
            })
          } else {
            const user = {
              username: data.data.name,
              email: this.defaults.email,
              password: this.passwordGen.generateRandomPassword(12),
              image: null,
              type: 'client',
              active: true,
            }

            const client = {
              email: this.defaults.email,
              first_name: data.data.name,
              last_name: data.data.surname,
              birth_date: moment(data.data.fromDate).format('YYYY-MM-DD'),
              phone: this.defaults.phone,
              telephone: this.defaults.telephone,
              address: this.defaults.address,
              cp: this.defaults.cp,
              city: this.defaults.city,
              province: this.defaults.province,
              country: this.defaults.country,
              image: null,
              language1_id:null,
              language2_id:null,
              language3_id:null,
              language4_id:null,
              language5_id:null,
              language6_id:null,
              user_id: null,
              station_id: this.defaults.station_id
            }

            this.setLanguagesUtilizateur(data.data.languages, client);

            this.crudService.create('/users', user)
            .pipe(takeUntil(this.destroy$))
            .subscribe((user) => {
              client.user_id = user.data.id;

              this.crudService.create('/clients', client)
                .pipe(takeUntil(this.destroy$))
                .subscribe((clientCreated) => {
                  this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', {duration: 3000});

                  this.crudService.create('/clients-schools', {client_id: clientCreated.data.id, school_id: this.schoolData.id})
                    .pipe(takeUntil(this.destroy$))
                    .subscribe((clientSchool) => {

                      setTimeout(() => {
                        this.crudService.create('/clients-utilizers', {client_id: clientCreated.data.id, main_id: this.id})
                        .pipe(takeUntil(this.destroy$))
                        .subscribe((res) => {
                          this.getClientUtilisateurs();
                        })}, 1000);
                    });
                })
            })
          }
        }
      });
    } else {
      this.snackbar.open(this.translateService.instant('snackbar.client.no_age'), 'OK', {duration: 3000});
    }

  }

  setLanguagesUtilizateur(langs: any, dataToModify: any) {
    if (langs.length >= 1) {

      dataToModify.language1_id = langs[0].id;
    } if (langs.length >= 2) {

      dataToModify.language2_id = langs[1].id;
    } if (langs.length >= 3) {

      dataToModify.language3_id = langs[2].id;
    } if (langs.length >= 4) {

      dataToModify.language4_id = langs[3].id;
    } if (langs.length >= 5) {

      dataToModify.language5_id = langs[4].id;
    } if (langs.length === 6) {

      dataToModify.language6_id = langs[5].id;
    }
  }

  showInfoEvent(event: boolean) {
    this.showInfo = event;
  }

  showInfoEditEvent(event: boolean) {
    this.editInfo = event;
    this.selectedTabIndex = 0;
    this.selectedTabPreviewIndex = 0;
    this.editing = true;
  }

  showPersonalInfoEvent(event: boolean) {
    this.showPersonalInfo = event;
  }


  showPersonalInfoEditEvent(event: boolean) {
    this.editPersonalInfo = event;
    this.selectedTabIndex = 0;
    this.selectedTabPreviewIndex = 0;
    this.editing = true;
  }

  showAddressInfoEvent(event: boolean) {
    this.showAddressInfo = event;
  }

  showAddressInfoEditEvent(event: boolean) {
    this.editAddressInfo = event;
    this.selectedTabIndex = 1;
    this.selectedTabPreviewIndex = 0;
    this.editing = true;
  }

  showSportInfoEvent(event: boolean) {
    this.showSportInfo = event;
  }

  showSportInfoEditEvent(event: boolean) {
    this.editSportInfo = event;
    this.selectedTabIndex = 2;
    this.selectedTabPreviewIndex = 0;
    this.editing = true;
  }

  getCountry(id: any) {
    const country = this.countries.find((c: any) => c.id == +id);
    return country ? country.name : 'NDF';
  }

  getProvince(id: any) {
    const province = this.provinces.find((c: any) => c.id == +id);
    return province ? province.name : 'NDF';
  }

  calculateAge(birthDateString: any) {
    if(birthDateString && birthDateString !== null) {
      const today = new Date();
      const birthDate = new Date(birthDateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }

      return age;
    } else {
      return 0;
    }

  }

  showDetailEvent(event: any) {

    if (event.showDetail || (!event.showDetail && this.detailData !== null && this.detailData.id !== event.item.id)) {
      this.detailData = event.item;

      this.crudService.get('/slug/courses/'+this.detailData.course_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((course) => {
          this.detailData.course = course.data;
          this.crudService.get('/sports/'+this.detailData.course.sport_id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((sport) => {
            this.detailData.sport = sport.data;
          });

          if (this.detailData.degree_id !== null) {
            this.crudService.get('/degrees/'+this.detailData.degree_id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((degree) => {
              this.detailData.degree = degree.data;
            })
          }

      })

      this.crudService.list('/booking-users', 1, 10000, 'desc', 'id', '&booking_id='+this.detailData.booking.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((booking) => {
          this.detailData.users = [];

          booking.data.forEach((element: any) => {
            if (moment(element.date).format('YYYY-MM-DD') === moment(this.detailData.date).format('YYYY-MM-DD')) {
              this.detailData.users.push(element);

                this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='+element.client_id)
                .pipe(takeUntil(this.destroy$))
                .subscribe((cd) => {

                  if (cd.data.length > 0) {
                    element.sports= [];

                    cd.data.forEach((c: any) => {
                      element.sports.push(c);
                    });
                  }


                })

            }
          });
          this.showDetail = true;

        });


    } else {

      this.showDetail = event.showDetail;
      this.detailData = null;
    }

  }

  getLanguage(id: any) {
    const lang = this.languages.find((c: any) => c.id == +id);
    return lang ? lang.code.toUpperCase() : 'NDF';
  }


  getAllLevelsBySport() {
    let ret: any = [];
    this.schoolSports.forEach((element: any) => {
      if (element.sport_id === this.detailData.sport.id) {
        ret = element.degrees;
      }
    });

    return ret;
  }

  getClient(id: any) {
    if (id && id !== null) {
      return this.clients.find((c: any) => c.id === id);
    }
  }

  getClients() {
    this.crudService.list('/slug/clients/mains', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((client) => {
        this.clients = client.data;
      })
  }

  getDateIndex() {
    let ret = 0;
    if (this.detailData.course && this.detailData.course.course_dates) {
      this.detailData.course.course_dates.forEach((element: any, idx: any) => {
        if (moment(element.date).format('YYYY-MM-DD') === moment(this.detailData.date).format('YYYY-MM-DD')) {
          ret = idx +1;
        }
      });
    }

    return ret;
  }

  getGroupsQuantity() {
    let ret = 0;
    if (this.detailData.course && this.detailData.course.course_dates) {
      this.detailData.course.course_dates.forEach((element: any) => {
        if (moment(element.date).format('YYYY-MM-DD') === moment(this.detailData.date).format('YYYY-MM-DD')) {
          ret = element.groups.length;
        }
      });
    }

    return ret;
  }


  getSubGroupsIndex() {
    let ret = 0;
    if (this.detailData.course && this.detailData.course.course_dates) {

      this.detailData.course.course_dates.forEach((element: any) => {
        const group = element.groups.find((g: any) => g.id === this.detailData.course_group_id);

        if (group){
          group.subgroups.forEach((s: any, sindex: any) => {
            if (s.id === this.detailData.course_subgroup_id) {
              ret = sindex + 1;
            }
          });
        }
      });
    }
    return ret;
  }

  getDateFormatLong(date:string) {
    return moment(date).format('dddd, D MMMM YYYY');
  }

  getHoursMinutes(hour_start:string, hour_end:string) {
    const parseTime = (time:string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return { hours, minutes };
    };

    const startTime = parseTime(hour_start);
    const endTime = parseTime(hour_end);

    let durationHours = endTime.hours - startTime.hours;
    let durationMinutes = endTime.minutes - startTime.minutes;

    if (durationMinutes < 0) {
      durationHours--;
      durationMinutes += 60;
    }

    return `${durationHours}h${durationMinutes}m`;
  }

  getHourRangeFormat(hour_start:string,hour_end:string) {
    return hour_start.substring(0, 5)+' - '+hour_end.substring(0, 5);
  }

  getClientDegree(sport_id:any,sports:any) {
    const sportObject = sports.find((sport: any) => sport.sport_id === sport_id);
    if (sportObject) {
      return sportObject.degree_id;
    }
    else{
      return 0;
    }
  }

  getBirthYears(date:string) {
    const birthDate = moment(date);
    return moment().diff(birthDate, 'years');
  }

  getLanguageById(languageId: number): string {
    const language = this.languages.find((c: any) => c.id === languageId);
    return language ? language.code.toUpperCase() : '';
  }

  getCountryById(countryId: number): string {
    const country = MOCK_COUNTRIES.find(c => c.id === countryId);
    return country ? country.code : 'Aucun';
  }

  calculateHourEnd(hour: any, duration: any) {
    if(duration.includes('h') && duration.includes('min')) {
      const hours = duration.split(' ')[0].replace('h', '');
      const minutes = duration.split(' ')[1].replace('min', '');

      return moment(hour, 'HH:mm').add(hours, 'h').add(minutes, 'm').format('HH:mm');
    } else if(duration.includes('h')) {
      const hours = duration.split(' ')[0].replace('h', '');

      return moment(hour, 'HH:mm').add(hours, 'h').format('HH:mm');
    } else {
      const minutes = duration.split(' ')[0].replace('min', '');

      return moment(hour, 'HH:mm').add(minutes, 'm').format('HH:mm');
    }
  }

  close() {
    this.showDetail = false;
    this.detailData = null;
  }

  deleteUserClient(id: number) {

    const dialogRef = this.dialog.open(ConfirmModalComponent, {
      maxWidth: '100vw',  // Asegurarse de que no haya un ancho máximo
      panelClass: 'full-screen-dialog',  // Si necesitas estilos adicionales,
      data: {message: 'Do you want to remove this item? This action will be permanetly', title: 'Delete monitor course'}
    });


    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (data) {

        this.crudService.delete('/clients-utilizers', id)
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.getClientUtilisateurs();
            this.snackbar.open(this.translateService.instant('snackbar.client.removed_user'), 'OK', {duration: 3000});
          })
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}

