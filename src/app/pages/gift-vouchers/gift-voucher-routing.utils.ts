import { ActivatedRoute } from '@angular/router';

export function extractGiftVoucherSlug(route: ActivatedRoute): string | null {
  let current: ActivatedRoute | null = route;

  while (current) {
    const slug = current.snapshot.paramMap.get('slug');
    if (slug) {
      return slug;
    }
    current = current.parent;
  }

  return null;
}

export function buildGiftVoucherLink(slug: string | null, child: string): string {
  const base = slug ? `/${slug}/gift-vouchers` : '/gift-vouchers';
  if (!child) {
    return base;
  }
  return `${base}/${child}`;
}

export function buildGiftVoucherCommands(slug: string | null, child: string): any[] {
  if (slug) {
    return ['/', slug, 'gift-vouchers', child];
  }
  return ['/gift-vouchers', child];
}
