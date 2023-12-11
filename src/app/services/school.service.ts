import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {ApiResponse} from '../interface/api-response';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SchoolService extends ApiService {

  private schoolData = new BehaviorSubject<any>(null);
  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  fetchSchoolData(): void {
    const url = this.baseUrl + '/slug/school';
    this.http.get(url, { headers: this.getHeaders() }).subscribe(
      data => this.schoolData.next(data),
      error => console.error('Error al obtener datos de la escuela', error)
    );
  }

  getSchoolData(): Observable<any> {
    return this.schoolData.asObservable();
  }
}
