import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { _MatTableDataSource } from '@angular/material/table';
import { Observable, map, startWith, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import * as moment from 'moment';
import { PasswordService } from 'src/app/services/password.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddClientUserModalComponent } from './add-client-user/add-client-user.component';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild('userDetail') userDetailComponent:any;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  selectedSport: any;
  selectedSports: any[] = [];
  clientSport: any = [];
  coloring = true;
  allLevels: any = [];
  selectedGoal: any = [];
  schoolSports: any = [];
  goals: any = [];
  countries = MOCK_COUNTRIES;
  languages: any = [];
  selectedLanguages:any = [];

  userLogged: any;
  schoolData: any;
  sportsCurrentData = new _MatTableDataSource([]);
  filteredSports: Observable<any[]>;
  sportsControl = new FormControl();
  loading = true;
  id: any;
  bookingId: any = null;
  bookingSelectionChanged = new EventEmitter<number>();
  selectedBooking: boolean = false;

  panelOpenState = false;
  bookings: any = [];
  dataSource: any = [];

  displayedColumns: string[] = ['bookingusers[0].course.name', 'price_total'];
  mainId: any;

  defaults: any;
  defaultsUser: any;
  defaultsObservations: any;
  clientSchool = [];
  clientUsers:any[] = [];

  firstLoad:boolean = true;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService, private crudService: ApiCrudService, private dialog: MatDialog,
    private schoolService: SchoolService, private passwordGen: PasswordService, private snackbar: MatSnackBar, private translateService: TranslateService, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {

    this.schoolService.getSchoolData().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          if(this.firstLoad){
            this.getData();
          }
        }
      }
    );
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.userDetailComponent.changeClientDataB(this.defaults.id);
    }
  }

  getData(id = null, onChangeUser = false) {
    this.firstLoad = false;
    this.authService.getUserData().pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data !== null) {
        this.mainId = data.clients[0].id;
        this.userLogged = data;
        const getId = id === null ? this.mainId : id;
        this.id = getId;
        this.crudService.get('/clients/'+ getId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((client) => {
            this.defaults = client.data;

            this.crudService.get('/users/'+client.data.user_id)
              .pipe(takeUntil(this.destroy$))
              .subscribe(async (user)=> {


                await this.getSchoolSportDegrees();
                await this.getLanguages(data.clients[0]);
                await this.getClientSchool();
                await this.getClientSport();
                await this.getClientObservations();
                this.getBookings();

                if (!onChangeUser) {
                  this.getClientUtilisateurs();
                }
                this.defaultsUser = user.data;

              })
        })
      }
    });
  }

  async getClientSchool() {
    try {
      const data:any = await this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id='+this.id).toPromise();
      this.clientSchool = data.data;
    } catch (error) {
      console.error(error);
    }
  }

  async getClientObservations() {
    try {
      const data:any = await this.crudService.list('/client-observations', 1, 10000, 'desc', 'id', '&client_id='+this.id).toPromise();
      this.defaultsObservations = data.data.length > 0 ? data.data[0] : {
        id: null,
        general: '',
        notes: '',
        historical: '',
        client_id: null,
        school_id: null
      };
    } catch (error) {
      console.error(error);
    }
  }

  getClientUtilisateurs() {
    this.crudService.list('/slug/clients/' + this.id +'/utilizers', 1, 10000, 'desc', 'id','&client_id='+this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientUsers = data.data;
        console.log(this.clientUsers);
        this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id','&main_id='+this.id)
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

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

  goBack(url: string) {
    this.router.navigate(['/'+this.activatedRoute.snapshot.params['slug']]);
  }

  selectBooking(id: number) {
    this.selectedBooking = false;

    setTimeout(() => {
      this.selectedBooking = true;
      this.bookingId = id;
      this.bookingSelectionChanged.emit(this.bookingId);
    }, 0);
  }

  hideBooking() {
    this.selectedBooking = false;
    this.bookingId = null;
  }

  getBookings() {
    this.crudService.list('/bookings', 1, 10000, 'desc', 'created_at', '&client_main_id='+this.defaults.id, '&with[]=bookingusers.course')
      .pipe(takeUntil(this.destroy$))
      .subscribe((bookings) => {
        console.log(bookings.data);
        this.bookings = bookings.data;
        this.dataSource = bookings.data;
      })
  }

  setInitLanguages(user: any) {

    this.languages.forEach((element: any) => {
      if(element.id === user.language1_id || element.id === user.language2_id || element.id === user.language3_id
        || element.id === user.language4_id || element.id === user.language5_id || element.id === user.language6_id) {
          this.selectedLanguages.push(element);
        }
    });
  }

  calculateAge(birthDateString: string) {
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

  getLanguage(id: any) {
    const lang = this.languages.find((c: any) => c.id == +id);
    return lang ? lang.code.toUpperCase() : 'NDF';
  }

  getCountry(id: any) {
    const country = this.countries.find((c) => c.id == +id);
    return country ? country.name : 'NDF';
  }

  async getLanguages(user: any) {
    try {
      const data:any = await this.crudService.list('/languages', 1, 1000).toPromise();
      this.languages = data.data.reverse();
      this.setInitLanguages(user);
    } catch (error) {
      console.error(error);
    }
  }

  selectSportEvo(sport: any) {
    this.coloring = true;
    this.allLevels = [];
    this.selectedGoal = [];
    this.selectedSport = sport;

    this.schoolSports?.forEach((element: any) => {
      if (this.selectedSport && this.selectedSport.sport_id === element.sport_id) {
        this.selectedSport.degrees = element.degrees;
      }
    });

    this.selectedSport?.degrees.forEach((element: any) => {
      element.inactive_color = this.lightenColor(element.color, 30);
      this.allLevels.push(element);
    });

    this.allLevels?.sort((a:any, b:any) => a.degree_order - b.degree_order);

    this.goals?.forEach((element:any) => {
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

  calculateGoalsScore() {
    let ret = 0;
    this.selectedGoal.forEach((element: any) => {
      if (element.goal) {

        ret = ret + element.goal;
      }
    });

    return ret;
  }

  async getClientSport() {
  try {
    const data:any = await this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='+this.id).toPromise();
    this.clientSport = data.data;
    await this.getSports();
    await this.getDegrees();
    this.selectedSport = this.clientSport[0];
    this.selectSportEvo(this.selectedSport);
    this.loading = false;
  } catch (error) {
    console.error(error);
  }
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

  getGoals() {
    this.clientSport.forEach((cs: any) => {

      this.crudService.list('/degrees-school-sport-goals', 1, 10000, 'desc', 'id', '&degree_id='+cs.degree_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          data.data.forEach((goal: any) => {

          this.crudService.list('/evaluation-fulfilled-goals', 1, 10000, 'desc', 'id', '&degrees_school_sport_goals_id='+goal.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe((ev: any) => {
              if (ev.data.length > 0) {
                goal.score = ev.data[0].score;
              }

              this.goals.push(goal);
            });
          });
        })
    });
  }

  async getSchoolSportDegrees() {
    try {
      const sport:any = await this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id).toPromise();
      this.schoolSports = sport.data;

      for (let [idx, element] of sport.data.entries()) {
        const data:any = await this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&sport_id='+element.sport_id).toPromise();
        this.schoolSports[idx].degrees = data.data;
      }
    } catch (error) {
      console.error(error);
    }
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

        this.getGoals();

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

  private _filterSports(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value?.name?.toLowerCase();
    return this.schoolSports.filter((sport: any) => sport?.name.toLowerCase().indexOf(filterValue) === 0);
  }

  handleIdChange(newId: any) {
    this.changeClientData(newId);
  }

  changeClientData(id: any) {
    //this.loading = true;
    this.id = id;
    this.getData(id, true);
  }

  canAddUtilisateur(date: string): boolean {
    const dateBirth = moment(date);
    const today = moment();
    const diff = today.diff(dateBirth, 'years');

    return diff >= 18;
  }

  addUtilisateur() {

    if (this.canAddUtilisateur(this.userLogged.clients[0].birth_date)) {
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
              //this.getClientUtilisateurs(); --> Deberia añadirse al objeto del usuario
            })
          } else {
            const user = {
              username: data.data.name,
              email: this.userLogged.clients[0].email,
              password: this.passwordGen.generateRandomPassword(12),
              image: null,
              type: 'client',
              active: true,
            }

            const client = {
              email: this.userLogged.clients[0].email,
              first_name: data.data.name,
              last_name: data.data.surname,
              birth_date: moment(data.data.fromDate).format('YYYY-MM-DD'),
              phone: this.userLogged.clients[0].phone,
              telephone: this.userLogged.clients[0].telephone,
              address: this.userLogged.clients[0].address,
              cp: this.userLogged.clients[0].cp,
              city: this.userLogged.clients[0].city,
              province: this.userLogged.clients[0].province,
              country: this.userLogged.clients[0].country,
              image: null,
              language1_id:null,
              language2_id:null,
              language3_id:null,
              language4_id:null,
              language5_id:null,
              language6_id:null,
              user_id: null,
              station_id: this.userLogged.clients[0].station_id
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
                          //this.getClientUtilisateurs(); --> añadir al usuario
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

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  getCourseName(course: any) {
    if (course) {
      if (!course.translations || course.translations === null) {
        return course.name;
      } else {
        const translations = JSON.parse(course.translations);
        return translations[this.translateService.currentLang].name;
      }
    }
  }
}
