import { Component, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { _MatTableDataSource } from '@angular/material/table';
import { Observable, map, startWith, Subject, retry, of, tap, forkJoin, switchMap } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import * as moment from 'moment';
import { PasswordService } from 'src/app/services/password.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AddClientUserModalComponent } from './add-client-user/add-client-user.component';
import {CartService} from '../../services/cart.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild('userDetail') userDetailComponent: any;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  selectedSport: any;
  selectedSports: any[] = [];
  clientSport: any = [];
  coloring = true;
  allLevels: any = [];
  selectedGoal: any = [];
  schoolSports: any = [];
  goals: any = [];
  evaluationFullfiled: any = [];
  evaluations: any = [];
  countries = MOCK_COUNTRIES;
  languages: any = [];
  selectedLanguages: any = [];
  sportIdx: any = -1;
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

  displayedColumns: string[] = ['icon', 'booking_users[0].course.name', 'dates', 'has_cancellation_insurance',
    'has_boukii_care', 'payment_method', 'payment_status', 'cancellation_status', 'price_total'];
  mainId: any;

  defaults: any;
  defaultsUser: any;
  defaultsObservations: any;
  clientSchool = [];
  clientUsers: any[] = [];

  firstLoad: boolean = true;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService, private crudService: ApiCrudService, private dialog: MatDialog,
              private schoolService: SchoolService, private passwordGen: PasswordService, private snackbar: MatSnackBar, private translateService: TranslateService, private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {

    this.schoolService.getSchoolData().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          if (this.firstLoad) {
            this.getData();
          }
        }
      }
    );
    this.activatedRoute.queryParams.subscribe(params => {
      const status = params['status'];

      if (status === 'success') {
        // Mostrar snackbar de éxito
        this.snackbar.open(this.translateService.instant('Booking completed successfully!'), 'Close', {
          duration: 3000,  verticalPosition: "top"// Duración del snackbar en milisegundos
        });

        // Limpiar el carrito
        this.cartService.carData.next(null);
        localStorage.removeItem(this.schoolData?.slug + '-cart'); // Limpiar el carrito del local storage

      } else if (status === 'cancel' || status === 'failed') {
        // Mostrar snackbar de error
        this.snackbar.open(this.translateService.instant('Payment error: Booking could not be completed'), 'Close', {
          duration: 3000, verticalPosition: "top"
        });
      }
    });
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.userDetailComponent.changeClientDataB(this.defaults.id);
    }
    if (index === 1) {
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
    }
  }

  getData(id = null, onChangeUser = false) {
    this.loading = true;
    this.firstLoad = false;
    this.authService.getUserData().subscribe(data => {
      if (data !== null) {
        this.mainId = data.clients[0].id;
        this.userLogged = data;
        const getId = id === null ? this.mainId : id;
        this.id = getId;
        this.crudService.get('/clients/' + getId, ['user', 'clientSports.degree', 'clientSports.sport',
          'evaluations.evaluationFulfilledGoals.degreeSchoolSportGoal', 'evaluations.degree', 'observations'])
          .pipe(takeUntil(this.destroy$))
          .subscribe(async (client) => {
            this.defaults = client.data;
            this.defaultsUser = client.data.user;
            this.defaults = client.data;
            this.evaluations = client.data.evaluations;
            this.evaluationFullfiled = [];
            this.evaluations.forEach((ev: any) => {
              ev.evaluation_fulfilled_goals.forEach((element: any) => {
                ;
                this.evaluationFullfiled.push(element);
              });
            });
            if (client.data.observations.length > 0) {
              this.defaultsObservations = client.data[0];
            } else {
              this.defaultsObservations = {
                id: null,
                general: '',
                notes: '',
                historical: '',
                client_id: null,
                school_id: null
              };
            }
            this.getBookings();
            const requestsClient = {
              clientSchool: this.getClientSchool().pipe(retry(3), catchError(error => {
                console.error('Error fetching client school:', error);
                return of([]); // Devuelve un array vacío en caso de error
              })),
              clientSport: this.getClientSport().pipe(retry(3), catchError(error => {
                console.error('Error fetching client sport:', error);
                return of([]); // Devuelve un array vacío en caso de error
              })),
              languages: this.getLanguages().pipe(retry(3), catchError(error => {
                console.error('Error fetching languages:', error);
                return of([]); // Devuelve un array vacío en caso de error
              }))
            };
            return forkJoin(requestsClient).subscribe((results) => {
              console.log('All data loaded', results);
              if (!onChangeUser) {
                this.getClientUtilisateurs();
              }
              const langs = [];
              this.languages.forEach((element: any) => {
                if (element.id === this.defaults?.language1_id || element.id === this.defaults?.language2_id || element.id === this.defaults?.language3_id ||
                  element.id === this.defaults?.language4_id || element.id === this.defaults?.language5_id || element.id === this.defaults?.language6_id) {
                  langs.push(element);
                }
              });
              setTimeout(() => this.loading = false, 0);
            });
          })
      }
    });
  }

  async getClientSchoolold() {
    try {
      const data: any = await this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
      this.clientSchool = data.data;
    } catch (error) {
      console.error(error);
    }
  }

  getClientSchool() {
    return this.crudService.list('/clients-schools', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(
        map((data) => {
          this.clientSchool = data.data;
        })
      );
  }

  async getClientObservations() {
    try {
      const data: any = await this.crudService.list('/client-observations', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
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
    this.crudService.list('/slug/clients/' + this.id + '/utilizers', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientUsers = data.data;
        console.log(this.clientUsers);
        this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id', '&main_id=' + this.id)
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
    this.router.navigate(['/' + this.activatedRoute.snapshot.params['slug']]);
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

  getMinMaxDates(data: any[]): { minDate: string, maxDate: string, days: number } {
    let days = 0;
    if (data.length === 0) {
      return { minDate: '', maxDate: '', days: days };
    }

    let minDate = new Date(data[0].date);
    let maxDate = new Date(data[0].date);

    data.forEach(item => {
      const currentDate = new Date(item.date);
      if (currentDate < minDate) {
        minDate = currentDate;
      }
      if (currentDate > maxDate) {
        maxDate = currentDate;
      }
      days = days + 1;
    });

    return { minDate: minDate.toISOString(), maxDate: maxDate.toISOString(), days: days };
  }

  getMinMaxHours(data: any[]): { minHour: string, maxHour: string } {
    if (data.length === 0) {
      return { minHour: '', maxHour: '' };
    }
    let minHour: any = null;
    let maxHour: any = null;
    if (data[0].course.course_type === 2) {
      minHour = data[0].hour_start;
      maxHour = this.calculateHourEnd(data[0].hour_start, data[0].course.duration);

    } else {
      minHour = data[0].hour_start;
      maxHour = data[0].hour_end.replace(':00', '');

      data.forEach(item => {
        if (item.hour_start < minHour) {
          minHour = item.hour_start;
        }
        if (item.hour_end > maxHour) {
          maxHour = item.hour_end.replace(':00', '');
        }
      });
    }

    minHour = minHour.replace(':00', '');

    return { minHour, maxHour };
  }

  getPaymentMethod(id: number) {
    switch (id) {
      case 1:
        return 'CASH';
      case 2:
        return 'BOUKII PAY';
      case 3:
        return 'ONLINE';
      case 4:
        return 'AUTRE';
      case 5:
        return this.translateService.instant('payment_no_payment');

      default:
        return this.translateService.instant('payment_no_payment');
    }
  }

  calculateHourEnd(hour: any, duration: any) {
    if (duration.includes('h') && duration.includes('min')) {
      const hours = duration.split(' ')[0].replace('h', '');
      const minutes = duration.split(' ')[1].replace('min', '');

      return moment(hour, 'HH:mm').add(hours, 'h').add(minutes, 'm').format('HH:mm');
    } else if (duration.includes('h')) {
      const hours = duration.split(' ')[0].replace('h', '');

      return moment(hour, 'HH:mm').add(hours, 'h').format('HH:mm');
    } else {
      const minutes = duration.split(' ')[0].replace('min', '');

      return moment(hour, 'HH:mm').add(minutes, 'm').format('HH:mm');
    }
  }

  getBookings() {
    this.crudService.list('/bookings', 1, 10000, 'desc', 'created_at', '&client_main_id=' + this.defaults.id,
      '', null, '', ['bookingUsers.course'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((bookings) => {
        console.log(bookings.data);
        this.bookings = bookings.data;
        this.dataSource = bookings.data;

      })
  }

  setInitLanguages() {
    this.selectedLanguages = [];
    this.languages.forEach((element: any) => {
      if (element.id === this.defaults.language1_id || element.id === this.defaults.language2_id || element.id === this.defaults.language3_id
        || element.id === this.defaults.language4_id || element.id === this.defaults.language5_id || element.id === this.defaults.language6_id) {
        this.selectedLanguages.push(element);
      }
    });
  }

  calculateAge(birthDateString: string) {
    if (birthDateString && birthDateString !== null) {
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

  async getLanguagesold(user: any) {
    try {
      const data: any = await this.crudService.list('/languages', 1, 1000).toPromise();
      this.languages = data.data.reverse();
      this.setInitLanguages();
    } catch (error) {
      console.error(error);
    }
  }

  getLanguages() {
    return this.crudService.list('/languages', 1, 1000).pipe(
      tap((data) => {
        this.languages = data.data.reverse();
        this.setInitLanguages();
      })
    );
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

    this.allLevels?.sort((a: any, b: any) => a.degree_order - b.degree_order);
    this.sportIdx = this.allLevels.findIndex((al: any) => al.id === sport.degree_id);
    if (sport && sport?.level) {

      this.goals?.forEach((element: any) => {
        if (element.degree_id === sport.degree_id) {

          this.selectedGoal.push(element);
        }
      });
    }
    this.coloring = false;
  }

  lightenColor(hexColor: any, percent: any) {

    let r: any = parseInt(hexColor.substring(1, 3), 16);
    let g: any = parseInt(hexColor.substring(3, 5), 16);
    let b: any = parseInt(hexColor.substring(5, 7), 16);

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

    const goals = this.goals.filter((g: any) => g.degree_id == this.selectedSport.level.id);

    if (goals.length > 0) {
      const maxPoints = goals.length * 10;
      this.evaluationFullfiled.forEach((element: any) => {
        if (element.score) {

          ret = ret + element.score;
        }
      });

      return (ret / maxPoints) * 100;
    } else {
      return ret;
    }

  }

  async getClientSportOld() {
    try {
      const data: any = await this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
      this.clientSport = data.data;
      await this.getSports();
      await this.getDegrees();
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
      //this.loading = false;
    } catch (error) {
      console.error(error);
    }
  }

  getClientSport() {
    return this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='
      + this.id + "&school_id=" + this.schoolData.id, '', null, '', ['degree.degreesSchoolSportGoals'])
      .pipe(
        switchMap((data) => {
          this.clientSport = data.data;
          this.selectedSport = this.clientSport[0];
          this.goals = [];

          this.clientSport.forEach((element: any) => {
            element.level = element.degree;

          });

          return this.getSchoolSportDegrees();
        })
      );
  }

  getDegrees() {
    this.clientSport.forEach((element: any) => {
      this.crudService.get('/degrees/' + element.degree_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
          element.level = data.data;
        })
    });
  }

  getGoals() {
    this.clientSport.forEach((cs: any) => {

      cs.degrees.forEach((dg: any) => {
        this.crudService.list('/degrees-school-sport-goals', 1, 10000, 'desc', 'id', '&degree_id=' + dg.id)
          .subscribe((data) => {

            data.data.forEach((element: any) => {

              this.goals.push(element);
            });

          })
      });

    });
  }

  async getSchoolSportDegreesold() {
    try {
      const sport: any = await this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id=' + this.schoolData.id).toPromise();
      this.schoolSports = sport.data;

      for (let [idx, element] of sport.data.entries()) {
        const data: any = await this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&sport_id=' + element.sport_id).toPromise();
        this.schoolSports[idx].degrees = data.data;
      }
    } catch (error) {
      console.error(error);
    }
  }

  getSchoolSportDegrees() {
    return this.crudService.list('/school-sports', 1, 10000, 'desc', 'id', '&school_id=' +
      this.schoolData.id, '', null, '', ['sport', 'degrees.degreesSchoolSportGoals'])
      .pipe(
        map((sport) => {
          this.schoolSports = sport.data;
          this.schoolSports.forEach((sport: any) => {
            sport.name = sport.sport.name;
            sport.icon_selected = sport.sport.icon_selected;
            sport.icon_unselected = sport.sport.icon_unselected;
            sport.degrees.forEach((degree: any) => {
              degree.degrees_school_sport_goals.forEach((goal: any) => {
                this.goals.push(goal);
              });
            });

            this.clientSport.forEach((element: any) => {
              if (element.sport_id === sport.sport_id) {
                element.name = sport.name;
                element.icon_selected = sport.icon_selected;
                element.icon_unselected = sport.icon_unselected;
                element.degrees = sport.degrees;
              }
            });
          });
          this.sportsCurrentData.data = this.clientSport;
          const availableSports: any = [];
          this.schoolSports.forEach((element: any) => {
            if (!this.sportsCurrentData.data.find((s: any) => s.sport_id === element.sport_id)) {
              availableSports.push(element);
            }
          });

          this.filteredSports = this.sportsControl.valueChanges.pipe(
            startWith(''),
            map((sport: string | null) => sport ? this._filterSports(sport) : availableSports.slice())
          );


          //return this.getGoals();
        })
      );
  }


  getSports() {
    this.crudService.list('/sports', 1, 10000, 'desc', 'id', '&school_id=' + this.schoolData.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        data.data.forEach((element: any) => {
          this.schoolSports.forEach((sport: any) => {
            if (element.id === sport.sport_id) {
              sport.name = element.name;
              sport.icon_selected = element.icon_selected;
              sport.icon_unselected = element.icon_unselected;
            }
          });
        });

        this.schoolSports.forEach((element: any) => {

          this.clientSport.forEach((sport: any) => {
            if (element.sport_id === sport.sport_id) {
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
          if (!this.sportsCurrentData.data.find((s: any) => s.sport_id === element.sport_id)) {
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
        data: { id: this.schoolData.id }
      });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
        if (data) {

          if (data.action === 'add') {
            this.crudService.create('/clients-utilizers', { client_id: data.ret, main_id: parseInt(this.id) })
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
              language1_id: null,
              language2_id: null,
              language3_id: null,
              language4_id: null,
              language5_id: null,
              language6_id: null,
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
                    this.snackbar.open(this.translateService.instant('snackbar.client.create'), 'OK', { duration: 3000 });

                    this.crudService.create('/clients-schools', { client_id: clientCreated.data.id, school_id: this.schoolData.id })
                      .pipe(takeUntil(this.destroy$))
                      .subscribe((clientSchool) => {

                        setTimeout(() => {
                          this.crudService.create('/clients-utilizers', { client_id: clientCreated.data.id, main_id: this.id })
                            .pipe(takeUntil(this.destroy$))
                            .subscribe((res) => {
                              //this.getClientUtilisateurs(); --> añadir al usuario
                            })
                        }, 1000);
                      });
                  })
              })
          }
        }
      });
    } else {
      this.snackbar.open(this.translateService.instant('snackbar.client.no_age'), 'OK', { duration: 3000 });
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

  async getEvaluations() {
    this.crudService.list('/evaluations', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .subscribe((data) => {
        this.evaluations = data.data;

        data.data.forEach((evaluation: any) => {

          this.crudService.list('/evaluation-fulfilled-goals', 1, 10000, 'desc', 'id', '&evaluation_id=' + evaluation.id)
            .subscribe((ev: any) => {
              ev.data.forEach((element: any) => {
                this.evaluationFullfiled.push(element);

              });

            });
        });
      })
  }

  getEvaluationsData(): any {
    let ret: any = [];

    this.evaluations.forEach((element: any) => {
      if (element.degree_id === this.selectedSport.level.id) {
        ret.push(element);
      }
    });

    return ret;
  }

  changeLevel(nextLevel: any) {
    this.selectedGoal = [];
    this.sportIdx = this.sportIdx + nextLevel;

    if (this.sportIdx < 0) {
      this.sportIdx = 0;
    } else if (this.sportIdx >= this.allLevels.length) {
      this.sportIdx = this.allLevels.length - 1;
    }
    this.allLevels.sort((a: any, b: any) => a.degree_order - b.degree_order);
    this.selectedSport.level = this.allLevels[this.sportIdx];
    this.goals.forEach((element: any) => {
      if (element.degree_id === this.allLevels[this.sportIdx].id) {

        this.selectedGoal.push(element);
      }
    });
    this.coloring = false;
  }

  getGoalImage(): string {
    let ret = '';

    if (this.selectedGoal.length > 0) {
      this.allLevels.forEach((element: any) => {
        if (element.id === this.selectedGoal[0].degree_id) {
          ret = element.image;
        }
      });
    }


    return ret;
  }
}
