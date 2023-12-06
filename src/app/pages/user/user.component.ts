import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  constructor(private router: Router, public themeService: ThemeService) { }

  ngOnInit(): void {
  }

  goTo(...urls: string[]) {
    this.router.navigate(urls);
  }

}
