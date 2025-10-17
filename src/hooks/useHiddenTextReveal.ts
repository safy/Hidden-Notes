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
        isAltPressed = true;
        console.log('🔑 Alt pressed!');
        updateHiddenTexts();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressed = false;
        console.log('🔑 Alt released!');
        updateHiddenTexts();
      }
    };

    const updateHiddenTexts = () => {
      const hiddenTexts = document.querySelectorAll('.hidden-text');
      console.log('📝 Found hidden texts:', hiddenTexts.length);
      
      hiddenTexts.forEach((element, index) => {
        if (isAltPressed) {
          element.setAttribute('data-revealing', 'true');
          console.log(`  ✅ Revealed element ${index}`);
        } else {
          element.removeAttribute('data-revealing');
          console.log(`  ❌ Hidden element ${index}`);
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
