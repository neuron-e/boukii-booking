import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDetailsColectiveFlexComponent } from './form-details-colective-flex.component';

describe('FormDetailsColectiveFlexComponent', () => {
  let component: FormDetailsColectiveFlexComponent;
  let fixture: ComponentFixture<FormDetailsColectiveFlexComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormDetailsColectiveFlexComponent]
    });
    fixture = TestBed.createComponent(FormDetailsColectiveFlexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
