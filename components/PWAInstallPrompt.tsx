import { useState, useEffect } from 'react';
import { Logo } from './LetrisUI';
import { useI18n } from '../lib/i18n';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    // Check if app is already installed or running as PWA
    const checkInstallStatus = () => {
      try {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                (window.navigator as any).standalone || 
                                document.referrer.includes('android-app://');
        setIsStandalone(isStandaloneMode);

        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Don't show prompt if already installed
        if (isStandaloneMode) {
          setIsInstalled(true);
          return;
        }

        // Check if user has already dismissed the prompt
        const hasShownPrompt = localStorage.getItem('pwa-install-dismissed');
        if (hasShownPrompt) {
          return;
        }

        // Show prompt after a short delay for better UX
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 2000);
      } catch (error) {
        console.warn('Error checking install status:', error);
      }
    };

    checkInstallStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      try {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      } catch (error) {
        console.warn('Error handling install prompt:', error);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      onInstall?.();
    };

    // Only add event listeners if supported
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      }
    };
  }, [onInstall]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallPrompt(false);
        onInstall?.();
      } else {
        console.log('User dismissed the install prompt');
        handleDismiss();
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#17111f]/90 flex items-center justify-center z-50 p-4 text-white">
      <div className="bg-ink border border-line rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="flex justify-center"><Logo size={30} gap={4} /></div>
        <div className="text-center">
          <h2 className="m-0 text-2xl font-black">{t('install.title')}</h2>
          <p className="m-0 mt-1 text-[15px] font-bold text-soft">{t('install.text')}</p>
        </div>

        {isIOS && !isStandalone ? (
          <div className="bg-panel rounded-2xl p-4 text-sm font-semibold text-chip">
            <p className="m-0 mb-2 font-black text-white">{t('install.iosTitle')}</p>
            <ol className="m-0 pl-5 flex flex-col gap-1">
              <li>{t('install.iosStep1')}</li>
              <li>{t('install.iosStep2')}</li>
              <li>{t('install.iosStep3')}</li>
            </ol>
          </div>
        ) : null}

        <div className="flex gap-2.5">
          {deferredPrompt && !isIOS ? (
            <button type="button" onClick={handleInstallClick}
              className="btn-3d flex-1 h-12 rounded-2xl bg-tile-green text-white font-black">
              {t('install.install')}
            </button>
          ) : (
            <button type="button" onClick={handleDismiss}
              className="btn-3d flex-1 h-12 rounded-2xl bg-tile-green text-white font-black">
              {t('common.gotIt')}
            </button>
          )}
          <button type="button" onClick={handleDismiss}
            className="flex-1 h-12 rounded-2xl bg-panel text-white font-extrabold">
            {t('install.notNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
