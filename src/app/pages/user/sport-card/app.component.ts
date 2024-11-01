import { Component, Input } from '@angular/core';
import { UserComponent } from '../user.component';

@Component({
  selector: 'app-user-detail-sport-card',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class SportCardComponent {
  constructor(public user: UserComponent) { }
  @Input() selectedSport: any
  @Input() level: any
  @Input() goals: any
  @Input() border: boolean = true

  calculateGoalsScore() {
    let ret = 0;
    if (this.selectedSport?.level) {
      const goalsx = this.goals.filter((g: any) => g.degree_id == this.level.id);
      const maxPoints = goalsx.length * 10;
      for (const goal of goalsx) {
        this.user.evaluationFullfiled.forEach((element: any) => {
          if (element.degrees_school_sport_goals_id === goal.id) {
            ret += element.score;
          }
        });
        ret = ret > maxPoints ? maxPoints : ret
        return (ret / maxPoints) * 100;
      }
    }
    return ret;
  }

  getDegreeScore(goal: any) {
    const d = this.user.evaluationFullfiled.find((element: any) => element.degrees_school_sport_goals_id === goal)
    if (d) return d.score
    return 0
  }
}
