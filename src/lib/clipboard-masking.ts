/**
 * @file: clipboard-masking.ts
 * @description: Utilities for copying hidden text with metadata to clipboard
 * @dependencies: Clipboard API
 */

const MASK_FLAG_TYPE = 'application/x-hidden-notes-masked';

/**
 * Copies hidden text to clipboard with metadata
 * @param text - Real data to copy
 * @throws Error if Clipboard API is not available
 */
export async function copyHiddenText(text: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error('Clipboard API not available');
  }

  try {
    const textBlob = new Blob([text], { type: 'text/plain' });
    const maskBlob = new Blob(['true'], { type: MASK_FLAG_TYPE });

    const clipboardItem = new ClipboardItem({
      'text/plain': textBlob,
      [MASK_FLAG_TYPE]: maskBlob,
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('✅ Hidden text copied with mask metadata');
  } catch (error) {
    console.error('❌ Failed to copy hidden text:', error);
    throw error;
  }
}

/**
 * Checks if clipboard contains hidden data flag
 * @returns Promise<boolean>
 */
export async function isHiddenDataInClipboard(): Promise<boolean> {
  try {
    if (!navigator.clipboard) {
      return false;
    }

    const items = await navigator.clipboard.read();

    return items.some(item => item.types.includes(MASK_FLAG_TYPE));
  } catch (error) {
    console.warn('⚠️ Could not read clipboard:', error);
    return false;
  }
}

/**
 * Clears hidden data flag from clipboard
 * @returns Promise<void>
 */
export async function clearMaskFlag(): Promise<void> {
  try {
    if (!navigator.clipboard) {
      return;
    }

    // Read current clipboard contents
    const items = await navigator.clipboard.read();

    // Get text from first item
    const textBlob = await items[0].getType('text/plain');
    const text = await textBlob.text();

    // Write back without the mask metadata flag (only text/plain)
    const newClipboardItem = new ClipboardItem({
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([newClipboardItem]);
    console.log('✅ Mask flag cleared from clipboard');
  } catch (error) {
    console.warn('⚠️ Could not clear mask flag:', error);
    // Not critical, just log
  }
}
