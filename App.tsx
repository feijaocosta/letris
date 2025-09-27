import React, { useEffect } from 'react';
import { LetrisGame } from './components/LetrisGame';

export default function App() {
  useEffect(() => {
    // Prevent default touch behaviors that interfere with the game
    const preventDefault = (e: Event) => e.preventDefault();
    
    // Prevent double-tap zoom
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent pinch zoom
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent context menu
    document.addEventListener('contextmenu', preventDefault);
    
    // Handle orientation change
    const handleOrientationChange = () => {
      // Small delay to ensure viewport is updated
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return (
    <LetrisGame />
  );
}