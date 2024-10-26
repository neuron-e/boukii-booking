import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ApiResponse } from '../interface/api-response';
import { BehaviorSubject, map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SchoolService extends ApiService {
  isModalLogin: boolean = false
  isModalNewUser: boolean = false
  private schoolDataSubject = new BehaviorSubject<any>(null);
  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
    this.fetchSchoolData().subscribe();  // Llamada a fetchSchoolData al iniciar el servicio
  }

  fetchSchoolData(slug:  string = ''): Observable<any> {
    const url = `${this.baseUrl}/slug/school`;
    const headers = this.getHeaders(slug);

    return this.http.get(url, { headers }).pipe(
      map((response: any) => {
        this.setSchoolData(response);
        return response;
      }),
      catchError((error: any) => throwError(error))
    );
  }

  getSchoolData(): Observable<any> {
    return this.schoolDataSubject.asObservable();
  }

  private setSchoolData(data: any) {
    this.schoolDataSubject.next(data);
  }
}
