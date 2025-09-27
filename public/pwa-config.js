// PWA Configuration - Simplified
(function() {
  'use strict';
  
  // Simple PWA initialization
  const initPWA = () => {
    console.log('PWA configuration loaded');
    
    // Add basic meta tags if not present
    const metaTags = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'LETRIS' },
      { name: 'theme-color', content: '#06b6d4' }
    ];
    
    metaTags.forEach(tag => {
      if (!document.querySelector(`meta[name="${tag.name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
  } else {
    initPWA();
  }
  
  // Expose PWA utilities globally
  window.PWAUtils = {
    initPWA
  };
})();