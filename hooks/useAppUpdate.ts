import { useState, useEffect, useCallback } from 'react';
import { track } from '../lib/analytics';

// Verifica se existe uma versão publicada mais nova que a que está rodando.
// A versão atual vem embutida no bundle (__APP_VERSION__); a publicada vem de
// version.json, que não entra no precache do Service Worker e é buscado sem
// cache. Não registra Service Worker (isso é do vite-plugin-pwa).

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos com o app aberto
const VERSION_PARAM = 'v';

async function fetchPublishedVersion(): Promise<string | null> {
  try {
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.version === 'string' ? data.version : null;
  } catch {
    return null; // offline ou erro de rede: tenta de novo depois
  }
}

export function useAppUpdate() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (import.meta.env.DEV) return;
    const published = await fetchPublishedVersion();
    if (published && published !== __APP_VERSION__) {
      setNewVersion(published);
    }
    // Aproveita para o navegador também checar o sw.js
    navigator.serviceWorker?.getRegistration().then(reg => reg?.update()).catch(() => {});
  }, []);

  useEffect(() => {
    // Remove da URL o parâmetro usado para furar o cache na atualização
    const url = new URL(window.location.href);
    if (url.searchParams.has(VERSION_PARAM)) {
      url.searchParams.delete(VERSION_PARAM);
      window.history.replaceState(null, '', url.toString());
    }

    checkForUpdate();

    // No PWA instalado o app costuma voltar do segundo plano em vez de abrir
    // do zero, então checa também quando ele fica visível de novo.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', checkForUpdate);
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', checkForUpdate);
      clearInterval(interval);
    };
  }, [checkForUpdate]);

  // Força a atualização: remove o Service Worker e todo o cache dele e
  // recarrega a página direto da rede. O vite-plugin-pwa registra o SW
  // novo assim que a página carrega.
  const applyUpdate = useCallback(async () => {
    track('app_update');
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set(VERSION_PARAM, newVersion ?? String(Date.now()));
      window.location.replace(url.toString());
    }
  }, [newVersion]);

  return {
    currentVersion: __APP_VERSION__,
    updateAvailable: newVersion !== null,
    isUpdating,
    applyUpdate,
  };
}

export default useAppUpdate;
