import { Injectable } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ApiService} from './api.service';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  public user = new BehaviorSubject<any>(null);


  constructor(private router: Router, http: HttpClient, route: ActivatedRoute) {
    super(http, route);

  }

  getUserData(): Observable<any> {
    return this.user.asObservable();
  }

  setUserData() {

  }

  async login(data:any) {
    try {

      this.http.post(this.baseUrl + '/slug/login', data, {headers: this.getHeaders()})
        .subscribe((data: any) => {
          localStorage.setItem(this.extractSlugFromRoute(this.route.snapshot) + '-boukiiUser', JSON.stringify(data.data.user));
          this.user.next(data.data.user)
          console.log(this.user);
          return this.user;
/*          this.router.navigate(['/home']);*/
        })
    } catch (error) {
      console.error('Error during login:', error);
    }
  }
}
