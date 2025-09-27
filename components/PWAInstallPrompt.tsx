import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 max-w-sm mx-4 text-center border-2 border-cyan-200 shadow-2xl">
        <div className="mb-6">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-cyan-800 mb-2">Instalar LETRIS</h2>
          <h3 className="text-lg font-semibold text-blue-700 mb-4">
            Jogue offline a qualquer hora!
          </h3>
        </div>
        
        <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-semibold text-gray-800 mb-2">Vantagens de instalar:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 🚀 Acesso mais rápido</li>
            <li>• 📱 Ícone na tela inicial</li>
            <li>• 🌐 Funciona offline</li>
            <li>• 📱 Experiência app nativo</li>
            <li>• 💾 Salva progresso local</li>
          </ul>
        </div>

        {isIOS && !isStandalone ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Para instalar no iOS:</strong>
            </p>
            <ol className="text-xs text-blue-700 text-left space-y-1">
              <li>1. Toque no botão compartilhar (📤)</li>
              <li>2. Role para baixo</li>
              <li>3. Toque em "Adicionar à Tela de Início"</li>
              <li>4. Toque em "Adicionar"</li>
            </ol>
          </div>
        ) : null}
        
        <div className="flex gap-3">
          {deferredPrompt && !isIOS ? (
            <Button 
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transform transition-all duration-200 hover:scale-105"
            >
              Instalar Agora! 📱
            </Button>
          ) : (
            <Button 
              onClick={handleDismiss}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg"
            >
              Entendi! 👍
            </Button>
          )}
          
          <Button 
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Agora não
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          Você pode instalar mais tarde através do menu do navegador
        </p>
      </Card>
    </div>
  );
}

export default PWAInstallPrompt;