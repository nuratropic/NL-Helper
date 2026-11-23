    // ГЛАВНОЕ ОКНО
    // открывает помощник: модальное окно или док-панель сбоку — по SETS.uiMode;
    // внутренняя разметка и вся логика (renderCards/bindMain) общие, различается только контейнер
    function openMain() {
        if (document.querySelector('.nl-ov')) return;
        // на телефоне (узкий экран) окно по центру не помещается — открываем панелью во всю ширину
        const dock = SETS.uiMode === 'dock' || isNarrow();
        if (!dock) document.body.style.overflow = 'hidden';
        // при первом открытии на странице — вкладка по разделу форума (жалобы на игроков → «Игроки» и т.д.)
        const section = detectSection();
        if (!sectionApplied) { sectionApplied = true; if (section && SETS.autoTab !== false) curTab = section; }
        const dl = reviewDeadline(section);
        const autoSrv = SETS.serverAuto !== false ? detectServer() : '';

        const ov = document.createElement('div');
        ov.className = 'nl-ov' + (dock ? ' nl-dock' : '');
        ov.innerHTML = `
            <div class="nl-m">
                <aside class="nl-sidebar">
                    <div class="nl-logo-area">
                        <div class="nl-logo-text">NL<span>.</span></div>
                        <div class="nl-logo-sub">${theme().dbh ? 'NL800 · № 582 289 006 — 62' : `Helper v${VERSION} · Alt+H`}</div>
                        <div class="nl-logo-sub" title="Редакция общих правил серверов, с которой сверены шаблоны">Правила от ${RULES_REVISION}</div>
                    </div>
                    <nav class="nl-tabs">
                        ${TABS.map(t=>`<button class="nl-tab${t.id===curTab?' active':''}" data-tab="${t.id}">${t.name}</button>`).join('')}
                    </nav>
                    <div class="nl-sb-foot">
                        <button class="nl-hb" id="nl-wizard-sb">🧙 Мастер решений</button>
                        <button class="nl-hb" id="nl-rulebuilder-btn">⚖ Конструктор</button>
                        <button class="nl-hb" id="nl-history-btn">🕐 История</button>
                        <button class="nl-hb" id="nl-profile-btn">🏅 Профиль</button>
                        <button class="nl-hb" id="nl-hud">🎨 Тема</button>
                        <button class="nl-hb" id="nl-settings-btn">⚙️ Настройки</button>
                    </div>
                </aside>

                <main class="nl-main-content">
                    <header class="nl-hd">
                        <div class="nl-hd-top">
                            <input type="text" class="nl-sr" placeholder="🔍 Поиск шаблонов (EN→RU)...">
                            <button type="button" class="nl-cl" id="nl-mode-toggle" title="${dock?'Развернуть в окно':'Свернуть в панель сбоку'}" aria-label="${dock?'Развернуть в окно':'Свернуть в панель сбоку'}">⇄</button>
                            <button type="button" class="nl-cl" id="nl-close" title="Закрыть (Esc)" aria-label="Закрыть">✕</button>
                        </div>
                        ${dl ? `<div class="nl-dl${dl.overdue ? ' over' : dl.soon ? ' soon' : ''}">⏱ ${esc(dl.text)}</div>` : ''}
                        <div class="nl-pb">
                            ${Object.entries(PREFIX_NAMES).filter(([i])=>i!=0).map(([i,n])=>
                                `<button class="nl-pp" data-p="${i}" style="color:${PREFIX_COLORS[i]};border-color:${PREFIX_COLORS[i]}44">${n}</button>`
                            ).join('')}
                        </div>
                    </header>

                    <section class="nl-ct"><div class="nl-grid"></div></section>

                    <footer class="nl-ft">
                        <div class="nl-fl">
                            <label class="nl-cl2"><input type="checkbox" id="nl-as" ${SETS.autoSubmit?'checked':''}> Авто-отправка</label>
                            <label class="nl-cl2"><input type="checkbox" id="nl-fc" ${SETS.floodControl?'checked':''}> Анти-флуд</label>
                            <div class="nl-sep"></div>
                            <input type="text" id="nl-srv" class="nl-sin" placeholder="Сервер…" aria-label="Название сервера"
                                value="${esc(autoSrv || SETS.serverName || '')}" ${autoSrv ? 'readonly title="Сервер определён по разделу форума. Отключить — в настройках"' : 'title="Название сервера ({server})"'}>
                            <div class="nl-sep"></div>
                            <button class="nl-btn nl-bn nl-btn-sm" id="nl-exp">📤 Экспорт</button>
                            <button class="nl-btn nl-bn nl-btn-sm" id="nl-imp">📥 Импорт</button>
                            <input type="file" id="nl-file" style="display:none" accept=".json">
                        </div>
                        <div class="nl-fr">
                            <button class="nl-btn ${manageMode?'nl-bs':'nl-bd'}" id="nl-mg">${manageMode?'✓ Готово':'✎ Редактировать'}</button>
                            <button class="nl-btn nl-bp" id="nl-cr">+ Создать</button>
                        </div>
                    </footer>
                </main>
            </div>`;

        mountDialog(ov, 'NL Helper — шаблоны');
        if (dock) ov.firstElementChild.setAttribute('aria-modal', 'false'); // док-панель не блокирует страницу
        renderCards();
        bindMain(ov);
    }

    function closeMain() {
        const ov = document.querySelector('.nl-ov'); if(ov) ov.remove();
        document.body.style.overflow = '';
    }

    function bindMain(ov) {
        ov.querySelector('#nl-close').onclick = closeMain;
        ov.querySelector('#nl-mode-toggle').onclick = () => {
            SETS.uiMode = SETS.uiMode === 'dock' ? 'modal' : 'dock';
            saveSettings();
            closeMain(); openMain();
        };
        // клик по подложке закрывает только модальное окно; у док-панели подложки нет
        ov.onclick = e => { if (e.target===ov && !ov.classList.contains('nl-dock')) closeMain(); };
        // на телефоне переключать «окно/панель» бессмысленно — кнопку прячем
        if (isNarrow()) ov.querySelector('#nl-mode-toggle').style.display = 'none';

        ov.querySelectorAll('.nl-tab').forEach(t => {
            t.onclick = () => {
                curTab = t.dataset.tab;
                ov.querySelectorAll('.nl-tab').forEach(x=>x.classList.remove('active'));
                t.classList.add('active');
                ov.querySelector('.nl-sr').value='';
                renderCards();
            };
        });

        // поиск с небольшой задержкой: не перерисовываем ~180 карточек на каждую букву
        const sr = ov.querySelector('.nl-sr');
        let srTimer = null;
        const flushSearch = () => { if (srTimer) { clearTimeout(srTimer); srTimer = null; renderCards(sr.value); } };
        sr.oninput = () => { clearTimeout(srTimer); srTimer = setTimeout(flushSearch, 70); };
        sr.onkeydown = e => {
            if (manageMode) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') flushSearch();
            if (e.key==='ArrowDown') { e.preventDefault(); moveCardSelection(1); }
            else if (e.key==='ArrowUp') { e.preventDefault(); moveCardSelection(-1); }
            else if (e.key==='Enter') {
                e.preventDefault();
                (document.querySelector('.nl-card-active') || document.querySelector('.nl-grid .nl-card'))?.click();
            }
        };
        let srvTimer = null;
        ov.querySelector('#nl-srv').oninput = e => {
            if (e.target.readOnly) return;
            SETS.serverName = e.target.value.trim();
            clearTimeout(srvTimer); srvTimer = setTimeout(saveSettings, 400);
        };
        ov.querySelectorAll('.nl-pp').forEach(b => {
            b.onclick = () => { if(!manageMode){ closeMain(); setPrefix(parseInt(b.dataset.p)); } };
        });

        ov.querySelector('#nl-as').onchange = e => {
            if (e.target.checked && !confirm('При авто-отправке шаблон отправится сразу. Включить?')) { e.target.checked=false; return; }
            SETS.autoSubmit=e.target.checked; saveSettings();
        };
        ov.querySelector('#nl-fc').onchange = e => { SETS.floodControl=e.target.checked; saveSettings(); };
        ov.querySelector('#nl-hud').onclick         = openThemePicker;
        ov.querySelector('#nl-settings-btn').onclick = openSettings;
        ov.querySelector('#nl-history-btn').onclick  = openHistory;
        ov.querySelector('#nl-rulebuilder-btn').onclick = openRuleBuilder;
        ov.querySelector('#nl-profile-btn').onclick = openProfile;
        ov.querySelector('#nl-wizard-sb').onclick   = () => { closeMain(); openWizard(); };
        ov.querySelector('#nl-cr').onclick = createDialog;
        ov.querySelector('#nl-mg').onclick = () => {
            manageMode = !manageMode;
            const b = ov.querySelector('#nl-mg');
            b.textContent = manageMode?'✓ Готово':'✎ Редактировать';
            b.className = `nl-btn ${manageMode?'nl-bs':'nl-bd'}`;
            renderCards();
        };

        ov.querySelector('#nl-exp').onclick = exportTemplates;
        ov.querySelector('#nl-imp').onclick = () => ov.querySelector('#nl-file').click();
        ov.querySelector('#nl-file').onchange = e => {
            importTemplatesFile(e.target.files[0], () => { showNotification('✅ Шаблоны импортированы', 'success'); renderCards(); });
            e.target.value = '';
        };
    }

    // двигает клавиатурное выделение по видимым карточкам (стрелки в поле поиска)
    function moveCardSelection(delta) {
        const cards = [...document.querySelectorAll('.nl-grid .nl-card')];
        if (!cards.length) return;
        let idx = cards.findIndex(c => c.classList.contains('nl-card-active'));
        cards.forEach(c => c.classList.remove('nl-card-active'));
        idx = idx < 0 ? (delta > 0 ? 0 : cards.length - 1) : Math.max(0, Math.min(cards.length - 1, idx + delta));
        cards[idx].classList.add('nl-card-active');
        cards[idx].scrollIntoView({ block: 'nearest' });
    }

    // РЕНДЕР КАРТОЧЕК
    // текст шаблона без BB/HTML-разметки — кэшируем, чтобы поиск не чистил его на каждую букву
    const plainCache = new WeakMap();
    function plainText(tpl) {
        const c = plainCache.get(tpl);
        if (c && c.src === tpl.content) return c.text;
        const text = String(tpl.content || '').replace(/\[[^\]]*\]/g, '').replace(/<[^>]*>/g, '').replace(/[ \t]+/g, ' ').trim();
        plainCache.set(tpl, { src: tpl.content, text });
        return text;
    }
    const tabOf = id => Object.keys(TPLS).find(k => TPLS[k].some(t => t.id === id));

    function renderCards(filter='') {
        const grid = document.querySelector('.nl-grid'); if(!grid) return;
        let items = [];
        const originTab = {}; // id -> tabId, только при глобальном поиске (для бейджа раздела)

        if (curTab==='recent') {
            const seen = new Set();
            for (const h of HIST) {
                if (!h || seen.has(h.id)) continue; seen.add(h.id);
                const found = findTpl(h.id);
                if (found) items.push(found);
            }
        } else if (filter) {
            Object.entries(TPLS).forEach(([tabId,arr]) => arr.forEach(t => {
                if (fuzz(filter,t.title) || fuzz(filter,t.tags||'') || fuzz(filter,plainText(t))) { items.push(t); originTab[t.id] = tabId; }
            }));
        } else {
            items = [...(TPLS[curTab]||[])];
        }

        if (curTab !== 'recent') items.sort((a,b) => {
            if (!!a.isPinned !== !!b.isPinned) return b.isPinned ? 1 : -1;
            if (!!a.isNew !== !!b.isNew)       return b.isNew ? 1 : -1;
            return 0;
        });

        if (!items.length) {
            grid.innerHTML=`<div class="nl-empty"><div class="nl-empty-icon">${filter?'🔍':curTab==='recent'?'🕐':'📂'}</div>${filter?'Ничего не найдено':curTab==='recent'?'История пуста':'Раздел пуст'}</div>`;
            return;
        }

        const byId = {};
        grid.innerHTML = items.map(tpl => {
            byId[tpl.id] = tpl;
            const full = plainText(tpl);
            const pc = PREFIX_COLORS[tpl.prefix]||'#666';
            const pn = PREFIX_NAMES[tpl.prefix] ||'Без префикса';
            const titleDisplay = tpl.title.length > 38 ? tpl.title.substring(0, 38) + '…' : tpl.title;
            const originName = filter && originTab[tpl.id] ? TABS.find(t=>t.id===originTab[tpl.id])?.name : null;
            return `<div class="nl-card${tpl.isPinned?' pinned':''}${manageMode?' em':''}" data-id="${esc(tpl.id)}"${manageMode ? '' : ` tabindex="0" role="button" aria-label="Вставить шаблон: ${esc(tpl.title)}"`}>
                ${tpl.isPinned ? '<div class="nl-pin-star">★</div>' : ''}
                <h3 title="${esc(tpl.title)}">${esc(titleDisplay)}${tpl.isNew?'<span class="nl-new">NEW</span>':''}</h3>
                <div class="nl-card-preview">${esc(full.substring(0,90))}…</div>
                <span class="nl-badge" style="background:${pc}12;color:${pc};border:1px solid ${pc}30">${pn}</span>
                ${originName?`<span class="nl-badge nl-badge-tab">${esc(originName)}</span>`:''}
                ${tpl.uses?`<span class="nl-uses">×${tpl.uses}</span>`:''}
                <div class="nl-tooltip">${esc(full.substring(0,700))}</div>
                ${manageMode ? `<div class="nl-mo">
                    <button class="nl-ib" data-a="ed"  title="Редактировать" aria-label="Редактировать «${esc(tpl.title)}»">✎</button>
                    <button class="nl-ib" data-a="dup" title="Дублировать" aria-label="Дублировать «${esc(tpl.title)}»">⧉</button>
                    <button class="nl-ib" data-a="pin" title="${tpl.isPinned?'Открепить':'Закрепить'}" aria-label="${tpl.isPinned?'Открепить':'Закрепить'} «${esc(tpl.title)}»">${tpl.isPinned?'★':'☆'}</button>
                    <button class="nl-ib del" data-a="del" title="Удалить" aria-label="Удалить «${esc(tpl.title)}»">🗑</button>
                </div>` : ''}
            </div>`;
        }).join('');

        // Enter/пробел на карточке в фокусе = клик
        grid.onkeydown = e => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('nl-card')) { e.preventDefault(); e.target.click(); }
        };
        // один обработчик на всю сетку вместо пяти на каждую карточку
        grid.onclick = e => {
            const card = e.target.closest('.nl-card'); if (!card) return;
            const tpl = byId[card.dataset.id]; if (!tpl) return;
            if (!manageMode) { insertTemplate(tpl); return; }
            const act = e.target.closest('[data-a]')?.dataset.a;
            if (!act) return;
            e.stopPropagation();
            if (act === 'ed') editDialog(tpl);
            else if (act === 'dup') {
                const tab = tabOf(tpl.id) || 'custom';
                const cl = { ...deepClone(tpl), id: newId(), title: tpl.title + ' (копия)', isNew: true, uses: 0 };
                delete cl.rule;
                TPLS[tab].push(cl); saveTemplates(); renderCards(filter);
            } else if (act === 'pin') { tpl.isPinned = !tpl.isPinned; saveTemplates(); renderCards(filter); }
            else if (act === 'del') {
                if (!confirm(`Удалить "${tpl.title}"?`)) return;
                for (const k of Object.keys(TPLS)) TPLS[k] = TPLS[k].filter(t => t.id !== tpl.id);
                saveTemplates(); renderCards(filter);
            }
        };
    }

    // ДИАЛОГ СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
    function createDialog() {
        if (!TPLS.custom) TPLS.custom=[];
        if (TPLS.custom.length>=MAX_CUSTOM){ alert(`Лимит: ${MAX_CUSTOM} кастомных шаблонов.`); return; }
        showEditDialog('Создать шаблон',{title:'',prefix:0,tags:'',content:''},v=>{
            if(!v.title||!v.content){ alert('Название и текст обязательны.'); return false; }
            TPLS.custom.push({id:newId(),title:v.title,prefix:parseInt(v.prefix)||0,tags:v.tags||'',content:v.content,isPinned:false,isNew:true,uses:0});
            curTab='custom';
            document.querySelectorAll('.nl-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='custom'));
            saveTemplates(); renderCards();
        });
    }
    function editDialog(tpl) {
        showEditDialog('Редактировать шаблон',tpl,v=>{
            if(!v.title||!v.content){ alert('Название и текст обязательны.'); return false; }
            tpl.title=v.title; tpl.prefix=parseInt(v.prefix)||0; tpl.tags=v.tags||''; tpl.content=v.content;
            saveTemplates(); renderCards();
        });
    }
    function showEditDialog(title, tpl, cb) {
        const ov=document.createElement('div'); ov.className='nl-dov';
        const phHtml=PH_HELP.map(([p,d])=>`<code>${p}</code> ${d}`).join(' &nbsp;·&nbsp; ');
        ov.innerHTML=`
            <div class="nl-dbox">
                <div class="nl-dt">${esc(title)}</div>
                <div class="nl-f"><label>Название</label><input class="nl-in" id="dd-t" value="${esc(tpl.title||'')}" placeholder="Например: Одобрено — скам"></div>
                <div class="nl-f"><label>Префикс</label><select class="nl-sel" id="dd-p">${Object.entries(PREFIX_NAMES).map(([i,n])=>`<option value="${i}" ${parseInt(i)===(tpl.prefix||0)?'selected':''}>${n}</option>`).join('')}</select></div>
                <div class="nl-f"><label>Теги (для поиска)</label><input class="nl-in" id="dd-tags" value="${esc(tpl.tags||'')}" placeholder="Например: скам, мошенничество, жалоба"></div>
                <div class="nl-f">
                    <label>Текст (BB-код + плейсхолдеры)</label>
                    <textarea class="nl-ta" id="dd-c" rows="8">${esc(tpl.content||'')}</textarea>
                    <div class="nl-ph-hint">${phHtml}</div>
                </div>
                <div class="nl-da">
                    <button class="nl-btn nl-bn" id="dd-pv" style="margin-right:auto">👁 Предпросмотр</button>
                    <button class="nl-btn nl-bd" id="dd-x">Отмена</button>
                    <button class="nl-btn nl-bp" id="dd-s">Сохранить</button>
                </div>
            </div>`;
        mountDialog(ov);
        ov.querySelector('#dd-x').onclick=()=>ov.remove();
        // предпросмотр собирает пост так же, как при вставке (с подстановкой плейсхолдеров)
        ov.querySelector('#dd-pv').onclick=()=>{
            const content = ov.querySelector('#dd-c').value;
            const body = tpl.isRaw ? applyPH(content) : `[SIZE=6][COLOR=rgb(255,255,255)][I]${applyPH(content)}[/I][/COLOR][/SIZE]`;
            showPreview(wrapPost(mentionOf(getAuthor()), serverName(), body));
        };
        ov.querySelector('#dd-s').onclick=()=>{
            const ok = cb({title:ov.querySelector('#dd-t').value.trim(),prefix:ov.querySelector('#dd-p').value,tags:ov.querySelector('#dd-tags').value.trim(),content:ov.querySelector('#dd-c').value.trim()});
            if (ok !== false) ov.remove(); // при ошибке ввода окно не закрываем — текст не теряется
        };
        ov.querySelector('#dd-t').focus();
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // собирает и вставляет пост по одному или нескольким пунктам правил
    // (общая точка для конструктора, мастера решений и командной строки)
    function insertCombinedRules(approved, rules) {
        if (!rules.length) return false;
        rules = rules.filter(r => RULES[r]);
        if (!rules.length) return false;
        if (!confirmOverwriteIfNeeded()) return false;
        const word = approved ? 'Одобрено' : 'Отказано';
        const title = rules.length > 1
            ? `${word} (сборный: ${rules.map(ruleLabel).join(', ')})`
            : `${word} — ${RULES[rules[0]].short} [${ruleLabel(rules[0])}]`;
        const syntheticTpl = { id:'combo', title, rules, prefix: approved ? P.ACCEPT : P.UNACCEPT };
        return finishInsert(syntheticTpl, wrapPost(mentionOf(getAuthor()), serverName(), combinedRuleBody(approved, rules)));
    }

    // строка правила в списке с чекбоксами (конструктор и мастер)
    const ruleRowHtml = (rule, badge = '') => {
        const r = RULES[rule];
        const tag = r.note ? '<span class="nl-rb-note">прим.</span>' : r.set !== 'general' ? `<span class="nl-rb-note">${RULE_SETS[r.set].short}</span>` : '';
        const search = `${r.num} ${r.desc} ${r.short} ${r.tags} ${RULE_SETS[r.set].short} ${RULE_SETS[r.set].name}`;
        return `<label class="nl-rb-row" data-search="${esc(search)}"><input type="checkbox" value="${esc(rule)}"><span><b>${esc(r.num)}</b>${tag} — ${esc(r.desc)}${r.penalty ? ` <span class="nl-rb-pen">| ${esc(r.penalty)}</span>` : ''}${badge}</span></label>`;
    };
    // группы для списка правил: разделы общих правил + отдельные наборы
    const GENERAL_SECTIONS = { '2':'Игровой процесс', '3':'Игровые чаты', '4':'Игровые аккаунты' };
    const ruleGroup = id => { const r = RULES[id]; return r.set === 'general' ? 'general:' + r.num.split('.')[0] : r.set; };
    const ruleGroupTitle = g => g.startsWith('general:')
        ? `Раздел ${g.slice(8)} — ${GENERAL_SECTIONS[g.slice(8)] || ''}`
        : RULE_SETS[g].name;

