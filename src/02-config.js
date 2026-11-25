    // ПРЕФИКСЫ
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

    // ВКЛАДКИ
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
    const TPL_TABS = TABS.map(t => t.id).filter(id => id !== 'recent');

    // ТЕМЫ
    const THEMES = {
        amber:  { name:'🟠 NL Amber',   accent:'#f0900a', bg:'#0f0c07', bg2:'#161009', bg3:'#1e1710', border:'#30220a', text:'#f2e8d0', text2:'#7a6440', gradient:'linear-gradient(135deg,#f0900a,#c45f00)' },
        purple: { name:'🟣 NL Purple',  accent:'#a855f7', bg:'#0c0a12', bg2:'#120f1a', bg3:'#181426', border:'#28203a', text:'#ede8f8', text2:'#6e5f8a', gradient:'linear-gradient(135deg,#a855f7,#7c3aed)' },
        cyan:   { name:'🔵 NL Cyan',    accent:'#06b6d4', bg:'#040e12', bg2:'#071318', bg3:'#0b1c22', border:'#0d2e38', text:'#d0f0f8', text2:'#346070', gradient:'linear-gradient(135deg,#06b6d4,#0284c7)' },
        red:    { name:'🔴 NL Crimson', accent:'#ef4444', bg:'#0f0606', bg2:'#160909', bg3:'#1e0e0e', border:'#320f0f', text:'#f8e8e8', text2:'#7a4040', gradient:'linear-gradient(135deg,#ef4444,#b91c1c)' },
        green:  { name:'🟢 NL Matrix',  accent:'#22c55e', bg:'#050f08', bg2:'#08140b', bg3:'#0d1e10', border:'#0f3018', text:'#d0f0da', text2:'#3a7050', gradient:'linear-gradient(135deg,#22c55e,#15803d)' },
        white:  { name:'⚪ NL Arctic',  accent:'#e2e8f0', bg:'#06080c', bg2:'#0c0f14', bg3:'#12161e', border:'#20252e', text:'#f0f4ff', text2:'#606880', gradient:'linear-gradient(135deg,#e2e8f0,#94a3b8)' },
        // Detroit: Become Human — dbh:true включает фирменный декор CyberLife (шрифты Michroma/Jost,
        // LED-индикатор, скобки на карточках, пасхалки); btnText/overlay — переопределения для светлого фона
        detroit:{ name:'🤖 NL CyberLife', accent:'#00a9cc', bg:'#eef2f5', bg2:'#ffffff', bg3:'#e1e9ee', border:'#c3d2db', text:'#132a36', text2:'#68818f', gradient:'linear-gradient(135deg,#29d5e8,#008fb3)', dbh:true, btnText:'#ffffff', overlay:'rgba(238,242,245,.94)' },
        deviant:{ name:'🌃 NL Deviant',   accent:'#35d6ea', bg:'#06121c', bg2:'#0a1a26', bg3:'#102636', border:'#16374a', text:'#d9f2f8', text2:'#4e7a8c', gradient:'linear-gradient(135deg,#35d6ea,#0e7f9e)', dbh:true },
    };

    // СТОП-СЛОВА
    const DEFAULT_MG_TERMS = [
        'лвл','lvl','admin','админ','бан','ban','варн','warn',
        'деморган','нонрп','nonrp','dm','дб','db','зз','zz',
        'тк','tk','ск','sk','увал','мут','кик','hp','хп',
        'гдб','gdb','спавн','spawn','телепорт','teleport',
        'читер','cheat','hack','хак',
    ];

    // требования «Правил составления RP биографии» (форум, тема 13425782)
    const BIO_RULES = {
        minWords: 200,
        maxWords: 600,
        // разделы формы подачи: [название, шаблон поиска]
        sections: [
            ['Имя и фамилия', /имя\s+и\s+фамилия/i],
            ['Пол',           /(^|\n|\s)пол\s*:/i],
            ['Возраст',       /возраст/i],
            ['Национальность',/национальност/i],
            ['Образование',   /образовани/i],
            ['Внешность',     /внешност/i],
            ['Характер',      /характер/i],
            ['Детство',       /детств/i],
            ['Настоящее время', /настоящее\s+время/i],
            ['Итог',          /итог/i],
        ],
        titleRe: /биография\s*\|\s*[A-Za-z]+_[A-Za-z]+/i,
    };

    // ПЛЕЙСХОЛДЕРЫ
    const PH_HELP = [
        ['{nickname}',  'Ник автора темы'],
        ['{mention}',   'Упоминание [USER=id]ник[/USER]'],
        ['{violator}',  'Ник нарушителя из формы жалобы'],
        ['{curator}',   'Ваш ник (кто отвечает)'],
        ['{server}',    'Название сервера'],
        ['{date}',      'Текущая дата'],
        ['{time}',      'Текущее время'],
        ['{greeting}',  'Приветствие по времени суток'],
        ['{thread_id}', 'Номер темы'],
    ];

    // ОФОРМЛЕНИЕ ПОСТА (меняется в настройках; пустая картинка — строка не выводится)
    const DEFAULT_POST = {
        header:     'https://i.postimg.cc/9QhjNYgx/Untitled38-20260604131933.png',
        footer:     'https://i.postimg.cc/jjMvPRJ2/Untitled36-20260604131154.png',
        footerLink: 'https://postimg.cc/gw6vPFsb',
        address:    'уважаемый',
        closing:    'Приятной игры на сервере',
        signature:  'Администрация сервера',
    };

    // СТИЛЬ «DETROIT» («чертоги разума»): баннеры нарисованы в docs/design/generate-dbh2.html
    const DBH_IMG = {
        header:   'https://i.postimg.cc/QdQnbyr6/dbh2-header.png',
        divider:  'https://i.postimg.cc/SQP5N9r1/dbh2-divider.png',
        complete: 'https://i.postimg.cc/W47C2fWk/dbh2-complete.png',
        approved: 'https://i.postimg.cc/Kjjdpr5N/dbh2-approved.png',
        denied:   'https://i.postimg.cc/9M8k9wjc/dbh2-denied.png',
        review:   'https://i.postimg.cc/KzH9jXnR/dbh2-review.png',
        resolved: 'https://i.postimg.cc/s23H04jD/dbh2-resolved.png',
        closed:   'https://i.postimg.cc/4NrrwcH5/dbh2-closed.png',
    };
    // цвета текста в стиле Detroit (как на баннерах)
    const DBH = { text: 'rgb(232,236,238)', dim: 'rgb(154,163,170)', white: 'rgb(245,247,248)', blue: 'rgb(47,143,232)',
        red: 'rgb(229,57,74)', yellow: 'rgb(242,194,48)', gray: 'rgb(141,150,157)' };

