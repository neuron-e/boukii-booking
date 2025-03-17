import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDetailsColectiveFixComponent } from './form-details-colective-fix.component';

describe('FormDetailsColectiveFixComponent', () => {
  let component: FormDetailsColectiveFixComponent;
  let fixture: ComponentFixture<FormDetailsColectiveFixComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormDetailsColectiveFixComponent]
    });
    fixture = TestBed.createComponent(FormDetailsColectiveFixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
