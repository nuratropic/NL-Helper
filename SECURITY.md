# 🔒 Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in NL Helper, **please do NOT create a public GitHub issue**. Instead:

1. **Email**: Send a detailed report to nurasyl230610@gmail.com
2. **Subject**: `[SECURITY] NL Helper Vulnerability Report`
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your name and contact info (optional)

We will respond within 48 hours and work on a fix privately.

---

## Security Considerations

### What NL Helper Does:
- Stores user-created templates locally in browser storage (GM_getValue/GM_setValue)
- Never transmits user data to external servers
- Only runs on forum.blackrussia.online
- Uses only whitelisted Tampermonkey permissions

### What NL Helper Does NOT Do:
- ❌ Store passwords or sensitive credentials
- ❌ Send data to external services
- ❌ Access user's browser history
- ❌ Modify other websites
- ❌ Collect personal information

---

## Code Integrity Verification

### How to Verify the Script is Unmodified:

1. **Get SHA-256 hash of official script**:
   ```bash
   # On Linux/Mac
   sha256sum NL_Helper.js
   
   # On Windows (PowerShell)
   Get-FileHash NL_Helper.js -Algorithm SHA256
   ```

2. **Compare with official hash** (published in releases):
   - Visit: https://github.com/nuratropic/nl-helper/releases
   - Check the v5.0.0 release notes for the correct hash
   - If hashes don't match, DO NOT USE THE SCRIPT

3. **Domain Verification**:
   - Script will only load on `forum.blackrussia.online`
   - If you're on a different domain, the script will refuse to run
   - This is intentional protection against phishing/spoofing

---

## Known Security Features

### Domain Whitelisting ✅
```javascript
// Script only runs on official forum domain
if (!window.location.href.includes('forum.blackrussia.online')) {
    throw new Error('Invalid domain');
}
```

### No External Communications ✅
- All data stored locally in browser
- No API calls to unknown servers
- No telemetry or analytics

### Storage Isolation ✅
- Data stored with `GM_setValue` is isolated per script
- Cannot access data from other scripts
- Cannot access browser cookies

---

## Responsible Disclosure

### If You Find a Bug:
1. For **non-security bugs**: Use GitHub Issues
2. For **security issues**: Email privately (no public disclosure until fix is released)
3. For **code theft/misuse**: Report to GitHub DMCA team

---

## Updates & Patches

- Security patches will be released ASAP (within 24-48 hours)
- Major version bumps (e.g., 5.0.0 → 6.0.0) indicate breaking changes
- Patch versions (e.g., 5.0.0 → 5.0.1) indicate security/bug fixes
- Check [Releases](https://github.com/nuratropic/nl-helper/releases) for updates

---

## Legal Protection

This script is protected by:
- **MIT License** — Clear terms of use
- **Copyright © 2024** — Protects original code
- **DMCA Notice** — Against unauthorized use
- **Terms of Service** — Binding agreement

Misuse of this code may result in:
- DMCA takedown notices
- Legal action (civil/criminal)
- Account bans on the forum

---

## Questions?

For security questions: nurasyl230610@gmail.com
For bug reports: [GitHub Issues](https://github.com/nuratropic/nl-helper/issues)
For general support: [Telegram @zhanzun23](https://t.me/zhanzun23) or [Forum](https://forum.blackrussia.online/members/nicki_lachowski.2210536/)

---

**Last Updated**: 2024
**Maintained by**: Nicki_Lachowski & Claude
