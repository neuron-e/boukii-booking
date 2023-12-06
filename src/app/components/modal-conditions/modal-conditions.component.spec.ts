import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConditionsComponent } from './modal-conditions.component';

describe('ModalConditionsComponent', () => {
  let component: ModalConditionsComponent;
  let fixture: ComponentFixture<ModalConditionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalConditionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConditionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
