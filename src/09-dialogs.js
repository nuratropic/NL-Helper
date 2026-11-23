    // ДИАЛОГИ И ДОСТУПНОСТЬ
    const FOCUSABLE = 'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    function focusFirst(root) {
        const el = root.querySelector('[autofocus]') || root.querySelector('input.nl-in, input.nl-sr, textarea, .nl-cmd-in') || root.querySelector(FOCUSABLE);
        if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* элемент мог исчезнуть */ } }
    }
    // монтирует окно: роль диалога для экранных дикторов, фокус внутрь, возврат фокуса после закрытия
    function mountDialog(ov, label) {
        ensureFonts();
        const box = ov.firstElementChild || ov;
        if (!label) label = (ov.querySelector('.nl-dt, .nl-htitle')?.textContent || 'NL Helper').trim();
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        if (label) box.setAttribute('aria-label', label);
        const prev = document.activeElement;
        document.body.appendChild(ov);
        focusFirst(ov);
        const obs = new MutationObserver(() => {
            if (ov.isConnected) return;
            obs.disconnect();
            if (prev && prev.isConnected && typeof prev.focus === 'function') { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
        });
        obs.observe(document.body, { childList: true });
        return ov;
    }
    // Tab не выпускает фокус из верхнего открытого окна помощника
    function trapTab(e) {
        if (e.key !== 'Tab') return;
        const top = topOverlay();
        if (!top) return;
        const items = [...top.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (!top.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    // верхнее окно: командная строка → диалоги → главное окно (док-панель модальной не считаем)
    function topOverlay() {
        return document.querySelector('.nl-cmd-ov') || [...document.querySelectorAll('.nl-dov, .nl-hov')].pop()
            || document.querySelector('.nl-ov:not(.nl-dock)');
    }

    // ШРИФТЫ — грузим с Google Fonts только при первом открытии окна, а не на каждой странице форума
    let fontsKey = '';
    function ensureFonts() {
        const dbh = !!theme().dbh;
        const key = dbh ? 'dbh' : 'base';
        if (fontsKey === key || fontsKey === 'dbh') return;
        fontsKey = key;
        const fams = 'family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono' + (dbh ? '&family=Michroma&family=Jost:wght@400;500;600;700' : '');
        const link = document.getElementById('nl-fonts') || Object.assign(document.createElement('link'), { id: 'nl-fonts', rel: 'stylesheet' });
        link.href = `https://fonts.googleapis.com/css2?${fams}&display=swap`;
        if (!link.isConnected) document.head.appendChild(link);
    }

    // ОБНОВЛЕНИЯ ПРАВИЛ — раз в 12 часов смотрим даты последних сообщений в темах правил.
    // Запрос идёт на тот же форум (новых разрешений не нужно); данные никуда не отправляются.
    const RULE_FORUMS = [51, 52, 53, 202];
    // тема → [название, дата последнего сообщения, с которой сверен скрипт]
    const RULE_WATCH = {
        312571:   ['Общие правила серверов',                        '2026-11-13T17:38:59+03:00'],
        202392:   ['Правила и обязанности лидера',                  '2026-11-13T17:41:09+03:00'],
        655011:   ['Общие правила для государственных организаций', '2026-11-13T17:45:08+03:00'],
        3353981:  ['Общие правила криминальных организаций',        '2026-04-03T21:22:38+03:00'],
        313084:   ['Правила и обязанности администрации',           '2026-09-11T20:24:14+03:00'],
        13425782: ['Правила составления RP биографии',              '2025-09-03T16:39:29+03:00'],
        13425780: ['Правила составления RP ситуации',               '2025-09-03T16:39:17+03:00'],
        13425777: ['Правила создания неофициальной RP организации', '2025-09-03T16:38:57+03:00'],
        3429394:  ['Правила подачи жалоб на игроков',               '2022-10-20T13:03:37+03:00'],
        3429349:  ['Правила подачи жалоб на администрацию',         '2022-10-20T12:54:58+03:00'],
        3429391:  ['Правила подачи жалоб на лидеров',               '2022-10-20T13:03:00+03:00'],
        3429398:  ['Правила подачи заявки на обжалование',          '2022-10-20T13:04:24+03:00'],
    };
    const RULE_CHECK_EVERY = 12 * 3600000;

    function ruleCheckState() {
        const s = readJSON(STORAGE.RULECHECK, null);
        return s && typeof s === 'object' ? { at: s.at || 0, ok: !!s.ok, changed: Array.isArray(s.changed) ? s.changed : [], acked: s.acked || {} } : { at: 0, ok: false, changed: [], acked: {} };
    }
    // разбирает страницу раздела форума: id темы → время последнего сообщения
    function parseForumListing(html) {
        const d = new DOMParser().parseFromString(html, 'text/html');
        const out = {};
        d.querySelectorAll('.structItem--thread').forEach(it => {
            const a = it.querySelector('.structItem-title a[href*="/threads/"]');
            const m = a && a.getAttribute('href').match(/\.(\d+)\/?(?:[?#].*)?$/) || (a && a.getAttribute('href').match(/\/threads\/(\d+)/));
            const t = it.querySelector('.structItem-latestDate, .structItem-cell--latest time');
            if (!m || !t) return;
            const ts = parseInt(t.getAttribute('data-time')) * 1000 || Date.parse(t.getAttribute('datetime'));
            if (ts) out[m[1]] = ts;
        });
        return out;
    }
    // manual = true — по кнопке: проверяем сразу и показываем результат даже без изменений
    async function checkRuleUpdates(manual) {
        if (!manual && (SETS.ruleCheck === false || Date.now() - ruleCheckState().at < RULE_CHECK_EVERY)) { showRuleBanner(); return; }
        if (manual) showNotification('🔄 Проверяю темы с правилами…', 'success');
        const seen = {};
        let ok = 0;
        for (const f of RULE_FORUMS) {
            try {
                const r = await fetch(`/forums/${f}/`, { credentials: 'same-origin' });
                if (!r.ok) continue;
                const found = parseForumListing(await r.text());
                if (Object.keys(found).length) { ok++; Object.assign(seen, found); }
            } catch (e) { /* сеть / защита от ботов — попробуем в следующий раз */ }
        }
        const prev = ruleCheckState();
        const changed = Object.entries(RULE_WATCH)
            .filter(([id, [, known]]) => seen[id] && seen[id] > Date.parse(known) + 60000)
            .map(([id, [name]]) => ({ id, name, ts: seen[id] }));
        // при неудаче (страница-заглушка защиты) повторим через час, а не через 12
        writeJSON(STORAGE.RULECHECK, { at: ok ? Date.now() : Date.now() - RULE_CHECK_EVERY + 3600000, ok: ok > 0, changed, acked: prev.acked });
        if (manual) {
            if (!ok) showNotification('⚠️ Не удалось открыть разделы правил — попробуйте позже', 'error');
            else if (!changed.length) showNotification(`✅ Правила не менялись с ${RULES_REVISION}`, 'success');
        }
        showRuleBanner(manual);
    }
    // баннер о новых правилах; скрывается кнопкой «Понятно» до следующего изменения
    function showRuleBanner(force) {
        document.getElementById('nl-rules-banner')?.remove();
        const st = ruleCheckState();
        const fresh = st.changed.filter(c => force || !(st.acked[c.id] >= c.ts));
        if (!fresh.length) return;
        const b = document.createElement('div');
        b.id = 'nl-rules-banner';
        b.setAttribute('role', 'status');
        b.innerHTML = `<div><b>⚠ NL Helper: на форуме обновились правила</b><br>` +
            fresh.map(c => `<a href="/threads/${encodeURIComponent(c.id)}/latest" target="_blank" rel="noopener">${esc(c.name)}</a> — ${fmtDate(c.ts)}`).join('<br>') +
            `<br><span style="opacity:.75">Шаблоны скрипта сверены с редакцией от ${RULES_REVISION}. Проверьте изменения и обновите скрипт.</span></div>` +
            `<button type="button" aria-label="Скрыть уведомление">Понятно</button>`;
        b.querySelector('button').onclick = () => {
            const s = ruleCheckState();
            fresh.forEach(c => { s.acked[c.id] = c.ts; });
            writeJSON(STORAGE.RULECHECK, s);
            b.remove();
        };
        document.body.appendChild(b);
    }

