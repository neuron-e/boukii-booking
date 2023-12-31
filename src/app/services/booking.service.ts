import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class BookingService extends ApiService {

  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
  }

  checkOverlap(bookingUsers: any) {
    const url = this.baseUrl + '/slug/bookings/checkbooking';
    return this.http.post(url, {'bookingUsers': bookingUsers}, { headers: this.getHeaders() });
  }

  createBooking(bookingData: any) {
    const url = this.baseUrl + '/slug/bookings';
    return this.http.post(url, bookingData, { headers: this.getHeaders() });
  }

}
