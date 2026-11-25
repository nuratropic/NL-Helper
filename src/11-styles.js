    // CSS
    function buildCSS(hd) {
        // шрифты Google Fonts подключает ensureFonts() — только когда открывается окно помощника
        const btnOn = hd.btnText || '#000';
        return `

:root {
    --nl-bg:       ${hd.bg};
    --nl-bg2:      ${hd.bg2};
    --nl-bg3:      ${hd.bg3};
    --nl-border:   ${hd.border};
    --nl-accent:   ${hd.accent};
    --nl-text:     ${hd.text};
    --nl-text2:    ${hd.text2};
    --nl-grid:     ${hd.accent}07;
    --nl-font:       ${hd.dbh ? "'Jost','Rajdhani',sans-serif" : "'Rajdhani',sans-serif"};
    --nl-font-title: ${hd.dbh ? "'Michroma','Rajdhani',sans-serif" : "'Rajdhani',sans-serif"};
}

/* ── Кнопки на форуме ── */
.nl-btn-main {
    font-family:var(--nl-font) !important; font-weight:700 !important;
    font-size:11px !important; letter-spacing:1px !important; text-transform:uppercase !important;
    background:transparent !important; color:${hd.accent} !important;
    border:1px solid ${hd.accent} !important;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)) !important;
    padding:8px 16px !important; cursor:pointer !important;
    margin:3px 5px 3px 0 !important; height:36px !important;
    display:inline-flex !important; align-items:center !important;
    vertical-align:middle !important; flex-shrink:0 !important;
    transition:all .15s !important;
    box-shadow:0 0 10px ${hd.accent}25 !important;
}
.nl-btn-main:hover { background:${hd.accent} !important; color:${btnOn} !important; box-shadow:0 0 20px ${hd.accent}55 !important; }
#nl-bio-btn   { color:#3b82f6 !important; border-color:#3b82f6 !important; box-shadow:0 0 10px #3b82f625 !important; }
#nl-bio-btn:hover   { background:#3b82f6 !important; color:#fff !important; }
#nl-wizard-btn { color:#a855f7 !important; border-color:#a855f7 !important; box-shadow:0 0 10px #a855f725 !important; }
#nl-wizard-btn:hover { background:#a855f7 !important; color:#fff !important; }
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
    font-family:var(--nl-font);
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
    padding:20px 20px 16px; border-bottom:1px solid ${hd.border};
    position:relative; overflow:hidden;
}
.nl-logo-area::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
    background:linear-gradient(90deg,transparent,${hd.accent},transparent);
    animation:nl-scan 3s ease-in-out infinite; opacity:.5;
}
.nl-logo-text {
    font-family:var(--nl-font); font-size:28px; font-weight:700;
    color:${hd.text}; line-height:1; letter-spacing:2px; text-transform:uppercase;
}
.nl-logo-text span { color:${hd.accent}; }
.nl-logo-sub {
    font-family:'Share Tech Mono',monospace; font-size:10px;
    color:${hd.text2}; letter-spacing:1.5px; text-transform:uppercase; margin-top:4px;
}

/* ── Вкладки ── */
.nl-tabs { flex:1; overflow-y:auto; padding:8px 0; display:flex; flex-direction:column; gap:2px; }
.nl-tabs::-webkit-scrollbar { width:4px; }
.nl-tabs::-webkit-scrollbar-thumb { background:${hd.border}; }
.nl-tab {
    padding:10px 20px; background:none; border:none;
    border-left:2px solid transparent;
    color:${hd.text2};
    font-family:var(--nl-font); font-size:13px; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase;
    cursor:pointer; text-align:left; transition:all .15s;
}
.nl-tab:hover { color:${hd.text}; background:${hd.bg3}; }
.nl-tab.active { color:${hd.accent}; border-left-color:${hd.accent}; background:${hd.accent}0d; }

/* ── Кнопки подвала сайдбара ── */
.nl-sb-foot { padding:12px; border-top:1px solid ${hd.border}; display:flex; flex-direction:column; gap:8px; }
.nl-hb {
    background:${hd.bg3}; border:1px solid ${hd.border};
    padding:10px 12px; cursor:pointer; color:${hd.text2};
    font-family:var(--nl-font); font-size:12px; font-weight:600;
    letter-spacing:.05em; text-transform:uppercase;
    transition:all .15s; text-align:left; width:100%;
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));
}
.nl-hb:hover { border-color:${hd.accent}; color:${hd.accent}; background:${hd.accent}0d; }

/* ── Основной контент ── */
.nl-main-content { flex:1; display:flex; flex-direction:column; min-width:0; background:${hd.bg}; }

/* ── Топ-панель ── */
.nl-hd {
    padding:16px 20px 14px; border-bottom:1px solid ${hd.border};
    display:flex; flex-direction:column; gap:12px; flex-shrink:0;
    background:linear-gradient(90deg,${hd.accent}05 0%,transparent 60%);
}
.nl-hd-top { display:flex; gap:12px; align-items:center; }
.nl-sr {
    flex:1; background:${hd.bg2}; border:1px solid ${hd.border};
    color:${hd.text}; padding:10px 14px;
    font-family:var(--nl-font); font-size:14px; outline:none; transition:border-color .15s;
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
.nl-pb { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.nl-pp {
    font-family:var(--nl-font); font-size:11px; font-weight:700;
    text-transform:uppercase; letter-spacing:.5px;
    padding:5px 12px; border:1px solid; cursor:pointer;
    transition:all .15s; background:transparent;
    clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px));
}
.nl-pp:hover { filter:brightness(1.2); transform:translateY(-1px); }

/* ── Контент ── */
.nl-ct { flex:1; overflow-y:auto; padding:16px 20px; }
.nl-ct::-webkit-scrollbar { width:4px; }
.nl-ct::-webkit-scrollbar-thumb { background:${hd.border}; }

/* ── Сетка карточек ── */
.nl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; align-content:start; }

/* ── Карточка ── */
.nl-card {
    background:${hd.bg2}; border:1px solid ${hd.border};
    border-left:2px solid transparent;
    clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
    padding:16px; cursor:pointer; transition:all .15s; position:relative; overflow:hidden;
    box-sizing:border-box;
}
.nl-card:hover { border-left-color:${hd.accent}; box-shadow:0 4px 20px rgba(0,0,0,.3); transform:translateY(-1px); }
.nl-card.pinned { border-left-color:${hd.accent}; background:${hd.accent}06; }
.nl-card h3 {
    font-family:var(--nl-font); font-weight:700; font-size:14px; letter-spacing:.05em;
    color:${hd.text}; margin:0 0 8px; padding-right:22px; line-height:1.3;
    text-transform:uppercase;
}
.nl-card-preview {
    font-family:var(--nl-font); font-size:12px; color:${hd.text2}; margin:0 0 12px; line-height:1.5;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.nl-badge {
    display:inline-block; font-size:10px; padding:2px 9px;
    font-family:var(--nl-font); font-weight:700; text-transform:uppercase; letter-spacing:.5px;
    clip-path:polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px));
}
.nl-new {
    display:inline-block; font-size:10px; font-weight:700; font-family:var(--nl-font);
    padding:1px 7px; background:rgba(34,197,94,.15); color:#22c55e;
    margin-left:6px; vertical-align:middle; text-transform:uppercase; letter-spacing:.5px;
}
.nl-uses { position:absolute; bottom:14px; right:16px; font-family:'Share Tech Mono',monospace; font-size:10px; color:${hd.text2}; }
.nl-pin-star { position:absolute; top:14px; right:16px; color:${hd.accent}; font-size:12px; }

/* Tooltip */
.nl-tooltip {
    position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
    background:${hd.bg3}; border:1px solid ${hd.border};
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    padding:10px 13px; font-family:var(--nl-font); font-size:12px; color:${hd.text}; line-height:1.6;
    width:280px; z-index:99999; pointer-events:none;
    box-shadow:0 8px 24px rgba(0,0,0,.7);
    white-space:pre-wrap; word-break:break-word;
    opacity:0; transition:opacity .15s;
}
.nl-card:hover .nl-tooltip { opacity:1; }

/* Overlay редактирования */
.nl-mo { position:absolute; inset:0; background:${hd.overlay || 'rgba(8,6,4,.92)'}; display:none; align-items:center; justify-content:center; gap:10px; }
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
    padding:12px 20px; background:${hd.bg2}; border-top:1px solid ${hd.border};
    flex-shrink:0; flex-wrap:wrap; gap:10px;
}
.nl-fl { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.nl-cl2 { display:flex; align-items:center; gap:7px; font-family:var(--nl-font); font-size:13px; color:${hd.text2}; cursor:pointer; font-weight:600; user-select:none; letter-spacing:.05em; }
.nl-cl2 input { accent-color:${hd.accent}; width:14px; height:14px; cursor:pointer; }
.nl-sep { width:1px; height:18px; background:${hd.border}; }
.nl-sin { background:${hd.bg3}; border:1px solid ${hd.border}; color:${hd.text}; padding:8px 12px; font-family:var(--nl-font); font-size:13px; width:110px; outline:none; transition:border-color .15s; clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,0 100%); }
.nl-sin:focus { border-color:${hd.accent}; }
.nl-sin::placeholder { color:${hd.text2}; }

/* ── Кнопки ── */
.nl-btn {
    padding:9px 16px; border:none;
    font-family:var(--nl-font); font-size:12px; font-weight:700;
    text-transform:uppercase; letter-spacing:.5px; cursor:pointer; transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
}
.nl-btn-sm { padding:7px 12px; font-size:11px; }
.nl-bp { background:${hd.accent}; color:${btnOn}; border:1px solid ${hd.accent}; }
.nl-bp:hover { filter:brightness(1.1); box-shadow:0 0 16px ${hd.accent}50; }
.nl-bd { background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.35); color:#ef4444; }
.nl-bd:hover { background:rgba(239,68,68,.2); }
.nl-bs { background:rgba(34,197,94,.1); border:1px solid rgba(34,197,94,.35); color:#22c55e; }
.nl-bs:hover { background:rgba(34,197,94,.2); }
.nl-bn { background:${hd.bg3}; border:1px solid ${hd.border}; color:${hd.text2}; }
.nl-bn:hover { border-color:${hd.accent}; color:${hd.accent}; }
.nl-fr { display:flex; gap:8px; }

/* ── Пустое состояние ── */
.nl-empty { text-align:center; padding:54px 20px; color:${hd.text2}; font-family:var(--nl-font); font-size:14px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
.nl-empty-icon { font-size:40px; margin-bottom:12px; opacity:.4; }
.nl-fa { opacity:.5 !important; pointer-events:none !important; }

/* ── Диалоги ── */
.nl-dov { position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,.85); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; font-family:var(--nl-font); animation:nl-fade .15s ease; }
.nl-dbox { background:${hd.bg}; border:1px solid ${hd.border}; clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); padding:24px; width:560px; max-width:94vw; max-height:90vh; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,.8); display:flex; flex-direction:column; gap:16px; animation:nl-up .18s ease; }
.nl-dt { font-family:var(--nl-font); font-weight:700; font-size:16px; letter-spacing:.05em; text-transform:uppercase; color:${hd.text}; border-bottom:1px solid ${hd.border}; padding-bottom:12px; }
.nl-f  { display:flex; flex-direction:column; gap:6px; }
.nl-f label { font-family:var(--nl-font); font-size:11px; color:${hd.text2}; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
.nl-ph-hint { font-size:11px; color:${hd.text2}; line-height:1.8; font-family:var(--nl-font); }
.nl-ph-hint code { background:${hd.bg3}; padding:1px 6px; color:${hd.accent}; font-size:11px; font-family:'Share Tech Mono',monospace; }
.nl-in, .nl-sel, .nl-ta { background:${hd.bg2}; border:1px solid ${hd.border}; color:${hd.text}; padding:10px 14px; font-family:var(--nl-font); font-size:14px; outline:none; transition:border-color .15s; width:100%; box-sizing:border-box; }
.nl-in:focus, .nl-sel:focus, .nl-ta:focus { border-color:${hd.accent}; box-shadow:0 0 0 1px ${hd.accent}20; }
.nl-ta { resize:vertical; min-height:120px; line-height:1.6; }
.nl-sel option { background:${hd.bg2}; }
.nl-da { display:flex; gap:8px; justify-content:flex-end; margin-top:4px; }

/* Вкладки в диалоге */
.nl-dtabs { display:flex; gap:2px; border-bottom:1px solid ${hd.border}; margin-bottom:2px; }
.nl-dtab { padding:10px 16px; background:none; border:none; border-bottom:2px solid transparent; color:${hd.text2}; font-family:var(--nl-font); font-size:13px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; cursor:pointer; transition:all .15s; margin-bottom:-1px; }
.nl-dtab:hover { color:${hd.text}; }
.nl-dtab.active { color:${hd.accent}; border-bottom-color:${hd.accent}; }
.nl-dpanel { display:none; flex-direction:column; gap:13px; }
.nl-dpanel.active { display:flex; }

/* ── Выбор темы ── */
.nl-hov { position:fixed; inset:0; z-index:999998; background:rgba(0,0,0,.82); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; font-family:var(--nl-font); }
.nl-hbox { background:${hd.bg}; border:1px solid ${hd.border}; clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px)); padding:22px; width:360px; box-shadow:0 16px 50px rgba(0,0,0,.8); }
.nl-htitle { font-family:var(--nl-font); font-weight:700; font-size:16px; letter-spacing:.08em; text-transform:uppercase; color:${hd.text}; margin-bottom:16px; text-align:center; }
.nl-hgrid { display:flex; flex-direction:column; gap:8px; }
.nl-hi { display:flex; align-items:center; gap:12px; padding:11px 16px; border:1px solid ${hd.border}; cursor:pointer; transition:all .15s; background:${hd.bg2}; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
.nl-hi:hover { border-color:var(--th-a); transform:translateX(3px); }
.nl-hi.active { border-color:var(--th-a); background:var(--th-a)0d; }
.nl-hs { width:26px; height:26px; flex-shrink:0; clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%); }
.nl-hn { font-family:var(--nl-font); font-size:14px; font-weight:700; letter-spacing:.05em; color:${hd.text}; }
.nl-hclose { margin-top:14px; width:100%; padding:10px; border:1px solid ${hd.border}; background:${hd.bg2}; color:${hd.text2}; cursor:pointer; font-family:var(--nl-font); font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; transition:all .15s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px)); }
.nl-hclose:hover { color:${hd.text}; border-color:${hd.accent}; }

/* ── Статистика / История / Настройки ── */
.nl-stat-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; border-left:2px solid ${hd.accent}40; }
.nl-stat-title { color:${hd.text}; font-family:var(--nl-font); font-size:13px; font-weight:600; letter-spacing:.05em; }
.nl-stat-val { font-weight:700; font-family:'Share Tech Mono',monospace; font-size:14px; }
.nl-stat-val.ok   { color:#22c55e; } .nl-stat-val.warn { color:#f59e0b; } .nl-stat-val.err  { color:#ef4444; }
.nl-stat-details  { font-size:11px; color:${hd.text2}; margin-top:5px; line-height:1.55; font-family:var(--nl-font); }
.nl-stat-section  { font-family:var(--nl-font); font-size:11px; color:${hd.accent}; letter-spacing:1.2px; text-transform:uppercase; margin:12px 0 6px; font-weight:700; }
.nl-stat-grid     { display:flex; flex-direction:column; gap:6px; }
.nl-bar-wrap      { display:flex; align-items:center; gap:9px; }
.nl-bar           { flex:1; height:4px; background:${hd.border}; overflow:hidden; }
.nl-bar-fill      { height:100%; transition:width .4s ease; }
.nl-hist-item { display:flex; gap:11px; align-items:flex-start; padding:10px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; border-left:2px solid transparent; cursor:pointer; transition:all .15s; clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); }
.nl-hist-item:hover { border-left-color:${hd.accent}; }
.nl-hist-dot  { width:8px; height:8px; flex-shrink:0; margin-top:4px; }
.nl-hist-body { flex:1; min-width:0; }
.nl-hist-tpl  { font-family:var(--nl-font); font-size:13px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:${hd.text}; }
.nl-hist-thread { font-size:12px; color:${hd.text2}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-family:var(--nl-font); }
.nl-hist-time { font-size:11px; color:${hd.text2}; flex-shrink:0; font-family:'Share Tech Mono',monospace; }
.nl-set-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${hd.bg2}; border:1px solid ${hd.border}; }
.nl-set-label { font-family:var(--nl-font); font-size:13px; color:${hd.text}; font-weight:700; letter-spacing:.05em; }
.nl-set-desc  { font-size:11px; color:${hd.text2}; margin-top:2px; font-family:var(--nl-font); }
.nl-tag-list  { display:flex; flex-wrap:wrap; gap:6px; }
.nl-tag { display:flex; align-items:center; gap:5px; background:${hd.bg3}; border:1px solid ${hd.border}; padding:4px 12px; font-family:'Share Tech Mono',monospace; font-size:11px; color:${hd.text2}; }
.nl-tag button { background:none; border:none; color:${hd.text2}; cursor:pointer; font-size:14px; line-height:1; padding:0; }
.nl-tag button:hover { color:#ef4444; }
.nl-verdict { text-align:center; padding:10px 16px; font-family:var(--nl-font); font-weight:700; font-size:14px; text-transform:uppercase; letter-spacing:.4px; clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px)); }

/* ── Конструктор нарушений ── */
.nl-rb-group { font-family:var(--nl-font); font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:${hd.text2}; padding:8px 2px 2px; }
.nl-rb-row { display:flex; align-items:flex-start; gap:8px; padding:8px 12px; background:${hd.bg2}; border:1px solid ${hd.border}; cursor:pointer; font-family:var(--nl-font); font-size:12px; color:${hd.text}; }
.nl-rb-row:hover { border-color:${hd.accent}44; }
.nl-rb-row input { margin-top:2px; flex-shrink:0; accent-color:${hd.accent}; }
.nl-rb-row b { color:${hd.accent}; font-family:'Share Tech Mono',monospace; }
.nl-rb-pen { color:${hd.text2}; opacity:.85; }

/* ── Мастер решений ── */
.nl-wiz-steps { display:flex; gap:6px; }
.nl-wiz-step {
    flex:1; text-align:center; padding:7px 4px;
    font-family:var(--nl-font); font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
    color:${hd.text2}; border:1px solid ${hd.border}; background:${hd.bg2};
    clip-path:polygon(0 0,calc(100% - 7px) 0,100% 7px,100% 100%,7px 100%,0 calc(100% - 7px));
}
.nl-wiz-step.active { color:${hd.accent}; border-color:${hd.accent}66; background:${hd.accent}0d; }
.nl-wiz-step.done   { color:${hd.text}; }
.nl-wiz-excerpt {
    font-size:12px; color:${hd.text2}; background:${hd.bg3}; border:1px solid ${hd.border};
    padding:12px 14px; max-height:140px; overflow-y:auto; line-height:1.55; font-family:var(--nl-font); white-space:pre-wrap;
}
.nl-wiz-verdict {
    display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 14px;
    border:1px solid; font-family:var(--nl-font); font-size:13px; font-weight:700; letter-spacing:.03em;
    flex-wrap:wrap;
}
.nl-wiz-cat { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.nl-wiz-cat button {
    display:flex; flex-direction:column; gap:4px; align-items:flex-start; padding:14px 16px;
    background:${hd.bg2}; border:1px solid ${hd.border}; color:${hd.text}; cursor:pointer;
    font-family:var(--nl-font); text-align:left; transition:all .15s;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
}
.nl-wiz-cat button:hover { border-color:${hd.accent}; background:${hd.accent}0d; }
.nl-wiz-cat .t { font-size:15px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; }
.nl-wiz-cat .d { font-size:11px; color:${hd.text2}; }
.nl-wiz-match {
    display:inline-block; font-size:10px; font-weight:700; font-family:var(--nl-font);
    padding:1px 7px; background:${hd.accent}22; color:${hd.accent};
    text-transform:uppercase; letter-spacing:.5px; margin-left:6px; white-space:nowrap;
}
.nl-wiz-tplrow {
    display:flex; flex-direction:column; gap:3px; padding:10px 14px;
    background:${hd.bg2}; border:1px solid ${hd.border}; border-left:2px solid transparent;
    cursor:pointer; transition:all .15s;
}
.nl-wiz-tplrow:hover { border-left-color:${hd.accent}; background:${hd.accent}08; }
.nl-wiz-quick {
    display:flex; gap:8px; flex-wrap:wrap; align-items:center; padding:10px 12px;
    background:#ffa50210; border:1px solid #ffa50240;
    font-family:var(--nl-font); font-size:12px; color:#ffa502; font-weight:600;
}

/* ── Клавиатурная навигация по карточкам ── */
.nl-card.nl-card-active { border-left-color:${hd.accent}; box-shadow:0 0 0 1px ${hd.accent}, 0 4px 20px rgba(0,0,0,.3); }

/* ── Тег происхождения (глобальный поиск) ── */
.nl-badge-tab { background:${hd.bg3}; color:${hd.text2}; border:1px solid ${hd.border}; }

/* ── Нотификация ── */
.nl-notif {
    position:fixed; top:20px; right:20px; padding:10px 18px;
    font-family:var(--nl-font); font-size:13px; font-weight:700;
    letter-spacing:.08em; text-transform:uppercase; z-index:200000;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
    animation:nl-up .2s ease;
}

/* ── Профиль куратора ── */
.nl-prof-head { display:flex; gap:16px; align-items:center; }
.nl-prof-lvl {
    width:74px; height:74px; flex-shrink:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:${hd.accent}10; border:1px solid ${hd.accent}55; color:${hd.accent};
    font-family:var(--nl-font); font-size:30px; font-weight:700; line-height:1;
    clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
}
.nl-prof-lvl span { font-size:10px; letter-spacing:2px; color:${hd.text2}; margin-bottom:3px; }
.nl-prof-ach { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.nl-prof-a {
    display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 4px 8px;
    background:${hd.bg2}; border:1px solid ${hd.border}; text-align:center; opacity:.35; filter:grayscale(1);
    clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px));
}
.nl-prof-a.on { opacity:1; filter:none; border-color:${hd.accent}44; background:${hd.accent}08; }
.nl-prof-a .i { font-size:22px; }
.nl-prof-a .n { font-family:var(--nl-font); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.03em; color:${hd.text}; line-height:1.2; }
.nl-prof-a .d { font-family:'Share Tech Mono',monospace; font-size:10px; color:${hd.text2}; }

/* ── Командная строка (Alt+K) ── */
.nl-cmd-ov {
    position:fixed; inset:0; z-index:999999;
    background:rgba(0,0,0,.6); backdrop-filter:blur(3px);
    display:flex; align-items:flex-start; justify-content:center;
    padding-top:14vh; font-family:var(--nl-font); animation:nl-fade .12s ease;
}
.nl-cmd-box {
    width:560px; max-width:94vw; background:${hd.bg}; border:1px solid ${hd.accent}55;
    clip-path:polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px));
    box-shadow:0 0 0 1px ${hd.accent}15, 0 24px 60px rgba(0,0,0,.85);
    display:flex; flex-direction:column; animation:nl-up .15s ease;
}
.nl-cmd-in {
    background:${hd.bg2}; border:none; border-bottom:1px solid ${hd.border};
    color:${hd.text}; padding:14px 18px; font-family:'Share Tech Mono',monospace; font-size:15px; outline:none;
}
.nl-cmd-in::placeholder { color:${hd.text2}; font-size:13px; }
.nl-cmd-list { max-height:320px; overflow-y:auto; display:flex; flex-direction:column; }
.nl-cmd-list::-webkit-scrollbar { width:4px; }
.nl-cmd-list::-webkit-scrollbar-thumb { background:${hd.border}; }
.nl-cmd-item {
    display:flex; align-items:center; gap:11px; padding:9px 16px; cursor:pointer;
    font-size:13px; color:${hd.text}; border-left:2px solid transparent;
}
.nl-cmd-item.active, .nl-cmd-item:hover { background:${hd.accent}0d; border-left-color:${hd.accent}; }
.nl-cmd-ico { width:20px; text-align:center; flex-shrink:0; }
.nl-cmd-lbl { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:600; letter-spacing:.02em; }
.nl-cmd-tag { font-family:'Share Tech Mono',monospace; font-size:10px; color:${hd.text2}; flex-shrink:0; text-transform:uppercase; }
.nl-cmd-empty { padding:18px; text-align:center; color:${hd.text2}; font-size:13px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
.nl-cmd-hint { padding:8px 16px; border-top:1px solid ${hd.border}; font-family:'Share Tech Mono',monospace; font-size:10px; color:${hd.text2}; letter-spacing:.5px; }

/* ── Док-панель (режим «сбоку»): та же разметка, другой контейнер ── */
@keyframes nl-dock-in { from{transform:translateX(40px);opacity:0} to{transform:none;opacity:1} }
.nl-ov.nl-dock {
    inset:0 0 0 auto; width:min(440px,100vw);
    background:none; backdrop-filter:none;
    display:block; animation:none;
}
.nl-dock .nl-m {
    width:100%; height:100%; max-width:none; max-height:none;
    flex-direction:column; clip-path:none;
    border:none; border-left:1px solid ${hd.border};
    box-shadow:-16px 0 44px rgba(0,0,0,.65);
    animation:nl-dock-in .2s ease;
}
.nl-dock .nl-sidebar { width:100%; border-right:none; border-bottom:1px solid ${hd.border}; flex-shrink:0; }
.nl-dock .nl-logo-area { padding:10px 16px 8px; display:flex; align-items:baseline; gap:10px; }
.nl-dock .nl-logo-text { font-size:18px; }
.nl-dock .nl-tabs { flex:none; flex-direction:row; overflow-x:auto; overflow-y:hidden; padding:0 8px; gap:0; }
.nl-dock .nl-tabs::-webkit-scrollbar { height:3px; }
.nl-dock .nl-tab { padding:9px 10px; border-left:none; border-bottom:2px solid transparent; white-space:nowrap; font-size:12px; }
.nl-dock .nl-tab.active { border-bottom-color:${hd.accent}; background:none; }
.nl-dock .nl-sb-foot { flex-direction:row; flex-wrap:wrap; padding:8px; gap:4px; }
.nl-dock .nl-hb { width:auto; flex:1 1 45%; padding:7px 6px; font-size:11px; text-align:center; }
.nl-dock .nl-hd { padding:10px 12px 9px; }
.nl-dock .nl-ct { padding:12px; }
.nl-dock .nl-grid { grid-template-columns:1fr; }
.nl-dock .nl-ft { padding:10px 12px; gap:8px; }

/* ── Телефон: всё в одну колонку, крупнее зоны нажатия ── */
@media (max-width: 759px) {
    .nl-ov.nl-dock { width:100vw; }
    .nl-dock .nl-m { border-left:none; }
    .nl-dock .nl-sb-foot .nl-hb { flex:1 1 30%; }
    .nl-dov { align-items:flex-start; padding:8px 0; overflow-y:auto; }
    .nl-dbox { padding:14px; gap:12px; max-height:none; width:auto !important; max-width:calc(100vw - 16px); }
    .nl-wiz-cat { grid-template-columns:1fr; }
    .nl-prof-ach { grid-template-columns:repeat(3,1fr); }
    .nl-set-row { flex-wrap:wrap; gap:8px; }
    .nl-da { flex-wrap:wrap; }
    .nl-cmd-ov { padding-top:4vh; }
    .nl-tooltip { display:none; }
    .nl-card:hover { transform:none; }
    .nl-btn, .nl-hb, .nl-tab, .nl-pp, .nl-rb-row { min-height:40px; }
    #nl-inline-wrap { margin:6px 0 0 !important; }
    #nl-float-panel { bottom:10px; right:10px; }
    #nl-float-panel .nl-btn-main { width:150px; }
    #nl-rules-banner { left:8px; right:8px; bottom:8px; max-width:none; }
}

/* ── Плавающая панель (если кнопки «Ответить» нет) ── */
#nl-float-panel { position:fixed; bottom:20px; right:20px; z-index:2147483000; display:flex; flex-direction:column; gap:8px; align-items:flex-end; }
#nl-float-panel .nl-btn-main { background:${hd.bg2} !important; width:165px; justify-content:center !important; margin:0 !important; }
#nl-float-panel .nl-btn-main:hover { background:${hd.accent} !important; }
.nl-rb-note { font-size:10px; font-family:var(--nl-font); padding:0 5px; margin-left:2px; border:1px solid ${hd.accent}55; color:${hd.accent}; letter-spacing:.03em; }

/* ── Контекст темы: срок рассмотрения, инфо в мастере ── */
.nl-dl { font-family:'Share Tech Mono',monospace; font-size:11px; color:${hd.text2}; letter-spacing:.3px; }
.nl-dl.soon { color:#ffa502; } .nl-dl.over { color:#ff4757; }
.nl-wiz-info { font-family:var(--nl-font); font-size:12px; color:${hd.text2}; padding:6px 10px; background:${hd.bg2}; border:1px solid ${hd.border}; }
.nl-wiz-info b { color:${hd.text}; }

/* ── Предпросмотр поста (тёмный фон, как у темы форума) ── */
.nl-pv { background:#1e1f22; color:#d1d5d8; border:1px solid ${hd.border}; padding:16px; max-height:60vh; overflow:auto; font:15px/1.5 'Times New Roman',serif; word-break:break-word; }
.nl-pv img { max-width:100%; height:auto; }
.nl-pv a { color:#54acd2; }
.nl-pv-sp { margin:6px auto; max-width:90%; text-align:left; border:1px solid #3a3d42; background:#26282c; padding:4px 10px; }
.nl-pv-sp summary { cursor:pointer; color:#9aa0a6; font-family:var(--nl-font); font-size:13px; }
.nl-pv-user { color:#54acd2; }
.nl-pv-q { margin:8px 0; padding:10px 14px; border-left:3px solid #54acd2; background:#26282c; text-align:left; font-family:Arial, sans-serif; }

/* ── Уведомление об обновлении правил ── */
#nl-rules-banner { position:fixed; left:20px; bottom:20px; z-index:2147483000; max-width:460px; display:flex; gap:12px; align-items:flex-start;
    background:${hd.bg}; color:${hd.text}; border:1px solid #ffa502; border-left:4px solid #ffa502; padding:12px 14px;
    font:13px/1.5 var(--nl-font), sans-serif; box-shadow:0 10px 30px rgba(0,0,0,.5); }
#nl-rules-banner a { color:${hd.accent}; }
#nl-rules-banner button { flex-shrink:0; background:#ffa502; color:#000; border:none; padding:6px 12px; cursor:pointer; font:700 12px var(--nl-font), sans-serif; }

/* ── Клавиатурный фокус и кнопки-иконки ── */
button.nl-cl { padding:0; font-family:inherit; }
.nl-ov :focus-visible, .nl-dov :focus-visible, .nl-hov :focus-visible, .nl-cmd-ov :focus-visible, #nl-float-panel :focus-visible, #nl-inline-wrap :focus-visible {
    outline:2px solid ${hd.accent} !important; outline-offset:2px; }
.nl-card:focus-visible { border-left-color:${hd.accent}; }
@media (prefers-reduced-motion: reduce) { .nl-ov *, .nl-dov *, .nl-logo-area::after, .nl-m::before { animation:none !important; transition:none !important; } }
${hd.dbh ? `
/* ── Detroit: Become Human — фирменный декор CyberLife ── */
/* LED-индикатор андроида в углу логотипа */
@keyframes nl-led { 0%,100% { box-shadow:0 0 0 0 ${hd.accent}55; } 50% { box-shadow:0 0 0 7px transparent; } }
.nl-logo-area::before {
    content:''; position:absolute; top:22px; right:18px; width:12px; height:12px; border-radius:50%;
    border:2px solid ${hd.accent};
    background:radial-gradient(circle, ${hd.accent} 0 42%, transparent 50%);
    animation:nl-led 2.4s ease-in-out infinite;
}
.nl-dock .nl-logo-area::before { top:14px; }
.nl-logo-text { font-family:var(--nl-font-title); font-size:22px; letter-spacing:4px; }
.nl-dock .nl-logo-text { font-size:16px; }
.nl-dt, .nl-htitle { font-family:var(--nl-font-title); font-size:14px; letter-spacing:2.5px; font-weight:400; }
/* плоские углы вместо срезов + сканирующая линия по окну */
.nl-m, .nl-dbox, .nl-cmd-box, .nl-hbox, .nl-card, .nl-btn, .nl-hb, .nl-notif, .nl-verdict, .nl-badge, .nl-sr, .nl-cl, .nl-sin, .nl-ib, .nl-hi, .nl-hs, .nl-hclose, .nl-hist-item, .nl-wiz-step, .nl-wiz-cat button, .nl-prof-lvl, .nl-prof-a { clip-path:none; }
.nl-m { position:relative; }
.nl-m::before {
    content:''; position:absolute; left:0; right:0; top:0; height:1px; z-index:9; pointer-events:none;
    background:linear-gradient(90deg,transparent,${hd.accent},transparent); opacity:.5;
    animation:nl-dbh-scan 6s linear infinite;
}
@keyframes nl-dbh-scan { from { top:0; } to { top:100%; } }
/* уголки-скобки на карточках — рамка анализа улик */
.nl-card::before, .nl-card::after {
    content:''; position:absolute; width:12px; height:12px; border:0 solid ${hd.accent};
    transition:all .15s; pointer-events:none; opacity:.85;
}
.nl-card::before { top:-1px; left:-1px; border-top-width:2px; border-left-width:2px; }
.nl-card::after  { bottom:-1px; right:-1px; border-bottom-width:2px; border-right-width:2px; }
.nl-card:hover::before, .nl-card:hover::after { width:24px; height:24px; }
/* скошенные кнопки-«реплики», как варианты диалога */
.nl-btn { clip-path:polygon(9px 0,100% 0,calc(100% - 9px) 100%,0 100%); padding-left:22px; padding-right:22px; }
.nl-btn-sm { padding-left:18px; padding-right:18px; }
.nl-pp { clip-path:polygon(7px 0,100% 0,calc(100% - 7px) 100%,0 100%); padding-left:16px; padding-right:16px; }
/* «девиантный» глитч — включается командой rA9 */
@keyframes nl-glitch {
    0%   { text-shadow:2px 0 rgba(229,66,79,.65), -2px 0 ${hd.accent}aa; }
    49%  { text-shadow:2px 0 rgba(229,66,79,.65), -2px 0 ${hd.accent}aa; }
    50%  { text-shadow:-2px 0 rgba(229,66,79,.65), 2px 0 ${hd.accent}aa; transform:translateX(1px); }
    100% { text-shadow:-2px 0 rgba(229,66,79,.65), 2px 0 ${hd.accent}aa; }
}
body.nl-ra9 .nl-m, body.nl-ra9 .nl-dbox, body.nl-ra9 .nl-cmd-box, body.nl-ra9 .nl-btn-main { animation:nl-glitch .28s steps(2) infinite; }
` : ''}
        `;
    }

    function applyCSS() {
        if (styleEl) styleEl.remove();
        styleEl = document.createElement('style');
        styleEl.textContent = buildCSS(theme());
        document.head.appendChild(styleEl);
    }

