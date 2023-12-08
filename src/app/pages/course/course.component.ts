import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(300))
    ])
  ]
})
export class CourseComponent implements OnInit {
  userLogged:boolean=true;
  courseType:number=1;
  dataLevels = [
    {"id": 181, "league": "SKV", "level": "test", "name": "Ptit Loup", "annotation": "PT", "degree_order": 0, "color": "#1C482C", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 182, "league": "SKV", "level": "test", "name": "JN", "annotation": "JN", "degree_order": 1, "color": "#1C482C", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 183, "league": "SKV", "level": "test", "name": "Débutant Kid Village", "annotation": "DKV", "degree_order": 2, "color": "#1C482C", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 184, "league": "BLEU", "level": "test", "name": "Prince / Pricesse Bleu", "annotation": "PB", "degree_order": 3, "color": "#0E3991", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 185, "league": "BLEU", "level": "test", "name": "Roi / Reine Bleu", "annotation": "RB", "degree_order": 4, "color": "#0E3991", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 186, "league": "BLEU", "level": "test", "name": "Star Bleu", "annotation": "SB", "degree_order": 5, "color": "#0E3991", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 187, "league": "ROUGE", "level": "test", "name": "R1", "annotation": "R1", "degree_order": 6, "color": "#572830", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 188, "league": "ROUGE", "level": "test", "name": "R2", "annotation": "R2", "degree_order": 7, "color": "#572830", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 189, "league": "ROUGE", "level": "test", "name": "R3", "annotation": "R3", "degree_order": 8, "color": "#572830", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 190, "league": "NOIR", "level": "test", "name": "Prince / Pricesse Noir", "annotation": "PN", "degree_order": 9, "color": "#000000", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 191, "league": "Academy", "level": "test", "name": "Race", "annotation": "ACA", "degree_order": 10, "color": "#7d7c7c", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 192, "league": "Academy", "level": "test", "name": "Freestyle", "annotation": "ACA", "degree_order": 11, "color": "#7d7c7c", "active": true, "school_id": 1, "sport_id": 1},
    {"id": 193, "league": "Academy", "level": "test", "name": "Freeride", "annotation": "ACA", "degree_order": 12, "color": "#7d7c7c", "active": true, "school_id": 1, "sport_id": 1}
  ];  
  selectedLevel:any;
  selectedUser:any;
  selectedDateReservation:any;

  tooltipsFilter: boolean[] = [];
  tooltipsLevel: boolean[] = [];
  showMoreFilters:boolean=false;
  showLevels:boolean=false;

  monthNames: string[] = [];
  weekdays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  currentMonth: number;
  currentYear: number;
  days: any[] = [];

  isCollective:boolean=false;
  isPrivate:boolean=true;
  activeDates: string[] = ['2023-12-20','2023-12-28','2023-12-29','2023-12-30','2023-12-4','2023-12-5','2023-12-6','2023-12-7','2024-1-18','2024-1-19','2024-1-20'];

  isModalAddUser:boolean=false;

  constructor(private router: Router, public themeService: ThemeService) { }

  ngOnInit(): void {
    this.dataLevels.forEach((degree: any) => {
      degree.inactive_color = this.lightenColor(degree.color, 30);
    });
    this.initializeMonthNames();
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.renderCalendar();
  }

  initializeMonthNames() {
    this.monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  }

  prevMonth() {
    if (this.currentYear > new Date().getFullYear() || (this.currentYear === new Date().getFullYear() && this.currentMonth > new Date().getMonth())) {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderCalendar();
    }
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar(); 
  }
  
  renderCalendar() {
    const startDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    this.days = [];
    //Start monday
    let adjustedStartDay = startDay - 1;
    if (adjustedStartDay < 0) adjustedStartDay = 6;

    for (let j = 0; j < adjustedStartDay; j++) {
      this.days.push({ number: '', active: false });
    }

    for(let i = 1; i <= daysInMonth; i++) {
      const spanDate = new Date(this.currentYear, this.currentMonth, i);
      const isPast = spanDate < new Date();
      const dateStr = `${this.currentYear}-${this.currentMonth + 1}-${i}`;
      const isActive = !isPast && this.activeDates.includes(dateStr);
      this.days.push({ number: i, active: isActive, selected: false, past: isPast });
    }

    let lastDayOfWeek = new Date(this.currentYear, this.currentMonth, daysInMonth).getDay();
    for (let k = lastDayOfWeek; k <= 6 && lastDayOfWeek !== 6; k++) {
      this.days.push({ number: '', active: false });
    }
  }

  selectDay(day:any) {
    if (day.active) {
      this.days.forEach(d => d.selected = false);
      day.selected = true;
      const formattedDate = `${this.currentYear}-${this.currentMonth + 1}-${day.number}`;

      this.selectedDateReservation = `${day.number}`.padStart(2, '0') + '/' + `${this.currentMonth + 1}`.padStart(2, '0') + '/' + this.currentYear;
    }
  }

  private lightenColor(hexColor: string, percent: number): string {
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

    return `#${r}${g}${b}`;
  }

  selectUser(user:any){
    this.selectedUser = user;
  }

  selectLevel(level:any){
    this.selectedLevel = level;
    this.showLevels = false;
  }

  showTooltipFilter(index: number) {
    this.tooltipsFilter[index] = true;
  }
  hideTooltipFilter(index: number) {
    this.tooltipsFilter[index] = false;
  }
  /*
  getFilteredGoals(degree:number): any[] {
    return this.degreeGoals.filter((goal:any) => goal.sport.id === this.selectedSport && goal.degree.id === degree);
  }
  */

  openModalAddUser() {
    this.isModalAddUser = true;
  }

  closeModalAddUser() {
    this.isModalAddUser = false;
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

}
