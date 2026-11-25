/* global XF */
(function () {
    'use strict';

    if (window.location.hostname !== 'forum.blackrussia.online') return;
    if (window.__NL_HELPER__) return; // защита от двойного запуска (две копии скрипта / SPA-переход)
    window.__NL_HELPER__ = true;

    const VERSION = '6.5.0';
    // дата редакции «Общих правил серверов», с которой сверена таблица RULE_TABLE
    const RULES_REVISION = '14.11.2026';

    // ХРАНИЛИЩЕ
    // v6: шаблоны по умолчанию больше не копируются в хранилище целиком — храним только
    // пользовательские изменения (overrides), удалённые id и свои шаблоны. Поэтому обновлённые
    // тексты правил доходят до всех сразу после обновления скрипта, а запись при каждой вставке —
    // это несколько килобайт вместо ~100 КБ.
    const STORAGE = {
        TEMPLATES: 'nl_tpl_v6',
        SETTINGS:  'nl_set_v5',
        FLOOD:     'nl_flood_v5',
        PENDING:   'nl_pend_v5',
        THEME:     'nl_hud_v5',
        HISTORY:   'nl_hist_v5',
        STATS:     'nl_stats_v5',
        RULECHECK: 'nl_rulecheck_v1',
    };
    const LEGACY_TEMPLATES = 'nl_tpl_v5';
    const STORAGE_VERSION = 6;
    const MAX_CUSTOM      = 50;
    const MAX_HISTORY     = 30;

    // ОБЁРТКА ХРАНИЛИЩА. Tampermonkey и Violentmonkey (компьютер, Android) дают синхронные
    // GM_getValue/GM_setValue. Некоторые менеджеры на iPhone (например, бесплатный Userscripts
    // для Safari) их не дают — тогда храним данные в localStorage форума, а остальной код не меняется.
    const HAS_GM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';
    const gm = HAS_GM ? {
        get: k => GM_getValue(k),
        set: (k, v) => GM_setValue(k, v),
        del: k => (typeof GM_deleteValue === 'function' ? GM_deleteValue(k) : GM_setValue(k, undefined)),
    } : {
        get(k) { try { const v = localStorage.getItem(k); return v === null ? undefined : v; } catch (e) { return undefined; } },
        set(k, v) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) { /* хранилище недоступно */ } },
        del(k) { try { localStorage.removeItem(k); } catch (e) { /* хранилище недоступно */ } },
    };

    // безопасное чтение JSON из хранилища: битые данные не должны ронять весь скрипт
    function readJSON(key, fallback) {
        try {
            const raw = gm.get(key);
            if (raw === undefined || raw === null || raw === '') return fallback;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            console.warn('[NL Helper] повреждённые данные', key, e);
            return fallback;
        }
    }
    function writeJSON(key, val) {
        try { gm.set(key, JSON.stringify(val)); }
        catch (e) { console.error('[NL Helper] не удалось сохранить', key, e); }
    }

    // одноразовый перенос данных из localStorage (версии до 5.0.1) в изолированное GM_* хранилище
    (function migrateFromLocalStorage() {
        if (!HAS_GM) return; // без GM_* данные и так живут в localStorage
        try {
            [...Object.values(STORAGE), LEGACY_TEMPLATES].forEach(key => {
                if (gm.get(key) !== undefined) return;
                const old = localStorage.getItem(key);
                if (old === null) return;
                gm.set(key, old);
                localStorage.removeItem(key);
            });
        } catch (e) { /* localStorage может быть недоступен — не критично */ }
    })();

    // СЕЛЕКТОРЫ
    const SEL = {
        editor:       '.fr-element.fr-view',
        blockMessage: '.blockMessage',
        overlayClose: 'a.overlay-titleCloser',
        titleValue:   '.p-title-value',
        // автор темы: в шапке темы (есть на любой странице темы), затем стартовый пост
        authorCandidates: [
            '.p-description a.username[data-user-id]',
            '.message-threadStarterPost .message-name a.username',
            'article.message .message-name a.username',
            'a.username[data-user-id]',
        ],
        // первый пост темы: на 2-й и далее страницах .message-body первого сообщения — уже не жалоба
        firstPostCandidates: [
            '.message-threadStarterPost .message-body .bbWrapper',
            '.message-body .bbWrapper',
        ],
        replyCandidates: [
            'button.button--primary.button--icon--reply.rippleButton',
            '.formButtonGroup-primary button[type="submit"]',
            '.formButtonGroup-primary button',
            'button.button--icon--reply',
            '.button--icon--write.rippleButton',
            '.uix_quickReply--button',
            'button.button--icon--write',
            'button[data-xf-click="quick-reply"]',
            '.js-quickReply',
        ],
        submitCandidates: [
            '.button--icon--reply.rippleButton',
            'button[data-xf-click="quick-reply"]',
            '.js-quickReply',
        ],
    };

    const pick = list => { for (const sel of list) { const el = document.querySelector(sel); if (el) return el; } return null; };
    const findReplyBtn = () => pick(SEL.replyCandidates);
    const firstPost    = () => pick(SEL.firstPostCandidates);
    function clickSubmit() { const el = pick(SEL.submitCandidates); if (el) el.click(); }

