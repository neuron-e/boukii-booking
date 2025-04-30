import { Injectable } from '@angular/core';


import { Resolve, Router } from '@angular/router';

import { ActivatedRouteSnapshot } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { SchoolService } from '../services/school.service';

@Injectable()
export class SlugResolver implements Resolve<any> {
  constructor(private schoolService: SchoolService, private router: Router) { }

  resolve(route: ActivatedRouteSnapshot) {
    const slug = route.paramMap.get('slug') ?? '';
    return this.schoolService.fetchSchoolData(slug).pipe(catchError(err => {
      this.router.navigate(["/404"], { skipLocationChange: true });
      return '';
    }));
  }
}
