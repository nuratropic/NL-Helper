    // УВЕДОМЛЕНИЯ
    function showNotification(message, type='success', onUndo) {
        const all = document.querySelectorAll('.nl-notif');
        if (all.length >= 4) all[0].remove(); // не копим стопку уведомлений
        const n = document.createElement('div'); n.className = 'nl-notif';
        const th = theme();
        n.style.cssText = `background:${type==='error'?'rgba(220,60,60,0.92)':th.accent};color:${type==='error'?'#fff':(th.btnText||'#000')};border:1px solid ${type==='error'?'#cc3333':th.accent};display:flex;align-items:center;gap:10px;`;
        n.style.top = (20 + document.querySelectorAll('.nl-notif').length * 52) + 'px';
        const span = document.createElement('span'); span.textContent = message; n.appendChild(span);
        if (onUndo) {
            const btn = document.createElement('button');
            btn.textContent = '↺ Отменить';
            btn.style.cssText = 'background:rgba(0,0,0,.15);border:1px solid currentColor;border-radius:3px;padding:2px 9px;cursor:pointer;color:inherit;font:inherit;font-size:11px;flex-shrink:0;';
            btn.onclick = () => { onUndo(); n.remove(); };
            n.appendChild(btn);
        }
        document.body.appendChild(n);
        setTimeout(() => n.remove(), onUndo ? 5000 : (type === 'error' ? 4000 : 2200));
    }

    // отменяет последнюю вставку шаблона, возвращая прежнее содержимое редактора
    function undoLastInsert() {
        const ed = document.querySelector(SEL.editor);
        if (!ed || lastEditorSnapshot === null) return;
        ed.innerHTML = lastEditorSnapshot;
        ['input','keyup','change'].forEach(ev => ed.dispatchEvent(new Event(ev,{bubbles:true})));
        lastInsertedHTML = ed.innerHTML;
        lastEditorSnapshot = null;
        showNotification(theme().dbh ? '⏪ Реконструкция: вставка отменена' : '↺ Вставка отменена', 'success');
    }

    // предупреждает, если в редакторе уже есть текст, который вставили не мы сами
    // (textContent, а не innerHTML — у пустого Froala-редактора innerHTML вида '<p><br></p>' не пуст)
    function confirmOverwriteIfNeeded() {
        const ed = document.querySelector(SEL.editor);
        if (ed && ed.textContent.trim() && ed.innerHTML !== lastInsertedHTML) {
            return confirm('В редакторе уже есть текст — похоже, вы печатали его сами. Заменить его шаблоном?');
        }
        return true;
    }

    // КНОПКИ НА ФОРУМЕ
    const FORUM_BUTTONS = [
        ['nl-btn',        '⬡ NL HELPER',   () => openMain()],
        ['nl-wizard-btn', '🧙 РАЗОБРАТЬ',  () => openWizard()],
        ['nl-bio-btn',    '📋 АНАЛИЗ БИО', () => openBioAnalyzer()],
        ['nl-stats-btn',  '📊 СТАТИСТИКА', () => openStats()],
    ];
    function mkForumBtn(id, txt, fn) {
        const b = document.createElement('button');
        b.id = id; b.type = 'button'; b.className = 'nl-btn-main';
        b.textContent = txt;
        b.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); fn(); });
        return b;
    }

    // кнопки встают рядом с «Ответить»; если её нет (тема закрыта / форма ещё не загружена) — плавающая панель
    function injectButtons() {
        if (document.getElementById('nl-inline-wrap')) return;
        const replyBtn = findReplyBtn();
        if (replyBtn && replyBtn.parentNode) {
            document.getElementById('nl-float-panel')?.remove();
            const wrap = document.createElement('div');
            wrap.id = 'nl-inline-wrap';
            wrap.style.cssText = 'display:inline-flex;align-items:center;vertical-align:middle;gap:6px;margin:0 0 0 8px;flex-wrap:wrap;';
            FORUM_BUTTONS.forEach(([id, txt, fn]) => wrap.appendChild(mkForumBtn(id, txt, fn)));
            replyBtn.insertAdjacentElement('afterend', wrap);
            return;
        }
        if (document.getElementById('nl-float-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'nl-float-panel';
        FORUM_BUTTONS.forEach(([id, txt, fn]) => panel.appendChild(mkForumBtn(id, txt, fn)));
        document.body.appendChild(panel);
    }

    // следим за DOM, пока не появится кнопка ответа: проверка не чаще раза за кадр и не дольше минуты
    function watchReplyButton() {
        if (document.getElementById('nl-inline-wrap')) return;
        let scheduled = false;
        const obs = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                if (findReplyBtn()) { injectButtons(); obs.disconnect(); }
            });
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => obs.disconnect(), 60000);
    }

    // ИНИЦИАЛИЗАЦИЯ — каждый шаг изолирован: сбой одного не выключает остальные
    function init() {
        const step = (name, fn) => { try { fn(); } catch (e) { console.error(`[NL Helper] ошибка при «${name}»`, e); } };
        step('стили', applyCSS);
        step('горячие клавиши', initHotkeys);
        step('анти-флуд', checkFlood);
        step('кнопки', injectButtons);
        step('наблюдатель', watchReplyButton);
        step('меню', () => {
            if (typeof GM_registerMenuCommand === 'undefined') return;
            GM_registerMenuCommand('NL Helper: Открыть',          openMain);
            GM_registerMenuCommand('NL Helper: Мастер решений',   openWizard);
            GM_registerMenuCommand('NL Helper: Анализ биографии', openBioAnalyzer);
            GM_registerMenuCommand('NL Helper: Статистика',       openStats);
            GM_registerMenuCommand('NL Helper: Профиль',          openProfile);
            GM_registerMenuCommand('NL Helper: Проверить обновления правил', () => checkRuleUpdates(true));
            GM_registerMenuCommand('NL Helper: Сброс шаблонов', () => {
                if (confirm('Сбросить стандартные шаблоны к заводским? Шаблоны во вкладке «Мои» сохранятся.')) { resetTemplates(); location.reload(); }
            });
        });
        // проверка правил — отложенно и в фоне, чтобы не мешать загрузке страницы
        step('проверка правил', () => {
            if (SETS.ruleCheck === false) return;
            const run = () => checkRuleUpdates(false).catch(e => console.warn('[NL Helper] проверка правил', e));
            setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 10000 }) : run()), 4000);
        });

        if (theme().dbh) {
            console.log('%cCYBERLIFE OS · МОДЕЛЬ NL800 · БИОКОМПОНЕНТЫ В НОРМЕ · rA9', 'color:#00a9cc;font-family:monospace;letter-spacing:2px');
        }
        console.log(`%c[NL Helper ${VERSION}] готов · правила от ${RULES_REVISION} · пунктов: ${RULE_COUNT}`, 'color:#ff6b2b;font-weight:bold');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
