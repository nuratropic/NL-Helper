# 🔒 Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in NL Helper, **please do not open a public GitHub issue**. Instead, report it privately:

1. **Preferred:** open a private report via [GitHub Security Advisories](https://github.com/nuratropic/nl-helper/security/advisories/new).
2. **Alternatively:** message [@zhanzun23 on Telegram](https://t.me/zhanzun23) and say it is a security report.

Please include:
- a description of the vulnerability;
- steps to reproduce;
- the potential impact;
- the script version (shown in the helper window).

We will try to reply within a few days and will work on a fix privately. Please don't disclose the issue publicly until a fixed version is released.

---

## What NL Helper Does

- Runs only on `forum.blackrussia.online` thread pages (`@match`), and additionally checks the hostname at startup, so its logic never executes on other sites even if a userscript manager ignores `@match`.
- Stores templates, settings, statistics and history locally via `GM_setValue` / `GM_getValue` (isolated per script).
- Makes network requests **only** to:
  - `forum.blackrussia.online` itself — to change a thread prefix when you click a prefix button or insert a template, and (if enabled in settings) to read the "server rules" forum listings twice a day to detect rule updates. Requests use your existing forum session; nothing is sent to third parties.
  - Google Fonts (`fonts.googleapis.com`) — to load interface fonts the first time a helper window opens.
- All text analysis (complaint wizard, evidence detection, rule matching, biography check, curator profile) runs entirely in the browser — no AI services or external APIs.
- Uses only the `GM_setValue`, `GM_getValue`, `GM_deleteValue` and `GM_registerMenuCommand` grants.

### What NL Helper Does Not Do

- ❌ Store passwords or credentials
- ❌ Send your data to external services, telemetry or analytics
- ❌ Access browser history or other sites
- ❌ Insert raw HTML from templates into the page — text inserted into the editor and shown in previews is escaped, and only `https://` links are allowed in post images

---

## Verifying the Script

The script installed from [Greasy Fork](https://greasyfork.org/en/scripts/582289-nl-helper) is built from the `src/` folder of this repository. To check that a copy matches a release:

```bash
# Linux / macOS
sha256sum nl_helper.js

# Windows (PowerShell)
Get-FileHash nl_helper.js -Algorithm SHA256
```

Compare the hash with the one published in the notes of the corresponding [release](https://github.com/nuratropic/nl-helper/releases). You can also rebuild the file yourself with `npm run build` and compare (`npm run check`).

---

## Updates

- Security fixes are released as soon as possible as a patch version.
- Tampermonkey updates the script automatically from Greasy Fork.
- See [CHANGELOG.md](./CHANGELOG.md) for what changed in each version.

---

## License

NL Helper is distributed under the [MIT License](./LICENSE). You may use, modify and redistribute it, provided the copyright notice and license text are kept.

---

## Contacts

- Security reports: [GitHub Security Advisories](https://github.com/nuratropic/nl-helper/security/advisories/new) or [Telegram @zhanzun23](https://t.me/zhanzun23)
- Bug reports: [GitHub Issues](https://github.com/nuratropic/nl-helper/issues)
- Forum: [Nicki_Lachowski](https://forum.blackrussia.online/members/nicki_lachowski.2210536/)

**Last Updated**: November 2026
**Maintained by**: Nicki_Lachowski
