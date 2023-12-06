import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(300))
    ])
  ]
})
export class HomeComponent implements OnInit {

  tooltipsFilter: boolean[] = [];
  tooltipsLevel: boolean[] = [];
  showMoreFilters:boolean=false;

  monthNames: string[] = [];
  weekdays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  currentMonth: number;
  currentYear: number;
  days: any[] = [];

  isCollective:boolean=true;
  isPrivate:boolean=false;
  activeDates: string[] = ['2023-12-20','2023-12-28','2023-12-29','2023-12-30','2023-12-4','2023-12-5','2023-12-6','2023-12-7','2024-1-18','2024-1-19','2024-1-20'];

  //SEE MORE -> do it for each course
  fullText: string = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam at eros tempor, sollicitudin sem sit amet, ornare augue. Cras eget neque fermentum, rutrum dolor at, vulputate odio. Duis nec pulvinar eros. Ut et interdum ante. Nulla id quam lectus. In efficitur congue nisi, vel dapibus felis egestas sed.';
  displayedText: string;
  displayedTextOld: string;
  showSeeMore: boolean = false;
  showSeeLess: boolean = false;
  private maxLength: number = 100; 

  constructor(private router: Router, public themeService: ThemeService) { }

  ngOnInit(): void {
    this.initializeMonthNames();
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.renderCalendar();

    //SEE MORE -> do it for each course received
    if (this.fullText.length > this.maxLength) {
      this.displayedText = this.fullText.substring(0, this.maxLength) + '...';
      this.displayedTextOld = this.fullText.substring(0, this.maxLength) + '...';
      this.showSeeMore = true;
    } else {
      this.displayedText = this.fullText;
    }
  }

  //SEE MORE -> do it for each course
  showFullText() {
    this.displayedText = this.fullText;
    this.showSeeMore = false;
    this.showSeeLess = true;
  }
  showLessText() {
    this.displayedText = this.displayedTextOld;
    this.showSeeMore = true;
    this.showSeeLess = false;
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
    }
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

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

}
