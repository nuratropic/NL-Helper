    // ВЫБОР ТЕМЫ
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
        mountDialog(pk);
        pk.querySelectorAll('.nl-hi').forEach(i=>{
            i.onclick=()=>{
                curTheme=i.dataset.k; gm.set(STORAGE.THEME,curTheme); pk.remove(); applyCSS();
                // кнопки на форуме (и плавающая панель) стилизованы через CSS — достаточно applyCSS
                closeMain(); setTimeout(openMain,50);
            };
        });
        pk.querySelector('.nl-hclose').onclick=()=>pk.remove();
    }

    // ИСТОРИЯ
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
            <div class="nl-dbox">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="nl-dt">🕐 История использования</div>
                    ${HIST.length?'<button class="nl-btn nl-bd nl-btn-sm" id="hc">Очистить</button>':''}
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">${rows}</div>
                <div class="nl-da"><button class="nl-btn nl-bp" id="hx" style="width:100%">Закрыть</button></div>
            </div>`;
        mountDialog(ov);
        ov.querySelector('#hx').onclick=()=>ov.remove();
        const hcBtn=ov.querySelector('#hc');
        if(hcBtn) hcBtn.onclick=()=>{ if(!confirm('Очистить историю?')) return; HIST.length=0; saveHistory(); ov.remove(); };
        ov.querySelectorAll('.nl-hist-item').forEach(el=>{ el.onclick=()=>{
            const u = el.dataset.url;
            if (u && /^https:\/\/forum\.blackrussia\.online\//.test(u)) window.open(u, '_blank', 'noopener');
        }; });
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // СТАТИСТИКА
    function openStats() {
        const hd=theme();
        const ov=document.createElement('div'); ov.className='nl-dov';
        const byTab=Object.entries(STATS.byTab||{}).sort(([,a],[,b])=>b-a).slice(0,6);
        const maxT=byTab[0]?.[1]||1;
        const allTpls=Object.values(TPLS).flat().filter(t=>t.uses>0).sort((a,b)=>(b.uses||0)-(a.uses||0)).slice(0,5);
        const days7=[]; for(let i=6;i>=0;i--){ const d=new Date();d.setDate(d.getDate()-i);const k=dayKey(d);days7.push({label:d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}),count:STATS.byDay?.[k]||0}); }
        const max7=Math.max(...days7.map(d=>d.count),1);

        ov.innerHTML=`
            <div class="nl-dbox">
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
                            <div style="width:130px;font-size:12px;color:${hd.text2};font-family:var(--nl-font)">${esc(tab?.name||id)}</div>
                            <div class="nl-bar"><div class="nl-bar-fill" style="width:${Math.round(cnt/maxT*100)}%;background:${hd.accent}"></div></div>
                            <div style="font-size:12px;color:${hd.text};font-weight:600;width:26px;text-align:right;font-family:'Share Tech Mono',monospace">${cnt}</div>
                        </div>`;
                    }).join('')||`<div style="font-size:12px;color:${hd.text2}">Нет данных</div>`}
                </div>
                <div class="nl-stat-section">🏆 Топ шаблонов</div>
                <div class="nl-stat-grid">
                    ${allTpls.map((t,i)=>`<div class="nl-bar-wrap">
                            <div style="width:130px;font-size:12px;color:${hd.text2};font-family:var(--nl-font);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(t.title)}">${i+1}. ${esc(t.title)}</div>
                            <div class="nl-bar"><div class="nl-bar-fill" style="width:${Math.round((t.uses||0)/(allTpls[0]?.uses||1)*100)}%;background:${hd.accent}"></div></div>
                            <div style="font-size:12px;color:${hd.text};font-weight:600;width:26px;text-align:right;font-family:'Share Tech Mono',monospace">${t.uses||0}</div>
                        </div>`).join('')||`<div class="nl-empty" style="padding:10px;font-size:13px">Нет данных</div>`}
                </div>
                <div class="nl-da" style="justify-content:space-between">
                    <button class="nl-btn nl-bd nl-btn-sm" id="sr">Сбросить</button>
                    <div style="display:flex;gap:8px">
                        <button class="nl-btn nl-bn nl-btn-sm" id="sprof">🏅 Профиль</button>
                        <button class="nl-btn nl-bn nl-btn-sm" id="scsv">⬇ CSV</button>
                        <button class="nl-btn nl-bp" id="sx">Закрыть</button>
                    </div>
                </div>
            </div>`;
        mountDialog(ov);
        ov.querySelector('#sx').onclick=()=>ov.remove();
        ov.querySelector('#sprof').onclick=()=>{ ov.remove(); openProfile(); };
        ov.querySelector('#sr').onclick=()=>{
            if(!confirm('Сбросить статистику?')) return;
            STATS={total:0,byPrefix:{},byTab:{},byDay:{}};
            Object.values(TPLS).flat().forEach(t=>t.uses=0);
            saveStats(); saveTemplates(); ov.remove();
        };
        ov.querySelector('#scsv').onclick=()=>{
            const rows=['Раздел;Использований'];
            Object.entries(STATS.byTab||{}).sort(([,a],[,b])=>b-a).forEach(([id,cnt])=>{
                const tab=TABS.find(t=>t.id===id);
                rows.push(`"${(tab?.name||id).replace(/"/g,'""')}";${cnt}`);
            });
            rows.push('', 'Шаблон;Использований');
            Object.values(TPLS).flat().filter(t=>t.uses).sort((a,b)=>(b.uses||0)-(a.uses||0)).forEach(t=>{
                rows.push(`"${String(t.title).replace(/"/g,'""')}";${t.uses||0}`);
            });
            rows.push('', `Всего использований;${STATS.total||0}`);
            downloadFile(`nl-helper-stats-${dayKey()}.csv`, String.fromCharCode(0xFEFF)+rows.join('\r\n'), 'text/csv;charset=utf-8');
        };
        ov.onclick=e=>{if(e.target===ov)ov.remove();};
    }

    // ПРОФИЛЬ КУРАТОРА — уровень, ачивки и факты поверх уже собираемой статистики (STATS)

    // до следующего уровня нужно level*25 использований: 25, 50, 75…
    function levelFromTotal(total) {
        let level = 1, need = 25, spent = 0;
        while (total >= spent + need) { spent += need; level++; need = level * 25; }
        return { level, cur: total - spent, next: need };
    }

    // серии дней подряд по STATS.byDay (ключи YYYY-MM-DD, как пишет recordUse)
    function calcStreaks(byDay) {
        const days = Object.keys(byDay || {}).filter(d => byDay[d] > 0).sort();
        let best = 0, run = 0, prev = null;
        days.forEach(d => {
            run = (prev !== null && Date.parse(d) - Date.parse(prev) === 86400000) ? run + 1 : 1;
            if (run > best) best = run;
            prev = d;
        });
        const today     = dayKey();
        const y = new Date(); y.setDate(y.getDate() - 1);
        const yesterday = dayKey(y);
        const current = (days.length && (prev === today || prev === yesterday)) ? run : 0;
        return { best, current };
    }

    const ACHIEVEMENTS = [
        { icon:'🥉', name:'Первые шаги',      desc:'10 использований',   test:p => p.total >= 10 },
        { icon:'🥈', name:'В деле',           desc:'50 использований',   test:p => p.total >= 50 },
        { icon:'🥇', name:'Сотня',            desc:'100 использований',  test:p => p.total >= 100 },
        { icon:'🎖', name:'Ветеран',          desc:'250 использований',  test:p => p.total >= 250 },
        { icon:'💎', name:'Мастер',           desc:'500 использований',  test:p => p.total >= 500 },
        { icon:'🏆', name:'Легенда форума',   desc:'1000 использований', test:p => p.total >= 1000 },
        { icon:'🔥', name:'Разогрев',         desc:'3 дня подряд',       test:p => p.bestStreak >= 3 },
        { icon:'⚡', name:'Без выходных',     desc:'7 дней подряд',      test:p => p.bestStreak >= 7 },
        { icon:'🚀', name:'Две недели',       desc:'14 дней подряд',     test:p => p.bestStreak >= 14 },
        { icon:'👑', name:'Железный куратор', desc:'30 дней подряд',     test:p => p.bestStreak >= 30 },
    ];

    // собирает профиль из статистики; ничего не пишет — только считает
    function computeProfile(stats, tpls) {
        const total = stats.total || 0;
        const lv = levelFromTotal(total);
        const st = calcStreaks(stats.byDay);
        const p = { total, level: lv.level, xpCur: lv.cur, xpNext: lv.next, bestStreak: st.best, curStreak: st.current };
        p.achievements = ACHIEVEMENTS.map(a => ({ icon:a.icon, name:a.name, desc:a.desc, unlocked:a.test(p) }));
        p.unlockedCount = p.achievements.filter(a => a.unlocked).length;

        const topTab = Object.entries(stats.byTab || {}).sort(([,a],[,b]) => b - a)[0];
        p.favTab = topTab ? (TABS.find(t => t.id === topTab[0])?.name || topTab[0]) : null;
        const topTpl = Object.values(tpls).flat().filter(t => t.uses > 0).sort((a,b) => (b.uses||0)-(a.uses||0))[0];
        p.favTpl = topTpl ? topTpl.title : null;
        const wd = [0,0,0,0,0,0,0];
        Object.entries(stats.byDay || {}).forEach(([d, c]) => { const wdI = new Date(d + 'T12:00:00').getDay(); if (!isNaN(wdI)) wd[wdI] += c; });
        const maxWd = Math.max(...wd);
        p.favWeekday = maxWd > 0 ? ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][wd.indexOf(maxWd)] : null;
        p.activeDays = Object.keys(stats.byDay || {}).filter(d => stats.byDay[d] > 0).length;
        const rec = Object.entries(stats.byDay || {}).sort(([,a],[,b]) => b - a)[0];
        p.recordDay = rec && rec[1] > 0 ? { date: rec[0], count: rec[1] } : null;
        return p;
    }

    // рисует карточку профиля на canvas — можно сохранить как PNG
    function renderProfileCard(p) {
        const hd = theme();
        const cv = document.createElement('canvas');
        cv.width = 720; cv.height = 400;
        const x = cv.getContext('2d');
        x.fillStyle = hd.bg; x.fillRect(0, 0, 720, 400);
        x.strokeStyle = hd.accent + '12'; x.lineWidth = 1;
        for (let i = 0; i <= 720; i += 28) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 400); x.stroke(); }
        for (let i = 0; i <= 400; i += 28) { x.beginPath(); x.moveTo(0, i); x.lineTo(720, i); x.stroke(); }
        x.strokeStyle = hd.accent; x.lineWidth = 2; x.strokeRect(1, 1, 718, 398);
        const cardFont = hd.dbh ? 'Michroma, Jost, sans-serif' : 'Rajdhani, Segoe UI, sans-serif';
        x.fillStyle = hd.text;
        x.font = (hd.dbh ? '400 24px ' : '700 30px ') + cardFont;
        x.fillText(hd.dbh ? 'CYBERLIFE · МОДЕЛЬ NL800' : 'NL HELPER — ПРОФИЛЬ КУРАТОРА', 28, 52);
        x.fillStyle = hd.accent; x.fillRect(28, 66, 664, 2);
        x.font = (hd.dbh ? '400 58px ' : '700 76px ') + cardFont;
        x.fillText('LVL ' + p.level, 28, 150);
        x.fillStyle = hd.text2;
        x.font = '16px Consolas, monospace';
        x.fillText(p.total + ' использований · ачивок ' + p.unlockedCount + '/' + p.achievements.length, 30, 180);
        const pw = 664, ph = 14, py = 200;
        x.fillStyle = hd.bg3; x.fillRect(28, py, pw, ph);
        x.fillStyle = hd.accent; x.fillRect(28, py, Math.round(pw * Math.min(1, p.xpCur / p.xpNext)), ph);
        x.strokeStyle = hd.border; x.strokeRect(28.5, py + .5, pw - 1, ph - 1);
        x.fillStyle = hd.text2; x.font = '13px Consolas, monospace';
        x.fillText(p.xpCur + ' / ' + p.xpNext + ' до следующего уровня', 30, py + 34);
        let ax = 28;
        x.font = '30px "Segoe UI Emoji", sans-serif';
        p.achievements.forEach(a => {
            x.globalAlpha = a.unlocked ? 1 : 0.22;
            x.fillText(a.icon, ax, 292);
            ax += 46;
        });
        x.globalAlpha = 1;
        x.fillStyle = hd.text; x.font = '600 15px ' + (hd.dbh ? 'Jost, sans-serif' : 'Rajdhani, Segoe UI, sans-serif');
        const facts = [];
        if (p.favTab)         facts.push('Любимый раздел: ' + p.favTab.replace(/^\S+\s/, ''));
        if (p.favWeekday)     facts.push('Самый активный день: ' + p.favWeekday);
        if (p.bestStreak > 1) facts.push('Лучшая серия: ' + p.bestStreak + ' дн.');
        x.fillText(facts.join('  ·  ').substring(0, 82), 28, 330);
        x.fillStyle = hd.text2; x.font = '12px Consolas, monospace';
        x.fillText('forum.blackrussia.online · ' + fmtDate(Date.now()) + (hd.dbh ? ' · rA9' : ''), 28, 374);
        return cv;
    }

    function openProfile() {
        const hd = theme();
        const p = computeProfile(STATS, TPLS);
        const pct = Math.min(100, Math.round(p.xpCur / p.xpNext * 100));
        const facts = [];
        if (p.favTab)      facts.push(['📂', 'Любимый раздел', p.favTab]);
        if (p.favTpl)      facts.push(['📄', 'Любимый шаблон', p.favTpl]);
        if (p.favWeekday)  facts.push(['📅', 'Самый активный день', p.favWeekday]);
        if (p.recordDay)   facts.push(['🚩', 'Рекорд за день', `${p.recordDay.count} (${fmtDate(p.recordDay.date)})`]);
        if (p.activeDays)  facts.push(['🗓', 'Активных дней всего', String(p.activeDays)]);
        if (p.curStreak > 1) facts.push(['🔥', 'Текущая серия', `${p.curStreak} дн. подряд`]);
        // отсылка к DBH: «нестабильность ПО» растёт с опытом, как у Коннора по пути девианта
        if (theme().dbh) facts.push(['🤖', 'Нестабильность ПО', `▲ ${Math.min(99, p.level * 7 + p.unlockedCount * 3)}%`]);

        const ov = document.createElement('div'); ov.className = 'nl-dov';
        ov.innerHTML = `
            <div class="nl-dbox">
                <div class="nl-dt" style="text-align:center">${theme().dbh ? '🏅 Профиль андроида-куратора' : '🏅 Профиль куратора'}</div>
                <div class="nl-prof-head">
                    <div class="nl-prof-lvl"><span>LVL</span>${p.level}</div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:7px">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px">
                            <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:${hd.text2}">ОПЫТ: ${p.total} использований</span>
                            <span style="font-family:'Share Tech Mono',monospace;font-size:12px;color:${hd.accent}">${p.xpCur} / ${p.xpNext} до LVL ${p.level+1}</span>
                        </div>
                        <div class="nl-bar" style="height:8px"><div class="nl-bar-fill" style="width:${pct}%;background:${hd.accent}"></div></div>
                        <div style="font-family:var(--nl-font);font-size:11px;color:${hd.text2}">Серия: ${p.curStreak} дн. подряд · рекорд серии: ${p.bestStreak} дн.</div>
                    </div>
                </div>
                <div class="nl-stat-section">🏅 Ачивки (${p.unlockedCount}/${p.achievements.length})</div>
                <div class="nl-prof-ach">
                    ${p.achievements.map(a => `
                        <div class="nl-prof-a${a.unlocked ? ' on' : ''}" title="${esc(a.desc)}">
                            <div class="i">${a.icon}</div>
                            <div class="n">${esc(a.name)}</div>
                            <div class="d">${esc(a.desc)}</div>
                        </div>`).join('')}
                </div>
                ${facts.length ? `<div class="nl-stat-section">✨ Факты</div>
                <div class="nl-stat-grid">${facts.map(([i, k, v]) => `
                    <div class="nl-stat-row"><span class="nl-stat-title">${i} ${esc(k)}</span>
                    <span class="nl-stat-val" style="color:${hd.accent};max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(v)}">${esc(v)}</span></div>`).join('')}</div>` : ''}
                <div id="pf-card-wrap" style="display:none;flex-direction:column;gap:10px"></div>
                <div class="nl-da" style="justify-content:space-between">
                    <button class="nl-btn nl-bn nl-btn-sm" id="pf-card">🖼 Карточка PNG</button>
                    <button class="nl-btn nl-bp" id="pf-x">Закрыть</button>
                </div>
            </div>`;
        mountDialog(ov);
        ov.querySelector('#pf-x').onclick = () => ov.remove();
        ov.querySelector('#pf-card').onclick = () => {
            const wrap = ov.querySelector('#pf-card-wrap');
            const url = renderProfileCard(p).toDataURL('image/png');
            wrap.innerHTML = `<img src="${url}" alt="Карточка профиля" style="width:100%;border:1px solid ${hd.border}">` +
                `<a class="nl-btn nl-bs nl-btn-sm" style="text-align:center;text-decoration:none" download="nl-profile.png" href="${url}">⬇ Скачать PNG</a>`;
            wrap.style.display = 'flex';
        };
        ov.onclick = e => { if (e.target === ov) ov.remove(); };
    }

