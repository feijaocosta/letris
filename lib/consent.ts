import { setAnalyticsAllowed } from './analytics';
import { setAdsPersonalized } from './ads';
import { load, save } from './storage';

// Consentimento de cookies (LGPD). Sem resposta = recusado: nada de
// Analytics e só anúncios não personalizados.

export type Consent = 'granted' | 'denied' | null;

const KEY = 'consent';

export function getConsent(): Consent {
  return load<Consent>(KEY, null);
}

/** Aplica a escolha salva (chamado ao abrir o app). */
export function applyConsent(consent: Consent = getConsent()) {
  setAdsPersonalized(consent === 'granted');
  setAnalyticsAllowed(consent === 'granted');
}

export function setConsent(consent: 'granted' | 'denied') {
  save(KEY, consent);
  applyConsent(consent);
}
