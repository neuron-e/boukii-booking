import { Component, OnInit, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ThemeService } from '../../services/theme.service';
import { ClientService } from '../../services/client.service';
import { ApiCrudService } from 'src/app/services/crud.service';
import { SchoolService } from '../../services/school.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-modal-voucher',
  templateUrl: './modal-voucher.component.html',
  styleUrls: ['./modal-voucher.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ]),
  ]
})
export class ModalVoucherComponent implements OnInit, OnChanges  {

  @Input() isOpen: boolean = false;
  @Input() slug: string;
  @Input() vouchers: any[] = []; // Changed to array of vouchers
  @Output() onClose = new EventEmitter<any>();
  bonuses: any[] = [];
  code: string = '';
  bonus: any;
  loading = false;
  currencyCode = 'CHF';
  private clientId: number | null = null;
  private schoolId: number | null = null;

  constructor(
    public themeService: ThemeService,
    private clientService: ClientService,
    private crudService: ApiCrudService,
    private schoolService: SchoolService,
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.bonus = null;
    this.code = '';

    this.schoolService.getSchoolData().subscribe((data) => {
      if (!data) {
        this.bonuses = [];
        return;
      }

      this.schoolId = data?.data?.id ?? data?.id ?? null;
      this.currencyCode = data?.data?.currency || data?.data?.taxes?.currency || data?.currency || this.currencyCode;

      const storageKey = `${this.slug}-boukiiUser`;
      const storedUser = localStorage.getItem(storageKey);

      if (!storedUser) {
        this.bonuses = [];
        return;
      }

      let userLogged: any = null;
      try {
        userLogged = JSON.parse(storedUser);
      } catch (error) {
        userLogged = null;
      }

      this.clientId = userLogged?.clients?.[0]?.id ?? null;

      if (!this.schoolId) {
        this.bonuses = [];
        return;
      }

      const userVouchers$ = this.clientId
        ? this.crudService.list(
            '/vouchers',
            1,
            10000,
            'desc',
            'id',
            '',
            '',
            null,
            `&school_id=${this.schoolId}&client_id=${this.clientId}&payed=0`
          )
        : of({ data: [] });

      const genericVouchers$ = this.crudService.get(
        `/vouchers/generic?school_id=${this.schoolId}&available_only=1`
      );

      this.loading = true;
      forkJoin([userVouchers$, genericVouchers$]).subscribe({
        next: ([userResponse, genericResponse]) => {
          const userBonuses = this.ensureArray(userResponse?.data);
          const genericBonuses = this.ensureArray(genericResponse?.data);
          const merged = this.mergeVoucherLists(this.bonuses, userBonuses, genericBonuses);
          this.bonuses = merged.filter(
            (voucher) => !voucher.payed && this.getRemainingBalance(voucher) > 0
          );
        },
        error: () => {
          this.bonuses = [];
        },
        complete: () => {
          this.loading = false;
        },
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.bonus = null;
      this.code = '';
    }
  }

  searchVoucher() {
    const trimmedCode = (this.code || '').trim();
    if (!trimmedCode) {
      this.showMessage(this.translateService.instant('text_select_client_voucher'));
      return;
    }

    this.loading = true;
    this.clientService
      .findVoucherByCode(trimmedCode, this.clientId ?? null)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const found = this.ensureArray(response?.data);
          if (!found.length) {
            this.showMessage(this.translateService.instant('text_voucher_not_found'));
            return;
          }

          const merged = this.mergeVoucherLists(this.bonuses, found);
          this.bonuses = merged.filter(
            (voucher) => !voucher.payed && this.getRemainingBalance(voucher) > 0
          );

          const selected = this.pickSelectableVoucher(found) ?? this.pickSelectableVoucher(this.bonuses);
          if (selected) {
            this.bonus = selected;
          }
          this.code = '';
        },
        error: (error) => {
          const reasons = error?.error?.errors?.reasons;
          const message = Array.isArray(reasons) && reasons.length
            ? reasons.join(', ')
            : error?.error?.message || this.translateService.instant('text_voucher_not_available');
          this.showMessage(message);
        },
      });
  }

  private ensureArray(data: any): any[] {
    if (!data) {
      return [];
    }
    return Array.isArray(data) ? data : [data];
  }

  private mergeVoucherLists(...lists: any[][]): any[] {
    const voucherMap = new Map<number, any>();

    lists
      .filter(Boolean)
      .forEach((list) => {
        list.forEach((item) => {
          const normalized = this.normalizeVoucher(item);
          if (!normalized?.id) {
            return;
          }
          const existing = voucherMap.get(normalized.id);
          voucherMap.set(
            normalized.id,
            existing ? { ...existing, ...normalized } : normalized
          );
        });
      });

    return Array.from(voucherMap.values());
  }

  private normalizeVoucher(voucher: any): any | null {
    if (!voucher) {
      return null;
    }

    const normalized = { ...voucher };
    normalized.id = Number(normalized.id ?? normalized.voucher_id ?? null);
    if (!normalized.id) {
      return null;
    }

    normalized.remaining_balance = this.toNumber(
      normalized.remaining_balance ?? normalized.remaining_balance_after
    );
    normalized.quantity = this.toNumber(normalized.quantity);
    if (normalized.reducePrice !== undefined) {
      normalized.reducePrice = this.toNumber(normalized.reducePrice);
    }
    normalized.is_generic =
      normalized.is_generic !== undefined
        ? normalized.is_generic
        : normalized.client_id == null;

    return normalized;
  }

  private toNumber(value: any): number {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private getRemainingBalance(voucher: any): number {
    return this.toNumber(voucher?.remaining_balance ?? voucher?.remaining_balance_after);
  }

  private pickSelectableVoucher(candidates: any[]): any | null {
    if (!Array.isArray(candidates)) {
      return null;
    }

    for (const candidate of candidates) {
      const normalized = this.normalizeVoucher(candidate);
      if (!normalized?.id) {
        continue;
      }

      const match = this.bonuses.find((bonus) => bonus.id === normalized.id);
      if (
        match &&
        !this.isInUse(match.id) &&
        !match.payed &&
        this.getRemainingBalance(match) > 0
      ) {
        return match;
      }
    }

    return null;
  }

  private showMessage(message: string) {
    const text = message || this.translateService.instant('text_voucher_not_available');
    this.snackBar.open(text, 'OK', { duration: 3500 });
  }

  confirmSelection() {
    if (this.bonus) {
      this.onClose.emit(this.bonus);
    }
  }

  closeModal() {
    this.onClose.emit();
  }

  isInUse(id: number) {
    // Check if voucher is already used
    return this.vouchers.some(v => v.id === id);
  }
}
