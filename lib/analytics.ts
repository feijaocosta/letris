import { ANALYTICS, analyticsEnabled } from '../config/analytics';
import { getLanguage } from './i18n';

// GA4 via gtag.js, carregado pelo bundle (a CSP não permite script inline).
// Só é iniciado depois do consentimento. Em localhost/dev o gtag existe
// (os eventos vão para window.dataLayer, útil em teste) mas o script do
// Google não é carregado, para não sujar as métricas.
//
// Todo evento leva o idioma do jogo (game_language) e a versão do app
// (game_version), que também ficam como propriedades do usuário: dá para
// ver quantos jogadores ainda estão em versões antigas. No GA4 é preciso
// registrar os dois como dimensões personalizadas (Admin → Definições
// personalizadas) para aparecerem nos relatórios.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;
let allowed = false;
let reportedLanguage: string | null = null;

const isLocal = () =>
  import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname);

const displayMode = () =>
  window.matchMedia('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone
    ? 'app'
    : 'navegador';

function startAnalytics() {
  if (!analyticsEnabled || started) return;
  started = true;

  window.dataLayer = window.dataLayer || [];
  // gtag.js espera o objeto `arguments`, não um array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  if (!isLocal()) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.measurementId}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS.measurementId, { game_version: __APP_VERSION__ });
  window.gtag('set', 'user_properties', { display_mode: displayMode(), game_version: __APP_VERSION__ });
}

/** Liga (após o aceite) ou desliga (se o jogador mudar para recusar) a medição. */
export function setAnalyticsAllowed(value: boolean) {
  allowed = value;
  (window as unknown as Record<string, boolean>)[`ga-disable-${ANALYTICS.measurementId}`] = !value;
  if (value) startAnalytics();
}

/** Registra um evento. Sem consentimento (ou sem ID) não faz nada. */
export function track(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!allowed || !started || !window.gtag) return;
  try {
    const language = getLanguage();
    if (language !== reportedLanguage) {
      reportedLanguage = language;
      window.gtag('set', 'user_properties', { game_language: language });
    }
    window.gtag('event', name, { ...params, game_language: language, game_version: __APP_VERSION__ });
  } catch {
    // métrica nunca pode quebrar o jogo
  }
}
