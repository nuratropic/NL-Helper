    // КОНСТРУКТОР НАРУШЕНИЙ (несколько пунктов правил в одном посте)
    function openRuleBuilder(onlySets) {
        if (!Array.isArray(onlySets)) onlySets = null; // при вызове из onclick сюда приходит событие
        const hd = theme();
        const ov = document.createElement('div'); ov.className='nl-dov';

        let html='', curSection=null, groupOpen=false;
        Object.keys(RULES).filter(id => !onlySets || onlySets.includes(RULES[id].set)).forEach(rule => {
            const sect = ruleGroup(rule);
            if (sect !== curSection) {
                if (groupOpen) html += `</div>`;
                html += `<div class="nl-rb-section" data-section="${esc(sect)}"><div class="nl-rb-group">${esc(ruleGroupTitle(sect))}</div>`;
                curSection = sect; groupOpen = true;
            }
            html += ruleRowHtml(rule);
        });
        if (groupOpen) html += `</div>`;

        ov.innerHTML = `
            <div class="nl-dbox" style="width:660px">
                <div class="nl-dt" style="text-align:center">⚖ Конструктор нарушений <span style="font-size:11px;color:${hd.text2};letter-spacing:0;text-transform:none">· правила от ${RULES_REVISION}</span></div>
                <div class="nl-dtabs">
                    <button class="nl-dtab active" data-v="accept">✅ Одобрено</button>
                    <button class="nl-dtab" data-v="unaccept">❌ Отказано</button>
                </div>
                <input class="nl-in" id="rb-search" placeholder="Поиск по номеру или описанию…">
                <div id="rb-list" style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">${html}</div>
                <div class="nl-empty" id="rb-empty" style="display:none;padding:16px"><div class="nl-empty-icon">🔍</div>Ничего не найдено</div>
                <div class="nl-da" style="justify-content:space-between;align-items:center">
                    <span id="rb-count" style="font-size:12px;color:${hd.text2}">Выбрано: 0</span>
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bd" id="rb-cancel">Отмена</button>
                        <button class="nl-btn nl-bp" id="rb-insert" disabled>Вставить</button>
                    </div>
                </div>
            </div>`;
        mountDialog(ov);

        let approved = true;
        ov.querySelectorAll('.nl-dtab').forEach(tab => {
            tab.onclick = () => {
                ov.querySelectorAll('.nl-dtab').forEach(t=>t.classList.remove('active'));
                tab.classList.add('active');
                approved = tab.dataset.v === 'accept';
            };
        });

        const countEl = ov.querySelector('#rb-count');
        const insertBtn = ov.querySelector('#rb-insert');
        const updateCount = () => {
            const n = ov.querySelectorAll('#rb-list input:checked').length;
            countEl.textContent = `Выбрано: ${n}`;
            insertBtn.disabled = n === 0;
        };
        ov.querySelector('#rb-list').addEventListener('change', updateCount);

        ov.querySelector('#rb-search').oninput = e => {
            const q = e.target.value.trim();
            let anyRowVisible = false;
            ov.querySelectorAll('#rb-list .nl-rb-row').forEach(row => {
                const vis = !q || fuzz(q, row.dataset.search);
                row.style.display = vis ? '' : 'none';
                if (vis) anyRowVisible = true;
            });
            ov.querySelectorAll('.nl-rb-section').forEach(sec => {
                const anyVisible = [...sec.querySelectorAll('.nl-rb-row')].some(r=>r.style.display!=='none');
                sec.style.display = anyVisible ? '' : 'none';
            });
            ov.querySelector('#rb-empty').style.display = anyRowVisible ? 'none' : '';
            ov.querySelector('#rb-list').style.display = anyRowVisible ? '' : 'none';
        };

        ov.querySelector('#rb-cancel').onclick = () => ov.remove();
        ov.querySelector('#rb-insert').onclick = () => {
            const rules = [...ov.querySelectorAll('#rb-list input:checked')].map(i=>i.value);
            if (!rules.length) return;
            if (insertCombinedRules(approved, rules)) ov.remove();
        };
        ov.onclick = e => { if (e.target===ov) ov.remove(); };
    }

