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
        updateHiddenTexts();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        isAltPressed = false;
        updateHiddenTexts();
      }
    };

    const updateHiddenTexts = () => {
      const hiddenTexts = document.querySelectorAll('.hidden-text');
      hiddenTexts.forEach((element) => {
        if (isAltPressed) {
          element.setAttribute('data-revealing', 'true');
        } else {
          element.removeAttribute('data-revealing');
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
