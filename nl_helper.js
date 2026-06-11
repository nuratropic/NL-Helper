// ==UserScript==
// @name         NL Helper
// @namespace    https://forum.blackrussia.online
// @version      5.0.0
// @description  Профессиональный помощник куратора форума Black Russia
// @author       Nicki_Lachowski & Claude
// @match        https://forum.blackrussia.online/threads/*
// @match        https://forum.blackrussia.online/threads/*/*
// @match        http://forum.blackrussia.online/threads/*
// @match        http://forum.blackrussia.online/threads/*/*
// @include      https://forum.blackrussia.online/threads/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

/* global XF */
(function () {
    'use strict';

    console.log('%c[NL Helper 5.0] ✅ Запущен: ' + window.location.href, 'color:#ff6b2b;font-size:14px;font-weight:bold');

    // ═══════════════════════════════════════════════════════════════
    //  ХРАНИЛИЩЕ
    // ═══════════════════════════════════════════════════════════════
    const STORAGE = {
        TEMPLATES: 'nl_tpl_v5',
        SETTINGS:  'nl_set_v5',
        FLOOD:     'nl_flood_v5',
        PENDING:   'nl_pend_v5',
        THEME:     'nl_hud_v5',
        HISTORY:   'nl_hist_v5',
        STATS:     'nl_stats_v5',
    };
    const STORAGE_VERSION = 5;
    const MAX_CUSTOM      = 50;
    const MAX_HISTORY     = 30;

    // ═══════════════════════════════════════════════════════════════
    //  СЕЛЕКТОРЫ
    // ═══════════════════════════════════════════════════════════════
    const SEL = {
        editor:       '.fr-element.fr-view',
        blockMessage: '.blockMessage',
        usernameLink: 'a.username',
        overlayClose: 'a.overlay-titleCloser',
        titleValue:   '.p-title-value',
        firstPost:    '.message-body .bbWrapper',
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

    function findReplyBtn() {
        for (const sel of SEL.replyCandidates) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    }
    function clickSubmit() {
        for (const sel of SEL.submitCandidates) {
            const el = document.querySelector(sel);
            if (el) { el.click(); return; }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ПРЕФИКСЫ
    // ═══════════════════════════════════════════════════════════════
    const P = {
        NONE: 0, UNACCEPT: 4, ACCEPT: 8, PIN: 2,
        RESHENO: 6, CLOSE: 7, WATCHED: 9,
        GA: 12, TEX: 13, REALIZOVANO: 5, OJIDANIE: 14,
    };
    const PREFIX_NAMES = {
        0: 'Без префикса', 4: 'Отказано',   8: 'Одобрено',
        2: 'На рассмотрении', 6: 'Решено',   7: 'Закрыто',
        9: 'Рассмотрено',  12: 'Гл. Администратору',
       13: 'Тех. Специалисту', 5: 'Реализовано', 14: 'Ожидание',
    };
    const PREFIX_COLORS = {
        0:  '#666',     4: '#ff4757', 8: '#61bd6d',
        2:  '#ffa502',  6: '#1e90ff', 7: '#747d8c',
        9:  '#ffa502', 12: '#a55eea',13: '#ff6348',
        5:  '#61bd6d', 14: '#747d8c',
    };
    const OPEN_PFXS = new Set([P.PIN, P.GA, P.TEX, P.OJIDANIE]);

    // ═══════════════════════════════════════════════════════════════
    //  ВКЛАДКИ
    // ═══════════════════════════════════════════════════════════════
    const TABS = [
        { id: 'recent',  name: '🕐 Недавние'      },
        { id: 'players', name: '👤 Игроки'         },
        { id: 'admins',  name: '🛡 Администрация'  },
        { id: 'leaders', name: '👑 Лидеры'         },
        { id: 'appeals', name: '⚖️ Обжалования'    },
        { id: 'rp_bio',  name: '📋 РП Био'         },
        { id: 'rp_sit',  name: '🎬 РП Ситуация'    },
        { id: 'opg',     name: '🔫 НеОф. Орг.'     },
        { id: 'custom',  name: '⭐ Мои'            },
    ];

    // ═══════════════════════════════════════════════════════════════
    //  ТЕМЫ
    // ═══════════════════════════════════════════════════════════════
    const THEMES = {
        amber:  { name:'🟠 NL Amber',   accent:'#f0900a', bg:'#0f0c07', bg2:'#161009', bg3:'#1e1710', border:'#30220a', text:'#f2e8d0', text2:'#7a6440', gradient:'linear-gradient(135deg,#f0900a,#c45f00)' },
        purple: { name:'🟣 NL Purple',  accent:'#a855f7', bg:'#0c0a12', bg2:'#120f1a', bg3:'#181426', border:'#28203a', text:'#ede8f8', text2:'#6e5f8a', gradient:'linear-gradient(135deg,#a855f7,#7c3aed)' },
        cyan:   { name:'🔵 NL Cyan',    accent:'#06b6d4', bg:'#040e12', bg2:'#071318', bg3:'#0b1c22', border:'#0d2e38', text:'#d0f0f8', text2:'#346070', gradient:'linear-gradient(135deg,#06b6d4,#0284c7)' },
        red:    { name:'🔴 NL Crimson', accent:'#ef4444', bg:'#0f0606', bg2:'#160909', bg3:'#1e0e0e', border:'#320f0f', text:'#f8e8e8', text2:'#7a4040', gradient:'linear-gradient(135deg,#ef4444,#b91c1c)' },
        green:  { name:'🟢 NL Matrix',  accent:'#22c55e', bg:'#050f08', bg2:'#08140b', bg3:'#0d1e10', border:'#0f3018', text:'#d0f0da', text2:'#3a7050', gradient:'linear-gradient(135deg,#22c55e,#15803d)' },
        white:  { name:'⚪ NL Arctic',  accent:'#e2e8f0', bg:'#06080c', bg2:'#0c0f14', bg3:'#12161e', border:'#20252e', text:'#f0f4ff', text2:'#606880', gradient:'linear-gradient(135deg,#e2e8f0,#94a3b8)' },
    };

    // ═══════════════════════════════════════════════════════════════
    //  СТОП-СЛОВА
    // ═══════════════════════════════════════════════════════════════
    const DEFAULT_MG_TERMS = [
        'лвл','lvl','admin','админ','бан','ban','варн','warn',
        'деморган','нонрп','nonrp','dm','дб','db','зз','zz',
        'тк','tk','ск','sk','увал','мут','кик','hp','хп',
        'гдб','gdb','спавн','spawn','телепорт','teleport',
        'читер','cheat','hack','хак',
    ];

    // ═══════════════════════════════════════════════════════════════
    //  ПЛЕЙСХОЛДЕРЫ
    // ═══════════════════════════════════════════════════════════════
    const PH_HELP = [
        ['{nickname}',  'Ник игрока из темы'],
        ['{mention}',   'Упоминание [USER=id]ник[/USER]'],
        ['{server}',    'Название сервера'],
        ['{date}',      'Текущая дата'],
        ['{time}',      'Текущее время'],
        ['{greeting}',  'Приветствие по времени суток'],
        ['{thread_id}', 'Номер темы'],
    ];

    // ═══════════════════════════════════════════════════════════════
    //  ШАБЛОНЫ ПО УМОЛЧАНИЮ
    // ═══════════════════════════════════════════════════════════════
    const DEFAULT_TEMPLATES = {
        players: [
            { id:'p1', title:'На рассмотрении', prefix:P.PIN, tags:'рассмотрение, жалоба', isPinned:true, isNew:false, uses:0,
              content:'Ваша жалоба успешно принята и взята на рассмотрение.\nУбедительная просьба не создавать дубликаты данной темы, иначе ваш форумный аккаунт может быть заблокирован.' },
            { id:'p2', title:'Одобрено — игрок наказан', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0, tags:'одобрено, наказание, жалоба',
              content:'Ваша жалоба была рассмотрена и получает статус — Одобрено.\nИгрок понесёт наказание в соответствии с регламентом сервера.' },
            { id:'p3', title:'Отказано — нарушений нет', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'отказано, чистый',
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nНарушений со стороны данного игрока обнаружено не было.' },
            { id:'p4', title:'Отказано — недостаточно доказательств', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'отказано, доказательства, видео',
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nПредоставленных доказательств недостаточно для вынесения наказания.\nПожалуйста, при повторном нарушении предоставьте качественную видеозапись.' },
            { id:'p5', title:'Отказано — жалоба не по регламенту', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'отказано, регламент, формат',
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nЖалоба оформлена не по регламенту либо содержит неверную информацию.\nПожалуйста, ознакомьтесь с правилами подачи жалоб и попробуйте снова.' },
            { id:'p6', title:'Ожидание — запрос доказательств', prefix:P.OJIDANIE, isPinned:false, isNew:false, uses:0, tags:'ожидание, доказательства, видео, 24часа',
              content:'Ваша жалоба взята на рассмотрение, однако требуются дополнительные доказательства.\nПожалуйста, предоставьте видеозапись нарушения в данной теме в течение 24 часов.\nЕсли доказательства не будут предоставлены вовремя, жалоба будет отклонена.' },
            { id:'p7', title:'Решено — ситуация урегулирована', prefix:P.RESHENO, isPinned:false, isNew:false, uses:0, tags:'решено, урегулирована',
              content:'Данная жалоба получает статус — Решено.\nСитуация была урегулирована в рамках сервера.' },
            { id:'p8', title:'Одобрено — пункт правил', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'одобрено, пункт, правила', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]?.??.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Описание пункта правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Наказание[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p9', title:'Отказано — пункт правил', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'отказано, пункт, правила', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]?.??.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Описание пункта правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Наказание[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p10_a', title:'Одобрено — 2.01', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'RP, роль, 2.01, нарушение RP, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.01.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено поведение, нарушающее нормы Role Play процессов[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p11_d', title:'Отказано — 2.01', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'RP, роль, 2.01, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.01.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено поведение, нарушающее нормы Role Play процессов[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p12_a', title:'Одобрено — AFK 2.02', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'AFK, 2.02, отсутствие, процесс, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.02.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено целенаправленно уходить от Role Play процесса[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p13_d', title:'Отказано — AFK 2.02', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'AFK, 2.02, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.02.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено целенаправленно уходить от Role Play процесса[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p14_a', title:'Одобрено — 2.03', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'NonRP, езда, 2.03, транспорт, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён NonRP Drive — вождение транспорта в невозможных условиях[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p15_d', title:'Отказано — 2.03', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'NonRP, езда, 2.03, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён NonRP Drive — вождение транспорта в невозможных условиях[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p16_a', title:'Одобрено — 2.04', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'помеха, 2.04, процесс, наказание, ban', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены действия, создающие помехи в игровом процессе или выполнении работ[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 10 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p17_d', title:'Отказано — 2.04', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'помеха, 2.04, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены действия, создающие помехи в игровом процессе или выполнении работ[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 10 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p18_a', title:'Одобрено — 2.05', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'обман, OOC, IC, 2.05, наказание, ban', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены любые OOC-обманы и IC-обманы с нарушением RP правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p19_d', title:'Отказано — 2.05', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'обман, OOC, IC, 2.05, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены любые OOC-обманы и IC-обманы с нарушением RP правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p20_a', title:'Одобрено — 2.06', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.07.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено нахождение в AFK без ESC, создающее помеху игрокам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Kick[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p21_d', title:'Отказано — 2.06', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.07.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено нахождение в AFK без ESC, создающее помеху игрокам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Kick[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p22_a', title:'Одобрено — 2.08', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'мораль, 2.08, сек, вар, наказание', tags:'мораль, 2.08, секс, варн, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена любая форма аморальных действий сексуального характера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p23_d', title:'Отказано — 2.08', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'мораль, 2.08, отказано', tags:'мораль, 2.08, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена любая форма аморальных действий сексуального характера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p24_a', title:'Одобрено — 2.09', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'слив, 2.09, склад, наказание, ban', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.09.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено сливать склад фракции / семьи[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p25_d', title:'Отказано — 2.09', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'слив, 2.09, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.09.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено сливать склад фракции / семьи[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p26_a', title:'Одобрено — 2.10', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'/do, 2.10, обман, команда, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено обманывать в /do[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p27_d', title:'Отказано — 2.10', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'/do, 2.10, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено обманывать в /do[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p28_a', title:'Одобрено — 2.11', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'работа, 2.11, транспорт, наказание', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование рабочего или фракционного транспорта в личных целях[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p29_d', title:'Отказано — 2.11', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'работа, 2.11, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование рабочего или фракционного транспорта в личных целях[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p30_a', title:'Одобрено — 2.12', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, tags:'медиа, 2.12, помеха, наказание, ban', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.12.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена помеха в работе официальных медиалиц проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p31_d', title:'Отказано — 2.12', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, tags:'медиа, 2.12, отказано', isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.12.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена помеха в работе официальных медиалиц проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p32_a', title:'Одобрено — DB (DriveBy)', tags:'DB, 2.13, driveby, убийство, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.13.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен DB (DriveBy) — убийство/урон без IC причины с транспорта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p33_d', title:'Отказано — DB (DriveBy)', tags:'DB, 2.13, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.13.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен DB (DriveBy) — убийство/урон без IC причины с транспорта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p34_a', title:'Одобрено — TK (Team Kill)', tags:'TK, 2.15, teamkill, фракция, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.15.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен TK (Team Kill) — убийство члена своей/союзной фракции без IC причины[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p35_d', title:'Отказано — TK (Team Kill)', tags:'TK, 2.15, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.15.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен TK (Team Kill) — убийство члена своей/союзной фракции без IC причины[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p36_a', title:'Одобрено — SK (Spawn Kill)', tags:'SK, 2.16, spawnkill, спавн, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.16.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен SK (Spawn Kill) — убийство/урон на титульной территории или у интерьеров[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p37_d', title:'Отказано — SK (Spawn Kill)', tags:'SK, 2.16, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.16.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен SK (Spawn Kill) — убийство/урон на титульной территории или у интерьеров[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут / Warn[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p38_a', title:'Одобрено — MG (MetaGaming)', tags:'MG, 2.18, metagaming, ooc, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.18.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён MG (MetaGaming) — использование OOC-информации в IC-процессе[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p39_d', title:'Отказано — MG (MetaGaming)', tags:'MG, 2.18, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.18.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён MG (MetaGaming) — использование OOC-информации в IC-процессе[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p40_a', title:'Одобрено — DM (DeathMatch)', tags:'DM, 2.19, deathmatch, убийство, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.19.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён DM (DeathMatch) — убийство/нанесение урона без IC-причины[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 90 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p41_d', title:'Отказано — DM (DeathMatch)', tags:'DM, 2.19, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.19.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещён DM (DeathMatch) — убийство/нанесение урона без IC-причины[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 90 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p42_a', title:'Одобрено — 2.20', tags:'massdm, 2.20, множественное убийство, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.20.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен Mass DM — убийство/урон без IC причины трём и более игрокам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 3–7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p43_d', title:'Отказано — 2.20', tags:'massdm, 2.20, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.20.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен Mass DM — убийство/урон без IC причины трём и более игрокам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 3–7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p44_a', title:'Одобрено — 2.21', tags:'баги, 2.21, система, эксплуатация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.21.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено обходить игровую систему или использовать баги сервера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p45_d', title:'Отказано — 2.21', tags:'баги, 2.21, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.21.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено обходить игровую систему или использовать баги сервера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p46_a', title:'Одобрено — 2.22', tags:'читы, 2.22, программы, макросы, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.22.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено хранить/использовать стороннее ПО или читы, включая макросы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p47_d', title:'Отказано — 2.22', tags:'читы, 2.22, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.22.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено хранить/использовать стороннее ПО или читы, включая макросы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p48_a', title:'Одобрено — 2.23', tags:'ошибки, 2.23, администрация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.23.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено скрывать ошибки игровых систем от администрации[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p49_d', title:'Отказано — 2.23', tags:'ошибки, 2.23, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.23.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено скрывать ошибки игровых систем от администрации[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p50_a', title:'Одобрено — 2.24', tags:'скрывание, 2.24, администрация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.24.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено скрывать от администрации нарушителей или злоумышленников[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p51_d', title:'Отказано — 2.24', tags:'скрывание, 2.24, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.24.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено скрывать от администрации нарушителей или злоумышленников[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p52_a', title:'Одобрено — 2.25', tags:'репутация, 2.25, проект, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.25.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены попытки навредить репутации проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p53_d', title:'Отказано — 2.25', tags:'репутация, 2.25, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.25.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены попытки навредить репутации проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p54_a', title:'Одобрено — 2.26', tags:'ресурсы, 2.26, проект, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.26.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено намеренно наносить вред ресурсам проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p55_d', title:'Отказано — 2.26', tags:'ресурсы, 2.26, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.26.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено намеренно наносить вред ресурсам проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p56_a', title:'Одобрено — 2.27', tags:'информация, 2.27, администрация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.27.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено распространять внутреннюю информацию администрации проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p57_d', title:'Отказано — 2.27', tags:'информация, 2.27, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.27.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено распространять внутреннюю информацию администрации проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p58_a', title:'Одобрено — 2.28', tags:'валюта, 2.28, деньги, реальные, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.28.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена покупка/продажа внутриигровой валюты за реальные деньги[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + обнуление аккаунта + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p59_d', title:'Отказано — 2.28', tags:'валюта, 2.28, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.28.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена покупка/продажа внутриигровой валюты за реальные деньги[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan + обнуление аккаунта + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p60_a', title:'Одобрено — 2.30', tags:'экономика, 2.30, сервер, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.30.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено пытаться нанести ущерб экономике сервера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p61_d', title:'Отказано — 2.30', tags:'экономика, 2.30, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.30.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено пытаться нанести ущерб экономике сервера[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p62_a', title:'Одобрено — 2.31', tags:'реклама, 2.31, проект, сторонние, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.31.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено рекламировать на серверах сторонние проекты, каналы и ресурсы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p63_d', title:'Отказано — 2.31', tags:'реклама, 2.31, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.31.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено рекламировать на серверах сторонние проекты, каналы и ресурсы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p64_a', title:'Одобрено — 2.32', tags:'обман, 2.32, администрация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.32.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено введение в заблуждение / обман администрации на всех ресурсах[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p65_d', title:'Отказано — 2.32', tags:'обман, 2.32, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.32.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено введение в заблуждение / обман администрации на всех ресурсах[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p66_a', title:'Одобрено — 2.33', tags:'уязвимость, 2.33, правила, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.33.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено пользоваться уязвимостью правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p67_d', title:'Отказано — 2.33', tags:'уязвимость, 2.33, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.33.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено пользоваться уязвимостью правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p68_a', title:'Одобрено — 2.37', tags:'угрозы, 2.37, ooc, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.37.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены OOC-угрозы, в том числе завуалированные[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 120 минут / Ban 7–15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p69_d', title:'Отказано — 2.37', tags:'угрозы, 2.37, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.37.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены OOC-угрозы, в том числе завуалированные[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 120 минут / Ban 7–15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p70_a', title:'Одобрено — 2.38', tags:'информация, 2.38, личные данные, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.38.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено распространять личную информацию игроков[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p71_d', title:'Отказано — 2.38', tags:'информация, 2.38, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.38.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено распространять личную информацию игроков[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan + ЧС проекта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p72_a', title:'Одобрено — 2.39', tags:'злоупотребление, 2.39, нарушения, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.39.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Злоупотребление нарушениями правил сервера (6+ нарушений за 7 дней)[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p73_d', title:'Отказано — 2.39', tags:'злоупотребление, 2.39, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.39.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Злоупотребление нарушениями правил сервера (6+ нарушений за 7 дней)[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p74_a', title:'Одобрено — 2.40', tags:'деструктив, 2.40, проект, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.40.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены деструктивные действия по отношению к проекту[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 300 минут / Ban 30 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p75_d', title:'Отказано — 2.40', tags:'деструктив, 2.40, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.40.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены деструктивные действия по отношению к проекту[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 300 минут / Ban 30 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p76_a', title:'Одобрено — 2.42', tags:'продажа, 2.42, аккаунт, имущество, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.42.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Попытка продажи игрового имущества или аккаунта за реальные деньги[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p77_d', title:'Отказано — 2.42', tags:'продажа, 2.42, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.42.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Попытка продажи игрового имущества или аккаунта за реальные деньги[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p78_a', title:'Одобрено — 2.43', tags:'промокод, 2.43, код, обмен, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.43.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена продажа/обмен бонус-кодов и промокодов проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 120 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p79_d', title:'Отказано — 2.43', tags:'промокод, 2.43, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.43.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена продажа/обмен бонус-кодов и промокодов проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 120 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p80_a', title:'Одобрено — 2.47', tags:'поля, 2.47, транспорт, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.47.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено передвижение по полям на рабочем грузовом транспорте[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p81_d', title:'Отказано — 2.47', tags:'поля, 2.47, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.47.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено передвижение по полям на рабочем грузовом транспорте[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p82_a', title:'Одобрено — 2.48', tags:'репутация, 2.48, семья, лидер, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.48.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена продажа/передача репутации семьи; сокрытие нарушителей лидером[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление рейтинга / обнуление аккаунта лидера[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p83_d', title:'Отказано — 2.48', tags:'репутация, 2.48, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.48.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена продажа/передача репутации семьи; сокрытие нарушителей лидером[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление рейтинга / обнуление аккаунта лидера[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p84_a', title:'Одобрено — 2.50', tags:'задержание, 2.50, аукцион, казино, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.50.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены задержания и аресты в интерьере аукциона, казино, во время мероприятий[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 10 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p85_d', title:'Отказано — 2.50', tags:'задержание, 2.50, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.50.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены задержания и аресты в интерьере аукциона, казино, во время мероприятий[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 10 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p86_a', title:'Одобрено — 2.52', tags:'аксессуары, 2.52, неадекватное использование, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.52.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено неадекватное использование аксессуаров[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление аксессуаров / Jail 30 минут при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p87_d', title:'Отказано — 2.52', tags:'аксессуары, 2.52, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.52.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено неадекватное использование аксессуаров[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление аксессуаров / Jail 30 минут при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p88_a', title:'Одобрено — 2.53', tags:'имена, 2.53, нецензурные, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.53.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование нецензурных/оскорбительных названий для игровых ценностей[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Принудительная смена / Ban 1 день / Обнуление при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p89_d', title:'Отказано — 2.53', tags:'имена, 2.53, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.53.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование нецензурных/оскорбительных названий для игровых ценностей[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Принудительная смена / Ban 1 день / Обнуление при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p90_a', title:'Одобрено — 2.54', tags:'неуважение, 2.54, администрация, наказание', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.54.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено неуважительное обращение и оскорбление администрации[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 180 / 300 минут при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p91_d', title:'Отказано — 2.54', tags:'неуважение, 2.54, отказано', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.54.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено неуважительное обращение и оскорбление администрации[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 180 / 300 минут при повторном[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p92_a', title:'Одобрено — 2.55', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.55.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещается багоюз, связанный с анимацией[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 120 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p93_d', title:'Отказано — 2.55', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.55.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещается багоюз, связанный с анимацией[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Jail 120 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p94_a', title:'Одобрено — 2.57', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.57.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещается брать в долг игровые ценности и не возвращать их[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p95_d', title:'Отказано — 2.57', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]2.57.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещается брать в долг игровые ценности и не возвращать их[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p96_a', title:'Одобрено — 3.02', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.02.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование Caps Lock в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p97_d', title:'Отказано — 3.02', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.02.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование Caps Lock в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p98_a', title:'Одобрено — 3.03', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены оскорбления, расизм, дискриминация в OOC чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p99_d', title:'Отказано — 3.03', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены оскорбления, расизм, дискриминация в OOC чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p100_a', title:'Одобрено — 3.04', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено оскорбление или упоминание родных в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 300 минут / Ban 7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p101_d', title:'Отказано — 3.04', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено оскорбление или упоминание родных в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 300 минут / Ban 7 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p102_a', title:'Одобрено — 3.05', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен флуд — 3 и более повторяющихся сообщений[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p103_d', title:'Отказано — 3.05', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещен флуд — 3 и более повторяющихся сообщений[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p104_a', title:'Одобрено — 3.06', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.06.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено злоупотребление знаками препинания и символами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p105_d', title:'Отказано — 3.06', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.06.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено злоупотребление знаками препинания и символами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p106_a', title:'Одобрено — 3.08', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены любые формы «слива» через глобальные чаты[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p107_d', title:'Отказано — 3.08', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены любые формы «слива» через глобальные чаты[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p108_a', title:'Одобрено — 3.10', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено выдавать себя за администратора[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней + ЧС сервера[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p109_d', title:'Отказано — 3.10', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено выдавать себя за администратора[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 7–15 дней + ЧС сервера[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p110_a', title:'Одобрено — 3.11', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено вводить игроков в заблуждение путём злоупотребления командами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p111_d', title:'Отказано — 3.11', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено вводить игроков в заблуждение путём злоупотребления командами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15–30 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p112_a', title:'Одобрено — 3.12', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.12.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено подавать репорт транслитом, с Caps Lock или нецензурной бранью[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Report Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p113_d', title:'Отказано — 3.12', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.12.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено подавать репорт транслитом, с Caps Lock или нецензурной бранью[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Report Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p114_a', title:'Одобрено — 3.14', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.14.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено включать музыку в Voice Chat[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p115_d', title:'Отказано — 3.14', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.14.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено включать музыку в Voice Chat[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p116_a', title:'Одобрено — 3.16', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.16.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать посторонние шумы или звуки[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное предупреждение / Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p117_d', title:'Отказано — 3.16', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.16.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать посторонние шумы или звуки[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное предупреждение / Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p118_a', title:'Одобрено — 3.18', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.18.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены споры и обсуждения на политические, религиозные, расовые темы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 180 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p119_d', title:'Отказано — 3.18', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.18.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещены споры и обсуждения на политические, религиозные, расовые темы[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 180 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p120_a', title:'Одобрено — 3.19', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.19.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование сторонних программ для изменения голоса[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p121_d', title:'Отказано — 3.19', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.19.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование сторонних программ для изменения голоса[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 60 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p122_a', title:'Одобрено — 3.20', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.20.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование транслита в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p123_d', title:'Отказано — 3.20', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.20.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование транслита в любом чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p124_a', title:'Одобрено — 3.21', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.21.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена реклама промокодов в игре[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p125_d', title:'Отказано — 3.21', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.21.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена реклама промокодов в игре[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Ban 15 дней[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p126_a', title:'Одобрено — 3.22', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.22.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено публиковать объявления в помещениях государственных организаций[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p127_d', title:'Отказано — 3.22', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.22.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено публиковать объявления в помещениях государственных организаций[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p128_a', title:'Одобрено — 3.23', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.23.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование нецензурных слов в VIP чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p129_d', title:'Отказано — 3.23', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.23.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использование нецензурных слов в VIP чате[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p130_a', title:'Одобрено — 3.24', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.24.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено токсичное поведение в IC чате, унижающее честь и достоинство[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное предупреждение / Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p131_d', title:'Отказано — 3.24', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]3.24.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено токсичное поведение в IC чате, унижающее честь и достоинство[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное предупреждение / Mute 30 минут[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p132_a', title:'Одобрено — 4.03', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена передача игрового аккаунта третьим лицам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p133_d', title:'Отказано — 4.03', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.03.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена передача игрового аккаунта третьим лицам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p134_a', title:'Одобрено — 4.04', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено регистрировать более трёх игровых аккаунтов на сервере[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p135_d', title:'Отказано — 4.04', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.04.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено регистрировать более трёх игровых аккаунтов на сервере[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p136_a', title:'Одобрено — 4.05', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена передача или трансфер игровых ценностей между аккаунтами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 15 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p137_d', title:'Отказано — 4.05', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.05.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещена передача или трансфер игровых ценностей между аккаунтами[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Warn / Ban 15 дней / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p138_a', title:'Одобрено — 4.06', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.06.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Никнейм должен быть в формате «Имя_Фамилия» на английском языке[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p139_d', title:'Отказано — 4.06', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.06.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Никнейм должен быть в формате «Имя_Фамилия» на английском языке[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p140_a', title:'Одобрено — 4.07', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.07.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать более двух заглавных букв в никнейме[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p141_d', title:'Отказано — 4.07', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.07.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать более двух заглавных букв в никнейме[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p142_a', title:'Одобрено — 4.08', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать никнейм, не соответствующий реальным именам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p143_d', title:'Отказано — 4.08', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.08.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать никнейм, не соответствующий реальным именам[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p144_a', title:'Одобрено — 4.09', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.09.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать никнейм с матерными словами или оскорблениями[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p145_d', title:'Отказано — 4.09', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.09.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено использовать никнейм с матерными словами или оскорблениями[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p146_a', title:'Одобрено — 4.10', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать никнейм, похожий на никнеймы других игроков или администраторов[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p147_d', title:'Отказано — 4.10', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.10.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать никнейм, похожий на никнеймы других игроков или администраторов[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Устное замечание + смена никнейма / PermBan[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p148_a', title:'Одобрено — 4.11', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Владеть бизнесами разрешается только с одного основного аккаунта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление твинк аккаунта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p149_d', title:'Отказано — 4.11', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.11.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Владеть бизнесами разрешается только с одного основного аккаунта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление твинк аккаунта[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p150_a', title:'Одобрено — 4.14', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.14.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено иметь транспортную/строительную компанию без активности в игре[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление компании без компенсации[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p151_d', title:'Отказано — 4.14', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.14.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено иметь транспортную/строительную компанию без активности в игре[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Обнуление компании без компенсации[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p152_a', title:'Одобрено — 4.15', prefix:P.ACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#61bd6d][I]Одобрено[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nИгрок понесёт наказание по следующему пункту общих правил серверов;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.15.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать промокод, идентичный промокоду блогера проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan / Обнуление имущества[/I][/SIZE][/COLOR][/SPOILER]' },
            { id:'p153_d', title:'Отказано — 4.15', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0, isRaw:true,
              content:'[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=#ff4757][I]Отказано[/I][/COLOR][COLOR=rgb(255,255,255)][I].\nНарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]4.15.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Запрещено создавать промокод, идентичный промокоду блогера проекта[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | PermBan / Обнуление имущества[/I][/SIZE][/COLOR][/SPOILER]' },
        ],
        admins: [
            { id:'a1', title:'На рассмотрении', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Ваша жалоба на администратора принята и взята на рассмотрение.\nРезультат рассмотрения будет опубликован в данной теме.' },
            { id:'a2', title:'Одобрено — администратор наказан', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Одобрено.\nДействия администратора были признаны неправомерными, сотрудник понесёт дисциплинарное взыскание.' },
            { id:'a3', title:'Отказано — действия правомерны', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nДействия администратора были признаны правомерными и соответствующими регламенту сервера.' },
            { id:'a4', title:'Отказано — нет доказательств', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nПредоставленных материалов недостаточно для установления нарушения со стороны сотрудника.' },
            { id:'a5', title:'Передано Гл. Администратору', prefix:P.GA, isPinned:false, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и передана на рассмотрение Главному Администратору.\nОжидайте ответа в данной теме.' },
        ],
        leaders: [
            { id:'l1', title:'На рассмотрении', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Ваша жалоба на лидера принята и взята на рассмотрение.\nРезультат будет опубликован в данной теме.' },
            { id:'l2', title:'Одобрено — лидер наказан', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Одобрено.\nЛидер понесёт наказание согласно действующему регламенту.' },
            { id:'l3', title:'Отказано — нарушений не выявлено', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Отказано.\nФактов нарушения со стороны лидера обнаружено не было.' },
            { id:'l4', title:'Реализовано', prefix:P.REALIZOVANO, isPinned:false, isNew:false, uses:0,
              content:'Ваша жалоба была рассмотрена и получает статус — Реализовано.\nМеры по исправлению ситуации приняты.' },
        ],
        appeals: [
            { id:'ap1', title:'На рассмотрении', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Ваше обжалование принято и взято на рассмотрение.\nРезультат будет опубликован в данной теме в ближайшее время.' },
            { id:'ap2', title:'Обжалование одобрено — бан снят', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Ваше обжалование было рассмотрено и получает статус — Одобрено.\nНаказание снято. Ваш аккаунт разблокирован. Желаем приятной игры.' },
            { id:'ap3', title:'Обжалование отклонено — бан оставлен', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваше обжалование было рассмотрено и получает статус — Отказано.\nНаказание оставлено в силе. Нарушение было совершено умышленно и подтверждается имеющимися доказательствами.' },
            { id:'ap4', title:'Отказано — повторное нарушение', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваше обжалование было рассмотрено и получает статус — Отказано.\nУчитывая систематический характер нарушений, наказание остаётся в силе.' },
            { id:'ap5', title:'Ожидание — проверка обстоятельств', prefix:P.OJIDANIE, isPinned:false, isNew:false, uses:0,
              content:'Ваше обжалование принято на рассмотрение. Для вынесения решения требуется дополнительная проверка обстоятельств.\nОжидайте ответа в течение 72 часов.' },
            { id:'ap6', title:'Передано Тех. Специалисту', prefix:P.TEX, isPinned:false, isNew:false, uses:0,
              content:'Ваше обращение было передано Техническому Специалисту для детального рассмотрения.\nОжидайте ответа.' },
        ],
        rp_bio: [
            { id:'rb1', title:'Биография одобрена', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Ваша РП-биография была проверена и получает статус — Одобрено.\nПоздравляем, биография соответствует требованиям сервера. Приятной игры!' },
            { id:'rb2', title:'На доработку — слишком короткая', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Ваша РП-биография взята на проверку, однако требует доработки.\nБиография слишком короткая. Минимальный объём — 200 слов, максимальный — 600 слов. Пожалуйста, дополните историю персонажа.' },
            { id:'rb3', title:'На доработку — MG-термины', prefix:P.PIN, isPinned:false, isNew:false, uses:0,
              content:'Ваша РП-биография взята на проверку, однако требует доработки.\nВ тексте обнаружены термины, нарушающие атмосферу ролевой игры (метагейминг). Пожалуйста, перепишите биографию, избегая OOC-терминологии.' },
            { id:'rb4', title:'На доработку — нет структуры', prefix:P.PIN, isPinned:false, isNew:false, uses:0,
              content:'Ваша РП-биография взята на проверку, однако требует доработки.\nБиографии не хватает структуры: необходимо описать детство, становление личности и мотивацию персонажа.' },
            { id:'rb5', title:'Отказано — не соответствует требованиям', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша РП-биография была проверена и получает статус — Отказано.\nПредставленный текст не соответствует требованиям сервера. Пожалуйста, ознакомьтесь с правилами оформления биографии и подайте заявку повторно.' },
        ],
        rp_sit: [
            { id:'rs1', title:'Ситуация принята', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Ваша РП-ситуация принята и будет рассмотрена в ближайшее время.\nОжидайте ответа от куратора.' },
            { id:'rs2', title:'Ситуация одобрена', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Ваша РП-ситуация была рассмотрена и получает статус — Одобрено.\nСитуация разрешена в соответствии с правилами сервера.' },
            { id:'rs3', title:'Отказано — нарушение RP', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша РП-ситуация была рассмотрена и получает статус — Отказано.\nВ ходе ситуации зафиксированы грубые нарушения ролевых правил сервера.' },
            { id:'rs4', title:'Отказано — недостаточно скриншотов', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Ваша РП-ситуация была рассмотрена и получает статус — Отказано.\nДля подтверждения ситуации недостаточно скриншотов или видеоматериалов.' },
        ],
        opg: [
            { id:'o1', title:'Заявка принята', prefix:P.PIN, isPinned:true, isNew:false, uses:0,
              content:'Заявка на создание неофициальной организации принята и взята на рассмотрение.\nВам будет предоставлен ответ в течение 72 часов.' },
            { id:'o2', title:'Заявка одобрена', prefix:P.ACCEPT, isPinned:true, isNew:false, uses:0,
              content:'Заявка на создание неофициальной организации была рассмотрена и получает статус — Одобрено.\nПоздравляем! Ваша организация официально зарегистрирована на сервере.' },
            { id:'o3', title:'Отказано — не выполнены условия', prefix:P.UNACCEPT, isPinned:false, isNew:false, uses:0,
              content:'Заявка на создание неофициальной организации была рассмотрена и получает статус — Отказано.\nУсловия для создания организации не выполнены. Ознакомьтесь с требованиями и подайте заявку повторно.' },
            { id:'o4', title:'На доработку', prefix:P.OJIDANIE, isPinned:false, isNew:false, uses:0,
              content:'Заявка на создание неофициальной организации требует доработки.\nПожалуйста, исправьте указанные замечания и обновите тему.' },
            { id:'o5', title:'Расформирована', prefix:P.CLOSE, isPinned:false, isNew:false, uses:0,
              content:'Неофициальная организация расформирована по решению администрации в связи с систематическими нарушениями правил сервера.' },
        ],
        custom: [],
    };

    // ═══════════════════════════════════════════════════════════════
// ПОЛНАЯ АВТОМАТИЧЕСКАЯ ОПТИМИЗАЦИЯ НАЗВАНИЙ И ТЕГОВ (РАЗДЕЛ ИГРОКИ)
// ═══════════════════════════════════════════════════════════════
(function() {
    // Полная карта коротких названий и расширенных поисковых тегов для Black Russia
    const ruleMapping = {
        // --- РАЗДЕЛ 2: ИГРОВОЙ ПРОЦЕСС ---
        '2.01': { short: 'RP (Нарушение RP)', tags: 'rp, рп, нарушение рп, поведение, не по рп, нонрп' },
        '2.02': { short: 'AFK (Уход от RP)', tags: 'afk, авк, уход от рп, уход от ареста, офф от рп, уход, лив' },
        '2.03': { short: 'NRP Drive (НонРП езда)', tags: 'nrp drive, нонрп драйв, нонрп езда, езда, срезы, встречка, поля, неправдоподобная езда' },
        '2.04': { short: 'Помеха (Помеха игрокам)', tags: 'помеха, помеха работе, инкассаторам, дальнобойщикам, таран, мешает, помеха игровому процессу' },
        '2.05': { short: 'Обман (OOC/IC Обман)', tags: 'обман, оос обман, ic обман, развод, кидок, скам, украл деньги' },
        '2.07': { short: 'AFK без ESC (Помеха)', tags: 'afk без esc, помеха, афк на дороге, афк в проходе, кик' },
        '2.08': { short: 'Аморальные действия', tags: 'аморалка, аморальные действия, секс отыгровки, изнасилование, варн' },
        '2.09': { short: 'Слив склада', tags: 'слив склада, слив фамы, слив склада фракции, ресурсы' },
        '2.10': { short: 'Обман в /do', tags: 'обман в до, обман do, do, вранье в до' },
        '2.11': { short: 'Личный транспорт', tags: 'рабочий транспорт в личных целях, фракционный транспорт, фракция' },
        '2.12': { short: 'Помеха медиа лицам', tags: 'помеха стримеру, помеха блогеру, стримснайп, мешает стриму' },
        '2.13': { short: 'DB (DriveBy)', tags: 'db, дб, таран, убийство машиной, нанесение урона транспортом' },
        '2.15': { short: 'TK (Team Kill)', tags: 'tk, тк, тим килл, убийство своих, огонь по своим, фракция' },
        '2.16': { short: 'SK (Spawn Kill)', tags: 'sk, ск, спавн килл, убийство на спавне, титулка, база' },
        '2.18': { short: 'MG (Meta Gaming)', tags: 'mg, мг, метагейминг, оос в ic, информация из реальности, чат' },
        '2.19': { short: 'DM (Death Match)', tags: 'dm, дм, дезматч, убийство без причины, нанесение урона' },
        '2.20': { short: 'Mass DM', tags: 'масс дм, mass dm, масс убийство, расстрел, убийство троих' },
        '2.21': { short: 'Обход системы', tags: 'обход системы, багоюз системы, передача денег через багажник, махинации' },
        '2.22': { short: 'Сторонний софт', tags: 'софт, читы, читер, скрипты, макросы, стороннее по, сборка' },
        '2.23': { short: 'Скрытие багов', tags: 'скрытие багов, багоюз, скрытие ошибок, заблуждение' },
        '2.24': { short: 'Скрытие нарушителей', tags: 'соучастие, скрытие злоумышленников, покрывательство, чсп' },
        '2.25': { short: 'Вред репутации', tags: 'вред проекту, репутация, слив проекта' },
        '2.26': { short: 'Вред ресурсам', tags: 'вред ресурсам, дудос, ddos, вред форуму, вред серверам' },
        '2.27': { short: 'Слив инфы админов', tags: 'слив админ инфы, распространение переписок, слив админки' },
        '2.28': { short: 'Покупка/Продажа ИВ', tags: 'вирты, покупка вирт, продажа вирт, ив, покупка ив, черны рынок' },
        '2.30': { short: 'Ущерб экономике', tags: 'раздача денег, порча экономики, ущерб экономике' },
        '2.31': { short: 'Реклама проектов', tags: 'реклама, сторонние проекты, пиар каналов, ссылки' },
        '2.32': { short: 'Обман администрации', tags: 'обман адм, введение в заблуждение, подделка док-в' },
        '2.33': { short: 'Уязвимость правил', tags: 'уязвимость правил, обход правил, дыры в правилах' },
        '2.40': { short: 'Поля на рабочем тс', tags: 'езда по полям, рабочее тс, грузовик, курьер' },
        '2.45': { short: 'Наказание от Команды', tags: 'команда проекта, спец администрация' },
        '2.47': { short: 'Поля на грузовом тс', tags: 'поля, грузовик, фура, езда по полям, дальнобой' },
        '2.53': { short: 'Баги стрельбы (+C)', tags: '+c, плюс ц, отводы, слайды, сбив анимации, стрельба' },
        '2.54': { short: 'Оскорбление адм', tags: 'оск адм, неуважение к адм, неадекват адм, угрозы адм' },

        // --- РАЗДЕЛ 3: ПРАВИЛА ЧАТА ---
        '3.01': { short: 'Общепринятый язык', tags: 'язык, транслит, чат, русский язык' },
        '3.02': { short: 'Caps Lock (Капс)', tags: 'капс, верхний регистр, caps, заглавные буквы, крупный текст' },
        '3.03': { short: 'Оскорбление игроков', tags: 'оск, оскорбление, оск игроков, мат, брань' },
        '3.04': { short: 'Упоминание родных', tags: 'упом род, mq, оск род, родня, маме привет' },
        '3.05': { short: 'Flood (Флуд)', tags: 'флуд, flood, спам, чат, повторение сообщений' },
        '3.06': { short: 'Злоуп. символами', tags: 'знаки препинания, злоупотребление символами, спам знаками' },
        '3.21': { short: 'Запрещенная реклама', tags: 'реклама в чат, вип чат, гос чат, коммерция' },
        '3.22': { short: 'Объявления в госс', tags: 'рынок в больнице, рынок в госс, торговля, продажа в здании' },
        '3.23': { short: 'Мат в VIP-чат', tags: 'вип чат, vip чат, мат в вип, нецензурная брань' },

        // --- РАЗДЕЛ 4: НИКНЕЙМЫ / ПРОМОКОДЫ ---
        '4.05': { short: 'Реклама в нике', tags: 'ник реклама, реклама сторонних ресурсов, сайт в нике' },
        '4.08': { short: 'Символы/цифры в нике', tags: 'нонрп ник, цифры в нике, символы в нике, ошибки в нике' },
        '4.09': { short: 'Матерный/Оск ник', tags: 'оск ник, мат в нике, политика в нике, религия в нике' },
        '4.10': { short: 'Фейк никнейм', tags: 'фейк ник, подмена букв, фейк админа, подделка аккаунта' },
        '4.11': { short: 'Бизнес на твинках', tags: 'твинки, бизнес, владение бизнесом, мультиаккаунт' },
        '4.14': { short: 'Неактив компании', tags: 'неактивность тк, строительная компания, обнуление тк, не заходил' },
        '4.15': { short: 'Фейк промокод', tags: 'промокод, фейк промо, промокод блогера, копия промо' }
    };

    // Карта жестких базовых тегов для стандартных (общих) вердиктов по ID
    const generalTags = {
        'p1': 'игроки, жалоба, рассмотрение, закреплено, в работе',
        'p2': 'игроки, жалоба, одобрено, наказание выдано, регламент, закреплено',
        'p3': 'игроки, жалоба, отказано, нарушений нет, чист',
        'p4': 'игроки, жалоба, отказано, недостаточно доказательств, видео, скриншот',
        'p5': 'игроки, жалоба, отказано, не по регламенту, формат, форма подачи',
        'p6': 'игроки, жалоба, ожидание, запрос доказательств, 24 часа, предоставить видео',
        'p7': 'игроки, жалоба, решено, ситуация урегулирована, закрыто',
        'p8': 'игроки, жалоба, одобрено, пункт правил, ручной выбор',
        'p9': 'игроки, жалоба, отказано, пункт правил, ручной выбор'
    };

    // Автоматически определяем доступный массив (в глобальной области или внутри структуры скрипта)
    const templatesList = (typeof DEFAULT_TEMPLATES !== 'undefined' && DEFAULT_TEMPLATES.players) || (typeof players !== 'undefined' ? players : null);

    if (templatesList && Array.isArray(templatesList)) {
        templatesList.forEach(tpl => {
            let ruleNum = null;

            // Шаг 1. Пытаемся извлечь пункт правил из текущих тегов (поиск подстроки вида '2.01')
            if (tpl.tags) {
                const matchTags = tpl.tags.match(/\b\d+\.\d+\b/);
                if (matchTags) ruleNum = matchTags[0];
            }

            // Шаг 2. Если в тегах пусто, ищем пункт правил в самом названии шаблона
            if (!ruleNum && tpl.title) {
                const matchTitle = tpl.title.match(/\b\d+\.\d+\b/);
                if (matchTitle) ruleNum = matchTitle[0];
            }

            // Шаг 3. Если заголовок не помог, парсим текст BB-кода из content (например: [I]2.01.[/I])
            if (!ruleNum && tpl.content) {
                const matchContent = tpl.content.match(/\[I\](\d+\.\d+)\.\[\/I\]/);
                if (matchContent) ruleNum = matchContent[1];
            }

            // Определяем глобальный маркер статуса на основе текста в заголовке
            const isApproved = tpl.title.toLowerCase().includes('одобрено');
            const isRejected = tpl.title.toLowerCase().includes('отказано');
            const statusTag = isApproved ? 'одобрено' : isRejected ? 'отказано' : 'жалоба';

            if (ruleNum) {
                // Если номер пункта найден в базе ruleMapping
                if (ruleMapping[ruleNum]) {
                    const baseStatus = isApproved ? 'Одобрено' : isRejected ? 'Отказано' : 'Рассмотрено';

                    // Перезаписываем заголовок в идеальный читаемый вид
                    tpl.title = `${baseStatus} — ${ruleMapping[ruleNum].short} [${ruleNum}]`;

                    // Перезаписываем теги мощным поисковым набором
                    tpl.tags = `игроки, жалоба, ${statusTag}, пункт ${ruleNum}, ${ruleMapping[ruleNum].tags}`;
                } else {
                    // Если пункт правил обнаружен, но его нет в карте ruleMapping (страховочный вариант)
                    const baseStatus = isApproved ? 'Одобрено' : isRejected ? 'Отказано' : 'Рассмотрено';
                    tpl.title = `${baseStatus} — Пункт правил ${ruleNum}`;
                    tpl.tags = `игроки, жалоба, ${statusTag}, пункт ${ruleNum}`;
                }
            } else {
                // Обработка стандартных административных шаблонов, не привязанных к конкретным пунктам правил
                if (generalTags[tpl.id]) {
                    tpl.tags = generalTags[tpl.id];
                } else {
                    // Универсальный генератор тегов для любых кастомных элементов
                    tpl.tags = `игроки, жалоба, ${statusTag}, ${tpl.title.toLowerCase().replace(/[^a-zа-я0-9\s]/g, '')}`;
                }
            }
        });
        console.log(`[Успех] Оптимизатор успешно пересобрал базу данных! Обработано шаблонов: ${templatesList.length}`);
    } else {
        console.error("[Ошибка] Не удалось обнаружить массив 'players' для выполнения автоматической оптимизации.");
    }
})();

    // ═══════════════════════════════════════════════════════════════
    //  СОСТОЯНИЕ
    // ═══════════════════════════════════════════════════════════════
    let TPLS     = loadTemplates();
    let SETS     = loadSettings();
    let STATS    = loadStats();
    let HIST     = loadHistory();
    let curTheme = localStorage.getItem(STORAGE.THEME) || 'amber';
    let curTab   = 'players';
    let manageMode = false;
    let floodIv  = null;
    let styleEl  = null;

    const theme = () => {
        const t = THEMES[curTheme];
        if (!t) { curTheme = 'amber'; localStorage.setItem(STORAGE.THEME, 'amber'); return THEMES.amber; }
        return t;
    };

    // ═══════════════════════════════════════════════════════════════
    //  ЗАГРУЗКА / СОХРАНЕНИЕ
    // ═══════════════════════════════════════════════════════════════
    function loadTemplates() {
        try {
            const raw = localStorage.getItem(STORAGE.TEMPLATES);
            if (!raw) {
                const defs = deepClone(DEFAULT_TEMPLATES);
                defs.custom = [];
                return defs;
            }
            const parsed = JSON.parse(raw);
            const data = (parsed.version === STORAGE_VERSION && parsed.data) ? parsed.data : (parsed.data || parsed);
            Object.values(data).forEach(arr => { if (Array.isArray(arr)) arr.forEach(t => { if (t.uses === undefined) t.uses = 0; if (t.tags === undefined) t.tags = ''; }); });
            const defaults = deepClone(DEFAULT_TEMPLATES);
            defaults.custom = [];
            const result = {};
            for (const key of Object.keys(defaults)) {
                const saved = data[key];
                result[key] = (Array.isArray(saved) && saved.length > 0 && key !== 'custom') ? saved : defaults[key];
            }
            if (Array.isArray(data.custom)) result.custom = data.custom;
            return result;
        } catch(e) {
            localStorage.removeItem(STORAGE.TEMPLATES);
            const defs = deepClone(DEFAULT_TEMPLATES);
            defs.custom = [];
            return defs;
        }
    }
    function loadSettings() {
        const def = { autoSubmit: false, floodControl: true, serverName: 'ASTANA', mgTerms: [...DEFAULT_MG_TERMS], minBioWords: 200, hotkeys: true };
        try { const s = JSON.parse(localStorage.getItem(STORAGE.SETTINGS)); return s ? { ...def, ...s } : def; }
        catch(e) { return def; }
    }
    function loadStats() {
        try { return JSON.parse(localStorage.getItem(STORAGE.STATS)) || { total: 0, byPrefix: {}, byTab: {}, byDay: {} }; }
        catch(e) { return { total: 0, byPrefix: {}, byTab: {}, byDay: {} }; }
    }
    function loadHistory() {
        try { return JSON.parse(localStorage.getItem(STORAGE.HISTORY)) || []; }
        catch(e) { return []; }
    }
    function saveTemplates(d) { localStorage.setItem(STORAGE.TEMPLATES, JSON.stringify({ version: STORAGE_VERSION, data: d || TPLS })); }
    function saveSettings()   { localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(SETS)); }
    function saveStats()      { localStorage.setItem(STORAGE.STATS, JSON.stringify(STATS)); }
    function saveHistory()    { localStorage.setItem(STORAGE.HISTORY, JSON.stringify(HIST)); }
    function deepClone(o)     { return JSON.parse(JSON.stringify(o)); }

    // ═══════════════════════════════════════════════════════════════
    //  УТИЛИТЫ
    // ═══════════════════════════════════════════════════════════════
    function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function fmtDate(d) { return new Date(d).toLocaleDateString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric'}); }
    function fmtTime(d) { return new Date(d).toLocaleTimeString('ru-RU', {hour:'2-digit',minute:'2-digit'}); }
    function timeAgo(ts) {
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return s + 'с назад';
        if (s < 3600) return Math.floor(s/60) + 'м назад';
        if (s < 86400) return Math.floor(s/3600) + 'ч назад';
        return Math.floor(s/86400) + 'д назад';
    }
    function greeting() {
        const h = new Date().getHours();
        if (h>=4  && h<12) return 'Доброе утро';
        if (h>=12 && h<18) return 'Добрый день';
        if (h>=18)         return 'Добрый вечер';
        return 'Доброй ночи';
    }
    const LAYOUT = {q:'й',w:'ц',e:'у',r:'к',t:'е',y:'н',u:'г',i:'ш',o:'щ',p:'з','[':'х',']':'ъ',a:'ф',s:'ы',d:'в',f:'а',g:'п',h:'р',j:'о',k:'л',l:'д',';':'ж',"'":'э',z:'я',x:'ч',c:'с',v:'м',b:'и',n:'т',m:'ь',',':'б','.':'ю'};
    const toRu = s => s.split('').map(c => LAYOUT[c]||c).join('');
    const fuzz = (q,t) => { if(!q) return true; const n=q.toLowerCase(); const tx=t.toLowerCase(); return tx.includes(n)||tx.includes(toRu(n)); };
    function getAuthor() {
        const el = document.querySelector(SEL.usernameLink);
        return { name: el ? el.textContent.trim() : 'Игрок', id: el ? (el.getAttribute('data-user-id')||'') : '' };
    }

    // ═══════════════════════════════════════════════════════════════
    //  ПЛЕЙСХОЛДЕРЫ
    // ═══════════════════════════════════════════════════════════════
    function applyPH(text) {
        const {name, id} = getAuthor();
        const mention = id ? `[USER=${id}]${name}[/USER]` : name;
        const threadId = window.location.pathname.replace(/\D/g,'') || '';
        return text
            .replace(/\{nickname\}/g,  name)
            .replace(/\{mention\}/g,   mention)
            .replace(/\{server\}/g,    String(SETS.serverName||'ASTANA').toUpperCase())
            .replace(/\{date\}/g,      fmtDate(Date.now()))
            .replace(/\{time\}/g,      fmtTime(Date.now()))
            .replace(/\{greeting\}/g,  greeting())
            .replace(/\{thread_id\}/g, threadId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ВСТАВКА ШАБЛОНА
    // ═══════════════════════════════════════════════════════════════
    function insertTemplate(tpl) {
        try {
            const {name, id} = getAuthor();
            const mention = id ? `[USER=${id}]${name}[/USER]` : name;
            const srv = String(SETS.serverName||'ASTANA').toUpperCase();
            const pc  = PREFIX_COLORS[tpl.prefix] || '#61bd6d';

            // isRaw: контент уже содержит готовый BB-код тела — только плейсхолдеры
            if (tpl.isRaw) {
                let rawBody = applyPH(String(tpl.content||''))
                    .replace(/\{mention\}/g, mention);
                const fin =
                    `[CENTER][FONT=times new roman]\n` +
                    `[COLOR=rgb(209,213,216)][I][IMG]https://i.postimg.cc/9QhjNYgx/Untitled38-20260604131933.png[/IMG][/I][/COLOR]\n\n` +
                    `[COLOR=rgb(255,255,255)][SIZE=7][I]${greeting()}, уважаемый [/I][/SIZE][/COLOR]` +
                    `[COLOR=rgb(209,213,216)][SIZE=7][I]${mention}![/I][/SIZE][/COLOR]\n\n` +
                    `${rawBody}\n\n` +
                    `[URL='https://postimg.cc/gw6vPFsb'][IMG]https://i.postimg.cc/jjMvPRJ2/Untitled36-20260604131154.png[/IMG][/URL]\n\n` +
                    `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]Приятной игры на сервере[/I][/SIZE][/COLOR] ` +
                    `[COLOR=rgb(84,172,210)][SIZE=6][I]${srv}[/I][/SIZE][/COLOR][/COLOR]\n` +
                    `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]С уважением,[/I][/SIZE][/COLOR] ` +
                    `[COLOR=rgb(209,72,65)][SIZE=6][I]Администрация сервера[/I][/SIZE][/COLOR][/COLOR]\n` +
                    `[/FONT][/CENTER]`;
                const ed = document.querySelector(SEL.editor);
                if (!ed) { alert('❌ Редактор не найден. Откройте форму ответа.'); return; }
                ed.innerHTML = fin.replace(/\n/g,'<br>');
                ['input','keyup','change'].forEach(ev => ed.dispatchEvent(new Event(ev,{bubbles:true})));
                document.querySelector(SEL.overlayClose)?.click();
                closeMain();
                if (tpl.prefix) setPrefix(tpl.prefix);
                if (SETS.autoSubmit) submit();
                recordUse(tpl, curTab);
                return;
            }

            let rawBody = applyPH(String(tpl.content||''))
                .replace(/\[url=[^\]]*\]\[img\][^\[]*\[\/img\]\[\/url\]/gi,'')
                .replace(/\[img\][^\[]*\[\/img\]/gi,'')
                .replace(/\[\/?(CENTER|FONT|COLOR|SIZE|I|B|U)(=[^\]]+)?\]/gi,'')
                .trim();

            const hl = (text, pat) => text.replace(
                new RegExp(`(${pat})`, 'i'),
                `[/I][/COLOR][COLOR=${pc}][I]$1[/I][/COLOR][COLOR=rgb(255,255,255)][I]`
            );
            if      (tpl.prefix===P.ACCEPT||tpl.prefix===P.REALIZOVANO) rawBody = hl(rawBody,'Одобрено|Реализовано');
            else if (tpl.prefix===P.UNACCEPT)   rawBody = hl(rawBody,'Отказано');
            else if (tpl.prefix===P.PIN||tpl.prefix===P.OJIDANIE)       rawBody = hl(rawBody,'На рассмотрении|Ожидание');
            else if (tpl.prefix===P.RESHENO)    rawBody = hl(rawBody,'Решено');
            else if (tpl.prefix===P.CLOSE)      rawBody = hl(rawBody,'Закрыто');

            const fin =
                `[CENTER][FONT=times new roman]\n` +
                `[COLOR=rgb(209,213,216)][I][IMG]https://i.postimg.cc/9QhjNYgx/Untitled38-20260604131933.png[/IMG][/I][/COLOR]\n\n` +
                `[COLOR=rgb(255,255,255)][SIZE=7][I]${greeting()}, уважаемый [/I][/SIZE][/COLOR]` +
                `[COLOR=rgb(209,213,216)][SIZE=7][I]${mention}![/I][/SIZE][/COLOR]\n\n` +
                `[SIZE=6][COLOR=rgb(255,255,255)][I]${rawBody}[/I][/COLOR][/SIZE]\n\n` +
                `[URL='https://postimg.cc/gw6vPFsb'][IMG]https://i.postimg.cc/jjMvPRJ2/Untitled36-20260604131154.png[/IMG][/URL]\n\n` +
                `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]Приятной игры на сервере[/I][/SIZE][/COLOR] ` +
                `[COLOR=rgb(84,172,210)][SIZE=6][I]${srv}[/I][/SIZE][/COLOR][/COLOR]\n` +
                `[COLOR=rgb(209,213,216)][COLOR=rgb(255,255,255)][SIZE=6][I]С уважением,[/I][/SIZE][/COLOR] ` +
                `[COLOR=rgb(209,72,65)][SIZE=6][I]Администрация сервера[/I][/SIZE][/COLOR][/COLOR]\n` +
                `[/FONT][/CENTER]`;

            const ed = document.querySelector(SEL.editor);
            if (!ed) { alert('❌ Редактор не найден. Откройте форму ответа.'); return; }
            ed.innerHTML = fin.replace(/\n/g,'<br>');
            ['input','keyup','change'].forEach(ev => ed.dispatchEvent(new Event(ev,{bubbles:true})));

            document.querySelector(SEL.overlayClose)?.click();
            closeMain();
            if (tpl.prefix) setPrefix(tpl.prefix);
            if (SETS.autoSubmit) submit();
            recordUse(tpl, curTab);
        } catch(err) {
            console.error('NL Helper insertTemplate:', err);
            alert('❌ Ошибка вставки: ' + err.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ПРЕФИКС
    // ═══════════════════════════════════════════════════════════════
    function setPrefix(id) {
        if (typeof XF === 'undefined') { console.warn('XF не определен'); return; }
        const ti = document.querySelector(SEL.titleValue)?.lastChild?.textContent?.trim() || '';
        try {
            const fd = new FormData();
            fd.append('prefix_id',id); 
            fd.append('title',ti);
            fd.append('_xfToken',XF.config.csrf);
            fd.append('_xfRequestUri',window.location.pathname);
            fd.append('_xfWithData',1); 
            fd.append('_xfResponseType','json');
            const open = OPEN_PFXS.has(id) ? 1 : 0;
            fd.append('discussion_open',open); 
            fd.append('sticky',open);
            
            const url = new URL(window.location.href);
            const editUrl = url.pathname.replace(/\/$/, '') + '/edit';
            
            fetch(editUrl, {method:'POST', body:fd, credentials:'same-origin'})
                .then(r => {
                    if (!r.ok) { console.error('Ошибка префикса:', r.status); showNotification('❌ Ошибка при установке префикса', 'error'); return null; }
                    return r.json();
                })
                .then(d => {
                    if (d && d.status === 'ok') {
                        showNotification('✅ Префикс установлен', 'success');
                        if (SETS.autoSubmit) setTimeout(() => location.reload(), 500);
                    } else if (d) {
                        console.warn('Статус ответа:', d);
                        showNotification('⚠️ Ответ сервера: ' + (d.status || 'неизвестно'), 'error');
                    }
                })
                .catch(err => {
                    console.error('Ошибка в setPrefix:', err);
                    showNotification('❌ Ошибка: ' + err.message, 'error');
                });
        } catch (err) {
            console.error('Ошибка подготовки запроса:', err);
            showNotification('❌ Ошибка подготовки: ' + err.message, 'error');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SUBMIT + FLOOD
    // ═══════════════════════════════════════════════════════════════
    function submit() {
        clickSubmit();
        if (!SETS.floodControl) return;
        let n=0;
        const iv = setInterval(()=>{
            n++;
            const e = document.querySelector(SEL.blockMessage);
            if (e && e.textContent.includes('подождать')) { clearInterval(iv); doFlood(e.textContent); }
            if (n>25) clearInterval(iv);
        },100);
    }
    function doFlood(txt) {
        const m = txt.match(/(\d+)\s*(секунд|минут)/); if(!m) return;
        let s = parseInt(m[1]); if(m[2].includes('минут')) s*=60;
        localStorage.setItem(STORAGE.FLOOD, Date.now()+s*1000);
        const ed = document.querySelector(SEL.editor);
        localStorage.setItem(STORAGE.PENDING, ed?ed.innerHTML:'');
        floodTimer(s);
    }
    function floodTimer(secs) {
        const b = findReplyBtn(); if(!b) return;
        const sp = b.querySelector('.button-text'); const og = sp?.textContent||'Ответить'; let t=secs;
        const up=()=>{ if(sp) sp.textContent=`⏳ ${t}с`; b.classList.add('nl-fa'); }; up();
        if (floodIv) clearInterval(floodIv);
        floodIv = setInterval(()=>{
            t--; up();
            if(t<=0){
                clearInterval(floodIv); localStorage.removeItem(STORAGE.FLOOD);
                b.classList.remove('nl-fa'); if(sp) sp.textContent=og;
                const pd=localStorage.getItem(STORAGE.PENDING);
                if(pd){ const ed=document.querySelector(SEL.editor); if(ed){ed.innerHTML=pd;ed.dispatchEvent(new Event('input',{bubbles:true}));} localStorage.removeItem(STORAGE.PENDING); }
                if(SETS.autoSubmit) setTimeout(()=>clickSubmit(),500);
            }
        },1000);
    }
    function checkFlood() {
        const tg=parseInt(localStorage.getItem(STORAGE.FLOOD)); if(!tg) return;
        const r=Math.ceil((tg-Date.now())/1000); if(r>0) floodTimer(r); else localStorage.removeItem(STORAGE.FLOOD);
    }

    // ═══════════════════════════════════════════════════════════════
    //  СТАТИСТИКА
    // ═══════════════════════════════════════════════════════════════
    function recordUse(tpl, tabId) {
        tpl.uses = (tpl.uses||0)+1; saveTemplates();
        STATS.total = (STATS.total||0)+1;
        STATS.byPrefix[tpl.prefix] = (STATS.byPrefix[tpl.prefix]||0)+1;
        STATS.byTab[tabId] = (STATS.byTab[tabId]||0)+1;
        const today = new Date().toISOString().slice(0,10);
        STATS.byDay[today] = (STATS.byDay[today]||0)+1;
        saveStats();
        const threadTitle = document.querySelector(SEL.titleValue)?.textContent?.trim()||'(без названия)';
        HIST.unshift({ id:tpl.id, title:tpl.title, tabId, threadTitle, threadUrl:window.location.href, prefix:tpl.prefix, usedAt:Date.now() });
        if (HIST.length>MAX_HISTORY) HIST.length=MAX_HISTORY;
        saveHistory();
    }

    // ═══════════════════════════════════════════════════════════════
    //  ГОРЯЧИЕ КЛАВИШИ
    // ═══════════════════════════════════════════════════════════════
    function initHotkeys() {
        document.addEventListener('keydown', e => {
            if (!SETS.hotkeys) return;
            if (e.altKey && (e.key==='h'||e.key==='H'||e.key==='р'||e.key==='Р')) {
                e.preventDefault(); e.stopPropagation();
                document.querySelector('.nl-ov') ? closeMain() : openMain();
                return;
            }
            if (e.altKey && (e.key==='b'||e.key==='B'||e.key==='и'||e.key==='И')) {
                e.preventDefault(); e.stopPropagation();
                openBioAnalyzer(); return;
            }
            if (e.key==='Escape') {
                if (document.querySelector('.nl-ov')) { closeMain(); return; }
                if (document.querySelector('.nl-dov')) { document.querySelector('.nl-dov')?.remove(); return; }
            }
            if (e.altKey && e.key>='1' && e.key<='9') {
                const idx = parseInt(e.key)-1;
                if (idx < TABS.length) {
                    e.preventDefault(); e.stopPropagation();
                    curTab = TABS[idx].id;
                    if (!document.querySelector('.nl-ov')) { openMain(); }
                    else { document.querySelectorAll('.nl-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===curTab)); renderCards(); }
                }
            }
        }, { capture: true });
    }

    // ═══════════════════════════════════════════════════════════════
    //  CSS
    // ═══════════════════════════════════════════════════════════════
    function buildCSS(hd) {
        return `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

:root {
    --nl-bg:       ${hd.bg};
    --nl-bg2:      ${hd.bg2};
    --nl-bg3:      ${hd.bg3};
    --nl-border:   ${hd.border};
    --nl-accent:   ${hd.accent};
    --nl-text:     ${hd.text};
    --nl-text2:    ${hd.text2};
    --nl-grid:     ${hd.accent}07;
}

/* ── Кнопки на форуме ── */
.nl-btn-main {
    font-family:'Rajdhani',sans-serif !important; font-weight:700 !important;
    font-size:11px !important; letter-spacing:1px !important; text-transform:uppercase !important;
    background:transparent !important; color:${hd.accent} !important;
    border:1px solid ${hd.accent} !important;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)) !important;
    padding:8px 16px !important; cursor:pointer !important;
    margin:3px 5px 3px 0 !important; height:36px !important;
    display:inline-flex !important; align-items:center !important;
    vertical-align:middle !important; flex-shrink:0 !important;
    transition:all .2s !important;
    box-shadow:0 0 10px ${hd.accent}25 !important;
}
.nl-btn-main:hover { background:${hd.accent} !important; color:#000 !important; box-shadow:0 0 20px ${hd.accent}55 !important; }
#nl-bio-btn   { color:#3b82f6 !important; border-color:#3b82f6 !important; box-shadow:0 0 10px #3b82f625 !important; }
#nl-bio-btn:hover   { background:#3b82f6 !important; color:#fff !important; }
#nl-stats-btn { color:#22c55e !important; border-color:#22c55e !important; box-shadow:0 0 10px #22c55e25 !important; }
#nl-stats-btn:hover { background:#22c55e !important; color:#fff !important; }

/* ── Анимации ── */
@keyframes nl-fade { from{opacity:0} to{opacity:1} }
@keyframes nl-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
@keyframes nl-scan {
    0%,100% { transform:scaleX(0.1); opacity:0; }
    50%      { transform:scaleX(1);  opacity:0.6; }
}

/* ── Overlay ── */
.nl-ov {
    position:fixed; inset:0; z-index:99999;
    background:rgba(0,0,0,0.88);
    display:flex; align-items:center; justify-content:center;
    font-family:'Rajdhani',sans-serif;
    backdrop-filter:blur(5px);
    animation:nl-fade .18s ease;
}

/* ── Главное окно ── */
.nl-m {
    background:${hd.bg};
    background-image:linear-gradient(${hd.accent}05 1px,transparent 1px),linear-gradient(90deg,${hd.accent}05 1px,transparent 1px);
    background-size:28px 28px;
    width:1100px; max-width:97vw; height:88vh; max-height:860px;
    clip-path:polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px));
    overflow:hidden;
    display:flex; flex-direction:row;
    border:1px solid ${hd.border};
    box-shadow:0 0 0 1px ${hd.accent}10, 0 24px 60px rgba(0,0,0,.8);
    animation:nl-up .2s ease;
}

/* ── Сайдбар ── */
.nl-sidebar {
    width:220px; background:${hd.bg2}; border-right:1px solid ${hd.border};
    display:flex; flex-direction:column; flex-shrink:0;
}
.nl-logo-area {
    padding:22px 20px 18px; border-bottom:1px solid ${hd.border};
    position:relative; overflow:hidden;
}
.nl-logo-area::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,${hd.accent},transparent);
    animation:nl-scan 3s ease-in-out infinite; opacity:.5;
}
.nl-logo-text {
    font-family:'Rajdhani',sans-serif; font-size:28px; font-weight:700;
    color:${hd.text}; line-height:1; letter-spacing:2px; text-transform:uppercase;
}
.nl-logo-text span { color:${hd.accent}; }
.nl-logo-sub {
    font-family:'Share Tech Mono',monospace; font-size:10px;
    color:${hd.text2}; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px;
}

/* ── Вкладки ── */
.nl-tabs { flex:1; overflow-y:auto; padding:10px 0; display:flex; flex-direction:column; gap:2px; }
.nl-tabs::-webkit-scrollbar { width:3px; }
.nl-tabs::-webkit-scrollbar-thumb { background:${hd.border}; }
.nl-tab {
    padding:10px 20px; background:none; border:none;
    border-left:2px solid transparent;
    color:${hd.text2};
    font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase;
    cursor:pointer; text-align:left; transition:all .15s;
}
.nl-tab:hover { color:${hd.text}; background:${hd.bg3}; }
.nl-tab.active { color:${hd.accent}; border-left-color:${hd.accent}; background:${hd.accent}0d; }

/* ── Кнопки подвала сайдбара ── */
.nl-sb-foot { padding:14px; border-top:1px solid ${hd.border}; display:flex; flex-direction:column; gap:6px; }
.nl-hb {
    background:${hd.bg3}; border:1px solid ${hd.border};
    padding:9px 12px; cursor:pointer; color:${hd.text2};
    font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:600;
    letter-spacing:.06em; text-transform:uppercase;
    transition:all .15s; text-align:left; width:100%;
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));
}
.nl-hb:hover { border-color:${hd.accent}; color:${hd.accent}; background:${hd.accent}0d; }

/* ── Основной контент ── */
.nl-main-content { flex:1; display:flex; flex-direction:column; min-width:0; background:${hd.bg}; }

/* ── Топ-панель ── */
.nl-hd {
    padding:16px 22px 14px; border-bottom:1px solid ${hd.border};
    display:flex; flex-direction:column; gap:12px; flex-shrink:0;
    background:linear-gradient(90deg,${hd.accent}05 0%,transparent 60%);
}
.nl-hd-top { display:flex; gap:12px; align-items:center; }
.nl-sr {
    flex:1; background:${hd.bg2}; border:1px solid ${hd.border};
    color:${hd.text}; padding:10px 16px;
    font-family:'Rajdhani',sans-serif; font-size:14px; outline:none; transition:border-color .15s;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);
}
.nl-sr:focus { border-color:${hd.accent}; box-shadow:0 0 0 1px ${hd.accent}20; }
.nl-sr::placeholder { color:${hd.text2}; }
.nl-cl {
    width:36px; height:36px; flex-shrink:0;
    background:${hd.bg2}; border:1px solid ${hd.border};
    color:${hd.text2}; font-size:20px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));
}
.nl-cl:hover { background:rgba(239,68,68,.15); border-color:#ef4444; color:#ef4444; }

/* ── Панель префиксов ── */
.nl-pb { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
.nl-pp {
    font-family:'Rajdhani',sans-serif; font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:.5px;
    padding:4px 11px; border:1px solid; cursor:pointer;
    transition:all .15s; background:transparent;
    clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px));
}
.nl-pp:hover { filter:brightness(1.2); transform:translateY(-1px); }

/* ── Контент ── */
.nl-ct { flex:1; overflow-y:auto; padding:18px 22px; }
.nl-ct::-webkit-scrollbar { width:4px; }
.nl-ct::-webkit-scrollbar-thumb { background:${hd.border}; }

/* ── Сетка карточек ── */
.nl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; align-content:start; }

/* ── Карточка ── */
.nl-card {
    background:${hd.bg2}; border:1px solid ${hd.border};
    border-left:2px solid transparent;
    clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
    padding:16px; cursor:pointer; transition:all .18s; position:relative; overflow:hidden;
    box-sizing:border-box;
}
.nl-card:hover { border-left-color:${hd.accent}; box-shadow:0 4px 20px rgba(0,0,0,.3); transform:translateY(-1px); }
.nl-card.pinned { border-left-color:${hd.accent}; background:${hd.accent}06; }
.nl-card h3 {
    font-family:'Rajdhani',sans-serif; font-weight:700; font-size:14px; letter-spacing:.04em;
    color:${hd.text}; margin:0 0 7px; padding-right:22px; line-height:1.3;
    text-transform:uppercase;
}
.nl-card-preview {
    font-family:'Rajdhani',sans-serif; font-size:12px; color:${hd.text2}; margin:0 0 12px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.nl-badge {
    display:inline-block; font-size:10px; padding:2px 9px;
    font-family:'Rajdhani',sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
    clip-path:polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px));
}
.nl-new {
    display:inline-block; font-size:9px; font-weight:700; font-family:'Rajdhani',sans-serif;
    padding:1px 7px; background:rgba(34,197,94,.15); color:#22c55e;
    margin-left:6px; vertical-align:middle; text-transform:uppercase; letter-spacing:.5px;
}
.nl-uses { position:absolute; bottom:12px; right:14px; font-family:'Share Tech Mono',monospace; font-size:10px; color:${hd.text2}; }
.nl-pin-star { position:absolute; top:12px; right:14px; color:${hd.accent}; font-size:12px; }

/* Tooltip */
.nl-tooltip {
    position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
    background:${hd.bg3}; border:1px solid ${hd.border};
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    padding:10px 13px; font-family:'Rajdhani',sans-serif; font-size:12px; color:${hd.text}; line-height:1.6;
    width:280px; z-index:99999; pointer-events:none;
    box-shadow:0 8px 24px rgba(0,0,0,.7);
    white-space:pre-wrap; word-break:break-word;
    opacity:0; transition:opacity .15s;
}
.nl-card:hover .nl-tooltip { opacity:1; }

/* Overlay редактирования */
.nl-mo { position:absolute; inset:0; background:rgba(8,6,4,.92); display:none; align-items:center; justify-content:center; gap:10px; }
.nl-card.em .nl-mo { display:flex; }
.nl-card.em { cursor:default; }
.nl-card.em:hover { transform:none; box-shadow:none; }
.nl-ib {
    width:38px; height:38px;
    background:${hd.bg3}; border:1px solid ${hd.border};
    color:${hd.text}; font-size:15px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));
}
.nl-ib:hover { border-color:${hd.accent}; color:${hd.accent}; }
.nl-ib.del:hover { border-color:#ef4444; color:#ef4444; }

/* ── Футер ── */
.nl-ft {
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 22px; background:${hd.bg2}; border-top:1px solid ${hd.border};
    flex-shrink:0; flex-wrap:wrap; gap:10px;
}
.nl-fl { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.nl-cl2 { display:flex; align-items:center; gap:7px; font-family:'Rajdhani',sans-serif; font-size:13px; color:${hd.text2}; cursor:pointer; font-weight:600; user-select:none; letter-spacing:.04em; }
.nl-cl2 input { accent-color:${hd.accent}; width:14px; height:14px; cursor:pointer; }
.nl-sep { width:1px; height:18px; background:${hd.border}; }
.nl-sin { background:${hd.bg3}; border:1px solid ${hd.border}; color:${hd.text}; padding:7px 12px; font-family:'Rajdhani',sans-serif; font-size:13px; width:110px; outline:none; transition:border-color .15s; clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%); }
.nl-sin:focus { border-color:${hd.accent}; }
.nl-sin::placeholder { color:${hd.text2}; }

/* ── Кнопки ── */
.nl-btn {
    padding:8px 16px; border:none;
    font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:700;
    text-transform:uppercase; letter-spacing:.5px; cursor:pointer; transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
}
.nl-btn-sm { padding:6px 12px; font-size:11px; }
.nl-bp { background:${hd.accent}; color:#000; border:1px solid ${hd.accent}; }
.nl-bp:hover { filter:brightness(1.1); box-shadow:0 0 16px ${hd.accent}50; }
.nl-bd { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.35); color:#ef4444; }
.nl-bd:hover { background:rgba(239,68,68,.2); }
.nl-bs { background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.35); color:#22c55e; }
.nl-bs:hover { background:rgba(34,197,94,.2); }
.nl-bn { background:${hd.bg3}; border:1px solid ${hd.border}; color:${hd.text2}; }
.nl-bn:hover { border-color:${hd.accent}; color:${hd.accent}; }
.nl-fr { display:flex; gap:8px; }

/* ── Пустое состояние ── */
.nl-empty { text-align:center; padding:54px 20px; color:${hd.text2}; font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
.nl-empty-icon { font-size:40px; margin-bottom:12px; opacity:.4; }
.nl-fa { opacity:.5 !important; pointer-events:none !important; }

/* ── Диалоги ── */
.nl-dov { position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,.85); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; font-family:'Rajdhani',sans-serif; animation:nl-fade .15s ease; }
.nl-dbox { background:${hd.bg}; border:1px solid ${hd.border}; clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); padding:24px; width:560px; max-width:94vw; max-height:90vh; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,.8); display:flex; flex-direction:column; gap:14px; animation:nl-up .18s ease; }
.nl-dt { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:17px; letter-spacing:.06em; text-transform:uppercase; color:${hd.text}; border-bottom:1px solid ${hd.border}; padding-bottom:12px; }
.nl-f  { display:flex; flex-direction:column; gap:6px; }
.nl-f label { font-family:'Rajdhani',sans-serif; font-size:11px; color:${hd.text2}; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
.nl-ph-hint { font-size:11px; color:${hd.text2}; line-height:1.8; font-family:'Rajdhani',sans-serif; }
.nl-ph-hint code { background:${hd.bg3}; padding:1px 6px; color:${hd.accent}; font-size:10.5px; font-family:'Share Tech Mono',monospace; }
.nl-in, .nl-sel, .nl-ta { background:${hd.bg2}; border:1px solid ${hd.border}; color:${hd.text}; padding:10px 14px; font-family:'Rajdhani',sans-serif; font-size:14px; outline:none; transition:border-color .15s; width:100%; box-sizing:border-box; }
.nl-in:focus, .nl-sel:focus, .nl-ta:focus { border-color:${hd.accent}; box-shadow:0 0 0 1px ${hd.accent}18; }
.nl-ta { resize:vertical; min-height:120px; line-height:1.6; }
.nl-sel option { background:${hd.bg2}; }
.nl-da { display:flex; gap:10px; justify-content:flex-end; margin-top:4px; }

/* Вкладки в диалоге */
.nl-dtabs { display:flex; gap:2px; border-bottom:1px solid ${hd.border}; margin-bottom:2px; }
.nl-dtab { padding:9px 16px; background:none; border:none; border-bottom:2px solid transparent; color:${hd.text2}; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600; letter-spacing:.04em; text-transform:uppercase; cursor:pointer; transition:all .15s; margin-bottom:-1px; }
.nl-dtab:hover { color:${hd.text}; }
.nl-dtab.active { color:${hd.accent}; border-bottom-color:${hd.accent}; }
.nl-dpanel { display:none; flex-direction:column; gap:13px; }
.nl-dpanel.active { display:flex; }

/* ── Выбор темы ── */
.nl-hov { position:fixed; inset:0; z-index:999998; background:rgba(0,0,0,.82); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; font-family:'Rajdhani',sans-serif; }
.nl-hbox { background:${hd.bg}; border:1px solid ${hd.border}; clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); padding:22px; width:360px; box-shadow:0 16px 50px rgba(0,0,0,.8); }
.nl-htitle { font-family:'Rajdhani',sans-serif; font-weight:700; font-size:16px; letter-spacing:.08em; text-transform:uppercase; color:${hd.text}; margin-bottom:16px; text-align:center; }
.nl-hgrid { display:flex; flex-direction:column; gap:8px; }
.nl-hi { display:flex; align-items:center; gap:12px; padding:11px 16px; border:1px solid ${hd.border}; cursor:pointer; transition:all .18s; background:${hd.bg2}; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
.nl-hi:hover { border-color:var(--th-a); transform:translateX(3px); }
.nl-hi.active { border-color:var(--th-a); background:var(--th-a)0d; }
.nl-hs { width:26px; height:26px; flex-shrink:0; clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%); }
.nl-hn { font-family:'Rajdhani',sans-serif; font-size:14px; font-weight:700; letter-spacing:.04em; color:${hd.text}; }
.nl-hclose { margin-top:14px; width:100%; padding:10px; border:1px solid ${hd.border}; background:${hd.bg2}; color:${hd.text2}; cursor:pointer; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; transition:all .15s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
.nl-hclose:hover { color:${hd.text}; border-color:${hd.accent}; }

/* ── Статистика / История / Настройки ── */
.nl-stat-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; border-left:2px solid ${hd.accent}40; }
.nl-stat-title { color:${hd.text}; font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:600; letter-spacing:.04em; }
.nl-stat-val { font-weight:700; font-family:'Share Tech Mono',monospace; font-size:14px; }
.nl-stat-val.ok   { color:#22c55e; } .nl-stat-val.warn { color:#f59e0b; } .nl-stat-val.err  { color:#ef4444; }
.nl-stat-details  { font-size:11.5px; color:${hd.text2}; margin-top:5px; line-height:1.55; font-family:'Rajdhani',sans-serif; }
.nl-stat-section  { font-family:'Rajdhani',sans-serif; font-size:11px; color:${hd.accent}; letter-spacing:1.2px; text-transform:uppercase; margin:12px 0 6px; font-weight:700; }
.nl-stat-grid     { display:flex; flex-direction:column; gap:6px; }
.nl-bar-wrap      { display:flex; align-items:center; gap:9px; }
.nl-bar           { flex:1; height:4px; background:${hd.border}; overflow:hidden; }
.nl-bar-fill      { height:100%; transition:width .4s ease; }
.nl-hist-item { display:flex; gap:11px; align-items:flex-start; padding:10px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; border-left:2px solid transparent; cursor:pointer; transition:all .15s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); }
.nl-hist-item:hover { border-left-color:${hd.accent}; }
.nl-hist-dot  { width:8px; height:8px; flex-shrink:0; margin-top:4px; }
.nl-hist-body { flex:1; min-width:0; }
.nl-hist-tpl  { font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:${hd.text}; }
.nl-hist-thread { font-size:12px; color:${hd.text2}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:'Rajdhani',sans-serif; }
.nl-hist-time { font-size:11px; color:${hd.text2}; flex-shrink:0; font-family:'Share Tech Mono',monospace; }
.nl-set-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; }
.nl-set-label { font-family:'Rajdhani',sans-serif; font-size:13px; color:${hd.text}; font-weight:700; letter-spacing:.04em; }
.nl-set-desc  { font-size:11px; color:${hd.text2}; margin-top:2px; font-family:'Rajdhani',sans-serif; }
.nl-tag-list  { display:flex; flex-wrap:wrap; gap:6px; }
.nl-tag { display:flex; align-items:center; gap:5px; background:${hd.bg3}; border:1px solid ${hd.border}; padding:4px 12px; font-family:'Share Tech Mono',monospace; font-size:11px; color:${hd.text2}; }
.nl-tag button { background:none; border:none; color:${hd.text2}; cursor:pointer; font-size:14px; line-height:1; padding:0; }
.nl-tag button:hover { color:#ef4444; }
.nl-verdict { text-align:center; padding:10px 16px; font-family:'Rajdhani',sans-serif; font-weight:700; font-size:14px; text-transform:uppercase; letter-spacing:.4px; clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px)); }

/* ── Нотификация ── */
.nl-notif {
    position:fixed; top:20px; right:20px; padding:10px 18px;
    font-family:'Rajdhani',sans-serif; font-size:13px; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase; z-index:200000;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    animation:nl-up .2s ease;
}
        `;
    }

    function applyCSS() {
        if (styleEl) styleEl.remove();
        styleEl = document.createElement('style');
        styleEl.textContent = buildCSS(theme());
        document.head.appendChild(styleEl);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ГЛАВНОЕ ОКНО
    // ═══════════════════════════════════════════════════════════════
    function openMain() {
        if (document.querySelector('.nl-ov')) return;
        document.body.style.overflow = 'hidden';

        const ov = document.createElement('div');
        ov.className = 'nl-ov';
        ov.innerHTML = `
            <div class="nl-m">
                <aside class="nl-sidebar">
                    <div class="nl-logo-area">
                        <div class="nl-logo-text">NL<span>.</span></div>
                        <div class="nl-logo-sub">Helper v5.0 · Alt+H</div>
                    </div>
                    <nav class="nl-tabs">
                        ${TABS.map(t=>`<button class="nl-tab${t.id===curTab?' active':''}" data-tab="${t.id}">${t.name}</button>`).join('')}
                    </nav>
                    <div class="nl-sb-foot">
                        <button class="nl-hb" id="nl-hud">🎨 Тема</button>
                        <button class="nl-hb" id="nl-history-btn">🕐 История</button>
                        <button class="nl-hb" id="nl-settings-btn">⚙️ Настройки</button>
                    </div>
                </aside>

                <main class="nl-main-content">
                    <header class="nl-hd">
                        <div class="nl-hd-top">
                            <input type="text" class="nl-sr" placeholder="🔍 Поиск шаблонов (EN→RU)...">
                            <div class="nl-cl" title="Закрыть (Esc)">✕</div>
                        </div>
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
                            <input type="text" id="nl-srv" class="nl-sin" placeholder="Сервер…" value="${esc(SETS.serverName||'')}" title="Название сервера ({server})">
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

        document.body.appendChild(ov);
        renderCards();
        bindMain(ov);
    }

    function closeMain() {
        const ov = document.querySelector('.nl-ov'); if(ov) ov.remove();
        document.body.style.overflow = '';
    }

    function bindMain(ov) {
        ov.querySelector('.nl-cl').onclick = closeMain;
        ov.onclick = e => { if (e.target===ov) closeMain(); };

        ov.querySelectorAll('.nl-tab').forEach(t => {
            t.onclick = () => {
                curTab = t.dataset.tab;
                ov.querySelectorAll('.nl-tab').forEach(x=>x.classList.remove('active'));
                t.classList.add('active');
                ov.querySelector('.nl-sr').value='';
                renderCards();
            };
        });

        ov.querySelector('.nl-sr').oninput = e => renderCards(e.target.value);
        ov.querySelector('#nl-srv').oninput = e => { SETS.serverName=e.target.value.trim(); saveSettings(); };
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
        ov.querySelector('#nl-cr').onclick = createDialog;
        ov.querySelector('#nl-mg').onclick = () => {
            manageMode = !manageMode;
            const b = ov.querySelector('#nl-mg');
            b.textContent = manageMode?'✓ Готово':'✎ Редактировать';
            b.className = `nl-btn ${manageMode?'nl-bs':'nl-bd'}`;
            renderCards();
        };

        ov.querySelector('#nl-exp').onclick = () => {
            const blob = new Blob([JSON.stringify({version:STORAGE_VERSION,data:TPLS},null,2)],{type:'application/json'});
            const url  = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'),{href:url,download:`NL_Backup_${fmtDate(Date.now()).replace(/\./g,'-')}.json`});
            a.click(); URL.revokeObjectURL(url);
        };
        ov.querySelector('#nl-imp').onclick = () => ov.querySelector('#nl-file').click();
        ov.querySelector('#nl-file').onchange = e => {
            const file=e.target.files[0]; if(!file) return;
            const r=new FileReader();
            r.onload = ev => {
                try {
                    const p=JSON.parse(ev.target.result);
                    if(!p.data){ alert('❌ Неверный формат.'); return; }
                    const cnt=Object.values(p.data).reduce((s,a)=>s+a.length,0);
                    if(!confirm(`Импортировать ${cnt} шаблонов? Текущие данные будут заменены.`)) return;
                    TPLS=p.data; saveTemplates(); alert('✅ Импортировано!'); renderCards();
                } catch { alert('❌ Ошибка чтения JSON.'); }
            };
            r.readAsText(file);
        };
    }

    // ═══════════════════════════════════════════════════════════════
    //  РЕНДЕР КАРТОЧЕК
    // ═══════════════════════════════════════════════════════════════
    function renderCards(filter='') {
        const grid = document.querySelector('.nl-grid'); if(!grid) return;
        grid.innerHTML = '';
        let items = [];

        if (curTab==='recent') {
            const seen=new Set();
            for (const h of HIST) {
                if (seen.has(h.id)) continue; seen.add(h.id);
                let found=null;
                for (const arr of Object.values(TPLS)) { found=arr.find(t=>t.id===h.id); if(found) break; }
                if (found) items.push(found);
            }
        } else if (filter) {
            Object.values(TPLS).forEach(arr=>items.push(...arr));
            items=items.filter(t=>fuzz(filter,t.title)||fuzz(filter,t.content));
        } else {
            items=[...(TPLS[curTab]||[])];
        }

        items.sort((a,b)=>{
            if(a.isPinned!==b.isPinned) return b.isPinned?1:-1;
            if(a.isNew!==b.isNew)       return b.isNew?1:-1;
            if(curTab==='recent') return (b.uses||0)-(a.uses||0);
            return 0;
        });

        if (!items.length) {
            grid.innerHTML=`<div class="nl-empty"><div class="nl-empty-icon">${filter?'🔍':curTab==='recent'?'🕐':'📂'}</div>${filter?'Ничего не найдено':curTab==='recent'?'История пуста':'Раздел пуст'}</div>`;
            return;
        }

        items.forEach(tpl=>{
            const preview = tpl.content.replace(/\[.*?\]/g,'').replace(/<.*?>/g,'').substring(0,90);
            const full    = tpl.content.replace(/\[.*?\]/g,'').replace(/<.*?>/g,'');
            const pc = PREFIX_COLORS[tpl.prefix]||'#666';
            const pn = PREFIX_NAMES[tpl.prefix] ||'Без префикса';

            const c = document.createElement('div');
            c.className = `nl-card${tpl.isPinned?' pinned':''}${manageMode?' em':''}`;
            const titleDisplay = tpl.title.length > 35 ? tpl.title.substring(0, 35) + '…' : tpl.title;
            c.innerHTML = `
                ${tpl.isPinned ? '<div class="nl-pin-star">★</div>' : ''}
                <h3 title="${esc(tpl.title)}">${esc(titleDisplay)}${tpl.isNew?'<span class="nl-new">NEW</span>':''}</h3>
                <div class="nl-card-preview">${esc(preview)}…</div>
                <span class="nl-badge" style="background:${pc}12;color:${pc};border:1px solid ${pc}30">${pn}</span>
                ${tpl.uses?`<span class="nl-uses">×${tpl.uses}</span>`:''}
                <div class="nl-tooltip">${esc(full)}</div>
                <div class="nl-mo">
                    <button class="nl-ib" data-a="ed"  title="Редактировать">✎</button>
                    <button class="nl-ib" data-a="dup" title="Дублировать">⧉</button>
                    <button class="nl-ib" data-a="pin" title="${tpl.isPinned?'Открепить':'Закрепить'}">${tpl.isPinned?'★':'☆'}</button>
                    <button class="nl-ib del" data-a="del">🗑</button>
                </div>`;

            if (!manageMode) {
                c.onclick = () => insertTemplate(tpl);
            } else {
                c.querySelector('[data-a="ed"]').onclick  = e=>{e.stopPropagation();editDialog(tpl);};
                c.querySelector('[data-a="dup"]').onclick = e=>{
                    e.stopPropagation();
                    const cl={...deepClone(tpl),id:'u'+Date.now(),title:tpl.title+' (копия)',isNew:true,uses:0};
                    (TPLS[curTab]||TPLS.custom).push(cl); saveTemplates(); renderCards();
                };
                c.querySelector('[data-a="pin"]').onclick = e=>{e.stopPropagation();tpl.isPinned=!tpl.isPinned;saveTemplates();renderCards();};
                c.querySelector('[data-a="del"]').onclick = e=>{
                    e.stopPropagation();
                    if(!confirm(`Удалить "${tpl.title}"?`)) return;
                    for(const k of Object.keys(TPLS)) TPLS[k]=TPLS[k].filter(t=>t.id!==tpl.id);
                    saveTemplates(); renderCards();
                };
            }
            grid.appendChild(c);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    //  ДИАЛОГ СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
    // ═══════════════════════════════════════════════════════════════
    function createDialog() {
        if (!TPLS.custom) TPLS.custom=[];
        if (TPLS.custom.length>=MAX_CUSTOM){ alert(`Лимит: ${MAX_CUSTOM} кастомных шаблонов.`); return; }
        showEditDialog('Создать шаблон',{title:'',prefix:0,tags:'',content:''},v=>{
            if(!v.title||!v.content){ alert('Название и текст обязательны.'); return; }
            TPLS.custom.push({id:'u'+Date.now(),title:v.title,prefix:parseInt(v.prefix),tags:v.tags||'',content:v.content,isPinned:false,isNew:true,uses:0});
            curTab='custom';
            document.querySelectorAll('.nl-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='custom'));
            saveTemplates(); renderCards();
        });
    }
    function editDialog(tpl) {
        showEditDialog('Редактировать шаблон',tpl,v=>{ tpl.title=v.title; tpl.prefix=parseInt(v.prefix); tpl.tags=v.tags||''; tpl.content=v.content; saveTemplates(); renderCards(); });
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
                    <button class="nl-btn nl-bd" id="dd-x">Отмена</button>
                    <button class="nl-btn nl-bp" id="dd-s">Сохранить</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#dd-x').onclick=()=>ov.remove();
        ov.querySelector('#dd-s').onclick=()=>{
            cb({title:ov.querySelector('#dd-t').value.trim(),prefix:ov.querySelector('#dd-p').value,tags:ov.querySelector('#dd-tags').value.trim(),content:ov.querySelector('#dd-c').value.trim()});
            ov.remove();
        };
        ov.querySelector('#dd-t').focus();
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // ═══════════════════════════════════════════════════════════════
    //  ВЫБОР ТЕМЫ
    // ═══════════════════════════════════════════════════════════════
    function openThemePicker() {
        const pk=document.createElement('div'); pk.className='nl-hov';
        pk.innerHTML=`
            <div class="nl-hbox">
                <div class="nl-htitle">🎨 Тема оформления</div>
                <div class="nl-hgrid">
                    ${Object.entries(THEMES).map(([k,hd])=>`
                        <div class="nl-hi ${curTheme===k?'active':''}" data-k="${k}" style="--th-a:${hd.accent}">
                            <div class="nl-hs" style="background:${hd.gradient}"></div>
                            <span class="nl-hn">${hd.name}</span>
                        </div>`).join('')}
                </div>
                <button class="nl-hclose">Закрыть</button>
            </div>`;
        document.body.appendChild(pk);
        pk.querySelectorAll('.nl-hi').forEach(i=>{
            i.onclick=()=>{ curTheme=i.dataset.k; localStorage.setItem(STORAGE.THEME,curTheme); pk.remove(); applyCSS(); closeMain(); setTimeout(openMain,50); };
        });
        pk.querySelector('.nl-hclose').onclick=()=>pk.remove();
    }

    // ═══════════════════════════════════════════════════════════════
    //  ИСТОРИЯ
    // ═══════════════════════════════════════════════════════════════
    function openHistory() {
        const ov=document.createElement('div'); ov.className='nl-dov';
        const rows = HIST.length===0
            ? '<div class="nl-empty"><div class="nl-empty-icon">🕐</div>История пуста</div>'
            : HIST.map(h=>{
                const pc=PREFIX_COLORS[h.prefix]||'#666';
                return `<div class="nl-hist-item" data-url="${esc(h.threadUrl)}">
                    <div class="nl-hist-dot" style="background:${pc}"></div>
                    <div class="nl-hist-body">
                        <div class="nl-hist-tpl">${esc(h.title)}</div>
                        <div class="nl-hist-thread">${esc(h.threadTitle)}</div>
                    </div>
                    <div class="nl-hist-time">${timeAgo(h.usedAt)}</div>
                </div>`;
            }).join('');
        ov.innerHTML=`
            <div class="nl-dbox" style="width:520px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="nl-dt">🕐 История использования</div>
                    ${HIST.length?'<button class="nl-btn nl-bd nl-btn-sm" id="hc">Очистить</button>':''}
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">${rows}</div>
                <div class="nl-da"><button class="nl-btn nl-bp" id="hx" style="width:100%">Закрыть</button></div>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#hx').onclick=()=>ov.remove();
        const hcBtn=ov.querySelector('#hc');
        if(hcBtn) hcBtn.onclick=()=>{ if(!confirm('Очистить историю?')) return; HIST.length=0; saveHistory(); ov.remove(); };
        ov.querySelectorAll('.nl-hist-item').forEach(el=>{ el.onclick=()=>{ if(el.dataset.url) window.open(el.dataset.url,'_blank'); }; });
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // ═══════════════════════════════════════════════════════════════
    //  СТАТИСТИКА
    // ═══════════════════════════════════════════════════════════════
    function openStats() {
        const hd=theme();
        const ov=document.createElement('div'); ov.className='nl-dov';
        const byTab=Object.entries(STATS.byTab||{}).sort(([,a],[,b])=>b-a).slice(0,6);
        const maxT=byTab[0]?.[1]||1;
        const allTpls=Object.values(TPLS).flat().sort((a,b)=>(b.uses||0)-(a.uses||0)).slice(0,5);
        const days7=[]; for(let i=6;i>=0;i--){ const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10);days7.push({label:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}),count:STATS.byDay?.[k]||0}); }
        const max7=Math.max(...days7.map(d=>d.count),1);

        ov.innerHTML=`
            <div class="nl-dbox" style="width:500px">
                <div class="nl-dt" style="text-align:center">📊 Статистика</div>
                <div class="nl-stat-row"><span class="nl-stat-title">Всего использований</span><span class="nl-stat-val ok">${STATS.total||0}</span></div>
                <div class="nl-stat-section">📅 Активность за 7 дней</div>
                <div style="display:flex;gap:7px;align-items:flex-end;height:70px;padding:4px 0">
                    ${days7.map(d=>`
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%">
                            <div style="flex:1;display:flex;align-items:flex-end;width:100%">
                                <div style="width:100%;height:${Math.max(4,Math.round(d.count/max7*100))}%;background:${hd.accent};opacity:.85"></div>
                            </div>
                            <div style="font-size:10px;color:${hd.text2};font-family:'Share Tech Mono',monospace">${d.label}</div>
                            ${d.count?`<div style="font-size:10px;color:${hd.accent};font-weight:700;font-family:'Share Tech Mono',monospace">${d.count}</div>`:''}
                        </div>`).join('')}
                </div>
                <div class="nl-stat-section">📂 По разделам</div>
                <div class="nl-stat-grid">
                    ${byTab.map(([id,cnt])=>{
                        const tab=TABS.find(t=>t.id===id);
                        return `<div class="nl-bar-wrap">
                            <div style="width:130px;font-size:12px;color:${hd.text2};font-family:'Rajdhani',sans-serif">${tab?.name||id}</div>
                            <div class="nl-bar"><div class="nl-bar-fill" style="width:${Math.round(cnt/maxT*100)}%;background:${hd.accent}"></div></div>
                            <div style="font-size:12px;color:${hd.text};font-weight:600;width:26px;text-align:right;font-family:'Share Tech Mono',monospace">${cnt}</div>
                        </div>`;
                    }).join('')||`<div style="font-size:12px;color:${hd.text2}">Нет данных</div>`}
                </div>
                <div class="nl-stat-section">🏆 Топ шаблонов</div>
                <div class="nl-stat-grid">
                    ${allTpls.map((t,i)=>`<div class="nl-stat-row"><span class="nl-stat-title">${i+1}. ${esc(t.title)}</span><span class="nl-stat-val" style="color:${hd.accent}">×${t.uses||0}</span></div>`).join('')||`<div class="nl-empty" style="padding:10px;font-size:13px">Нет данных</div>`}
                </div>
                <div class="nl-da" style="justify-content:space-between">
                    <button class="nl-btn nl-bd nl-btn-sm" id="sr">Сбросить</button>
                    <button class="nl-btn nl-bp" id="sx">Закрыть</button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#sx').onclick=()=>ov.remove();
        ov.querySelector('#sr').onclick=()=>{
            if(!confirm('Сбросить статистику?')) return;
            STATS={total:0,byPrefix:{},byTab:{},byDay:{}};
            Object.values(TPLS).flat().forEach(t=>t.uses=0);
            saveStats(); saveTemplates(); ov.remove();
        };
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // ═══════════════════════════════════════════════════════════════
    //  АНАЛИЗАТОР БИОГРАФИИ
    // ═══════════════════════════════════════════════════════════════
    function openBioAnalyzer() {
        const postEl = document.querySelector(SEL.firstPost);
        const autoText = postEl ? postEl.textContent.trim() : '';
        showBioWindow(autoText);
    }

    function analyzeBio(text) {
        const words = text.split(/[\s\n]+/).filter(w=>w.length>0);
        const terms = SETS.mgTerms || DEFAULT_MG_TERMS;
        const foundMg = [];
        terms.forEach(term => {
            const re = new RegExp('(?:^|[\\s,.:;!?"\'\\/\\\\(\\)\\[\\]])(' + term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')(?=[\\s,.:;!?"\'\\/\\\\(\\)\\[\\]]|$)','gi');
            if (re.test(text)) foundMg.push(term);
        });
        const badCommas    = (text.match(/,[^\s\n0-9)]/g)||[]).length;
        const badSentences = (text.match(/[.!?]\s+[а-яёa-z]/g)||[]).length;
        const minWords     = SETS.minBioWords || 100;
        const wordsOk      = words.length >= minWords;
        const mgOk         = foundMg.length === 0;
        const puncIssues   = badCommas + badSentences;

        let verdict, vColor;
        if (!mgOk) { verdict='❌ Отказать — найдены MG-термины'; vColor='#ff4757'; }
        else if (!wordsOk) { verdict='⚠️ На доработку — текст слишком короткий'; vColor='#ffa502'; }
        else if (puncIssues > 5) { verdict='⚠️ На доработку — много пунктуационных ошибок'; vColor='#ffa502'; }
        else { verdict='✅ Можно одобрить'; vColor='#2ed573'; }

        return { words: words.length, minWords, mg: [...new Set(foundMg)], commas: badCommas, sentences: badSentences, verdict, vColor };
    }

    function showBioWindow(initialText) {
        if (document.querySelector('.nl-bio-ov')) return;
        const hd = theme();
        const ov = document.createElement('div');
        ov.className = 'nl-dov nl-bio-ov';
        ov.innerHTML = `
            <div class="nl-dbox" style="width:620px">
                <div class="nl-dt" style="text-align:center">📋 Анализатор РП Биографии</div>
                <div class="nl-dtabs">
                    <button class="nl-dtab active" data-panel="auto">🔍 Со страницы</button>
                    <button class="nl-dtab" data-panel="manual">✏️ Вставить вручную</button>
                </div>
                <div class="nl-dpanel active" id="bio-panel-auto">
                    ${initialText
                        ? `<div style="font-size:12px;color:${hd.text2};background:${hd.bg3};border:1px solid ${hd.border};padding:12px 14px;max-height:130px;overflow-y:auto;line-height:1.55;font-family:'Rajdhani',sans-serif">${esc(initialText.substring(0,600))}${initialText.length>600?'…':''}</div>`
                        : `<div style="text-align:center;padding:20px;color:#ff4757;font-size:13px;font-family:'Rajdhani',sans-serif">❌ Текст первого поста не найден на этой странице.</div>`
                    }
                </div>
                <div class="nl-dpanel" id="bio-panel-manual">
                    <textarea class="nl-ta" id="bio-manual-text" placeholder="Вставьте текст биографии сюда..." rows="8">${esc(initialText)}</textarea>
                </div>
                <div id="bio-result" style="display:none;flex-direction:column;gap:10px"></div>
                <div class="nl-da" style="justify-content:space-between;align-items:center">
                    <div id="bio-analyze-wrap" style="display:flex;gap:8px">
                        <button class="nl-btn nl-bp" id="bio-analyze">🔍 Анализировать</button>
                        <button class="nl-btn nl-bn" id="bio-clear-res" style="display:none">↺ Сброс</button>
                    </div>
                    <button class="nl-btn nl-bn" id="bio-close">Закрыть</button>
                </div>
            </div>`;
        document.body.appendChild(ov);

        let curPanel = 'auto';
        ov.querySelectorAll('.nl-dtab').forEach(tab => {
            tab.onclick = () => {
                curPanel = tab.dataset.panel;
                ov.querySelectorAll('.nl-dtab').forEach(t=>t.classList.remove('active'));
                ov.querySelectorAll('.nl-dpanel').forEach(p=>p.classList.remove('active'));
                tab.classList.add('active');
                ov.querySelector(`#bio-panel-${curPanel}`).classList.add('active');
                ov.querySelector('#bio-result').style.display='none';
                ov.querySelector('#bio-result').innerHTML='';
                ov.querySelector('#bio-clear-res').style.display='none';
            };
        });

        ov.querySelector('#bio-analyze').onclick = () => {
            const text = curPanel==='auto' ? initialText : ov.querySelector('#bio-manual-text').value.trim();
            if (!text) { alert('Нет текста для анализа.'); return; }
            const res = analyzeBio(text);
            const resEl = ov.querySelector('#bio-result');
            resEl.innerHTML = `
                <div class="nl-verdict" style="background:${res.vColor}18;border:1px solid ${res.vColor}44;color:${res.vColor}">${esc(res.verdict)}</div>
                <div class="nl-stat-grid">
                    <div class="nl-stat-row">
                        <span class="nl-stat-title">Количество слов</span>
                        <span class="nl-stat-val ${res.words>=res.minWords?'ok':'warn'}">${res.words} / ${res.minWords}</span>
                    </div>
                    <div class="nl-stat-row" style="flex-direction:column;align-items:flex-start">
                        <div style="display:flex;justify-content:space-between;width:100%">
                            <span class="nl-stat-title">MG-термины (метагейминг)</span>
                            <span class="nl-stat-val ${res.mg.length===0?'ok':'err'}">${res.mg.length}</span>
                        </div>
                        <div class="nl-stat-details">${res.mg.length>0?'Найдены: <b>'+esc(res.mg.join(', '))+'</b>':'✓ Нарушений не обнаружено'}</div>
                    </div>
                    <div class="nl-stat-row" style="flex-direction:column;align-items:flex-start">
                        <div style="display:flex;justify-content:space-between;width:100%">
                            <span class="nl-stat-title">Пунктуация</span>
                            <span class="nl-stat-val ${(res.commas+res.sentences)===0?'ok':'warn'}">${res.commas+res.sentences} ошибок</span>
                        </div>
                        <div class="nl-stat-details">Запятых без пробела: <b>${res.commas}</b> &nbsp;│&nbsp; Предложений с маленькой буквы: <b>${res.sentences}</b></div>
                    </div>
                </div>`;
            resEl.style.display='flex';
            ov.querySelector('#bio-clear-res').style.display='inline-block';
        };

        ov.querySelector('#bio-clear-res').onclick = () => {
            ov.querySelector('#bio-result').style.display='none';
            ov.querySelector('#bio-result').innerHTML='';
            ov.querySelector('#bio-clear-res').style.display='none';
        };
        ov.querySelector('#bio-close').onclick = () => ov.remove();
        ov.onclick = e => { if (e.target===ov) ov.remove(); };
    }

    // ═══════════════════════════════════════════════════════════════
    //  НАСТРОЙКИ
    // ═══════════════════════════════════════════════════════════════
    function openSettings() {
        const ov=document.createElement('div'); ov.className='nl-dov';
        const renderTags=()=>(SETS.mgTerms||[]).map((w,i)=>`<div class="nl-tag">${esc(w)}<button data-i="${i}">×</button></div>`).join('');
        ov.innerHTML=`
            <div class="nl-dbox" style="width:520px">
                <div class="nl-dt">⚙️ Настройки</div>
                <div class="nl-stat-section">🎮 Общие</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div class="nl-set-row">
                        <div><div class="nl-set-label">Горячие клавиши</div><div class="nl-set-desc">Alt+H — окно, Alt+B — биография, Alt+1-9 — вкладки, Esc — закрыть</div></div>
                        <label class="nl-cl2"><input type="checkbox" id="s-hk" ${SETS.hotkeys?'checked':''}></label>
                    </div>
                </div>
                <div class="nl-stat-section">📋 Анализатор биографий</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div class="nl-set-row">
                        <div class="nl-set-label">Мин. слов в биографии</div>
                        <input type="number" class="nl-sin" id="s-min" value="${SETS.minBioWords||200}" min="10" max="2000" style="width:80px">
                    </div>
                    <div class="nl-f">
                        <label>MG-термины (стоп-слова)</label>
                        <div style="display:flex;gap:7px"><input class="nl-in" id="s-mg-new" placeholder="Добавить термин…" style="flex:1"><button class="nl-btn nl-bp nl-btn-sm" id="s-mg-add">+</button></div>
                        <div class="nl-tag-list" id="s-mg-list">${renderTags()}</div>
                    </div>
                </div>
                <div class="nl-da" style="justify-content:space-between">
                    <button class="nl-btn nl-bd nl-btn-sm" id="s-reset">Сброс шаблонов</button>
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bn" id="s-cancel">Отмена</button>
                        <button class="nl-btn nl-bp" id="s-save">Сохранить</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(ov);
        const origSets = JSON.stringify(SETS);
        ov.querySelector('#s-hk').onchange=e=>SETS.hotkeys=e.target.checked;
        ov.querySelector('#s-min').oninput=e=>SETS.minBioWords=parseInt(e.target.value)||100;
        const list=ov.querySelector('#s-mg-list');
        const bindTags=()=>{
            list.querySelectorAll('button[data-i]').forEach(btn=>{
                btn.onclick=()=>{ SETS.mgTerms.splice(parseInt(btn.dataset.i),1); list.innerHTML=renderTags(); bindTags(); };
            });
        };
        bindTags();
        const addMg=()=>{
            const inp=ov.querySelector('#s-mg-new'); const val=inp.value.trim().toLowerCase();
            if(!val||SETS.mgTerms.includes(val)){inp.value='';return;}
            SETS.mgTerms.push(val); list.innerHTML=renderTags(); bindTags(); inp.value='';
        };
        ov.querySelector('#s-mg-add').onclick=addMg;
        ov.querySelector('#s-mg-new').onkeydown=e=>{if(e.key==='Enter')addMg();};
        ov.querySelector('#s-save').onclick=()=>{ saveSettings(); ov.remove(); };
        ov.querySelector('#s-cancel').onclick=()=>{ SETS=JSON.parse(origSets); ov.remove(); };
        ov.querySelector('#s-reset').onclick=()=>{
            if(!confirm('Сбросить ВСЕ шаблоны к заводским? Это необратимо.')) return;
            TPLS=deepClone(DEFAULT_TEMPLATES); saveTemplates(); alert('✅ Шаблоны сброшены.'); ov.remove(); renderCards();
        };
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // ═══════════════════════════════════════════════════════════════
    //  КНОПКИ НА ФОРУМЕ
    // ═══════════════════════════════════════════════════════════════
    function showNotification(message, type='success') {
        const n=document.createElement('div'); n.className='nl-notif';
        n.style.cssText=`background:${type==='error'?'rgba(220,60,60,0.92)':theme().accent};color:${type==='error'?'#fff':'#000'};border:1px solid ${type==='error'?'#cc3333':theme().accent};`;
        n.textContent=message; document.body.appendChild(n);
        setTimeout(()=>n.remove(),2200);
    }

    function injectButtons() {
        if (document.getElementById('nl-btn')) return;
        if (!document.body) { setTimeout(injectButtons,100); return; }

        const hd = theme();
        const mkBtn = (id,txt,fn) => {
            const b=document.createElement('button');
            b.id=id; b.type='button'; b.className='nl-btn-main';
            b.textContent=txt;
            b.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();fn();});
            return b;
        };

        const replyBtn = findReplyBtn();
        if (replyBtn && replyBtn.parentNode) {
            const wrap=document.createElement('div');
            wrap.id='nl-inline-wrap';
            wrap.style.cssText='display:inline-flex;align-items:center;vertical-align:middle;gap:6px;margin:0 0 0 8px;';
            wrap.appendChild(mkBtn('nl-btn',       '⬡ NL HELPER',   openMain));
            wrap.appendChild(mkBtn('nl-bio-btn',   '📋 АНАЛИЗ БИО', openBioAnalyzer));
            wrap.appendChild(mkBtn('nl-stats-btn', '📊 СТАТИСТИКА',  openStats));
            replyBtn.insertAdjacentElement('afterend', wrap);
        } else {
            const panel=document.createElement('div');
            panel.id='nl-float-panel';
            panel.setAttribute('style','position:fixed;bottom:20px;right:20px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:auto;');
            const bStyle=[
                `background:${hd.bg2}`,`color:${hd.accent}`,
                `border:1px solid ${hd.accent}`,
                'clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))',
                'padding:9px 18px','font-family:Rajdhani,sans-serif',
                'font-size:11px','font-weight:700','letter-spacing:1px',
                'text-transform:uppercase','cursor:pointer','width:165px',
                'text-align:center',`box-shadow:0 0 12px ${hd.accent}40`,
                'transition:all .2s','display:block',
            ].join(';');
            [
                ['nl-btn','⬡ NL HELPER',openMain],
                ['nl-bio-btn','📋 АНАЛИЗ БИО',openBioAnalyzer],
                ['nl-stats-btn','📊 СТАТИСТИКА',openStats],
            ].forEach(([id,txt,fn])=>{
                const b=mkBtn(id,txt,fn);
                b.removeAttribute('class');
                b.setAttribute('style',bStyle);
                b.addEventListener('mouseenter',()=>{b.style.background=hd.accent;b.style.color='#000';});
                b.addEventListener('mouseleave',()=>{b.style.background=hd.bg2;b.style.color=hd.accent;});
                panel.appendChild(b);
            });
            document.body.appendChild(panel);
        }
    }

    function tryInlineInsert() {
        if (document.getElementById('nl-btn')) return;
        const replyBtn=findReplyBtn();
        if (!replyBtn||!replyBtn.parentNode) return;
        const floatPanel=document.getElementById('nl-float-panel');
        if (floatPanel) floatPanel.remove();
        injectButtons();
    }

    // ═══════════════════════════════════════════════════════════════
    //  ИНИЦИАЛИЗАЦИЯ
    // ═══════════════════════════════════════════════════════════════
    function init() {
        applyCSS();
        initHotkeys();
        checkFlood();
        injectButtons();

        const ob=new MutationObserver(()=>tryInlineInsert());
        ob.observe(document.body,{childList:true,subtree:true});
        setTimeout(()=>ob.disconnect(),15000);

        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand('NL Helper: Открыть',          openMain);
            GM_registerMenuCommand('NL Helper: Анализ биографии', openBioAnalyzer);
            GM_registerMenuCommand('NL Helper: Статистика',       openStats);
            GM_registerMenuCommand('NL Helper: Сброс шаблонов', ()=>{
                if (confirm('Сбросить шаблоны?')) { TPLS=deepClone(DEFAULT_TEMPLATES); saveTemplates(); location.reload(); }
            });
        }

        console.log('%c[NL Helper 5.0] ✅ Инициализирован', 'color:#ff6b2b;font-weight:bold');
    }

    if (document.readyState==='loading') {
        document.addEventListener('DOMContentLoaded',init);
    } else {
        init();
    }

})();