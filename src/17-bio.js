    // АНАЛИЗАТОР БИОГРАФИИ (по «Правилам составления RP биографии»: 200–600 слов, форма подачи, заголовок)
    function openBioAnalyzer() {
        showBioWindow(postText(firstPost()), getThreadTitle());
    }

    // убирает BB-код разметку перед подсчётом слов/пунктуации, чтобы теги не искажали статистику
    const stripBBCode = text => text.replace(/\[[^\]]*\]/g, ' ');
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const WORD_EDGE = '[\\s,.:;!?"\'«»\\/\\\\()\\[\\]]';
    const BAD_COMMA_RE = /,[^\s0-9)»"'”]/g;
    const BAD_SENT_RE  = /[.!?]\s+[а-яёa-z]/g;

    function analyzeBio(text, title) {
        const clean = stripBBCode(text);
        // словом считаем токен, в котором есть буква или цифра (тире и «—» не считаются)
        const words = clean.split(/\s+/).filter(w => /[a-zа-яё0-9]/i.test(w)).length;
        const terms = (SETS.mgTerms && SETS.mgTerms.length) ? SETS.mgTerms : DEFAULT_MG_TERMS;
        const mg = [...new Set(terms.filter(term =>
            new RegExp(`(?:^|${WORD_EDGE})${escRe(term)}(?=${WORD_EDGE}|$)`, 'i').test(clean)))];
        const commas    = (clean.match(BAD_COMMA_RE) || []).length;
        const sentences = (clean.match(BAD_SENT_RE) || []).length;
        const minWords  = SETS.minBioWords || BIO_RULES.minWords;
        const maxWords  = SETS.maxBioWords || BIO_RULES.maxWords;
        const missing   = BIO_RULES.sections.filter(([, re]) => !re.test(clean)).map(([name]) => name);
        const titleOk   = title ? BIO_RULES.titleRe.test(title) : null; // null — заголовок неизвестен (ручной ввод)

        let verdict, vColor, tplId;
        if (mg.length)                                 { verdict = '⚠️ На доработку — найдены MG-термины'; vColor = '#ff4757'; tplId = 'rb3'; }
        else if (words < minWords || words > maxWords) { verdict = `⚠️ На доработку — объём ${words} слов (нужно ${minWords}–${maxWords})`; vColor = '#ffa502'; tplId = 'rb2'; }
        else if (missing.length >= 3)                  { verdict = '⚠️ На доработку — не по форме подачи'; vColor = '#ffa502'; tplId = 'rb4'; }
        else if (titleOk === false)                    { verdict = '⚠️ На доработку — заголовок не «Биография | Nick_Name»'; vColor = '#ffa502'; tplId = 'rb6'; }
        else if (commas + sentences > 5)               { verdict = '⚠️ На доработку — много пунктуационных ошибок'; vColor = '#ffa502'; tplId = 'rb6'; }
        else                                           { verdict = '✅ Можно одобрить'; vColor = '#2ed573'; tplId = 'rb1'; }

        return { words, minWords, maxWords, mg, commas, sentences, missing, titleOk, verdict, vColor, tplId };
    }

    // экранирует текст и оборачивает найденные MG-термины и пунктуационные проблемы в <mark>
    function highlightIssues(text, terms) {
        const spans = [];
        if (terms && terms.length) {
            const re = new RegExp(`(^|${WORD_EDGE})(${terms.map(escRe).join('|')})(?=${WORD_EDGE}|$)`, 'gi');
            let m;
            while ((m = re.exec(text))) {
                const start = m.index + m[1].length;
                spans.push({ start, end: start + m[2].length, color:'#ff4757' });
                if (m[0].length === 0) re.lastIndex++;
            }
        }
        { const re = new RegExp(BAD_COMMA_RE.source, 'g'); let m; while ((m = re.exec(text))) spans.push({ start:m.index, end:m.index+1, color:'#ffa502' }); }
        { const re = new RegExp(BAD_SENT_RE.source, 'g');  let m; while ((m = re.exec(text))) { const s = m.index + m[0].length - 1; spans.push({ start:s, end:s+1, color:'#ffa502' }); } }
        if (!spans.length) return esc(text);

        spans.sort((a,b) => a.start - b.start);
        const kept = []; let lastEnd = -1;
        for (const s of spans) { if (s.start >= lastEnd) { kept.push(s); lastEnd = s.end; } }

        let out = '', last = 0;
        for (const s of kept) {
            out += esc(text.slice(last, s.start)) + `<mark style="background:${s.color}33;color:${s.color};border-radius:2px;padding:0 2px">${esc(text.slice(s.start, s.end))}</mark>`;
            last = s.end;
        }
        return out + esc(text.slice(last));
    }

    function showBioWindow(initialText, pageTitle) {
        if (document.querySelector('.nl-bio-ov')) return;
        const hd = theme();
        const box = `font-size:12px;color:${hd.text2};background:${hd.bg3};border:1px solid ${hd.border};padding:12px 14px;overflow-y:auto;line-height:1.55;font-family:var(--nl-font);white-space:pre-wrap`;
        const ov = document.createElement('div');
        ov.className = 'nl-dov nl-bio-ov';
        ov.innerHTML = `
            <div class="nl-dbox" style="width:660px">
                <div class="nl-dt" style="text-align:center">📋 Анализатор РП Биографии</div>
                <div class="nl-dtabs">
                    <button class="nl-dtab active" data-panel="auto">🔍 Со страницы</button>
                    <button class="nl-dtab" data-panel="manual">✏️ Вставить вручную</button>
                </div>
                <div class="nl-dpanel active" id="bio-panel-auto">
                    ${initialText
                        ? `<div style="${box};max-height:130px">${esc(initialText.substring(0,600))}${initialText.length>600?'…':''}</div>`
                        : `<div style="text-align:center;padding:20px;color:#ff4757;font-size:13px;font-family:var(--nl-font)">❌ Текст первого поста не найден на этой странице.</div>`}
                </div>
                <div class="nl-dpanel" id="bio-panel-manual">
                    <textarea class="nl-ta" id="bio-manual-text" placeholder="Вставьте текст биографии сюда..." rows="8">${esc(initialText)}</textarea>
                </div>
                <div id="bio-result" style="display:none;flex-direction:column;gap:10px"></div>
                <div class="nl-da" style="justify-content:space-between;align-items:center">
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bp" id="bio-analyze">🔍 Анализировать</button>
                        <button class="nl-btn nl-bn" id="bio-clear-res" style="display:none">↺ Сброс</button>
                    </div>
                    <button class="nl-btn nl-bn" id="bio-close">Закрыть</button>
                </div>
            </div>`;
        mountDialog(ov);
        const resEl = ov.querySelector('#bio-result');
        const clearBtn = ov.querySelector('#bio-clear-res');
        const clearRes = () => { resEl.style.display = 'none'; resEl.innerHTML = ''; clearBtn.style.display = 'none'; };

        let curPanel = 'auto';
        ov.querySelectorAll('.nl-dtab').forEach(tab => {
            tab.onclick = () => {
                curPanel = tab.dataset.panel;
                ov.querySelectorAll('.nl-dtab').forEach(t=>t.classList.remove('active'));
                ov.querySelectorAll('.nl-dpanel').forEach(p=>p.classList.remove('active'));
                tab.classList.add('active');
                ov.querySelector(`#bio-panel-${curPanel}`).classList.add('active');
                clearRes();
            };
        });

        const row = (title, valCls, val, details) => `
            <div class="nl-stat-row" style="flex-direction:column;align-items:flex-start">
                <div style="display:flex;justify-content:space-between;width:100%;gap:10px">
                    <span class="nl-stat-title">${title}</span><span class="nl-stat-val ${valCls}">${val}</span>
                </div>
                ${details ? `<div class="nl-stat-details">${details}</div>` : ''}
            </div>`;

        ov.querySelector('#bio-analyze').onclick = () => {
            const manual = curPanel !== 'auto';
            const text = manual ? ov.querySelector('#bio-manual-text').value.trim() : initialText;
            if (!text) { showNotification('Нет текста для анализа', 'error'); return; }
            const res = analyzeBio(text, manual ? '' : pageTitle);
            const mgTerms = (SETS.mgTerms && SETS.mgTerms.length) ? SETS.mgTerms : DEFAULT_MG_TERMS;
            const sugg = findTpl(res.tplId);
            const wordsOk = res.words >= res.minWords && res.words <= res.maxWords;
            resEl.innerHTML = `
                <div class="nl-verdict" style="background:${res.vColor}18;border:1px solid ${res.vColor}44;color:${res.vColor}">${esc(res.verdict)}</div>
                ${sugg ? `<button class="nl-btn nl-bn nl-btn-sm" id="bio-use-tpl" style="align-self:center">📄 Вставить шаблон «${esc(sugg.title)}»</button>` : ''}
                ${(res.mg.length||res.commas||res.sentences) ? `<div style="${box};max-height:160px;line-height:1.6">${highlightIssues(text, mgTerms)}</div>
                <div style="font-size:11px;color:${hd.text2};display:flex;gap:14px"><span><mark style="background:#ff475733;color:#ff4757;border-radius:2px;padding:0 3px">текст</mark> MG-термин</span><span><mark style="background:#ffa50233;color:#ffa502;border-radius:2px;padding:0 3px">текст</mark> пунктуация</span></div>` : ''}
                <div class="nl-stat-grid">
                    ${row('Количество слов', wordsOk ? 'ok' : 'warn', `${res.words} / ${res.minWords}–${res.maxWords}`)}
                    ${row('Разделы формы подачи', res.missing.length === 0 ? 'ok' : res.missing.length >= 3 ? 'err' : 'warn',
                        `${BIO_RULES.sections.length - res.missing.length} / ${BIO_RULES.sections.length}`,
                        res.missing.length ? 'Не найдены: <b>' + esc(res.missing.join(', ')) + '</b>' : '✓ Все разделы на месте')}
                    ${res.titleOk === null ? '' : row('Заголовок темы', res.titleOk ? 'ok' : 'warn', res.titleOk ? '✓' : '✗',
                        res.titleOk ? '' : 'Должен быть по форме: <b>Биография | Nick_Name</b>')}
                    ${row('MG-термины (метагейминг)', res.mg.length ? 'err' : 'ok', res.mg.length,
                        res.mg.length ? 'Найдены: <b>' + esc(res.mg.join(', ')) + '</b>' : '✓ Нарушений не обнаружено')}
                    ${row('Пунктуация', (res.commas + res.sentences) ? 'warn' : 'ok', `ошибок: ${res.commas + res.sentences}`,
                        `Запятых без пробела: <b>${res.commas}</b> &nbsp;│&nbsp; Предложений с маленькой буквы: <b>${res.sentences}</b>`)}
                </div>
                <div style="font-size:11px;color:${hd.text2};font-family:var(--nl-font)">Шрифт (Times New Roman / Verdana, от 15), фотографии и логику биографии проверьте вручную.</div>`;
            const useBtn = resEl.querySelector('#bio-use-tpl');
            if (useBtn) useBtn.onclick = () => { curTab = 'rp_bio'; ov.remove(); insertTemplate(sugg); };
            resEl.style.display = 'flex';
            clearBtn.style.display = 'inline-block';
        };

        clearBtn.onclick = clearRes;
        ov.querySelector('#bio-close').onclick = () => ov.remove();
        ov.onclick = e => { if (e.target===ov) ov.remove(); };
    }

