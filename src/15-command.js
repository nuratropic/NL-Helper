    // КОМАНДНАЯ СТРОКА (Alt+K) — быстрые действия одной строкой, в духе командной палитры VS Code

    const CMD_ACTIONS = [
        { words:['био','биография','bio','анализ'],       icon:'📋', label:'Анализатор биографий',  run:()=>openBioAnalyzer() },
        { words:['статистика','стат','stats'],            icon:'📊', label:'Статистика',            run:()=>openStats() },
        { words:['настройки','опции','settings'],         icon:'⚙️', label:'Настройки',             run:()=>openSettings() },
        { words:['история','history'],                    icon:'🕐', label:'История использования', run:()=>openHistory() },
        { words:['профиль','ачивки','уровень','profile'], icon:'🏅', label:'Профиль куратора',      run:()=>openProfile() },
        { words:['мастер','разобрать','жалоба','wizard'], icon:'🧙', label:'Мастер решений',        run:()=>openWizard() },
        { words:['конструктор','builder'],                icon:'⚖',  label:'Конструктор нарушений', run:()=>openRuleBuilder() },
        { words:['тема','оформление','theme'],            icon:'🎨', label:'Тема оформления',       run:()=>openThemePicker() },
        { words:['правила','обновления','rules','update'], icon:'🔄', label:'Проверить обновления правил на форуме', run:()=>checkRuleUpdates(true) },
        { words:['лидер','лидеры','leader'],              icon:'👑', label:'Пункты правил лидера',  run:()=>openRuleBuilder(['leader']) },
        { words:['помощник','окно','шаблоны','open'],     icon:'⬡',  label:'Открыть NL Helper',     run:()=>openMain() },
    ];
    const CMD_ACCEPT_WORDS = ['одобрено','одобр','одобрить','принять','accept','ok','да','+'];
    const CMD_REJECT_WORDS = ['отказано','отказ','отказать','отклонить','deny','reject','нет','-'];

    // разбирает ввод и строит подсказки: «2.01 одобрено» → пост по пункту,
    // служебное слово → окно, любой другой текст → fuzzy-поиск по шаблонам
    function buildCmdSuggestions(q) {
        q = q.trim().toLowerCase();
        const items = [];
        if (!q) {
            CMD_ACTIONS.forEach(a => items.push({ icon:a.icon, label:a.label, hint:'открыть', run:a.run }));
            return items;
        }
        // «2.19 одобрено», «2,19 -», «2.19п», «гос 1.07», «крим 4 +», «лид 3.2» — номер пункта + необязательное решение
        const CMD_SETS = { 'гос': 'gov', 'крим': 'crim', 'лид': 'leader', 'лидер': 'leader' };
        const m = q.replace(/(\d+),(\d+)/, '$1.$2').match(/^(?:(гос|крим|лидер|лид)\s*:?\s*)?(\d+(?:\.\d+)?)(п)?\s*(.*)$/);
        if (m && (m[1] || m[2].includes('.'))) {
            const [, setWord, num, noteOnly, rest] = m;
            const set = setWord ? CMD_SETS[setWord] : null;
            const ids = Object.keys(RULES).filter(id => RULES[id].num === num && (!set || RULES[id].set === set) && (!noteOnly || RULES[id].note));
            if (ids.length) {
                const wantAccept = !rest || CMD_ACCEPT_WORDS.some(w => rest.startsWith(w));
                const wantReject = !rest || CMD_REJECT_WORDS.some(w => rest.startsWith(w));
                ids.forEach(rule => {
                    const r = RULES[rule], lbl = ruleLabel(rule);
                    if (wantAccept) items.push({ icon:'✅', label:`${lbl} Одобрено — ${r.desc}`, hint:r.penalty || 'вставить пост', run:()=>insertCombinedRules(true,[rule]) });
                    if (wantReject) items.push({ icon:'❌', label:`${lbl} Отказано — ${r.desc}`, hint:'вставить пост', run:()=>insertCombinedRules(false,[rule]) });
                });
            } else {
                items.push({ icon:'⚠️', label:`Пункта ${num} нет в таблицах правил (редакция от ${RULES_REVISION})`, hint:'', run:null });
            }
        }
        CMD_ACTIONS.forEach(a => {
            if (a.words.some(w => w.startsWith(q) || q.startsWith(w))) items.push({ icon:a.icon, label:a.label, hint:'открыть', run:a.run });
        });
        // отсылки к Detroit: Become Human
        if (q === 'ra9' || q === 'ра9' || q === 'ra 9') {
            items.push({ icon:'🤖', label:'rA9 rA9 rA9 rA9 rA9 rA9 rA9', hint:'?????', run:()=>{
                document.body.classList.add('nl-ra9');
                showNotification('⚠ НЕСТАБИЛЬНОСТЬ ПО ▲', 'error');
                setTimeout(()=>document.body.classList.remove('nl-ra9'), 2600);
            }});
        }
        if (q === 'коннор' || q === 'connor' || q === 'rk800') {
            items.push({ icon:'👔', label:'«Меня зовут Коннор. Я — андроид, присланный из „Киберлайф“»', hint:'RK800', run:()=>showNotification('🤖 Модель RK800 подключена', 'success') });
        }
        if (q === 'иерихон' || q === 'jericho') {
            items.push({ icon:'🚢', label:'Иерихон найден — сменить облик', hint:'темы', run:()=>openThemePicker() });
        }
        Object.entries(TPLS).forEach(([tabId, arr]) => arr.forEach(t => {
            if (items.length >= 24) return;
            if (fuzz(q, t.title) || fuzz(q, t.tags||'')) {
                const tab = TABS.find(x => x.id === tabId);
                items.push({ icon:'📄', label:t.title, hint:(tab ? tab.name : tabId), run:()=>{ curTab = tabId; insertTemplate(t); } });
            }
        }));
        return items.slice(0, 9);
    }

    function openCmdPalette() {
        if (document.querySelector('.nl-cmd-ov')) return;
        const ov = document.createElement('div');
        ov.className = 'nl-cmd-ov';
        ov.innerHTML = `
            <div class="nl-cmd-box">
                <input class="nl-cmd-in" placeholder="2.01 одобрено · био · статистика · название шаблона…" spellcheck="false">
                <div class="nl-cmd-list"></div>
                <div class="nl-cmd-hint">↑↓ — выбор&nbsp;&nbsp;·&nbsp;&nbsp;Enter — выполнить&nbsp;&nbsp;·&nbsp;&nbsp;Esc — закрыть</div>
            </div>`;
        mountDialog(ov);
        const input = ov.querySelector('.nl-cmd-in');
        const list  = ov.querySelector('.nl-cmd-list');
        let sugg = [], sel = 0;

        const render = () => {
            sugg = buildCmdSuggestions(input.value);
            if (sel >= sugg.length) sel = Math.max(0, sugg.length - 1);
            list.innerHTML = sugg.length
                ? sugg.map((s, i) => `<div class="nl-cmd-item${i===sel?' active':''}" data-i="${i}">
                        <span class="nl-cmd-ico">${s.icon}</span>
                        <span class="nl-cmd-lbl">${esc(s.label)}</span>
                        ${s.hint?`<span class="nl-cmd-tag">${esc(s.hint)}</span>`:''}
                    </div>`).join('')
                : '<div class="nl-cmd-empty">Ничего не найдено</div>';
            list.querySelectorAll('.nl-cmd-item').forEach(el => {
                el.onclick = () => exec(parseInt(el.dataset.i));
            });
        };
        const exec = i => {
            const s = sugg[i];
            if (!s || !s.run) return;
            ov.remove();
            s.run();
        };
        input.oninput = () => { sel = 0; render(); };
        input.onkeydown = e => {
            if (e.key === 'ArrowDown')    { e.preventDefault(); if (sel < sugg.length-1) { sel++; render(); } }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (sel > 0) { sel--; render(); } }
            else if (e.key === 'Enter')   { e.preventDefault(); exec(sel); }
        };
        ov.onclick = e => { if (e.target === ov) ov.remove(); };
        render();
        input.focus();
    }

