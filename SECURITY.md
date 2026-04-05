# Security Policy

## Clipboard Masking Security

This extension implements security measures to protect sensitive data (passwords, API keys, etc.) when copied and pasted across websites.

### Security Features

#### 1. Service Worker In-Memory Storage
- Sensitive data is stored in Service Worker memory, not in accessible sessionStorage
- Data is isolated from web page scripts and immune to XSS attacks
- Data expires after 5 minutes automatically
- All data is cleared when extension is unloaded

#### 2. Trusted Domain Whitelisting
- Content script only runs on explicitly trusted domains (GitHub, GitLab, etc.)
- Cannot be exploited on phishing sites or untrusted pages
- Users must explicitly add domains if they need clipboard masking elsewhere

#### 3. Cryptographic Random ID Generation
- Uses `crypto.getRandomValues()` for secure random IDs
- IDs are unpredictable and cannot be brute-forced
- Prevents ID collision and enumeration attacks

#### 4. No Plaintext Storage
- Passwords are never stored in localStorage, sessionStorage, or chrome.storage as plaintext
- Chrome Storage API is only used for temporary flags (without actual data)

### Threat Model

#### Protected Against
- ✅ XSS attacks on web pages (data isolated in Service Worker)
- ✅ Phishing sites pretending to accept passwords (domain whitelist)
- ✅ ID enumeration attacks (cryptographic randomness)
- ✅ Local storage inspection (in-memory only)

#### Not Protected Against
- ❌ Compromised extension code (inherent to all extensions)
- ❌ Browser-level keyloggers (OS-level threat)
- ❌ Clipboard hijacking by OS (system-level)

### Reporting Security Issues

Found a vulnerability? Please report privately to: [security contact]

Do NOT open public issues for security vulnerabilities.

### Recent Changes (2026-04-05)

- Migrated from sessionStorage to Service Worker in-memory storage
- Restricted content script to trusted domains only
- Implemented crypto.getRandomValues() for ID generation
- Added listener attachment verification
