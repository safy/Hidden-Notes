/**
 * @file: useHiddenTextReveal.ts
 * @description: Hook для раскрытия скрытого текста при Alt+hover
 * @created: 2025-10-17
 */

import { useEffect } from 'react';

export function useHiddenTextReveal() {
  useEffect(() => {
    let isAltPressed = false;
    let hoveredElement: HTMLElement | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser menu
        isAltPressed = true;
        updateHoveredElement();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser menu
        isAltPressed = false;
        updateHoveredElement();
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hiddenTextElement = target.closest('.hidden-text') as HTMLElement;
      
      if (hiddenTextElement) {
        hoveredElement = hiddenTextElement;
        updateHoveredElement();
      } else {
        hoveredElement = null;
        updateHoveredElement();
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const hiddenTextElement = target.closest('.hidden-text') as HTMLElement;
      
      if (hiddenTextElement) {
        hoveredElement = null;
        updateHoveredElement();
      }
    };

    const updateHoveredElement = () => {
      // Clear all reveals first
      const allHiddenTexts = document.querySelectorAll('.hidden-text');
      allHiddenTexts.forEach((element) => {
        const htmlElement = element as HTMLElement;
        htmlElement.style.background = '';
        htmlElement.style.color = '';
        htmlElement.style.animation = '';
        htmlElement.style.padding = '';
        htmlElement.removeAttribute('data-revealing');
      });

      // Reveal only if Alt is pressed AND hovering over hidden text
      if (isAltPressed && hoveredElement) {
        hoveredElement.style.background = 'none';
        hoveredElement.style.color = 'rgb(2, 8, 23)';
        hoveredElement.style.animation = 'none';
        hoveredElement.style.padding = '0';
        hoveredElement.setAttribute('data-revealing', 'true');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);
}
