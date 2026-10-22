import React from 'react';
import { usePWA } from '../hooks/usePWA';

export function PWAStatus() {
  const { isOnline, isStandalone, isInstalled } = usePWA();
  
  // Only show status in development or when there's something to show
  const shouldShowStatus = process.env.NODE_ENV === 'development' || isStandalone || !isOnline;
  
  if (!shouldShowStatus) {
    return null;
  }
  
  return (
    <div className="fixed left-2 z-30 flex gap-1" style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
      {/* Online/Offline Status - only show when offline */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
          📶 Offline
        </div>
      )}
      
      {/* PWA Status */}
      {isStandalone && (
        <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          📱 PWA
        </div>
      )}
      
      {/* Development indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          🔧 Dev
        </div>
      )}
    </div>
  );
}

export default PWAStatus;