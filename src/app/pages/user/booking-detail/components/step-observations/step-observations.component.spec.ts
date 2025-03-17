import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepObservationsComponent } from './step-observations.component';

describe('StepObservationsComponent', () => {
  let component: StepObservationsComponent;
  let fixture: ComponentFixture<StepObservationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StepObservationsComponent]
    });
    fixture = TestBed.createComponent(StepObservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
