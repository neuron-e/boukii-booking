import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalVoucherComponent } from './modal-voucher.component';

describe('ModalVoucherComponent', () => {
  let component: ModalVoucherComponent;
  let fixture: ComponentFixture<ModalVoucherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalVoucherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalVoucherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
