import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../interface/api-response';
import { ApiService } from './api.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class CoursesService extends ApiService {

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }
  hours: string[] = [
    '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00',
  ];

  hoursAll: string[] = [
    '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
    '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45',
    '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30', '21:45',
    '22:00', '22:15', '22:30', '22:45', '23:00', '23:15', '23:30', '23:45',
    '24:00',
  ];

  duration: string[] = [
    '15min', '30min', '45min', '1h', '1h 15min', '1h 30min', '1h 45min',
    '2h', '2h 15min', '2h 30min', '2h 45min', '3h', '3h 15min', '3h 30min', '3h 45min',
    '4h', '4h 15min', '4h 30min', '4h 45min', '5h', '5h 15min', '5h 30min', '5h 45min',
    '6h',
    //'6h 15min', '6h 30min', '6h 45min', '7h', '7h 15min', '7h 30min', '7h 45min'
  ];

  getCoursesAvailableByDates(params: any) {
    const url = this.baseUrl + '/slug/courses';

    // Crear HttpParams y añadir los parámetros
    let httpParams = new HttpParams();
    httpParams = httpParams.append('start_date', params.start_date);
    if (params.end_date) {
      httpParams = httpParams.append('end_date', params.end_date);
    }
    if (params.course_type) {
      httpParams = httpParams.append('course_type', params.course_type);
    }
    if (params.sport_id) {
      httpParams = httpParams.append('sport_id', params.sport_id);
    }
    if (params.client_id) {
      httpParams = httpParams.append('client_id', params.client_id);
    }
    if (params.degree_order) {
      httpParams = httpParams.append('degree_order', params.degree_order);
    }
    if (params.degree_id) {
      httpParams = httpParams.append('degree_id', params.degree_id);
    }
    if (params.min_age) {
      httpParams = httpParams.append('min_age', params.min_age);
    }
    if (params.max_age) {
      httpParams = httpParams.append('max_age', params.max_age);
    }
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders(), params: httpParams });

  }

  getCourse(id: any) {
    const url = this.baseUrl + '/slug/courses/' + id;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }
}
