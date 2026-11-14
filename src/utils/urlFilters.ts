export interface ParsedUrlFilters {
  unit: 'all' | 'Unit 1' | 'Unit 2' | 'Unit 3';
  flockId: 'all' | '8' | '9' | '10';
  from: string;
  to: string;
  month: string;
  year: string;
  head: string;
  hasDateRange: boolean;
}

const VALID_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeUnitParam(raw?: string | null): 'all' | 'Unit 1' | 'Unit 2' | 'Unit 3' {
  if (!raw) return 'all';
  const v = raw.trim().toLowerCase();
  if (v === 'unit 1' || v === 'unit1' || v === '8') return 'Unit 1';
  if (v === 'unit 2' || v === 'unit2' || v === '9') return 'Unit 2';
  if (v === 'unit 3' || v === 'unit3' || v === '10') return 'Unit 3';
  return 'all';
}

export function unitToFlockId(unit: 'all' | 'Unit 1' | 'Unit 2' | 'Unit 3'): 'all' | '8' | '9' | '10' {
  if (unit === 'Unit 1') return '8';
  if (unit === 'Unit 2') return '9';
  if (unit === 'Unit 3') return '10';
  return 'all';
}

export function getInitialUrlFilters(): ParsedUrlFilters {
  if (typeof window === 'undefined') {
    return {
      unit: 'all',
      flockId: 'all',
      from: '',
      to: '',
      month: '',
      year: '',
      head: 'all',
      hasDateRange: false,
    };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const unit = normalizeUnitParam(params.get('unit'));
    const flockId = unitToFlockId(unit);
    const rawFrom = (params.get('from') || '').trim();
    const rawTo = (params.get('to') || '').trim();
    const from = VALID_DATE_RE.test(rawFrom) ? rawFrom : '';
    const to = VALID_DATE_RE.test(rawTo) ? rawTo : '';
    const month = (params.get('month') || '').trim();
    const year = (params.get('year') || '').trim();
    const head = (params.get('head') || '').trim() || 'all';

    return {
      unit,
      flockId,
      from,
      to,
      month,
      year,
      head,
      hasDateRange: Boolean(from || to),
    };
  } catch {
    return {
      unit: 'all',
      flockId: 'all',
      from: '',
      to: '',
      month: '',
      year: '',
      head: 'all',
      hasDateRange: false,
    };
  }
}
