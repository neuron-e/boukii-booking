import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import {ActivatedRoute} from '@angular/router';

@Injectable()
export class SlugInterceptor implements HttpInterceptor {

  constructor(private route: ActivatedRoute) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const slug = this.route.snapshot.paramMap.get('slug') || '';

    const authReq = req.clone({
      headers: req.headers.set('slug', slug)
    });

    return next.handle(authReq);
  }
}
