    // ВСТАВКА ШАБЛОНА
    // в BB-код попадают только https-ссылки без символов, ломающих разметку
    const safeUrl = u => /^https:\/\/[^\s\[\]'"<>]+$/i.test(String(u || '').trim()) ? String(u).trim() : '';

    // общая обёртка поста (шапка-картинка, приветствие, тело, футер-картинка, подпись) — по настройкам SETS.post
    function wrapPost(mention, srv, bodyBlock) {
        const p = { ...DEFAULT_POST, ...(SETS.post || {}) };
        // в текстовых полях оформления тоже работают плейсхолдеры ({curator}, {server}…)
        ['address', 'closing', 'signature'].forEach(k => { if (p[k] && p[k].includes('{')) p[k] = applyPH(p[k]); });
        const header = safeUrl(p.header), footer = safeUrl(p.footer), link = safeUrl(p.footerLink);
        const footerImg = footer ? (link ? `[URL='${link}'][IMG]${footer}[/IMG][/URL]` : `[IMG]${footer}[/IMG]`) : '';
        return `[CENTER][FONT=times new roman]\n` +
            (header ? `[COLOR=rgb(209,213,216)][I][IMG]${header}[/IMG][/I][/COLOR]\n\n` : '') +
            `[COLOR=rgb(255,255,255)][SIZE=7][I]${greeting()}${p.address ? ', ' + p.address : ','} [/I][/SIZE][/COLOR]` +
            `[COLOR=rgb(209,213,216)][SIZE=7][I]${mention}![/I][/SIZE][/COLOR]\n\n` +
            `${bodyBlock}\n\n` +
            (footerImg ? `${footerImg}\n\n` : '') +
            (p.closing ? `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]${p.closing}[/I][/SIZE][/COLOR] ` +
                `[COLOR=rgb(84,172,210)][SIZE=6][I]${srv}[/I][/SIZE][/COLOR][/COLOR]\n` : '') +
            (p.signature ? `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]С уважением,[/I][/SIZE][/COLOR] ` +
                `[COLOR=rgb(209,72,65)][SIZE=6][I]${p.signature}[/I][/SIZE][/COLOR][/COLOR]\n` : '') +
            `[/FONT][/CENTER]`;
    }

    // ПРЕДПРОСМОТР — упрощённый перевод BB-кода форума в HTML (только для показа, не для отправки)
    const BB_SIZES = { 1: 10, 2: 12, 3: 15, 4: 18, 5: 22, 6: 26, 7: 32 };
    function bbToHtml(bb) {
        let h = esc(bb);
        const color = c => /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|[a-z]+)$/i.test(c.trim()) ? c.trim() : 'inherit';
        for (let i = 0; i < 6; i++) { // вложенные теги — несколько проходов
            h = h.replace(/\[B\]([\s\S]*?)\[\/B\]/gi, '<b>$1</b>')
                .replace(/\[I\]([\s\S]*?)\[\/I\]/gi, '<i>$1</i>')
                .replace(/\[U\]([\s\S]*?)\[\/U\]/gi, '<u>$1</u>')
                .replace(/\[SIZE=(\d)\]([\s\S]*?)\[\/SIZE\]/gi, (m, s, t) => `<span style="font-size:${BB_SIZES[s] || 15}px">${t}</span>`)
                .replace(/\[COLOR=([^\]]+)\]([\s\S]*?)\[\/COLOR\]/gi, (m, c, t) => `<span style="color:${color(c)}">${t}</span>`)
                .replace(/\[FONT=[^\]]+\]([\s\S]*?)\[\/FONT\]/gi, '<span style="font-family:\'Times New Roman\',serif">$1</span>')
                .replace(/\[CENTER\]([\s\S]*?)\[\/CENTER\]/gi, '<div style="text-align:center">$1</div>')
                .replace(/\[SPOILER(?:=&quot;([^\]]*?)&quot;)?\]([\s\S]*?)\[\/SPOILER\]/gi, (m, t, c) => `<details class="nl-pv-sp"><summary>${t || 'Спойлер'}</summary>${c}</details>`)
                .replace(/\[USER=\d+\]([\s\S]*?)\[\/USER\]/gi, '<b class="nl-pv-user">@$1</b>');
        }
        return h
            .replace(/\[URL=&#39;([^&\]]*)&#39;\]([\s\S]*?)\[\/URL\]/gi, (m, u, t) => safeUrl(u) ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t)
            .replace(/\[IMG\]([^\[]*?)\[\/IMG\]/gi, (m, u) => safeUrl(u) ? `<img src="${u}" alt="" style="max-width:100%">` : '')
            .replace(/\n/g, '<br>');
    }
    function showPreview(bb, onInsert) {
        const ov = document.createElement('div');
        ov.className = 'nl-dov nl-pv-ov';
        ov.innerHTML = `
            <div class="nl-dbox" style="width:720px">
                <div class="nl-dt">👁 Предпросмотр поста</div>
                <div class="nl-pv">${bbToHtml(bb)}</div>
                <div class="nl-set-desc">Отображение приблизительное: на форуме шрифты и отступы могут немного отличаться.</div>
                <div class="nl-da">
                    <button class="nl-btn nl-bn" id="pv-x">${onInsert ? 'Отмена' : 'Закрыть'}</button>
                    ${onInsert ? '<button class="nl-btn nl-bp" id="pv-ok">Вставить</button>' : ''}
                </div>
            </div>`;
        mountDialog(ov, 'Предпросмотр поста');
        ov.querySelector('#pv-x').onclick = () => ov.remove();
        if (onInsert) ov.querySelector('#pv-ok').onclick = () => { ov.remove(); onInsert(); };
        ov.onclick = e => { if (e.target === ov) ov.remove(); };
    }

    // пишет текст в редактор Froala. Текст экранируется: BB-код остаётся BB-кодом,
    // а «<…>» из ника/шаблона не превращается в HTML-разметку внутри редактора.
    function setEditorText(ed, text) {
        ed.innerHTML = esc(text).replace(/\n/g, '<br>');
        ['input', 'keyup', 'change'].forEach(ev => ed.dispatchEvent(new Event(ev, { bubbles: true })));
    }

    // вставляет готовый BB-код в редактор и завершает цикл (префикс/автосабмит/статистика)
    function finishInsert(tpl, fin, confirmed) {
        const ed = document.querySelector(SEL.editor);
        if (!ed) { showNotification('❌ Редактор не найден — откройте форму ответа', 'error'); return false; }
        // с включённым предпросмотром сначала показываем пост, вставляем — по кнопке
        if (SETS.preview && !confirmed) { showPreview(fin, () => finishInsert(tpl, fin, true)); return true; }
        lastEditorSnapshot = ed.innerHTML;
        setEditorText(ed, fin);
        lastInsertedHTML = ed.innerHTML;
        document.querySelector(SEL.overlayClose)?.click();
        closeMain();
        if (tpl.prefix) setPrefix(tpl.prefix);
        if (SETS.autoSubmit) submit();
        recordUse(tpl, curTab);
        showNotification(theme().dbh ? '✔ Задача выполнена' : '✅ Шаблон вставлен', 'success', undoLastInsert);
        return true;
    }

    // подсвечивает слово-статус в обычном (не raw) шаблоне цветом префикса
    const STATUS_WORDS = [
        [[P.ACCEPT, P.REALIZOVANO], 'Одобрено|Реализовано'],
        [[P.UNACCEPT],              'Отказано'],
        [[P.PIN, P.OJIDANIE],       'На рассмотрении|Ожидание'],
        [[P.RESHENO],               'Решено'],
        [[P.CLOSE],                 'Закрыто'],
    ];

    function insertTemplate(tpl) {
        if (!confirmOverwriteIfNeeded()) return false;
        try {
            const author = getAuthor();
            const mention = mentionOf(author);
            const srv = serverName();

            // isRaw: контент уже содержит готовый BB-код тела — только плейсхолдеры
            if (tpl.isRaw) return finishInsert(tpl, wrapPost(mention, srv, applyPH(String(tpl.content || ''))));

            let rawBody = applyPH(String(tpl.content || ''))
                .replace(/\[url=[^\]]*\]\[img\][^\[]*\[\/img\]\[\/url\]/gi, '')
                .replace(/\[img\][^\[]*\[\/img\]/gi, '')
                .replace(/\[\/?(CENTER|FONT|COLOR|SIZE|I|B|U)(=[^\]]+)?\]/gi, '')
                .trim();

            const pc = PREFIX_COLORS[tpl.prefix] || '#61bd6d';
            const sw = STATUS_WORDS.find(([ids]) => ids.includes(tpl.prefix));
            if (sw) rawBody = rawBody.replace(new RegExp(`(${sw[1]})`, 'i'),
                `[/I][/COLOR][COLOR=${pc}][I]$1[/I][/COLOR][COLOR=rgb(255,255,255)][I]`);

            return finishInsert(tpl, wrapPost(mention, srv, `[SIZE=6][COLOR=rgb(255,255,255)][I]${rawBody}[/I][/COLOR][/SIZE]`));
        } catch (err) {
            console.error('NL Helper insertTemplate:', err);
            showNotification('❌ Ошибка вставки: ' + err.message, 'error');
            return false;
        }
    }

    // ПРЕФИКС
    async function setPrefix(id) {
        const csrf = typeof XF !== 'undefined' && XF.config && XF.config.csrf;
        const threadId = getThreadId();
        if (!csrf || !threadId) { showNotification('⚠️ Не удалось сменить префикс: нет данных темы', 'error'); return; }
        const fd = new FormData();
        fd.append('prefix_id', id);
        fd.append('title', getThreadTitle());
        fd.append('_xfToken', csrf);
        fd.append('_xfRequestUri', window.location.pathname);
        fd.append('_xfWithData', 1);
        fd.append('_xfResponseType', 'json');
        const open = OPEN_PFXS.has(id) ? 1 : 0;
        fd.append('discussion_open', open);
        fd.append('sticky', open);
        try {
            // адрес редактирования строим от id темы: /threads/slug.123/page-2 → /threads/123/edit
            const r = await fetch(`/threads/${threadId}/edit`, { method: 'POST', body: fd, credentials: 'same-origin' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const d = await r.json().catch(() => null);
            if (d && d.status === 'ok') {
                showNotification('✅ Префикс «' + (PREFIX_NAMES[id] || id) + '» установлен', 'success');
                if (SETS.autoSubmit) setTimeout(() => location.reload(), 800);
            } else {
                const msg = d && Array.isArray(d.errors) ? d.errors.join('; ') : (d && d.status) || 'неизвестный ответ';
                showNotification('⚠️ Префикс не установлен: ' + msg, 'error');
            }
        } catch (err) {
            console.error('[NL Helper] setPrefix:', err);
            showNotification('❌ Ошибка префикса: ' + err.message, 'error');
        }
    }

    // SUBMIT + FLOOD
    function submit() {
        clickSubmit();
        if (!SETS.floodControl) return;
        let n = 0;
        const iv = setInterval(() => {
            n++;
            const e = [...document.querySelectorAll(SEL.blockMessage)].find(x => /подождать|подождите/i.test(x.textContent));
            if (e) { clearInterval(iv); doFlood(e.textContent); }
            if (n > 40) clearInterval(iv);
        }, 100);
    }
    function doFlood(txt) {
        const m = txt.match(/(\d+)\s*(секунд|сек|минут|мин)/i); if (!m) return;
        let s = parseInt(m[1]); if (/мин/i.test(m[2])) s *= 60;
        gm.set(STORAGE.FLOOD, Date.now() + s * 1000);
        const ed = document.querySelector(SEL.editor);
        gm.set(STORAGE.PENDING, ed ? ed.innerHTML : '');
        floodTimer(s);
    }
    function floodTimer(secs) {
        const b = findReplyBtn(); if (!b) return;
        const sp = b.querySelector('.button-text'); const og = sp?.textContent || 'Ответить'; let t = secs;
        const up = () => { if (sp) sp.textContent = `⏳ ${t}с`; b.classList.add('nl-fa'); }; up();
        if (floodIv) clearInterval(floodIv);
        floodIv = setInterval(() => {
            t--; up();
            if (t <= 0) {
                clearInterval(floodIv); floodIv = null; gm.del(STORAGE.FLOOD);
                b.classList.remove('nl-fa'); if (sp) sp.textContent = og;
                const pd = gm.get(STORAGE.PENDING);
                if (pd) { const ed = document.querySelector(SEL.editor); if (ed) { ed.innerHTML = pd; ed.dispatchEvent(new Event('input', { bubbles: true })); } gm.del(STORAGE.PENDING); }
                if (SETS.autoSubmit) setTimeout(clickSubmit, 500);
            }
        }, 1000);
    }
    function checkFlood() {
        const tg = parseInt(gm.get(STORAGE.FLOOD)); if (!tg) return;
        const r = Math.ceil((tg - Date.now()) / 1000);
        if (r > 0 && r < 3600) floodTimer(r); else gm.del(STORAGE.FLOOD);
    }

    // СТАТИСТИКА
    // локальная дата YYYY-MM-DD (toISOString давал UTC — ночные ответы попадали во «вчера»)
    const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    function recordUse(tpl, tabId) {
        try {
            const unlockedBefore = new Set(computeProfile(STATS, TPLS).achievements.filter(a => a.unlocked).map(a => a.name));
            // синтетические шаблоны (сборный пост по правилам) засчитываем шаблону пункта, если он один
            const real = findTpl(tpl.id) || (tpl.rules && tpl.rules.length === 1 && findTpl(RULES[tpl.rules[0]][tpl.prefix === P.ACCEPT ? 'a' : 'd']));
            if (real) { real.uses = (real.uses || 0) + 1; saveTemplates(); }
            STATS.total = (STATS.total || 0) + 1;
            STATS.byPrefix[tpl.prefix] = (STATS.byPrefix[tpl.prefix] || 0) + 1;
            STATS.byTab[tabId] = (STATS.byTab[tabId] || 0) + 1;
            const today = dayKey();
            STATS.byDay[today] = (STATS.byDay[today] || 0) + 1;
            saveStats();
            HIST.unshift({ id: (real || tpl).id, title: tpl.title, tabId, threadTitle: getThreadTitle() || '(без названия)', threadUrl: window.location.href, prefix: tpl.prefix, usedAt: Date.now() });
            if (HIST.length > MAX_HISTORY) HIST.length = MAX_HISTORY;
            saveHistory();
            computeProfile(STATS, TPLS).achievements.forEach(a => {
                if (a.unlocked && !unlockedBefore.has(a.name)) showNotification(`🏅 Новая ачивка: ${a.name}!`, 'success');
            });
        } catch (e) { console.warn('[NL Helper] статистика не записана', e); }
    }
    function findTpl(id) {
        if (!id) return null;
        for (const arr of Object.values(TPLS)) { const t = arr.find(x => x.id === id); if (t) return t; }
        return null;
    }

    // ГОРЯЧИЕ КЛАВИШИ — по физической клавише (e.code): работают в любой раскладке
    function initHotkeys() {
        const ALT_ACTIONS = {
            KeyH: () => (document.querySelector('.nl-ov') ? closeMain() : openMain()),
            KeyB: () => openBioAnalyzer(),
            KeyA: () => undoLastInsert(),
            KeyK: () => { const cmd = document.querySelector('.nl-cmd-ov'); if (cmd) cmd.remove(); else openCmdPalette(); },
        };
        document.addEventListener('keydown', e => {
            if (e.key === 'Tab') { trapTab(e); return; }
            if (e.key === 'Escape') {
                // закрываем самое верхнее окно помощника
                const top = document.querySelector('.nl-cmd-ov') || [...document.querySelectorAll('.nl-dov, .nl-hov')].pop();
                if (top) { top.remove(); e.stopPropagation(); return; }
                if (document.querySelector('.nl-ov')) { closeMain(); e.stopPropagation(); }
                return;
            }
            if (!SETS.hotkeys) return;
            // Ctrl+Alt = AltGr на ряде раскладок — не перехватываем
            if (!e.altKey || e.ctrlKey || e.metaKey) return;
            const act = ALT_ACTIONS[e.code];
            if (act) { e.preventDefault(); e.stopPropagation(); ensureFonts(); act(); return; }
            const dm = /^Digit([1-9])$/.exec(e.code);
            if (dm) {
                const idx = parseInt(dm[1]) - 1;
                if (idx >= TABS.length) return;
                e.preventDefault(); e.stopPropagation();
                curTab = TABS[idx].id;
                if (!document.querySelector('.nl-ov')) openMain();
                else { document.querySelectorAll('.nl-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === curTab)); renderCards(); }
            }
        }, { capture: true });
    }

