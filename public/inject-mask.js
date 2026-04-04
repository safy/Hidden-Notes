/**
 * @file: inject-mask.js
 * @description: Web Accessible Resource - works in page context
 * Allows intercepting paste events everywhere, including iframes
 * @dependencies: Must be injected by Content Script
 */

console.log('🔐 Inject-mask.js loaded in page context');

// Magic strings as constants
const MESSAGE_TYPES = {
  CHECK_MASK: 'CHECK_CLIPBOARD_MASK',
  MASK_RESULT: 'CLIPBOARD_MASK_RESULT'
};

const MESSAGE_SOURCES = {
  WAR: 'hidden-notes-mask',
  CONTENT_SCRIPT: 'hidden-notes-mask-content-script'
};

const STORAGE_PREFIX = 'masked_';

/**
 * Initializes clipboard masking in page context
 * Intercepts paste events everywhere on page and in iframes
 */
function initClipboardMaskingInPageContext() {
  console.log('🔐 Initializing masking in page context (can access iframes)');

  // Listen for paste events everywhere on the page (including inside iframes)
  document.addEventListener('paste', handlePasteInPageContext, true);

  // Listen for messages from Content Script
  window.addEventListener('message', handleMessageFromContentScript);
}

/**
 * Paste event handler in page context
 * Can intercept paste everywhere, including in iframes
 * @param {ClipboardEvent} event - The paste event
 */
async function handlePasteInPageContext(event) {
  try {
    const target = event.target;

    // Check if this is an input field
    if (!isInputElement(target)) {
      return;
    }

    // Ask Content Script: is there a hidden data flag?
    const origin = window.location.origin || '*';
    window.postMessage({
      type: MESSAGE_TYPES.CHECK_MASK,
      source: MESSAGE_SOURCES.WAR,
    }, origin);

    // Store reference to target element and event
    globalThis._currentPasteEvent = {
      event: event,
      target: target,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Error in paste handler:', error);
  }
}

/**
 * Message handler from Content Script
 * @param {MessageEvent} event - The message event
 */
function handleMessageFromContentScript(event) {
  if (event.source !== window) return;
  if (event.origin !== window.location.origin && event.origin !== '*') return;
  if (event.data.source !== MESSAGE_SOURCES.CONTENT_SCRIPT) return;

  if (event.data.type === MESSAGE_TYPES.MASK_RESULT) {
    if (!event.data.hasMask) {
      return; // Regular data, no masking needed
    }

    // There is a hidden data flag, mask it
    const pasteData = globalThis._currentPasteEvent;
    if (!pasteData) return;

    const { event: pasteEvent, target } = pasteData;

    // Get data from clipboard
    navigator.clipboard.read().then((items) => {
      if (items.length === 0) {
        console.warn('[WARN] Clipboard is empty');
        return;
      }

      const item = items[0];
      if (!item.types.includes('text/plain')) {
        console.warn('[WARN] Clipboard does not contain text data');
        return;
      }

      item.getType('text/plain').then((blob) => {
        blob.text().then((realData) => {
          // Intercept paste
          pasteEvent.preventDefault();
          pasteEvent.stopPropagation();

          // Insert real data
          if (target instanceof HTMLInputElement) {
            target.value = realData;
          } else if (target instanceof HTMLTextAreaElement) {
            target.value = realData;
          }

          // Mask visually
          const maskedData = '*'.repeat(realData.length);
          target.value = maskedData;
          target.readOnly = true;
          target.style.letterSpacing = '0.5em';

          // Save real data
          const inputId = target.id || `${STORAGE_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem(`${STORAGE_PREFIX}${inputId}`, realData);
          target.id = inputId;

          // Intercept form submission
          const form = target.closest('form');
          if (form) {
            // Only attach listener once per form
            if (!form.maskingListenerAttached) {
              form.maskingListenerAttached = true;
              form.addEventListener('submit', () => {
                const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${inputId}`);
                if (stored) {
                  target.value = stored;
                }
              });
            }
          }

          console.log('✅ Hidden data masked in page context');
        });
      });
    }).catch((error) => {
      console.error('[ERROR] Failed to read clipboard:', error);
      // Restore original paste behavior
      return;
    });
  }
}

/**
 * Check if element is an input field
 * @param {Element} element - The element to check
 * @returns {boolean} True if element is an input, textarea, or contentEditable
 */
function isInputElement(element) {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element && element.contentEditable === 'true')
  );
}

// Initialize on load
initClipboardMaskingInPageContext();
