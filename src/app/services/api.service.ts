import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  public baseUrl: string = environment.baseUrl;
  public slug: string = '';

  constructor(public http: HttpClient, protected route: ActivatedRoute) { }

  getHeaders(slug: string = ''): HttpHeaders {
    slug = slug || this.extractSlugFromRoute(this.route.snapshot);
    // const token = JSON.parse(localStorage.getItem('boukiiUserToken') || '');
    let headers = new HttpHeaders();
    headers = headers
      .set('content-type', 'application/json')
      .set('slug', slug)


    return headers;
  }

  // @ts-ignore
  extractSlugFromRoute(route: ActivatedRouteSnapshot): string {
    let childRoute = route.firstChild;
    while (childRoute) {
      if (childRoute.params['slug']) {
        this.slug == childRoute.params['slug'];
        return childRoute.params['slug'];
      }
      childRoute = childRoute.firstChild;
    }
  }

  getHeadersLogin(): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers
      .set('content-type', 'application/json');

    return headers;
  }
}
