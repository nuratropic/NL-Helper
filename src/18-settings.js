    // НАСТРОЙКИ — правим черновик; в SETS он попадает только по «Сохранить»
    function openSettings() {
        if (document.querySelector('.nl-set-ov')) return;
        const draft = deepClone(SETS);
        const ov = document.createElement('div'); ov.className = 'nl-dov nl-set-ov';
        const renderTags = () => (draft.mgTerms || []).map((w, i) => `<div class="nl-tag">${esc(w)}<button data-i="${i}" title="Удалить">×</button></div>`).join('');
        ov.innerHTML = `
            <div class="nl-dbox">
                <div class="nl-dt">⚙️ Настройки</div>
                <div class="nl-stat-section">🎮 Общие</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div class="nl-set-row">
                        <div><div class="nl-set-label">Горячие клавиши</div><div class="nl-set-desc">Alt+H — окно, Alt+K — командная строка, Alt+B — биография, Alt+A — отмена вставки, Alt+1-9 — вкладки, Esc — закрыть</div></div>
                        <label class="nl-cl2"><input type="checkbox" id="s-hk" ${draft.hotkeys ? 'checked' : ''}></label>
                    </div>
                    <div class="nl-set-row">
                        <div><div class="nl-set-label">Режим отображения</div><div class="nl-set-desc">«Панель сбоку» — помощник открывается справа, тема форума остаётся видна</div></div>
                        <select class="nl-sel" id="s-uimode" style="width:150px">
                            <option value="modal"${draft.uiMode !== 'dock' ? ' selected' : ''}>Окно</option>
                            <option value="dock"${draft.uiMode === 'dock' ? ' selected' : ''}>Панель сбоку</option>
                        </select>
                    </div>
                    ${[
                        ['serverAuto', 'Сервер — по разделу форума', `Название для {server} берётся из «хлебных крошек» темы${detectServer() ? ` (сейчас: ${esc(detectServer())})` : ''}; если выключить — из поля в окне`],
                        ['autoTab',    'Вкладка — по разделу форума', 'В жалобах на игроков сразу открывается «Игроки», в обжалованиях — «Обжалования» и т.д.; мастер пропускает выбор категории'],
                        ['preview',    'Предпросмотр перед вставкой', 'Сначала показать, как будет выглядеть пост, и вставлять по кнопке'],
                        ['ruleCheck',  'Следить за обновлениями правил', 'Раз в 12 часов проверять темы с правилами на форуме и предупреждать, если они изменились'],
                    ].map(([k, label, desc]) => `
                    <div class="nl-set-row">
                        <div><div class="nl-set-label">${label}</div><div class="nl-set-desc">${desc}</div></div>
                        <label class="nl-cl2"><input type="checkbox" data-k="${k}" aria-label="${esc(label)}" ${draft[k] !== false ? 'checked' : ''}></label>
                    </div>`).join('')}
                    <div style="display:flex;gap:8px"><button class="nl-btn nl-bn nl-btn-sm" id="s-rulecheck">🔄 Проверить правила сейчас</button></div>
                </div>
                <div class="nl-stat-section">🖼 Оформление поста</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    ${[
                        ['header',     'Картинка-шапка (https, пусто — без шапки)'],
                        ['footer',     'Картинка внизу (https, пусто — без неё)'],
                        ['footerLink', 'Ссылка картинки внизу'],
                        ['address',    'Обращение после приветствия («уважаемый»)'],
                        ['closing',    'Строка перед названием сервера'],
                        ['signature',  'Подпись («С уважением, …»; пусто — без подписи; можно {curator})'],
                    ].map(([k, label]) => `<div class="nl-f"><label for="s-post-${k}">${label}</label><input class="nl-in" id="s-post-${k}" data-p="${k}" value="${esc(draft.post[k] || '')}"></div>`).join('')}
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bn nl-btn-sm" id="s-post-pv">👁 Предпросмотр</button>
                        <button class="nl-btn nl-bn nl-btn-sm" id="s-post-reset">↺ По умолчанию</button>
                    </div>
                </div>
                <div class="nl-stat-section">📋 Анализатор биографий</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div class="nl-set-row">
                        <div><div class="nl-set-label">Объём биографии, слов</div><div class="nl-set-desc">По правилам: от ${BIO_RULES.minWords} до ${BIO_RULES.maxWords}</div></div>
                        <span style="display:flex;gap:6px;align-items:center">
                            <input type="number" class="nl-sin" id="s-min" value="${draft.minBioWords}" min="10" max="5000" style="width:80px">
                            <span style="color:var(--nl-text2)">—</span>
                            <input type="number" class="nl-sin" id="s-max" value="${draft.maxBioWords}" min="10" max="5000" style="width:80px">
                        </span>
                    </div>
                    <div class="nl-f">
                        <label>MG-термины (стоп-слова)</label>
                        <div style="display:flex;gap:7px"><input class="nl-in" id="s-mg-new" placeholder="Добавить термин…" style="flex:1"><button class="nl-btn nl-bp nl-btn-sm" id="s-mg-add">+</button></div>
                        <div class="nl-tag-list" id="s-mg-list">${renderTags()}</div>
                    </div>
                </div>
                <div class="nl-stat-section">⭐ Шаблоны</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="nl-btn nl-bn nl-btn-sm" id="s-export">⬇ Резервная копия</button>
                    <button class="nl-btn nl-bn nl-btn-sm" id="s-import">⬆ Импорт</button>
                    <input type="file" id="s-import-file" accept="application/json,.json" style="display:none">
                </div>
                <div class="nl-set-desc">Шаблоны по пунктам правил всегда берутся из актуальной редакции (${RULES_REVISION}); в хранилище лежат только ваши правки и шаблоны.</div>
                <div class="nl-da" style="justify-content:space-between">
                    <button class="nl-btn nl-bd nl-btn-sm" id="s-reset">Сброс шаблонов</button>
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bn" id="s-cancel">Отмена</button>
                        <button class="nl-btn nl-bp" id="s-save">Сохранить</button>
                    </div>
                </div>
            </div>`;
        mountDialog(ov);
        ov.querySelector('#s-hk').onchange = e => { draft.hotkeys = e.target.checked; };
        ov.querySelector('#s-uimode').onchange = e => { draft.uiMode = e.target.value; };
        ov.querySelector('#s-min').oninput = e => { draft.minBioWords = parseInt(e.target.value) || BIO_RULES.minWords; };
        ov.querySelector('#s-max').oninput = e => { draft.maxBioWords = parseInt(e.target.value) || BIO_RULES.maxWords; };
        ov.querySelectorAll('input[data-k]').forEach(cb => { cb.onchange = () => { draft[cb.dataset.k] = cb.checked; }; });
        ov.querySelectorAll('input[data-p]').forEach(inp => { inp.oninput = () => { draft.post[inp.dataset.p] = inp.value.trim(); }; });
        ov.querySelector('#s-rulecheck').onclick = () => checkRuleUpdates(true);
        ov.querySelector('#s-post-reset').onclick = () => {
            draft.post = { ...DEFAULT_POST };
            ov.querySelectorAll('input[data-p]').forEach(inp => { inp.value = draft.post[inp.dataset.p] || ''; });
        };
        ov.querySelector('#s-post-pv').onclick = () => {
            // предпросмотр с черновыми настройками, не сохраняя их
            const saved = SETS.post; SETS.post = draft.post;
            try { showPreview(wrapPost(mentionOf(getAuthor()), serverName(), '[SIZE=6][COLOR=rgb(255,255,255)][I]Текст ответа куратора.[/I][/COLOR][/SIZE]')); }
            finally { SETS.post = saved; }
        };
        const list = ov.querySelector('#s-mg-list');
        const refreshTags = () => { list.innerHTML = renderTags(); };
        list.onclick = e => {
            const btn = e.target.closest('button[data-i]'); if (!btn) return;
            draft.mgTerms.splice(parseInt(btn.dataset.i), 1); refreshTags();
        };
        const addMg = () => {
            const inp = ov.querySelector('#s-mg-new'); const val = inp.value.trim().toLowerCase();
            inp.value = '';
            if (!val || draft.mgTerms.includes(val)) return;
            draft.mgTerms.push(val); refreshTags();
        };
        ov.querySelector('#s-mg-add').onclick = addMg;
        ov.querySelector('#s-mg-new').onkeydown = e => { if (e.key === 'Enter') addMg(); };
        ov.querySelector('#s-export').onclick = exportTemplates;
        ov.querySelector('#s-import').onclick = () => ov.querySelector('#s-import-file').click();
        ov.querySelector('#s-import-file').onchange = e => {
            importTemplatesFile(e.target.files[0], () => { showNotification('✅ Шаблоны импортированы', 'success'); renderCards(); });
            e.target.value = '';
        };
        ov.querySelector('#s-save').onclick = () => {
            if (draft.minBioWords > draft.maxBioWords) { alert('Минимум слов не может быть больше максимума.'); return; }
            const badUrl = ['header', 'footer', 'footerLink'].find(k => draft.post[k] && !safeUrl(draft.post[k]));
            if (badUrl) { alert('Ссылки в оформлении поста должны начинаться с https:// и не содержать пробелов, кавычек и [ ].'); return; }
            const modeChanged = draft.uiMode !== SETS.uiMode;
            SETS = draft; saveSettings(); ov.remove();
            if (modeChanged && document.querySelector('.nl-ov')) { closeMain(); openMain(); }
            showNotification('✅ Настройки сохранены', 'success');
        };
        ov.querySelector('#s-cancel').onclick = () => ov.remove();
        ov.querySelector('#s-reset').onclick = () => {
            if (!confirm('Сбросить стандартные шаблоны к заводским (правки, удаления, закрепления)? Шаблоны во вкладке «Мои» сохранятся.')) return;
            resetTemplates(); ov.remove(); renderCards();
            showNotification('✅ Шаблоны сброшены', 'success');
        };
        ov.onclick = e => { if (e.target === ov) ov.remove(); };
    }

