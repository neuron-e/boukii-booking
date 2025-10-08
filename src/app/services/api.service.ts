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
    const resolvedSlug = this.resolveSlug(slug);
    let headers = new HttpHeaders().set('content-type', 'application/json');
    if (resolvedSlug) {
      headers = headers.set('slug', resolvedSlug);
    }
    return headers;
  }

  protected resolveSlug(explicitSlug: string | null | undefined = ''): string {
    if (explicitSlug && explicitSlug.trim().length > 0) {
      this.slug = explicitSlug;
      return explicitSlug;
    }
    if (this.slug && this.slug.length > 0) {
      return this.slug;
    }
    const routeSlug = this.extractSlugFromRoute(this.route.snapshot);
    if (routeSlug && routeSlug.length > 0) {
      this.slug = routeSlug;
      return routeSlug;
    }
    const urlSlug = this.extractSlugFromUrl();
    if (urlSlug && urlSlug.length > 0) {
      this.slug = urlSlug;
      return urlSlug;
    }
    return '';
  }

  protected extractSlugFromUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    const segments = window.location.pathname
      .split('/')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);
    if (segments.length === 0) {
      return '';
    }
    const candidate = segments[0];
    if (candidate.toLowerCase() === '404') {
      return '';
    }
    return candidate;
  }

  // @ts-ignore
  extractSlugFromRoute(route: ActivatedRouteSnapshot): string {
    let childRoute = route.firstChild;
    while (childRoute) {
      if (childRoute.params['slug']) {
        this.slug = childRoute.params['slug'];
        return childRoute.params['slug'];
      }
      childRoute = childRoute.firstChild;
    }
    return '';
  }

  getHeadersLogin(): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers
      .set('content-type', 'application/json');

    return headers;
  }
}

