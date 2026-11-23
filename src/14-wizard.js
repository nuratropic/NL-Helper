    // МАСТЕР РЕШЕНИЙ — пошаговый разбор жалобы: текст → доказательства → категория → готовый пост

    // хостинги скриншотов/видео и расширения медиафайлов, по которым ищем доказательства
    const EVIDENCE_HOSTS = /(?:postimg\.cc|postimages\.org|imgur\.com|ibb\.co|imgbb\.com|prnt\.sc|prntscr\.com|skrinshoter\.ru|snipboard\.io|youtube\.com|youtu\.be|rutube\.ru|streamable\.com|medal\.tv|twitch\.tv|vimeo\.com|drive\.google\.com|dropbox\.com|disk\.yandex|discord(?:app)?\.com)/i;
    const EVIDENCE_FILE  = /\.(?:png|jpe?g|gif|webp|bmp|mp4|webm|mov|avi)(?:\?|$)/i;

    // соцсети как хостинг доказательств запрещены (п. 3.6 правил подачи жалоб)
    const SOCIAL_HOSTS = /(?:^|\/\/|\.)(?:vk\.com|vk\.ru|vkvideo\.ru|ok\.ru|odnoklassniki\.ru)(?:[/:?#]|$)/i;

    function detectEvidence(text, postEl) {
        // ссылки берём и из текста, и из href/src: у «[URL=…]Доказательство[/URL]» адреса в тексте нет
        const urls = String(text||'').split(/\s+/).filter(t => /^https?:\/\//i.test(t) || EVIDENCE_HOSTS.test(t));
        let media = 0;
        if (postEl) {
            postEl.querySelectorAll('a[href]').forEach(a => urls.push(a.href));
            postEl.querySelectorAll('iframe[src], video source[src], video[src]').forEach(el => urls.push(el.src));
            media = postEl.querySelectorAll('img:not(.smilie):not([data-smilie]), video, iframe, .bbMediaWrapper, a[href*="/attachments/"]').length;
        }
        const uniq = [...new Set(urls)];
        const links = uniq.filter(u => EVIDENCE_HOSTS.test(u) || EVIDENCE_FILE.test(u));
        const social = uniq.filter(u => SOCIAL_HOSTS.test(u));
        return { found: links.length > 0 || media > 0, links, media, social };
    }

    // «Nick_Name | Суть жалобы» — форма названия темы из правил подачи жалоб
    const TITLE_FORM_RE = /[A-Za-z]{2,}_[A-Za-z]{2,}.*\|\s*\S/;

    // слова, не помогающие отличить один пункт правил от другого
    const RULE_STOP_WORDS = new Set([
        'на','по','из','за','он','вы','мы','ты','их','до','от','об','во','со','не','ни','да','ее','её',
        'она','они','оно','что','это','как','при','под','над','все','всех','был','была','было','или','без','для','его',
        'любые','любая','любой','форма','формы','форме','пункт','пункту','пунктам',
        'игрок','игроки','игрока','игроков','игрокам','человек','данный','данного',
        'сервер','сервера','серверов','серверах','проекта',
        'запрещено','запрещен','запрещена','запрещены','запрещается','запрещён',
        'жалоба','жалобу','жалобы','одобрено','отказано','здравствуйте','пожалуйста','прошу','нарушение','нарушил',
    ]);
    const splitWords = s => String(s||'').toLowerCase().split(/[^a-zа-яё0-9.+\/]+/).filter(w => w.length >= 2 && !RULE_STOP_WORDS.has(w));

    // ключевые слова каждого пункта: описание из RULES + теги готового шаблона
    // (в тегах уже собраны сленг и аббревиатуры — «дм», «ск», «читы» и т.п.)
    let RULE_KEYWORDS = null;
    function ruleKeywords() {
        if (RULE_KEYWORDS) return RULE_KEYWORDS;
        RULE_KEYWORDS = {};
        Object.entries(RULES).forEach(([rule, r]) => {
            RULE_KEYWORDS[rule] = { tags: new Set(splitWords(r.tags + ' ' + r.short)), desc: new Set(splitWords(r.desc)) };
        });
        return RULE_KEYWORDS;
    }

    // сортирует пункты правил по похожести на текст жалобы — локальное сравнение ключевых слов
    function scoreRulesByText(text, sets = ['general']) {
        const kw = ruleKeywords();
        const tokens = [...new Set(splitWords(text))];
        return Object.keys(RULES).filter(rule => sets.includes(RULES[rule].set)).map(rule => {
            let score = 0;
            const { tags, desc } = kw[rule];
            tokens.forEach(tok => {
                if (tok === RULES[rule].num) { score += 10; return; } // в жалобе прямо указан номер пункта
                if (tags.has(tok)) { score += 3;  return; }
                if (desc.has(tok)) { score += 2;  return; }
                if (tok.length >= 5) {                      // грубое совпадение по основе: «стрелял» ≈ «стрельба»
                    const stem = tok.slice(0, 5);
                    for (const w of tags) if (w.startsWith(stem)) { score += 2; return; }
                    for (const w of desc) if (w.startsWith(stem)) { score += 1; return; }
                }
            });
            // правила организаций чуть ниже общих при равной похожести — жалобы чаще по общим правилам
            if (RULES[rule].set !== 'general') score *= 0.8;
            return { rule, score };
        }).sort((a, b) => b.score - a.score || (a.rule < b.rule ? -1 : 1));
    }

    // похожесть готового шаблона на текст жалобы — для сортировки списков админ/лидер/апелляция
    function scoreTemplateByText(tpl, tokens) {
        const hay = (tpl.title + ' ' + (tpl.tags||'') + ' ' + tpl.content).toLowerCase();
        let score = 0;
        tokens.forEach(tok => { if (tok.length >= 3 && hay.includes(tok)) score++; });
        return score;
    }

    // КОНТЕКСТ СТРАНИЦЫ: раздел форума, сервер, сроки, форма жалобы, ники
    // «хлебные крошки» темы: … › Сервер №91 | ASTANA › Жалобы › Жалобы на игроков
    function getCrumbs() {
        return [...new Set([...document.querySelectorAll('.p-breadcrumbs a, .p-breadcrumbs li')]
            .map(a => a.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean))];
    }
    const SECTION_PATTERNS = [
        [/жалобы\s+на\s+игрок/i,        'players'],
        [/жалобы\s+на\s+администрац/i,  'admins'],
        [/жалобы\s+на\s+лидер/i,        'leaders'],
        [/обжаловани/i,                 'appeals'],
        [/(рп|rp)\s*биограф/i,          'rp_bio'],
        [/(рп|rp)\s*ситуац/i,           'rp_sit'],
        [/неофициальн/i,                'opg'],
    ];
    // раздел темы по «крошкам» (ближайший к теме уровень важнее)
    function detectSection() {
        const crumbs = getCrumbs();
        for (let i = crumbs.length - 1; i >= 0; i--) {
            for (const [re, tab] of SECTION_PATTERNS) if (re.test(crumbs[i])) return tab;
        }
        return null;
    }
    // «Сервер №91 | ASTANA» → «ASTANA»
    function detectServer() {
        for (const c of getCrumbs()) {
            const m = c.match(/Сервер\s*№\s*\d+\s*\|\s*([A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё\- ]*)/);
            if (m) return m[1].trim().toUpperCase();
        }
        return '';
    }
    // время создания темы (XenForo кладёт unix-время в data-time)
    function getThreadStart() {
        const el = document.querySelector('.p-description time[data-time], .message-threadStarterPost time.u-dt[data-time], article.message time.u-dt[data-time]');
        const ts = el ? parseInt(el.getAttribute('data-time')) * 1000 : NaN;
        return isNaN(ts) ? null : ts;
    }
    // срок рассмотрения по правилам подачи: жалобы — 2 рабочих дня, остальное — 72 часа
    const REVIEW_TERMS = {
        players: { days: 2, label: '2 рабочих дня' }, admins: { days: 2, label: '2 рабочих дня' }, leaders: { days: 2, label: '2 рабочих дня' },
        appeals: { hours: 72, label: '72 часа' }, rp_bio: { hours: 72, label: '72 часа' }, rp_sit: { hours: 72, label: '72 часа' }, opg: { hours: 72, label: '72 часа' },
    };
    function addBusinessDays(ts, n) {
        const d = new Date(ts);
        let added = 0;
        while (added < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) added++; }
        return d.getTime();
    }
    const fmtSpan = ms => {
        const h = Math.floor(Math.abs(ms) / 3600000), m = Math.floor(Math.abs(ms) % 3600000 / 60000);
        return h >= 24 ? `${Math.floor(h / 24)} д ${h % 24} ч` : h ? `${h} ч ${m} мин` : `${m} мин`;
    };
    // { text, overdue, soon } — для бейджа в окне и в мастере; null, если раздел/дата неизвестны
    function reviewDeadline(section) {
        const term = REVIEW_TERMS[section];
        const start = getThreadStart();
        if (!term || !start) return null;
        const due = term.days ? addBusinessDays(start, term.days) : start + term.hours * 3600000;
        const left = due - Date.now();
        return {
            overdue: left < 0, soon: left >= 0 && left < 6 * 3600000,
            text: `Тема создана ${fmtSpan(Date.now() - start)} назад · срок рассмотрения ${term.label}: ` +
                (left < 0 ? `просрочено на ${fmtSpan(left)}` : `осталось ${fmtSpan(left)}`),
        };
    }
    // поля формы подачи (правила подачи жалоб/обжалований); [подпись, шаблон поиска]
    const FORM_FIELDS = {
        players: [['Ваш Nick_Name', /ваш\s*nick/i], ['Nick_Name игрока', /nick[\s_]*name\s*игрока/i], ['Суть жалобы', /суть\s*жалобы/i], ['Доказательство', /доказательств/i]],
        admins:  [['Ваш Nick_Name', /ваш\s*nick/i], ['Nick_Name администратора', /nick[\s_]*name\s*администратора/i], ['Дата наказания', /дата/i], ['Суть жалобы', /суть\s*жалобы/i], ['Доказательство', /доказательств/i]],
        leaders: [['Ваш Nick_Name', /ваш\s*nick/i], ['Nick_Name лидера', /nick[\s_]*name\s*лидера/i], ['Суть жалобы', /суть\s*жалобы/i], ['Доказательство', /доказательств/i]],
        appeals: [['Ваш Nick_Name', /ваш\s*nick/i], ['Nick_Name администратора', /nick[\s_]*name\s*администратора/i], ['Дата наказания', /дата/i], ['Суть заявки', /суть\s*заявки/i], ['Доказательство', /доказательств/i]],
    };
    const FORM_DENY_TPL = { players: 'p5', admins: 'a7', leaders: 'l6', appeals: 'ap9' };
    function checkForm(section, text) {
        const fields = FORM_FIELDS[section];
        if (!fields) return null;
        const missing = fields.filter(([, re]) => !re.test(text)).map(([name]) => name);
        return { total: fields.length, missing };
    }
    // ник нарушителя из пункта «Nick_Name игрока/администратора/лидера: …»
    function extractViolator(text) {
        const m = String(text || '').match(/nick[\s_]*name\s*(?:игрока|администратора|лидера)\s*[:\-—]?\s*([A-Za-z0-9]+_[A-Za-z0-9_]+)/i);
        return m ? m[1] : '';
    }
    // ник того, кто сейчас отвечает (вошедший пользователь)
    function getCurator() {
        const el = document.querySelector('.p-navgroup-link--user .p-navgroup-linkText, .p-navgroup-link--user .username, .p-account .p-navgroup-linkText');
        if (el && el.textContent.trim()) return el.textContent.trim();
        const img = document.querySelector('.p-navgroup-link--user img[alt]');
        return img ? img.getAttribute('alt').trim() : '';
    }

    function openWizard() {
        if (document.querySelector('.nl-wiz-ov')) return;
        const hd = theme();
        const postEl   = firstPost();
        const autoText = postText(postEl);
        const threadTitle = getThreadTitle();
        const section = detectSection();
        // для биографий «разобрать» = анализатор биографии
        if (section === 'rp_bio') { openBioAnalyzer(); return; }
        const preset = ['players', 'admins', 'leaders', 'appeals'].includes(section) ? section : null;
        const state = {
            step: 1,
            text: autoText,
            manualDraft: '',
            evidence: detectEvidence(autoText, postEl),
            evidenceOverride: null, // null — как определил скрипт; true/false — поправил куратор
            category: preset,
            ruleSets: null,          // для шага 3: какие наборы правил показать
        };
        const hasEvidence = () => state.evidenceOverride === null ? state.evidence.found : state.evidenceOverride;
        const dbh = !!theme().dbh; // в Detroit-темах мастер говорит языком анализа улик
        const stepNames = dbh ? ['Анализ улик', 'Категория', 'Решение'] : ['Текст жалобы', 'Категория', 'Решение'];

        const ov = document.createElement('div');
        ov.className = 'nl-dov nl-wiz-ov';
        ov.innerHTML = `
            <div class="nl-dbox" style="width:660px">
                <div class="nl-dt" style="text-align:center">🧙 Мастер решений</div>
                <div class="nl-wiz-steps"></div>
                <div id="wiz-body" style="display:flex;flex-direction:column;gap:13px"></div>
            </div>`;
        mountDialog(ov, 'Мастер решений');
        ov.onclick = e => { if (e.target === ov) ov.remove(); };

        const body = () => ov.querySelector('#wiz-body');
        const useTpl = (tid, tab) => { const t = findTpl(tid); if (!t) return; curTab = tab || 'players'; ov.remove(); insertTemplate(t); };

        function render() {
            ov.querySelector('.nl-wiz-steps').innerHTML = stepNames.map((n, i) =>
                `<div class="nl-wiz-step${state.step === i+1 ? ' active' : state.step > i+1 ? ' done' : ''}">${i+1}. ${n}</div>`).join('');
            if (state.step === 1)      renderStep1();
            else if (state.step === 2) renderStep2();
            else                       renderStep3();
            focusFirst(ov);
        }

        function renderStep1() {
            const ev  = state.evidence;
            const has = hasEvidence();
            const evColor = has ? '#22c55e' : '#ffa502';
            const cat = state.category || section;
            const dl = reviewDeadline(cat);
            const form = checkForm(cat, state.text);
            const violator = extractViolator(state.text);
            const dlColor = dl ? (dl.overdue ? '#ff4757' : dl.soon ? '#ffa502' : hd.text2) : '';
            body().innerHTML = `
                ${preset ? `<div class="nl-wiz-info">📂 Раздел: <b>${esc(TABS.find(t => t.id === preset).name)}</b>${violator ? ` · нарушитель: <b>${esc(violator)}</b>` : ''}</div>` : (violator ? `<div class="nl-wiz-info">Нарушитель: <b>${esc(violator)}</b></div>` : '')}
                ${dl ? `<div class="nl-wiz-info" style="color:${dlColor}">⏱ ${esc(dl.text)}</div>` : ''}
                ${state.text
                    ? `<div class="nl-wiz-excerpt">${esc(state.text.substring(0,600))}${state.text.length>600?'…':''}</div>`
                    : `<div class="nl-f"><label>Первый пост не найден — вставьте текст жалобы вручную</label><textarea class="nl-ta" id="wiz-manual" rows="6" placeholder="Текст жалобы…">${esc(state.manualDraft)}</textarea></div>`}
                <div class="nl-wiz-verdict" style="border-color:${evColor}44;background:${evColor}10;color:${evColor}">
                    <span>${has ? (dbh ? '✔ Улики обнаружены' : '✔ Доказательства обнаружены') : (dbh ? '✖ Улики не обнаружены' : '✖ Доказательства не обнаружены')}
                        <span style="font-weight:400;opacity:.8">· ссылок: ${ev.links.length}, вложений: ${ev.media}</span></span>
                    <span style="display:flex;gap:6px">
                        <button class="nl-btn nl-btn-sm ${has?'nl-bs':'nl-bn'}" id="wiz-ev-yes">Есть</button>
                        <button class="nl-btn nl-btn-sm ${!has?'nl-bd':'nl-bn'}" id="wiz-ev-no">Нет</button>
                    </span>
                </div>
                ${form && form.missing.length ? `<div class="nl-wiz-quick"><span>⚠ Форма подачи заполнена не полностью (${form.total - form.missing.length}/${form.total}), нет: ${esc(form.missing.join(', '))}</span>
                    <button class="nl-btn nl-btn-sm nl-bd" id="wiz-q-form">✖ Отказать (не по форме)</button></div>` : ''}
                ${ev.social && ev.social.length ? `<div class="nl-wiz-quick"><span>⚠ Доказательства в соцсетях (ВК/ОК) — по правилам подачи не принимаются</span>
                    <button class="nl-btn nl-btn-sm nl-bd" id="wiz-q-social">✖ Отказать (соцсети)</button></div>` : ''}
                ${threadTitle && !TITLE_FORM_RE.test(threadTitle) ? `<div class="nl-wiz-quick"><span>⚠ Название темы не по форме «Nick_Name | Суть жалобы»</span>
                    <button class="nl-btn nl-btn-sm nl-bd" id="wiz-q-title">✖ Отказать (название)</button></div>` : ''}
                <div style="font-size:11px;color:${hd.text2};font-family:var(--nl-font)">Скрипт ищет в первом посте ссылки на скриншоты и видео (postimg, imgur, YouTube и т.п.) и вложения. Если он ошибся — поправьте кнопками выше.</div>
                <div class="nl-da"><button class="nl-btn nl-bp" id="wiz-next">Далее →</button></div>`;
            const formTab = cat === 'players' ? 'players' : cat;
            [['#wiz-q-social', 'p24', 'players'], ['#wiz-q-title', 'p22', 'players'], ['#wiz-q-form', FORM_DENY_TPL[cat], formTab]].forEach(([sel, tid, tab]) => {
                const b = body().querySelector(sel);
                if (b && tid) b.onclick = () => useTpl(tid, tab);
            });
            const stashManual = () => { const m = body().querySelector('#wiz-manual'); if (m) state.manualDraft = m.value; };
            body().querySelector('#wiz-ev-yes').onclick = () => { stashManual(); state.evidenceOverride = true;  render(); };
            body().querySelector('#wiz-ev-no').onclick  = () => { stashManual(); state.evidenceOverride = false; render(); };
            body().querySelector('#wiz-next').onclick   = () => {
                const m = body().querySelector('#wiz-manual');
                if (m && m.value.trim()) {
                    state.text = m.value.trim();
                    if (state.evidenceOverride === null) state.evidence = detectEvidence(state.text, null);
                }
                // раздел известен по «крошкам» — выбор категории пропускаем
                state.step = state.category ? 3 : 2; render();
            };
        }

        function renderStep2() {
            body().innerHTML = `
                <div class="nl-wiz-cat">
                    <button data-c="players"><span class="t">👤 Игрок</span><span class="d">Жалоба на игрока — подбор пунктов правил</span></button>
                    <button data-c="admins"><span class="t">🛡 Администратор</span><span class="d">Жалоба на действия администрации</span></button>
                    <button data-c="leaders"><span class="t">👑 Лидер</span><span class="d">Жалоба на лидера фракции</span></button>
                    <button data-c="appeals"><span class="t">⚖️ Апелляция</span><span class="d">Обжалование наказания</span></button>
                </div>
                <div class="nl-da" style="justify-content:flex-start"><button class="nl-btn nl-bn" id="wiz-back">← Назад</button></div>`;
            body().querySelectorAll('.nl-wiz-cat button').forEach(b => {
                b.onclick = () => { state.category = b.dataset.c; state.ruleSets = null; state.step = 3; render(); };
            });
            body().querySelector('#wiz-back').onclick = () => { state.step = 1; render(); };
        }

        function renderStep3() {
            if (state.category === 'players') renderStep3Rules(['general', 'gov', 'crim'], 'players');
            else if (state.ruleSets) renderStep3Rules(state.ruleSets, state.category);
            else renderStep3Templates();
        }

        const back = () => { if (state.ruleSets && state.category !== 'players') { state.ruleSets = null; } else { state.step = preset ? 1 : 2; } render(); };

        function renderStep3Rules(sets, tab) {
            const scored = scoreRulesByText(state.text, sets);
            const matchCut = Math.min(5, scored.filter(s => s.score >= 3).length);
            let approved = hasEvidence();
            const rowsHtml = scored.map((s, i) =>
                ruleRowHtml(s.rule, i < matchCut ? '<span class="nl-wiz-match">похоже на это</span>' : '')).join('');
            const isPlayers = tab === 'players';
            body().innerHTML = `
                ${isPlayers && !hasEvidence() ? `<div class="nl-wiz-quick"><span>Доказательств нет — можно сразу:</span>
                    <button class="nl-btn nl-btn-sm nl-bn" id="wiz-q-wait">⏳ Запросить доказательства</button>
                    <button class="nl-btn nl-btn-sm nl-bd" id="wiz-q-deny">✖ Отказать</button></div>` : ''}
                ${isPlayers ? `<div style="font-size:11px;color:${hd.text2};font-family:var(--nl-font)">В списке общие правила серверов и правила гос./криминальных организаций.</div>` : ''}
                <div class="nl-dtabs">
                    <button class="nl-dtab${approved?' active':''}" data-v="accept">✅ Одобрено</button>
                    <button class="nl-dtab${!approved?' active':''}" data-v="unaccept">❌ Отказано</button>
                </div>
                <input class="nl-in" id="wiz-search" placeholder="Фильтр по номеру или описанию…">
                <div id="wiz-list" style="max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">${rowsHtml}</div>
                <div class="nl-da" style="justify-content:space-between;align-items:center">
                    <button class="nl-btn nl-bn" id="wiz-back">← Назад</button>
                    <span style="display:flex;gap:10px;align-items:center">
                        <span id="wiz-count" style="font-size:12px;color:${hd.text2};font-family:var(--nl-font)">Выбрано: 0</span>
                        <button class="nl-btn nl-bp" id="wiz-insert" disabled>Вставить</button>
                    </span>
                </div>`;
            [['#wiz-q-wait', 'p6'], ['#wiz-q-deny', 'p4']].forEach(([sel, tid]) => {
                const b = body().querySelector(sel); if (b) b.onclick = () => useTpl(tid, 'players');
            });
            body().querySelectorAll('.nl-dtab').forEach(tabEl => {
                tabEl.onclick = () => {
                    body().querySelectorAll('.nl-dtab').forEach(t => t.classList.remove('active'));
                    tabEl.classList.add('active');
                    approved = tabEl.dataset.v === 'accept';
                };
            });
            const list = body().querySelector('#wiz-list');
            const insertBtn = body().querySelector('#wiz-insert');
            list.addEventListener('change', () => {
                const n = list.querySelectorAll('input:checked').length;
                body().querySelector('#wiz-count').textContent = `Выбрано: ${n}`;
                insertBtn.disabled = n === 0;
            });
            body().querySelector('#wiz-search').oninput = e => {
                const q = e.target.value.trim();
                list.querySelectorAll('.nl-rb-row').forEach(row => {
                    row.style.display = (!q || fuzz(q, row.dataset.search)) ? '' : 'none';
                });
            };
            insertBtn.onclick = () => {
                const rules = [...list.querySelectorAll('input:checked')].map(i => i.value);
                curTab = tab;
                if (insertCombinedRules(approved, rules)) ov.remove();
            };
            body().querySelector('#wiz-back').onclick = back;
        }

        function renderStep3Templates() {
            const tabId  = state.category;
            const tokens = [...new Set(splitWords(state.text))];
            const items  = [...(TPLS[tabId]||[])]
                .map(t => ({ t, score: scoreTemplateByText(t, tokens) }))
                .sort((a, b) => b.score - a.score || (b.t.isPinned?1:0) - (a.t.isPinned?1:0));
            const maxScore = items.length ? items[0].score : 0;
            body().innerHTML = `
                ${tabId === 'leaders' ? `<div class="nl-wiz-quick" style="color:var(--nl-accent);border-color:var(--nl-accent);background:transparent"><span>Нужен конкретный пункт «Правил и обязанностей лидера»?</span>
                    <button class="nl-btn nl-btn-sm nl-bn" id="wiz-leader-rules">⚖ Пункты правил лидера</button></div>` : ''}
                <div style="font-size:11px;color:${hd.text2};font-family:var(--nl-font)">Шаблоны раздела «${esc(TABS.find(t=>t.id===tabId)?.name||tabId)}», самые похожие на текст жалобы — сверху. Клик — вставить.</div>
                <div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:6px">
                    ${items.map(({t,score},i) => {
                        const pc = PREFIX_COLORS[t.prefix]||'#666';
                        const preview = plainText(t).substring(0,110);
                        const badge = (score>0 && score===maxScore && maxScore>=2) ? '<span class="nl-wiz-match">похоже на это</span>' : '';
                        return `<div class="nl-wiz-tplrow" data-i="${i}" tabindex="0" role="button">
                            <span style="font-weight:700;font-size:13px;letter-spacing:.05em;text-transform:uppercase;color:${hd.text}">${esc(t.title)}${badge}</span>
                            <span style="font-size:11px;color:${hd.text2}">${esc(preview)}…</span>
                            <span class="nl-badge" style="background:${pc}12;color:${pc};border:1px solid ${pc}30;align-self:flex-start">${PREFIX_NAMES[t.prefix]||'Без префикса'}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="nl-da" style="justify-content:flex-start"><button class="nl-btn nl-bn" id="wiz-back">← Назад</button></div>`;
            body().querySelectorAll('.nl-wiz-tplrow').forEach(row => {
                const pickRow = () => { const t = items[parseInt(row.dataset.i)].t; curTab = tabId; ov.remove(); insertTemplate(t); };
                row.onclick = pickRow;
                row.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickRow(); } };
            });
            const lr = body().querySelector('#wiz-leader-rules');
            if (lr) lr.onclick = () => { state.ruleSets = ['leader']; render(); };
            body().querySelector('#wiz-back').onclick = back;
        }

        render();
    }

