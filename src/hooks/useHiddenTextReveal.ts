/**
 * @file: useHiddenTextReveal.ts
 * @description: Hook для раскрытия скрытого текста при Alt+hover
 * @created: 2025-10-17
 */

import { useEffect } from 'react';

export function useHiddenTextReveal() {
  useEffect(() => {
    let isAltPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser menu
        isAltPressed = true;
        updateHiddenTexts();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser menu
        isAltPressed = false;
        updateHiddenTexts();
      }
    };

    const updateHiddenTexts = () => {
      // Use querySelectorAll to find ALL hidden text elements
      const hiddenTexts = document.querySelectorAll('.hidden-text');
      
      hiddenTexts.forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        if (isAltPressed) {
          // Apply inline styles to reveal
          htmlElement.style.background = 'none';
          htmlElement.style.color = 'rgb(2, 8, 23)'; // Explicit black color
          htmlElement.style.animation = 'none';
          htmlElement.style.padding = '0';
          htmlElement.setAttribute('data-revealing', 'true');
        } else {
          // Remove inline styles to hide again
          htmlElement.style.background = '';
          htmlElement.style.color = '';
          htmlElement.style.animation = '';
          htmlElement.style.padding = '';
          htmlElement.removeAttribute('data-revealing');
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}
