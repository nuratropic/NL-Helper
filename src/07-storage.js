    // СОСТОЯНИЕ
    let TPLS     = loadTemplates();
    let SETS     = loadSettings();
    let STATS    = loadStats();
    let HIST     = loadHistory();
    let curTheme = gm.get(STORAGE.THEME) || 'amber';
    let curTab   = 'players';
    let manageMode = false;
    let floodIv  = null;
    let styleEl  = null;
    let lastEditorSnapshot = null;
    let lastInsertedHTML   = null;
    let sectionApplied     = false; // вкладку по разделу форума выбираем только при первом открытии окна

    const theme = () => {
        const t = THEMES[curTheme];
        if (!t) { curTheme = 'amber'; gm.set(STORAGE.THEME, 'amber'); return THEMES.amber; }
        return t;
    };

    // ЗАГРУЗКА / СОХРАНЕНИЕ
    function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
    // объявлены функциями (а не const), т.к. вызываются из loadTemplates() выше по тексту — при старте
    function emptyTplState() { return { version: STORAGE_VERSION, ov: {}, del: [], extra: {} }; }
    function newId() { return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

    // приводит внешний/сохранённый шаблон к безопасному виду; null — если он непригоден
    function sanitizeTpl(t) {
        if (!t || typeof t !== 'object' || typeof t.title !== 'string' || typeof t.content !== 'string') return null;
        const out = {
            id: typeof t.id === 'string' && t.id ? t.id : newId(),
            title: t.title, prefix: parseInt(t.prefix) || 0,
            tags: typeof t.tags === 'string' ? t.tags : '',
            content: t.content, isPinned: !!t.isPinned, isNew: !!t.isNew,
            uses: Math.max(0, parseInt(t.uses) || 0),
        };
        if (t.isRaw) out.isRaw = true;
        return out;
    }

    // шаблоны = актуальные шаблоны по умолчанию − удалённые + правки пользователя + свои шаблоны
    function buildTemplates(state) {
        const tpls = deepClone(DEFAULT_TEMPLATES);
        const del = new Set(Array.isArray(state.del) ? state.del : []);
        const ov  = state.ov && typeof state.ov === 'object' ? state.ov : {};
        for (const tab of Object.keys(tpls)) {
            tpls[tab] = tpls[tab].filter(t => !del.has(t.id));
            tpls[tab].forEach(t => {
                const o = ov[t.id];
                if (o) TPL_FIELDS.forEach(f => { if (o[f] !== undefined) t[f] = o[f]; });
            });
        }
        const extra = state.extra && typeof state.extra === 'object' ? state.extra : {};
        const seen = new Set(Object.keys(DEFAULT_BY_ID));
        for (const [tab, arr] of Object.entries(extra)) {
            if (!tpls[tab] || !Array.isArray(arr)) continue;
            arr.map(sanitizeTpl).filter(Boolean).forEach(t => {
                if (seen.has(t.id)) t.id = newId();
                seen.add(t.id);
                tpls[tab].push(t);
            });
        }
        return tpls;
    }

    // обратная операция: в хранилище уходят только отличия от шаблонов по умолчанию
    function serializeTemplates(tpls) {
        const state = emptyTplState();
        const present = new Set();
        for (const [tab, arr] of Object.entries(tpls)) arr.forEach(t => {
            const def = DEFAULT_BY_ID[t.id];
            if (def && def.tab === tab) {
                present.add(t.id);
                const diff = {};
                TPL_FIELDS.forEach(f => { if (t[f] !== undefined && t[f] !== def.tpl[f]) diff[f] = t[f]; });
                if (Object.keys(diff).length) state.ov[t.id] = diff;
            } else {
                (state.extra[tab] = state.extra[tab] || []).push(sanitizeTpl(t) || t);
            }
        });
        Object.keys(DEFAULT_BY_ID).forEach(id => { if (!present.has(id)) state.del.push(id); });
        return state;
    }

    // перенос из формата v5 (полная копия всех шаблонов). Тексты пунктов правил НЕ переносим —
    // они берутся из актуальной редакции; сохраняем счётчики, закрепления, свои шаблоны и правки.
    function migrateV5(old) {
        const data = old && typeof old === 'object' && old.data && typeof old.data === 'object' ? old.data : old;
        const state = emptyTplState();
        if (!data || typeof data !== 'object') return state;
        for (const [tab, arr] of Object.entries(data)) {
            if (!Array.isArray(arr) || !TPL_TABS.includes(tab)) continue;
            arr.forEach(t => {
                if (!t || typeof t !== 'object') return;
                const def = DEFAULT_BY_ID[t.id];
                if (!def) { const s = sanitizeTpl(t); if (s) (state.extra[tab] = state.extra[tab] || []).push(s); return; }
                const o = {};
                const uses = parseInt(t.uses) || 0;
                if (uses) o.uses = uses;
                if (typeof t.isPinned === 'boolean' && t.isPinned !== def.tpl.isPinned) o.isPinned = t.isPinned;
                if (!def.tpl.rule && !CHANGED_IN_63.has(t.id)) {
                    ['title', 'tags', 'content'].forEach(f => { if (typeof t[f] === 'string' && t[f] && t[f] !== def.tpl[f]) o[f] = t[f]; });
                    const pf = parseInt(t.prefix);
                    if (!isNaN(pf) && pf !== def.tpl.prefix) o.prefix = pf;
                }
                if (Object.keys(o).length) state.ov[t.id] = o;
            });
        }
        return state;
    }

    function loadTemplates() {
        let state = readJSON(STORAGE.TEMPLATES, null);
        if (!state || state.version !== STORAGE_VERSION) {
            const legacy = readJSON(LEGACY_TEMPLATES, null);
            state = legacy ? migrateV5(legacy) : emptyTplState();
            if (legacy) writeJSON(STORAGE.TEMPLATES, state); // старый ключ оставляем как резервную копию
        }
        try { return buildTemplates(state); }
        catch (e) { console.error('[NL Helper] шаблоны повреждены, загружены стандартные', e); return deepClone(DEFAULT_TEMPLATES); }
    }
    function saveTemplates() { writeJSON(STORAGE.TEMPLATES, serializeTemplates(TPLS)); }
    // сбрасывает стандартные шаблоны к заводским, свои шаблоны («Мои») остаются
    function resetTemplates() {
        const custom = TPLS.custom || [];
        TPLS = deepClone(DEFAULT_TEMPLATES);
        TPLS.custom = custom;
        saveTemplates();
    }

    function loadSettings() {
        const def = { autoSubmit: false, floodControl: true, serverName: 'ASTANA', serverAuto: true, mgTerms: [...DEFAULT_MG_TERMS],
            minBioWords: BIO_RULES.minWords, maxBioWords: BIO_RULES.maxWords, hotkeys: true, uiMode: 'modal',
            preview: false, autoTab: true, ruleCheck: true, postStyle: 'detroit', post: { ...DEFAULT_POST } };
        const s = readJSON(STORAGE.SETTINGS, null);
        const out = s && typeof s === 'object' ? { ...def, ...s } : def;
        if (!Array.isArray(out.mgTerms)) out.mgTerms = [...DEFAULT_MG_TERMS];
        out.post = { ...DEFAULT_POST, ...(out.post && typeof out.post === 'object' ? out.post : {}) };
        out.minBioWords = parseInt(out.minBioWords) || def.minBioWords;
        out.maxBioWords = parseInt(out.maxBioWords) || def.maxBioWords;
        return out;
    }
    function loadStats() {
        const s = readJSON(STORAGE.STATS, null) || {};
        const obj = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
        return { total: parseInt(s.total) || 0, byPrefix: obj(s.byPrefix), byTab: obj(s.byTab), byDay: obj(s.byDay) };
    }
    function loadHistory() {
        const h = readJSON(STORAGE.HISTORY, []);
        return Array.isArray(h) ? h.filter(x => x && typeof x === 'object').slice(0, MAX_HISTORY) : [];
    }
    function saveSettings() { writeJSON(STORAGE.SETTINGS, SETS); }
    function saveStats()    { writeJSON(STORAGE.STATS, STATS); }
    function saveHistory()  { writeJSON(STORAGE.HISTORY, HIST); }

    // ЭКСПОРТ / ИМПОРТ (одна реализация для кнопок в окне и в настройках)
    function downloadFile(name, text, type) {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = Object.assign(document.createElement('a'), { href: url, download: name });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function exportTemplates() {
        const data = { app: 'nl-helper', version: STORAGE_VERSION, exportedAt: new Date().toISOString(), state: serializeTemplates(TPLS) };
        downloadFile(`nl-helper-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
    }
    // понимает: резервную копию v6, полный экспорт v5 ({data}) и список своих шаблонов ({templates} или массив)
    function importTemplatesFile(file, onDone) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (parsed && parsed.state && parsed.version === STORAGE_VERSION) {
                    if (!confirm('Восстановить резервную копию? Текущие шаблоны и правки будут заменены.')) return;
                    TPLS = buildTemplates(parsed.state);
                } else if (parsed && parsed.data && typeof parsed.data === 'object') {
                    if (!confirm('Импортировать резервную копию старого формата (v5)? Текущие шаблоны будут заменены.')) return;
                    TPLS = buildTemplates(migrateV5(parsed));
                } else {
                    const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed && parsed.templates) ? parsed.templates : null);
                    if (!list) throw new Error('bad format');
                    if (!TPLS.custom) TPLS.custom = [];
                    let added = 0, skipped = 0;
                    for (const t of list) {
                        const s = sanitizeTpl(t);
                        if (!s || TPLS.custom.length >= MAX_CUSTOM) { skipped++; continue; }
                        s.id = newId(); s.isNew = true; s.uses = 0; s.isPinned = false;
                        TPLS.custom.push(s); added++;
                    }
                    alert(`✅ Импортировано: ${added}` + (skipped ? `, пропущено: ${skipped}` : ''));
                }
                saveTemplates();
                if (onDone) onDone();
            } catch (err) {
                alert('❌ Не удалось прочитать файл — нужен JSON, экспортированный из NL Helper.');
            }
        };
        reader.readAsText(file);
    }

