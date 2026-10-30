import { KERUX } from '../config/ads';

// Kerux Ads: carrega o sdk.js sob demanda e mostra anúncios quando o Google
// não tem. Qualquer erro (sem internet, script bloqueado) vira "sem anúncio"
// e o jogo segue. API do SDK: docs/integracao.md no repositório do Kerux.

interface KeruxCliente {
  mostrar(
    posicao: string,
    elemento: Element,
    opcoes?: { aoFechar?: () => void; fecharApos?: number },
  ): Promise<boolean>;
}

declare global {
  interface Window {
    Kerux?: { init(config: object): KeruxCliente };
  }
}

const SDK_TIMEOUT_MS = 3000;

/**
 * Modo atual do Kerux. Nos testes (build E2E) dá para trocar com
 * window.__letrisKeruxModo, para cobrir os dois modos.
 */
export function keruxModo(): 'principal' | 'fallback' | null {
  if (__E2E__) {
    const modo = (window as { __letrisKeruxModo?: 'principal' | 'fallback' }).__letrisKeruxModo;
    if (modo && KERUX) return modo;
  }
  return KERUX?.modo ?? null;
}
let sdk: Promise<boolean> | undefined;

/** Carrega o sdk.js uma vez. Se falhar, a próxima chamada tenta de novo. */
function carregarSdk(): Promise<boolean> {
  if (!KERUX) return Promise.resolve(false);
  if (window.Kerux) return Promise.resolve(true);
  const url = KERUX.sdk;
  sdk ??= new Promise<boolean>(resolve => {
    const script = document.createElement('script');
    script.async = true;
    script.src = url;
    const timer = setTimeout(() => resolve(false), SDK_TIMEOUT_MS);
    script.onload = () => { clearTimeout(timer); resolve(!!window.Kerux); };
    script.onerror = () => { clearTimeout(timer); resolve(false); };
    document.head.appendChild(script);
  }).then(ok => {
    if (!ok) sdk = undefined;
    return ok;
  });
  return sdk;
}

async function cliente(idioma: string): Promise<KeruxCliente | null> {
  if (!KERUX || !(await carregarSdk()) || !window.Kerux) return null;
  return window.Kerux.init({
    site: KERUX.site,
    chave: KERUX.chave,
    idioma,
  });
}

/** Mostra o banner do Kerux dentro do elemento. Resolve `true` se mostrou. */
export async function keruxBanner(elemento: Element, idioma: string): Promise<boolean> {
  try {
    const ads = await cliente(idioma);
    return !!ads && !!KERUX && (await ads.mostrar(KERUX.posicoes.banner, elemento));
  } catch {
    return false;
  }
}

/**
 * Tela cheia do Kerux por cima do jogo. Resolve quando o jogador fecha o
 * anúncio, ou logo, se não houver anúncio.
 */
export async function keruxTelaCheia(idioma: string): Promise<void> {
  const config = KERUX;
  const ads = await cliente(idioma).catch(() => null);
  if (!ads || !config) return;

  const fundo = document.createElement('div');
  fundo.dataset.keruxTelaCheia = '';
  fundo.style.cssText =
    'position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);' +
    'background:var(--color-ink, #2a1f38)';
  const area = document.createElement('div');
  area.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
  const espaco = document.createElement('div');
  area.appendChild(espaco);
  fundo.appendChild(area);
  document.body.appendChild(fundo);
  // Formato tela cheia vertical (9:16), o maior que couber na área segura.
  // Medido em px (sem vh/dvh, que variam no Safari do iPhone).
  const largura = Math.min(area.clientWidth, (area.clientHeight * 9) / 16);
  espaco.style.cssText = `width:${largura}px;height:${(largura * 16) / 9}px`;

  await new Promise<void>(resolve => {
    ads
      .mostrar(config.posicoes.telaCheia, espaco, { fecharApos: config.fecharApos, aoFechar: resolve })
      .catch(() => resolve());
  });
  fundo.remove();
}
