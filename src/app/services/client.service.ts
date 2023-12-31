import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import {ApiResponse} from '../interface/api-response';

@Injectable({
  providedIn: 'root'
})
export class ClientService extends ApiService {

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  getClientVoucher(code:string, clientId:number) {
    const url = this.baseUrl + '/slug/client/'+clientId+'/voucher/'+code;
    return this.http.get<ApiResponse>(url, { headers: this.getHeaders() });
  }

}
