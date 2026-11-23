    // УТИЛИТЫ
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
    // нормализация для поиска: регистр + ё→е, чтобы «запрещенное» находило «запрещённое»
    const norm = s => String(s).toLowerCase().replace(/ё/g,'е');
    const fuzz = (q,t) => { if(!q) return true; const n=norm(q); const tx=norm(t); return tx.includes(n)||tx.includes(toRu(n)); };
    // автор темы (а не первый попавшийся ник на странице); ник чистим от символов, ломающих BB-код
    function getAuthor() {
        const el = pick(SEL.authorCandidates);
        const name = el ? el.textContent.trim().replace(/[\[\]]/g, '') : '';
        const id = el ? String(el.getAttribute('data-user-id') || '').replace(/\D/g, '') : '';
        return { name: name || 'Игрок', id };
    }
    const mentionOf = ({ name, id }) => id ? `[USER=${id}]${name}[/USER]` : name;
    // сервер: из «хлебных крошек» темы (если включено), иначе — из настроек
    const serverName = () => String((SETS.serverAuto !== false && detectServer()) || SETS.serverName || 'ASTANA').toUpperCase();
    // id темы из URL вида /threads/slug.12345/page-2 — цифры из slug не должны попадать в id
    function getThreadId() {
        const m = window.location.pathname.match(/\/threads\/(?:[^/]*\.)?(\d+)(?:\/|$)/);
        return m ? m[1] : '';
    }
    // заголовок темы без префикса-метки
    function getThreadTitle() {
        const el = document.querySelector(SEL.titleValue);
        if (!el) return '';
        const c = el.cloneNode(true);
        c.querySelectorAll('.label, .label-append').forEach(x => x.remove());
        return c.textContent.replace(/\s+/g, ' ').trim();
    }
    // текст поста с переносами строк, включая содержимое свёрнутых спойлеров
    // (innerText пропускает скрытое, а биографию часто прячут в спойлер)
    function postText(el) {
        if (!el) return '';
        const c = el.cloneNode(true);
        c.querySelectorAll('script, style, .bbCodeSpoiler-button, .js-unfurl-favicon').forEach(x => x.remove());
        c.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
        c.querySelectorAll('p, div, li, blockquote, h1, h2, h3, h4').forEach(b => b.append('\n'));
        return c.textContent.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // ПЛЕЙСХОЛДЕРЫ
    function applyPH(text) {
        const author = getAuthor();
        // {violator}/{curator} считаем только если они есть в тексте — это лишний разбор страницы
        if (text.includes('{violator}')) text = text.replace(/\{violator\}/g, extractViolator(postText(firstPost())) || 'игрок');
        if (text.includes('{curator}'))  text = text.replace(/\{curator\}/g, getCurator() || 'Администрация');
        return text
            .replace(/\{nickname\}/g,  author.name)
            .replace(/\{mention\}/g,   mentionOf(author))
            .replace(/\{server\}/g,    serverName())
            .replace(/\{date\}/g,      fmtDate(Date.now()))
            .replace(/\{time\}/g,      fmtTime(Date.now()))
            .replace(/\{greeting\}/g,  greeting())
            .replace(/\{thread_id\}/g, getThreadId());
    }

