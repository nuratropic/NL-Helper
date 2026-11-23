#!/usr/bin/env node
// Тесты логики NL Helper без браузера: таблицы правил, хранилище, миграция, подбор пунктов, анализ биографии.
// Запуск: npm test  (или node tests/test.js). Зависимостей нет.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'nl_helper.js'), 'utf8');

// минимальное окружение: GM_* поверх объекта, «страница» темы без DOM (init не запускается)
// noGM = true — как в менеджерах без синхронного GM_* API (Userscripts на iPhone): данные в localStorage
function run(store, pathname = '/threads/test-2.01-zhaloba.12345/page-2', noGM = false) {
    const ls = noGM ? store : {};
    const env = {
        console: { log() {}, warn() {}, error() {} },
        ...(noGM ? {} : {
            GM_getValue: k => store[k], GM_setValue: (k, v) => { store[k] = v; }, GM_deleteValue: k => { delete store[k]; },
            GM_registerMenuCommand: () => {},
        }),
        localStorage: { getItem: k => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: k => { delete ls[k]; } },
        document: { readyState: 'loading', addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] },
        window: { location: { hostname: 'forum.blackrussia.online', pathname, href: 'https://forum.blackrussia.online' + pathname } },
    };
    env.globalThis = env;
    const hooked = code.replace(/\n\s*if \(document\.readyState === 'loading'\)[\s\S]*?\n\}\)\(\);\s*$/,
        `\n    globalThis.__T = { get TPLS(){return TPLS;}, RULES, RULE_SETS, RULE_COUNT, saveTemplates, getThreadId,
        combinedRuleBody, scoreRulesByText, analyzeBio, checkForm, extractViolator, bbToHtml, wrapPost, setSets(s){ Object.assign(SETS, s); } };\n})();`);
    if (hooked === code) throw new Error('не найден конец скрипта для тестового хука');
    vm.runInNewContext(hooked, env);
    return env.__T;
}

let failed = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✓ ' : '  ✗ ') + msg); if (!cond) failed++; };
const section = name => console.log('\n' + name);

section('Таблицы правил');
let store = {};
let T = run(store);
const byset = s => Object.values(T.RULES).filter(r => r.set === s).length;
ok(T.RULE_COUNT === 72, `72 основных пункта общих правил (есть ${T.RULE_COUNT})`);
ok(Object.values(T.RULES).filter(r => r.note).length === 3, 'три примечания с отдельным наказанием (2.02, 2.19, 2.32)');
ok(byset('gov') > 0 && byset('crim') > 0 && byset('leader') > 0, `правила гос. (${byset('gov')}), крим. (${byset('crim')}) и лидеров (${byset('leader')})`);
ok(T.RULES['2.01'].a === 'p10_a' && T.RULES['4.15'].d === 'p153_d', 'id шаблонов совпадают с прошлыми версиями (p10_a … p153_d)');
ok(T.RULES['2.04'].penalty.startsWith('Ban 3 дня'), '2.04 — редакция 14.11.2026 (Ban 3 дня)');
ok(T.RULES['2.19п'].num === '2.19' && T.RULES['2.19п'].penalty === 'Ban 3 дня', '2.19 прим. — таран игроков на системной работе');
for (const [id, r] of Object.entries(T.RULES)) {
    if (!r.desc || !r.short || !r.tags || !T.RULE_SETS[r.set]) { ok(false, `неполная запись правила ${id}`); break; }
    if (r.set !== 'leader' && !r.penalty) { ok(false, `нет наказания у ${id}`); break; }
}
ok(true, 'у всех записей есть описание, имя, теги и (кроме лидеров) наказание');

section('Шаблоны и хранилище');
ok(T.getThreadId() === '12345', `id темы из URL со страницей и цифрами в slug: ${T.getThreadId()}`);
ok(T.TPLS.players.length === 16 + 75 * 2, `шаблонов игроков: ${T.TPLS.players.length}`);
ok(!T.TPLS.players.some(t => /гос:|крим:|лид:/.test(t.rule || '')), 'правила организаций не размножают карточки');
T.saveTemplates();
ok(store.nl_tpl_v6.length < 100, `чистое хранилище: ${store.nl_tpl_v6.length} байт`);
const t = T.TPLS.players.find(x => x.id === 'p16_a');
t.uses = 7; t.isPinned = true;
T.TPLS.admins = T.TPLS.admins.filter(x => x.id !== 'a5');
T.TPLS.custom.push({ id: 'u1', title: 'Мой', content: 'текст {nickname}', prefix: 8, tags: '', isPinned: false, isNew: true, uses: 2 });
T.saveTemplates();
const T2 = run(store);
const t2 = T2.TPLS.players.find(x => x.id === 'p16_a');
ok(t2.uses === 7 && t2.isPinned === true, 'счётчик и закрепление пережили перезагрузку');
ok(t2.content.includes('существенные помехи'), 'текст пункта всегда из текущей редакции');
ok(!T2.TPLS.admins.some(x => x.id === 'a5'), 'удалённый шаблон остаётся удалённым');
ok(T2.TPLS.custom.length === 1 && T2.TPLS.custom[0].title === 'Мой', 'свой шаблон сохранён');
ok(store.nl_tpl_v6.length < 400, `хранилище после правок: ${store.nl_tpl_v6.length} байт`);

section('Миграция из формата 6.2 (v5)');
const v5 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'storage-v5.json'), 'utf8'));
const storeM = { nl_tpl_v5: JSON.stringify(v5) };
const TM = run(storeM);
const m204 = TM.TPLS.players.find(x => x.id === 'p16_a');
ok(m204.uses === 11, 'счётчик 2.04 перенесён');
ok(m204.content.includes('Ban 3 дня') && !m204.content.includes('Ban 10 дней'), 'устаревший текст 2.04 заменён актуальным');
ok(TM.TPLS.players.find(x => x.id === 'p3').content === 'МОЯ ПРАВКА p3', 'правка обычного шаблона сохранена');
const rb2 = TM.TPLS.rp_bio.find(x => x.id === 'rb2');
ok(rb2.uses === 3 && rb2.content.includes('24 часа'), 'rb2: счётчик перенесён, текст новый');
ok(TM.TPLS.custom.some(x => x.title === 'Кастом 6.2' && x.uses === 5), 'свой шаблон перенесён');
ok(storeM.nl_tpl_v5 === JSON.stringify(v5), 'старый ключ оставлен как резервная копия');

section('Посты и подбор пунктов');
const body = T2.combinedRuleBody(true, ['2.19п', '2.20']);
ok(body.includes('2.19.') && body.includes('Примечание: Запрещён DM') && body.includes('следующим пунктам общих правил серверов'), 'сборный пост с примечанием');
const lead = T2.combinedRuleBody(true, ['лид:3.21']);
ok(lead.includes('Лидер понесёт наказание') && lead.includes('[SPOILER="Правила и обязанности лидера"]'), 'пост по правилам лидера');
const top = T2.scoreRulesByText('он таранил дальнобойщика на фуре').slice(0, 3).map(s => s.rule);
ok(top.includes('2.19п'), `таран дальнобойщика → 2.19 прим. (топ-3: ${top.join(', ')})`);
const top2 = T2.scoreRulesByText('игрок стрелял в меня без причины, дм', ['general', 'gov', 'crim']).slice(0, 2).map(s => s.rule);
ok(top2[0] === '2.19', `DM → 2.19 первым даже с правилами организаций (топ-2: ${top2.join(', ')})`);
const topL = T2.scoreRulesByText('лидер уволил меня без причины', ['leader']).slice(0, 1).map(s => s.rule);
ok(topL[0] === 'лид:3.21', `увольнение → правило лидера 3.21 (${topL[0]})`);

section('Форма жалобы и плейсхолдеры');
const complaint = '1. Ваш Nick_Name: Ivan_Petrov\n2. Nick_Name игрока: Bad_Guy\n3. Суть жалобы: DM\n4. Доказательство: ссылка';
ok(T2.checkForm('players', complaint).missing.length === 0, 'полная форма жалобы на игрока');
ok(T2.checkForm('admins', complaint).missing.includes('Nick_Name администратора'), 'для жалобы на администратора не хватает полей');
ok(T2.extractViolator(complaint) === 'Bad_Guy', 'ник нарушителя из формы');

section('Предпросмотр и оформление');
const html = T2.bbToHtml('[B]x[/B] [COLOR=red]y[/COLOR] <script>alert(1)</script> [IMG]javascript:alert(1)[/IMG] [IMG]https://i.postimg.cc/a.png[/IMG]');
ok(html.includes('<b>x</b>') && !html.includes('<script>') && !html.includes('javascript:') && html.includes('<img src="https://i.postimg.cc/a.png"'), 'BB → HTML: разметка есть, скрипты и javascript: отброшены');
T2.setSets({ post: { header: '', footer: '', footerLink: '', address: 'уважаемый', closing: '', signature: '' } });
const bare = T2.wrapPost('Ник', 'ASTANA', 'ТЕЛО');
ok(!bare.includes('[IMG]') && !bare.includes('С уважением') && bare.includes('ТЕЛО'), 'пустые поля оформления не попадают в пост');

section('Анализ биографии');
const bioText = 'Имя и фамилия: A\nПол: м\nВозраст: 20\nНациональность: x\nОбразование: x\nВнешность: x\nХарактер: x\nДетство: ' + 'слово '.repeat(220) + '\nНастоящее время: x\nИтог: x';
const bio = T2.analyzeBio(bioText, 'Биография | Ivan_Petrov');
ok(bio.tplId === 'rb1' && bio.missing.length === 0 && bio.titleOk === true, `корректная биография — «можно одобрить» (${bio.verdict})`);
ok(T2.analyzeBio('Пол: м. у него лвл', '').tplId === 'rb3', 'MG-термин → на доработку');

section('Устойчивость');
let T3;
try { T3 = run({ nl_tpl_v6: '{not json', nl_set_v5: '[[[', nl_stats_v5: 'null', nl_hist_v5: '{"a":1}' }); } catch (e) { /* упало */ }
ok(T3 && T3.TPLS.players.length > 100, 'повреждённое хранилище не ломает запуск');

section('Без GM_* (Userscripts на iPhone): данные в localStorage');
const lsStore = {};
let T4;
try { T4 = run(lsStore, undefined, true); } catch (e) { console.log('    ' + e.message); }
ok(!!T4, 'скрипт запускается без GM_getValue/GM_setValue');
if (T4) {
    T4.TPLS.players.find(x => x.id === 'p3').uses = 4;
    T4.saveTemplates();
    ok(typeof lsStore.nl_tpl_v6 === 'string', 'шаблоны сохраняются в localStorage');
    const T5 = run(lsStore, undefined, true);
    ok(T5.TPLS.players.find(x => x.id === 'p3').uses === 4, 'и читаются после перезагрузки');
}

console.log(failed ? `\n✗ Провалено: ${failed}` : '\n✓ Все тесты пройдены');
process.exit(failed ? 1 : 0);
