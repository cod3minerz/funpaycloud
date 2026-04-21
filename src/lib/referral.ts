'use client';

const REFERRAL_STORAGE_KEY = 'fp_referral_code';

const REFERRAL_CODE_RE = /^[A-Z0-9]{4,20}$/;

export function normalizeReferralCode(value: string): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isReferralCodeValid(code: string): boolean {
  return REFERRAL_CODE_RE.test(code);
}

export function readStoredReferralCode(): string {
  if (typeof window === 'undefined') return '';
  const value = window.localStorage.getItem(REFERRAL_STORAGE_KEY) || '';
  const normalized = normalizeReferralCode(value);
  return isReferralCodeValid(normalized) ? normalized : '';
}

export function storeReferralCode(code: string): string {
  const normalized = normalizeReferralCode(code);
  if (typeof window === 'undefined') return normalized;
  if (isReferralCodeValid(normalized)) {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
    return normalized;
  }
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
  return '';
}

export function clearStoredReferralCode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
}
