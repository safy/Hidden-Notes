# Clipboard Masking System - Complete Guide

## Overview

Hidden Notes implements a sophisticated clipboard masking system for protecting sensitive data (passwords, API keys, credit cards) when copying between applications. The system provides visual masking on the destination website while maintaining the real data for form submission.

## How It Works

### Architecture Overview

The clipboard masking system consists of three main components:

1. **Core Utilities** (`src/lib/clipboard-masking.ts`)
   - `copyHiddenText()` - Adds metadata flag to clipboard
   - `isHiddenDataInClipboard()` - Detects masked data in clipboard
   - `clearMaskFlag()` - Removes metadata after use

2. **Content Script** (`src/content-scripts/clipboard-mask.ts`)
   - Intercepts paste events on web pages
   - Checks if clipboard has hidden data flag
   - Handles visual masking in input fields
   - Manages sessionStorage for real data
   - Intercepts form submissions to restore real data

3. **Web Accessible Resource** (`public/inject-mask.js`)
   - Runs in page context (not content script isolation)
   - Handles paste events in iframes (Stripe, PayPal, etc.)
   - Communicates with content script via `postMessage`

### Detailed Flow

#### Step 1: User Copies Hidden Text from Hidden Notes

```typescript
// In Hidden Notes app
await copyHiddenText(sensitiveData);
```

- Creates two blobs:
  - `text/plain` - The actual sensitive data
  - `application/x-hidden-notes-masked` - Flag indicating this is masked data
- Writes both to clipboard using Clipboard API

#### Step 2: User Pastes on External Website

```
1. User visits stripe.com, paypal.com, etc.
2. Content script listener detects paste event
3. Checks isHiddenDataInClipboard()
4. If flag exists:
   - Prevents default paste
   - Retrieves real data from clipboard
   - Inserts real data into form field
   - Visually masks display with asterisks
   - Stores real data in sessionStorage
5. On form submit:
   - Retrieves real data from sessionStorage
   - Replaces masked asterisks with real data
   - Form submitted with correct real data
```

#### Step 3: Data Lifecycle

**While Pasting (on external website):**
- Real data: Exists in input.value and sessionStorage
- Displayed: `*` characters with monospace font
- Visible: Masked (safe from screenshots/recordings)

**On Form Submit:**
- sessionStorage data is restored to input field
- Form is submitted with real data
- Server receives correct data

**On Tab Close:**
- sessionStorage is automatically cleared by browser
- Real data is permanently removed from memory
- No persistent storage of sensitive data

## Browser Support

### Required Features

| Feature | Browser Support | Notes |
|---------|-----------------|-------|
| Clipboard API | Chrome 66+, Edge 79+, Firefox 63+ | Optional - graceful fallback |
| sessionStorage | All modern browsers | Cleared on tab close |
| Content Scripts | All modern browsers | Extension requirement |
| postMessage | All browsers | For iframe communication |

### Minimum Browser Versions

- Chrome/Edge: 66+
- Firefox: 63+
- Safari: 13.1+ (Clipboard API added)

### Mobile Browsers

- Android Chrome: Supported
- iOS Safari: Limited support (Clipboard API behind flag)
- Note: Mobile paste events may behave differently

## Testing Instructions

### Unit Tests

```bash
# Run all unit tests
npm run test:unit:run

# Run clipboard masking tests specifically  
npm run test:unit:run -- tests/unit/clipboard-masking.test.ts

# Watch mode
npm run test:unit
```

### Manual Testing

#### Test Case 1: Basic Password Masking

1. Open Hidden Notes extension
2. Create a note with content: `TestPassword123`
3. Use copy button for hidden text
4. Open PayPal (paypal.com)
5. Click password field
6. Paste (Ctrl+V)
7. Verify: Field shows `*` characters, not password

#### Test Case 2: Form Submission

1. Follow Test Case 1
2. After masking appears:
   - Open DevTools Console
   - Run: `sessionStorage.getItem('masked_password_field')`
   - Verify: Shows real password
3. Submit form (if not account)
   - Real password is submitted
   - No asterisks sent to server

#### Test Case 3: Multiple Masked Inputs

1. Prepare two secrets: `Pass123` and `API_key_xyz`
2. Copy first secret to clipboard
3. Paste in email field - check masking
4. Copy second secret to clipboard
5. Paste in API key field - check masking
6. Both fields should mask independently

#### Test Case 4: Iframe Handling

1. Open Stripe checkout page
2. Card field is in iframe
3. Copy card number using copy button
4. Paste in Stripe card field
5. Verify: Shows masked asterisks (uses inject-mask.js)

#### Test Case 5: Session Cleanup

1. Complete masking test
2. Close entire browser tab
3. Open DevTools in new tab
4. Application > Session Storage
5. Verify: No `masked_*` entries remain

### Integration Testing in Browser

#### Using DevTools Console

```javascript
// Simulate clipboard masking
const testData = 'secret123';
sessionStorage.setItem('masked_test_field', testData);

// Verify storage
console.log(sessionStorage.getItem('masked_test_field'));

// Clear like tab close
sessionStorage.clear();

// Check it's gone
console.log(sessionStorage.getItem('masked_test_field')); // null
```

#### Testing Clipboard Detection

```javascript
// This requires running in a context with Clipboard API
const MASK_FLAG = 'application/x-hidden-notes-masked';

// Create masked clipboard item (simulated)
const hasHiddenData = async () => {
  try {
    const items = await navigator.clipboard.read();
    return items.some(item => item.types.includes(MASK_FLAG));
  } catch {
    return false;
  }
};

hasHiddenData().then(console.log);
```

## Security Considerations

### Threat Model

**What clipboard masking protects against:**
- Screenshots capturing sensitive data
- Screen recordings (OBS, Teams, etc.)
- Shoulder surfing
- Session recordings on support calls

**What it does NOT protect against:**
- Malicious scripts in the page reading sessionStorage
- Malicious scripts reading clipboard API
- Man-in-the-middle attacks (requires HTTPS)
- Form submission interception

### Best Practices

#### For Users

1. **Copy only when needed**
   - Don't leave Hidden Notes open with secrets visible
   - Close tab when done with sensitive data

2. **Verify masked display**
   - Always verify asterisks appear after paste
   - Indicates masking is working

3. **Don't mix clipboard sources**
   - If you copy from Hidden Notes, paste from Hidden Notes
   - Mixing sources may break masking detection

4. **Use HTTPS only**
   - Only paste on HTTPS websites
   - HTTP sites are vulnerable to MITM attacks

#### For Developers

1. **Respect sessionStorage privacy**
   - Don't log or transmit sessionStorage data
   - Treat it as sensitive memory

2. **Handle errors gracefully**
   - Clipboard API may be denied
   - Should fallback to normal paste

3. **Clear data on errors**
   - If masking fails, consider clearing sessionStorage
   - Prevent partial data leaks

### Data Flow Security

```
Hidden Notes          →   Clipboard    →   External Site
(Real Data)              (Metadata)        (Masked + Storage)
   ✅ Visible              ✅ Hidden         ✅ Masked Display
   (Extension)            (Metadata Flag)   (Real in sessionStorage)
                                                    ↓
                                            Form Submit
                                                    ↓
                                            Server (Real Data)
```

### Session Storage Security

- **Scope**: Same-origin policy
- **Cleared**: Automatically on tab close
- **Accessible**: Only by scripts from same origin
- **Risk**: XSS attacks can read sessionStorage

### Recommendations

1. **Always use HTTPS**
   - Prevents network eavesdropping
   - Clipboard data travels in HTTPS requests

2. **Keep browser updated**
   - Security patches for Clipboard API
   - Protection against XSS vulnerabilities

3. **Be cautious with extensions**
   - Don't install untrusted extensions
   - They have access to all page data

4. **Monitor for phishing**
   - Fake sites won't have masking
   - Always verify URL before pasting secrets

## Troubleshooting

### Masking Not Appearing

**Symptom**: Paste shows real data, not asterisks

**Possible Causes**:
1. Content script not loaded
2. Clipboard API denied
3. Website blocking paste events

**Solutions**:
```bash
# Check content script is injected
# In DevTools console on external site:
console.log('Content script loaded:', typeof window.__hiddenNotesMask !== 'undefined');

# Check clipboard permissions
navigator.clipboard.readText().catch(e => console.log('Clipboard denied:', e));
```

### sessionStorage Data Lost

**Symptom**: Real data doesn't restore on form submit

**Possible Causes**:
1. sessionStorage cleared by site
2. Form redirects to different origin
3. JavaScript error during submission

**Solutions**:
1. Check site's localStorage/sessionStorage policies
2. Verify form submits to same domain
3. Check DevTools for JavaScript errors

### Paste Not Intercepted

**Symptom**: Normal clipboard paste happens instead of masking

**Possible Causes**:
1. Extension not enabled
2. Site has paste event handler (event.preventDefault)
3. Content script blocked by CSP

**Solutions**:
1. Check extension is enabled in chrome://extensions
2. Try inject-mask.js fallback (for iframes)
3. Check Content Security Policy in site

## FAQ

### Q: Is my data safe when using clipboard masking?

**A**: Clipboard masking provides visual protection only. Your real data is temporarily in memory (sessionStorage) on the website. Once submitted, it's in the destination server's hands. For maximum security:
- Use HTTPS only
- Trust the destination website
- Keep Hidden Notes and browser updated

### Q: Why is masking shown on external sites, not Hidden Notes?

**A**: Hidden Notes is a trusted context. Masking is for external websites where you don't want data visible on screen. The content script only activates masking on non-Hidden Notes pages.

### Q: Can I mask arbitrary text or only specific types?

**A**: Currently supports all text types (passwords, API keys, card numbers, etc.). The system works for any text copied using the copy button in Hidden Notes.

### Q: What happens if clipboard has no mask flag?

**A**: Normal paste operation proceeds unchanged. Masking only applies when you copy from Hidden Notes using the dedicated copy button.

### Q: Is sessionStorage data encrypted?

**A**: No. sessionStorage is unencrypted plain text. It's protected only by same-origin policy. Don't paste on untrusted sites.

### Q: What browsers are supported?

**A**: 
- Chrome/Edge 66+
- Firefox 63+
- Safari 13.1+
- Mobile Chrome: Yes
- Mobile Safari: Limited

### Q: Does masking work in password manager forms?

**A**: Partially. Most password managers have their own security measures. Masking works for manual paste. Password manager auto-fill bypasses paste events.

### Q: Can I disable masking?

**A**: Currently not user-configurable. Masking always activates when copy button is used. To paste normally, use regular clipboard paste without Hidden Notes copy.

## Code Examples

### Using Clipboard Masking in Custom Extensions

```typescript
import { copyHiddenText, isHiddenDataInClipboard } from '@/lib/clipboard-masking';

// Copy sensitive data
async function copySecret(secret: string) {
  try {
    await copyHiddenText(secret);
    console.log('Secret copied with masking enabled');
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// Detect masked data on external site
async function handlePaste(event: ClipboardEvent) {
  const hasMask = await isHiddenDataInClipboard();
  
  if (hasMask) {
    event.preventDefault();
    // Custom masking logic here
    console.log('Masked data detected');
  }
}
```

### Testing Masking Manually

```javascript
// Simulate masked paste in console
const realData = 'my_secret_key_12345';
const inputElement = document.querySelector('input');

// Store real data
sessionStorage.setItem('masked_input_id', realData);

// Show masked version
inputElement.value = '*'.repeat(realData.length);
inputElement.readOnly = true;

// On form submit, restore:
inputElement.value = sessionStorage.getItem('masked_input_id');
```

## Performance Considerations

### Overhead

- **Memory**: ~1-2KB per masked input (in sessionStorage)
- **CPU**: Negligible (clipboard API is async)
- **Network**: No network calls made by masking system

### Optimization

- sessionStorage is cleared on tab close (automatic)
- No persistent storage used
- Minimal DOM manipulation

## Future Improvements

Potential enhancements to clipboard masking:

1. **User Settings**
   - Toggle masking on/off per domain
   - Customize mask character (not just *)
   - Auto-clear timeout after X minutes

2. **Enhanced Security**
   - Zero-knowledge proofs for clipboard verification
   - Hardware-backed clipboard encryption

3. **Advanced Features**
   - Clipboard history with expiration
   - Multi-step authentication before paste
   - Audit log of paste operations

4. **Better iframe Support**
   - Automatic detection of sensitive inputs
   - Cross-origin frame masking

## Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup and debugging
- [src/lib/clipboard-masking.ts](../src/lib/clipboard-masking.ts) - Core implementation
- [src/content-scripts/clipboard-mask.ts](../src/content-scripts/clipboard-mask.ts) - Content script
- [public/inject-mask.js](../public/inject-mask.js) - Web accessible resource

## Support

For issues or questions about clipboard masking:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [FAQs](#faq)
3. Check DevTools console for errors
4. Consult [DEVELOPMENT.md](./DEVELOPMENT.md) for debugging tips

---

**Last Updated**: April 2026
**Status**: Production Ready
**Version**: 1.0
