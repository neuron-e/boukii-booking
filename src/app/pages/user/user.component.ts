import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from 'src/app/services/auth.service';

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
  goals = [];
  userLogged: any;

  constructor(private router: Router, public themeService: ThemeService, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => {
      this.userLogged = data;
    });
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
}
