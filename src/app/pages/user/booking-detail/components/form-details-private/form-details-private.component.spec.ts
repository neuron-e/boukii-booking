import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDetailsPrivateComponent } from './form-details-private.component';

describe('FormDetailsPrivateComponent', () => {
  let component: FormDetailsPrivateComponent;
  let fixture: ComponentFixture<FormDetailsPrivateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormDetailsPrivateComponent]
    });
    fixture = TestBed.createComponent(FormDetailsPrivateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
