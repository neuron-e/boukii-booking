import { ErrorInterceptor } from './error-interceptor';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

describe('ErrorInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientModule],
    providers: [
      { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    ]
  }));

  it('should be created', () => {
    const interceptor = TestBed.inject(HTTP_INTERCEPTORS).find(p => (p as any).intercept) as any;
    expect(interceptor).toBeTruthy();
  });
});

