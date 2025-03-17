import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormDetailsActivityComponent } from './form-details-activity.component';

describe('FormDetailsActivityComponent', () => {
  let component: FormDetailsActivityComponent;
  let fixture: ComponentFixture<FormDetailsActivityComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormDetailsActivityComponent]
    });
    fixture = TestBed.createComponent(FormDetailsActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
