import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ApiErrorShape {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | string> | null;
  code?: string | number | null;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let apiError: ApiErrorShape = {
          success: false,
          message: 'Unexpected error',
          errors: null,
          code: error.status,
        };
        if (error.error) {
          const e = error.error;
          apiError = {
            success: !!e.success === false,
            message: e.message || error.message || 'Unexpected error',
            errors: e.errors || null,
            code: e.code ?? error.status,
          };
        }
        return throwError(() => apiError);
      })
    );
  }
}

