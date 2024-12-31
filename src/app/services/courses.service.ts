import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ApiResponse} from '../interface/api-response';
import {ApiService} from './api.service';
import {ActivatedRoute} from '@angular/router';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class CoursesService extends ApiService{

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  getCoursesAvailableByDates(params: any) {
    const url = this.baseUrl + '/slug/courses';

    // Crear HttpParams y añadir los parámetros
    let httpParams = new HttpParams();
    if (params.start_date) {
      const startDate = moment(params.start_date).isSameOrAfter(moment()) ? moment(params.start_date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');
      httpParams = httpParams.append('start_date', startDate);
    }
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
    const url = this.baseUrl + '/slug/courses/'+id;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders()});
  }

  getAvailableDurations(courseDateId: any, hour:any) {
    const url = this.baseUrl + '/slug/courses/availability/'+courseDateId;
    let data = {
      hour_start: hour}
    return this.http.post<ApiResponse>(url,data, { headers: this.getHeaders()});
  }
}
