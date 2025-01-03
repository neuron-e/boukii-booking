
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from 'src/app/interface/api-response';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiCrudService extends ApiService {

  public zonesIds: any = [];
  public reservationId: any;
  public user: any;
  public searchTerm: any = '';
  public currentPage: any = 1;

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
    const parseJson = localStorage.getItem('boukiiUser');
    const user = parseJson !== null ? JSON.parse(localStorage.getItem('boukiiUser') || '') : null;
    this.user = user;
  }

  get(url: string, relations: any[] = []) {
    let relationsParams = '';
    if (relations.length > 0) {
      relationsParams = '?' + relations.map((relation) => `with[]=${relation}`).join('&');
    }

    // Construir la URL completa
    const fullUrl = this.baseUrl + url + relationsParams;

    return this.http.get<ApiResponse>(fullUrl, { headers: this.getHeaders() });
  }

  getAll(url: string) {
    return this.http.get<ApiResponse>(this.baseUrl + url + '/all',
      { headers: this.getHeaders()});
  }

  list(model: string, numPage: number = 1, perPage: number = 10, order: string = 'desc', orderColumn: string = 'id',
       search: string = '', exclude: string = '', user: any = null,
       filter: string = '', relations: any = []): Observable < ApiResponse > {


    let relationsParams = '';
    if (relations.length > 0) {
      relationsParams = relations.map((relation: string) => `&with[]=${relation}`).join('');
    }

    // Construir la URL completa
    const url = this.baseUrl + model + '?perPage=' + perPage + '&page=' + numPage + '&order=' + order
      + '&orderColumn=' + orderColumn + '&search=' + search + '&exclude=' + exclude + filter + relationsParams;

    return this.http.get<ApiResponse>(url,
      { headers: this.getHeaders() });
  }


  login(model: string, data: any): Observable < ApiResponse > {
    return this.http.post<ApiResponse>(this.baseUrl + model, data, {headers: this.getHeadersLogin()});
  }

  recoverPassword(model: string, data: any, id: any): Observable < ApiResponse > {
    return this.http.put<ApiResponse>(this.baseUrl + model+ '/' + id, data, {headers: this.getHeadersLogin()});
  }

  create(model: string, data: any): Observable < ApiResponse > {
    return this.http.post<ApiResponse>(this.baseUrl + model, data, { headers: this.getHeaders() });
  }

  post(model: string, data: any): Observable < ApiResponse > {
    return this.http.post<ApiResponse>(this.baseUrl + model, data, { headers: this.getHeaders() });
  }

  update(model: string, data: any, id: any): Observable < ApiResponse > {
    return this.http.put<ApiResponse>(this.baseUrl + model + '/' + id, data, { headers: this.getHeaders() });
  }

  massiveUpdate(model: string, data: any): Observable < ApiResponse > {
    return this.http.put<ApiResponse>(this.baseUrl + model + '/multiple', data, { headers: this.getHeaders() });
  }

  delete(model: string, id: number): Observable < ApiResponse > {
    return this.http.delete<ApiResponse>(this.baseUrl + model + '/' + id, { headers: this.getHeaders() });
  }

  getById(model: string, id: any): Observable < ApiResponse > {
    return this.http.get<ApiResponse>(this.baseUrl + model + '/' + id, { headers: this.getHeaders() });
  }

}
