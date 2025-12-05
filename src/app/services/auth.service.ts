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


  constructor(http: HttpClient, route: ActivatedRoute) { super(http, route) }

  getUserData(): Observable<any> {
    return this.user.asObservable();
  }

  setUserData() { }

  async login(data: any): Promise<any> {
    try {
      const response: any = await lastValueFrom(this.http.post(this.baseUrl + '/slug/login', data, { headers: this.getHeaders() }));
      const user = response.data.user || {};
      const client = Array.isArray(user.clients) && user.clients.length ? user.clients[0] : null;

      // Rellenar nombres a partir del cliente si no existen en el usuario
      if (!user.first_name && client?.first_name) {
        user.first_name = client.first_name;
      }
      if (!user.last_name && client?.last_name) {
        user.last_name = client.last_name;
      }
      if (!user.username && client?.email) {
        user.username = client.email;
      }

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
      return response.message;
    } catch (error) {
      console.error('Error during sen mailing:', error);
      throw error;
    }
  }

}
