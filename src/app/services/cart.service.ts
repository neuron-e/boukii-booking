import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  public carData = new BehaviorSubject<any>(null);

  constructor() { }

  getCartData(): Observable<any> {
    return this.carData.asObservable();
  }

}
