import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from 'src/app/services/school.service';
import { _MatTableDataSource } from '@angular/material/table';
import { Observable, map, startWith } from 'rxjs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  selectedSport: any;
  selectedSports: any[] = [];
  clientSport: any = [];
  coloring = true;
  allLevels: any = [];
  selectedGoal: any = [];
  schoolSports: any = [];
  goals: any = [];
  userLogged: any;
  schoolData: any;
  sportsCurrentData = new _MatTableDataSource([]);
  filteredSports: Observable<any[]>;
  sportsControl = new FormControl();
  loading = true;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService, private crudService: ApiCrudService, private schoolService: SchoolService) { }

  ngOnInit(): void {

    this.schoolService.getSchoolData().subscribe(
      data => {
        if (data) {
          this.schoolData = data.data;
          this.authService.getUserData().subscribe(data => {
            if (data !== null) {
              this.userLogged = data;
              this.getClientSport();
            }
          });
        }
      }
    );
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
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

    this.allLevels.sort((a:any, b:any) => a.degree_order - b.degree_order);

    this.goals.forEach((element:any) => {
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

  getClientSport() {
    this.crudService.list('/client-sports', 1, 10000, 'desc', 'id', '&client_id='+this.userLogged.clients[0].id)
      .subscribe((data) => {
        this.clientSport = data.data;
        this.selectedSport = this.clientSport[0];
        this.getSports();
        this.getDegrees();
      })
  }

  getDegrees() {
    this.clientSport.forEach((element: any) => {
      this.crudService.get('/degrees/'+element.degree_id)
        .subscribe((data) => {
          element.level = data.data;
        })
    });
  }

  getGoals() {
    this.clientSport.forEach((cs: any) => {

      this.crudService.list('/degrees-school-sport-goals', 1, 10000, 'desc', 'id', '&degree_id='+cs.degree_id)
        .subscribe((data) => {
          data.data.forEach((goal: any) => {

          this.crudService.list('/evaluation-fulfilled-goals', 1, 10000, 'desc', 'id', '&degrees_school_sport_goals_id='+goal.id)
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

  getSports() {
    this.crudService.list('/sports', 1, 10000, 'desc', 'id', '&school_id='+this.schoolData.id)
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

        this.loading = false;
      })
  }

  private _filterSports(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value?.name?.toLowerCase();
    return this.schoolSports.filter((sport: any) => sport?.name.toLowerCase().indexOf(filterValue) === 0);
  }
}
