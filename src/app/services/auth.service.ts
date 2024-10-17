import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';

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

  async login(data: any): Promise<any> {
    try {
      const response: any = await lastValueFrom(this.http.post(this.baseUrl + '/slug/login', data, { headers: this.getHeaders() }));
      const user = response.data.user;
      localStorage.setItem(this.extractSlugFromRoute(this.route.snapshot) + '-boukiiUser', JSON.stringify(user));
      this.user.next(user);
      return user;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async sendMailPassword(data: any): Promise<any> {
    try {
      const response: any = await lastValueFrom(this.http.post(this.baseUrl + '/forgot-password', data,
        { headers: this.getHeaders() }
      ));
      return response.data;
    } catch (error) {
      console.error('Error during sen mailing:', error);
      throw error;
    }
  }

}
