import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ApiResponse } from '../interface/api-response';
import { BehaviorSubject, map, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SchoolService extends ApiService {
  isModalLogin: boolean = false
  isModalNewUser: boolean = false
  private schoolDataSubject = new BehaviorSubject<any>(null);
  private ongoingSchoolRequest: Observable<any> | null = null;
  constructor(http: HttpClient, route: ActivatedRoute) {
    super(http, route);
    //this.fetchSchoolData().subscribe();  // Llamada a fetchSchoolData al iniciar el servicio
  }

  fetchSchoolData(slug: string = ''): Observable<any> {

    const resolvedSlug = this.resolveSlug(slug);

    if (!resolvedSlug) {

      return of(null);

    }

    const cached = this.schoolDataSubject.getValue();

    if (cached && cached.data && cached.data.slug === resolvedSlug) {

      return of(cached);

    }

    if (this.ongoingSchoolRequest) {

      return this.ongoingSchoolRequest;

    }

    const url = `${this.baseUrl}/slug/school`;

    const headers = this.getHeaders(resolvedSlug);

    const request$ = this.http.get(url, { headers }).pipe(

      map((response: any) => {

        this.slug = resolvedSlug;

        this.setSchoolData(response);

        return response;

      }),

      catchError((error: any) => throwError(() => error)),

      shareReplay(1)

    );

    this.ongoingSchoolRequest = request$;

    return request$.pipe(

      finalize(() => {

        this.ongoingSchoolRequest = null;

      })

    );

  }



  getSchoolData(): Observable<any> {
    return this.schoolDataSubject.asObservable();
  }

  getSchools(): Observable<any[]> {
    const url = `${this.baseUrl}/api/public/schools`;

    return this.http.get<ApiResponse | any[]>(url).pipe(
      map((response: ApiResponse | any) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ApiResponse).data as any[];
        }

        return Array.isArray(response) ? response : [];
      }),
      catchError((error: any) => {
        console.error('Error fetching schools', error);
        return of([]);
      })
    );
  }

  private setSchoolData(data: any) {
    this.schoolDataSubject.next(data);
  }
}




