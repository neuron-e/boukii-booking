import { Component, OnInit, ViewChild, EventEmitter, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { _MatTableDataSource } from '@angular/material/table';
import { Observable, map, startWith, Subject, retry, of, tap, forkJoin, switchMap, Subscription } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MOCK_COUNTRIES } from 'src/app/services/countries-data';
import * as moment from 'moment';
import { PasswordService } from 'src/app/services/password.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CartService } from '../../services/cart.service';
import { ScreenSizeService } from 'src/app/services/screen.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild('userDetail') userDetailComponent: any;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  sportCard: any[] = [];
  selectedSport: any;
  selectedSports: any[] = [];
  clientSport: any = [];
  allLevels: any = [];
  allClientLevels: any = [];
  schoolSports: any = [];
  goals: any = [];
  evaluationFullfiled: any = [];
  evaluations: any = [];
  countries = MOCK_COUNTRIES;
  languages: any = [];
  selectedLanguages: any = [];
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

  displayedColumns: string[] = ['icon', 'booking_users[0].course.name', 'dates', 'has_cancellation_insurance',
    'has_boukii_care', 'payment_method', 'payment_status', 'cancelation_status', 'price_total'];
  mainId: any;

  defaults: any;
  defaultsUser: any;
  defaultsObservations: any;
  clientSchool = [];
  clientUsers: any[] = [];

  screenWidth!: number;
  private screenWidthSubscription!: Subscription;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService, private crudService: ApiCrudService, private dialog: MatDialog,
    private schoolService: SchoolService, private passwordGen: PasswordService, private snackbar: MatSnackBar, private translateService: TranslateService, private activatedRoute: ActivatedRoute, private cartService: CartService, public screenSizeService: ScreenSizeService) { }

  ngOnInit(): void {
    this.screenWidthSubscription = this.screenSizeService.getScreenWidth().subscribe(width => this.screenWidth = width);
    this.schoolService.getSchoolData().pipe(takeUntil(this.destroy$)).subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.authService.getUserData().subscribe(data => {
            if (data) {
              this.mainId = data.clients[0].id;
              this.userLogged = data;
              this.id = this.mainId
              this.getDegrees();
              this.getData();
              this.getBookings();
              this.getClientUtilisateurs()
              this.getClientSport().subscribe()
              this.getLanguages().subscribe()
            }
          });

        }
      }
    );
    this.activatedRoute.queryParams.subscribe(params => {
      const status = params['status'];
      if (status === 'success') {
        this.snackbar.open(this.translateService.instant('Booking completed successfully!'), 'Close', {
          duration: 3000, verticalPosition: "top"// Duración del snackbar en milisegundos
        });
        this.cartService.carData.next(null);
        localStorage.removeItem(this.schoolData?.slug + '-cart');
      } else if (status === 'cancel' || status === 'failed') {
        this.snackbar.open(this.translateService.instant('Payment error: Booking could not be completed'), 'Close', {
          duration: 3000, verticalPosition: "top"
        });
      }
    });
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.userDetailComponent.changeClientDataB(this.defaults.id);
    } else if (index === 1) {
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
    }
  }

  getData() {
    this.loading = true;
    this.crudService.get('/clients/' + this.id, ['user', 'clientSports.degree', 'clientSports.sport',
      'evaluations.evaluationFulfilledGoals.degreeSchoolSportGoal', 'evaluations.degree', 'observations'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((client) => {
        this.defaults = client.data;
        this.defaultsUser = client.data.user;
        this.defaults = client.data;
        this.evaluations = client.data.evaluations;
        this.evaluationFullfiled = [];
        this.evaluations.forEach((ev: any) => ev.evaluation_fulfilled_goals.forEach((element: any) => this.evaluationFullfiled.push(element)))
        if (client.data.observations.length > 0) this.defaultsObservations = client.data[0];
        else {
          this.defaultsObservations = {
            id: null,
            general: '',
            notes: '',
            historical: '',
            client_id: null,
            school_id: null
          };
        }
        const requestsClient = {
          clientSchool: this.getClientSchool().pipe(retry(3), catchError(error => {
            console.error('Error fetching client school:', error);
            return of([]);
          })),

        };
        return forkJoin(requestsClient).subscribe(() => setTimeout(() => this.loading = false, 0));
      })
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
          if (!data.data.length) console.error("No Client School")
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
  clients_utilizers: any
  getClientUtilisateurs() {
    this.crudService.list('/slug/clients/' + this.id + '/utilizers', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.clientUsers = data.data;
        this.crudService.list('/clients-utilizers', 1, 10000, 'desc', 'id', '&main_id=' + this.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe((data) => {
            this.clients_utilizers = data
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
      this.bookingId = id;
      this.selectedBooking = true;
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
    this.crudService.list('/bookings', 1, 10000, 'desc', 'created_at', '&client_main_id=' + this.id,
      '', null, '', ['bookingUsers.course'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((bookings) => this.bookings = bookings.data)
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
    this.allClientLevels = [];
    this.selectedSport = sport;
    this.schoolSports?.forEach((element: any) => {
      if (this.selectedSport && this.selectedSport.sport_id === element.sport_id) this.selectedSport.degrees = element.degrees;
    });
    this.selectedSport?.degrees.forEach((element: any) => {
      element.inactive_color = this.lightenColor(element.color, 30);
      this.allClientLevels.push(element);
    });
    console.log(this.selectedSport)
    this.allClientLevels?.sort((a: any, b: any) => a.degree_order - b.degree_order);
    if (sport && sport?.level) {
      for (const i in this.allClientLevels) {
        this.sportCard[+i] = []
        this.goals.forEach((element: any) => {
          if (element.degree_id === this.allClientLevels[i].id) {
            this.sportCard[+i].push(element);
          }
        });
      }
    }
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


  async getClientSportOld() {
    try {
      const data: any = await this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id=' + this.id).toPromise();
      this.clientSport = data.data;
      this.getSports();
      this.getDegrees();
      this.selectedSport = this.clientSport[0];
      this.selectSportEvo(this.selectedSport);
    } catch (error) {
      console.error(error);
    }
  }

  getClientSport() {
    return this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='
      + this.id + "&school_id=" + this.schoolData.id, '', null, '', ['degree.degreesSchoolSportGoals'])
      .pipe(
        switchMap((data) => {
          if (!data.data.length) console.error("No Client Sport")
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
    this.crudService.list('/degrees', 1, 10000, 'asc', 'degree_order', '&school_id=' + this.schoolData.id + '&active=1')
      .subscribe((data) => {
        this.allLevels = data.data;
      })
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

          this.selectSportEvo(this.clientSport[0])
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


  isModalAddUser: boolean = false

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    if (this.screenWidthSubscription) {
      this.screenWidthSubscription.unsubscribe();
    }
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

  // async getEvaluations() {
  //   this.crudService.list('/evaluations', 1, 10000, 'desc', 'id', '&client_id=' + this.id)
  //     .subscribe((data) => {
  //       this.evaluations = data.data;
  //       data.data.forEach((evaluation: any) => {
  //         this.crudService.list('/evaluation-fulfilled-goals', 1, 10000, 'desc', 'id', '&evaluation_id=' + evaluation.id)
  //           .subscribe((ev: any) => {
  //             ev.data.forEach((element: any) => {
  //               this.evaluationFullfiled.push(element);
  //             });
  //           });
  //       });
  //     })
  // }

  getEvaluationsData(): any {
    let ret: any = [];

    this.evaluations.forEach((element: any) => {
      if (element.degree_id === this.selectedSport.level.id) {
        ret.push(element);
      }
    });

    return ret;
  }
  //changeLevel(nextLevel: any) {
  //  this.selectedGoal = [];
  //  this.sportIdx = this.sportIdx + nextLevel;
  //  if (this.sportIdx < 0) {
  //    this.sportIdx = this.allClientLevels.length - 1;
  //  } else if (this.sportIdx >= this.allClientLevels.length) {
  //    this.sportIdx = 0;
  //  }
  //  this.allClientLevels.sort((a: any, b: any) => a.degree_order - b.degree_order);
  //  this.selectedSport.level = this.allClientLevels[this.sportIdx];
  //  this.goals.forEach((element: any) => {
  //    if (element.degree_id === this.allClientLevels[this.sportIdx].id) {
  //      this.selectedGoal.push(element);
  //    }
  //  });
  //}

  getGoalImage(goal: any): string {
    let ret = '';
    if (goal.length > 0) {
      this.allClientLevels.forEach((element: any) => {
        if (element.id === goal[0].degree_id) {
          ret = element.image;
        }
      });
    }
    return ret;
  }
  @ViewChild('sliderContainer', { static: false }) sliderContainer!: ElementRef;
  centeredCardIndex: number = 0;

  scrollLeft(num: number) {
    this.sliderContainer.nativeElement.scrollBy({ left: num * 300, behavior: 'smooth' });
  }
  onScroll() {
    this.updateCenteredCardIndex();
  }

  private updateCenteredCardIndex() {
    const container = this.sliderContainer.nativeElement;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    const cards = container.querySelectorAll('app-user-detail-sport-card');
    cards.forEach((card: HTMLElement, index: number) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.centeredCardIndex = closestIndex;
  }

}

