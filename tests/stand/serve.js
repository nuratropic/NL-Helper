// Локальный стенд для ручной проверки: имитация страниц темы XenForo (жалоба, жалоба на лидера, биография)
// и разделов с правилами + сам скрипт с GM-шимами. Запуск: npm run stand → http://127.0.0.1:8765/threads/test.12345/
// Адреса: …/threads/complaint.1/, …/threads/leader.2/, …/threads/bio.3/ — по слову в адресе выбирается страница.
const http = require('http');
const fs = require('fs');
const file = process.argv[2] || require('path').resolve(__dirname, '../../nl_helper.js');

const pages = {
    complaint: {
        title: 'Ivan_Petrov | DM и таран', section: 'Жалобы на игроков', ageH: 40,
        body: `1. Ваш Nick_Name: Ivan_Petrov<br>2. Nick_Name игрока: Bad_Guy<br>3. Суть жалобы: игрок таранил меня на фуре, когда я работал дальнобойщиком, потом стрелял без причины<br>4. Доказательство: <a href="https://youtu.be/xyz">видео</a> и <a href="https://vk.com/video123">запись во вк</a>`,
    },
    leader: {
        title: 'Lead_Er | Электронные заявления не проверяются', section: 'Жалобы на лидеров', ageH: 100,
        body: `1. Ваш Nick_Name: Ivan_Petrov<br>3. Суть жалобы: лидер не проверяет раздел и уволил меня без причины<br>4. Доказательство: <a href="https://imgur.com/a/1">скрин</a>`,
    },
    bio: {
        title: 'Биография | Ivan_Petrov', section: 'РП биографии', ageH: 5,
        body: `<div class="bbCodeSpoiler"><button class="bbCodeSpoiler-button">Нажмите для раскрытия...</button><div class="bbCodeSpoiler-content" style="display:none">Имя и фамилия персонажа: Ivan Petrov<br>Пол: Мужской<br>Возраст: 25 лет<br>Национальность: русский<br>Образование: колледж<br>Описание внешности: высокий,худой. у него шрам на щеке<br>Характер: спокойный<br>Детство: ` + 'родился в небольшом городе и рос в обычной семье '.repeat(25) + `<br>Настоящее время: работает в автосервисе, у него лвл высокий<br>Итог: стал взрослым</div></div>`,
    },
};

function crumbs(section) {
    return `<ul class="p-breadcrumbs"><li><a href="/">Главная</a></li><li><a href="/forums/">Форумы</a></li><li><a href="/categories/x.6/">Игровые сервера</a></li>
<li><a href="/forums/x.4022/">Сервер №91 | ASTANA</a></li><li><a href="/forums/x.4038/">Жалобы</a></li>${section ? `<li><a href="/forums/x.4041/">${section}</a></li>` : ''}</ul>`;
}

function page(kind) {
    const p = pages[kind];
    const start = Math.floor(Date.now() / 1000) - p.ageH * 3600;
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${p.title} | Тест</title>
<style>body{background:#1b1b1b;color:#ddd;font:14px sans-serif;padding:20px;min-height:900px} .fr-element{min-height:120px;border:1px solid #555;padding:8px;background:#222} .label{background:#c33;padding:2px 6px;margin-right:6px} .p-breadcrumbs{list-style:none;display:flex;gap:8px;padding:0;font-size:12px} .p-breadcrumbs li:after{content:' ›'} a{color:#8ab}</style></head><body>
<div class="p-navgroup"><a class="p-navgroup-link p-navgroup-link--user" href="/account/"><span class="p-navgroup-linkText">Curator_Test</span></a></div>
${crumbs(p.section)}
<h1 class="p-title-value"><span class="label label--red">Важно</span><span class="label-append">&nbsp;</span>${p.title}</h1>
<div class="p-description"><ul><li><a href="/members/ivan.555/" class="username u-concealed" data-user-id="555">Ivan_Petrov</a></li><li><time class="u-dt" data-time="${start}" datetime="x">дата</time></li></ul></div>
<article class="message message-threadStarterPost message--post" data-author="Ivan_Petrov">
  <div class="message-name"><a class="username" data-user-id="555">Ivan_Petrov</a></div>
  <div class="message-body"><div class="bbWrapper">${p.body}</div></div>
</article>
<form><div class="fr-element fr-view" contenteditable="true"><p><br></p></div>
<div class="formButtonGroup-primary"><button type="button" class="button--primary button--icon--reply rippleButton"><span class="button-text">Ответить</span></button></div></form>
<script>
window.XF = { config: { csrf: 'test-token' } };
window.__store = JSON.parse(sessionStorage.getItem('__store') || '{}'); window.__posts = [];
const _f = window.fetch;
window.fetch = (u, o) => { if (String(u).includes('/edit')) { window.__posts.push({ u: String(u), body: Object.fromEntries(o.body.entries()) }); return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } })); } return _f(u, o); };
const persist = () => sessionStorage.setItem('__store', JSON.stringify(window.__store));
window.GM_getValue = k => window.__store[k]; window.GM_setValue = (k, v) => { window.__store[k] = v; persist(); }; window.GM_deleteValue = k => { delete window.__store[k]; persist(); }; window.GM_registerMenuCommand = () => {};
</script>
<script src="/nl_helper.js"></script></body></html>`;
}

// страница раздела с правилами: тема 312571 «обновлена» сегодня — проверка должна это заметить
function forumListing(id) {
    const items = { 51: [[312571, Math.floor(Date.now() / 1000) - 3600], [202392, 1794580869]], 52: [[655011, 1794581108]], 53: [[3353981, 1775240558]], 202: [[3429394, 1666260217]] }[id] || [];
    return `<!doctype html><html><body>${items.map(([t, ts]) => `<div class="structItem structItem--thread"><div class="structItem-title"><a href="/threads/rules.${t}/">Тема ${t}</a></div><time class="structItem-latestDate u-dt" data-time="${ts}">x</time></div>`).join('')}</body></html>`;
}

http.createServer((req, res) => {
    if (req.url.startsWith('/nl_helper.js')) {
        // стенд работает на 127.0.0.1 — снимаем только проверку домена
        const code = fs.readFileSync(file, 'utf8').replace("if (window.location.hostname !== 'forum.blackrussia.online') return;", '');
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(code);
    }
    const fm = req.url.match(/^\/forums\/(\d+)\//);
    if (fm) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(forumListing(+fm[1])); }
    const kind = req.url.includes('bio') ? 'bio' : req.url.includes('leader') ? 'leader' : 'complaint';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(page(kind));
}).listen(8765, '127.0.0.1', () => console.log('serving on 8765'));
