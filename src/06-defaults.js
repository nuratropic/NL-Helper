    // общие теги шаблонов игроков без номера пункта
    const PLAYER_TAGS = {
        p1: 'игроки, жалоба, рассмотрение, закреплено, в работе',
        p2: 'игроки, жалоба, одобрено, наказание выдано, регламент, закреплено',
        p3: 'игроки, жалоба, отказано, нарушений нет, чист',
        p4: 'игроки, жалоба, отказано, недостаточно доказательств, видео, скриншот',
        p5: 'игроки, жалоба, отказано, не по регламенту, формат, форма подачи',
        p6: 'игроки, жалоба, ожидание, запрос доказательств, 24 часа, предоставить видео',
        p7: 'игроки, жалоба, решено, ситуация урегулирована, закрыто',
        p8: 'игроки, жалоба, одобрено, пункт правил, ручной выбор',
        p9: 'игроки, жалоба, отказано, пункт правил, ручной выбор',
        p20: 'игроки, жалоба, отказано, срок, истек срок, 72 часа, три дня, поздно',
        p21: 'игроки, жалоба, отказано, третье лицо, не участник',
        p22: 'игроки, жалоба, отказано, название темы, заголовок, форма названия',
        p23: 'игроки, жалоба, отказано, time, /time, нет времени',
        p24: 'игроки, жалоба, отказано, вк, вконтакте, одноклассники, соцсети, нет доступа, доказательства недоступны',
        p25: 'игроки, жалоба, отказано, видео, нужна видеозапись, скриншотов мало, db, обман',
        p26: 'игроки, жалоба, отказано, монтаж, музыка, редактирование, тайм-коды, таймкоды',
    };

    // собирает все шаблоны по умолчанию: базовые + по два на каждый пункт правил
    function buildDefaultTemplates() {
        const defs = JSON.parse(JSON.stringify(BASE_TEMPLATES));
        defs.players.forEach(t => { if (PLAYER_TAGS[t.id]) t.tags = PLAYER_TAGS[t.id]; });
        // шаблоны «пункт правил вручную» — с заглушкой вместо номера и описания
        const stub = (approved) => `[SIZE=6][COLOR=rgb(255,255,255)][I]Ваша жалоба была рассмотрена и получает статус — [/I][/COLOR][COLOR=${approved?'#61bd6d':'#ff4757'}][I]${approved?'Одобрено':'Отказано'}[/I][/COLOR][COLOR=rgb(255,255,255)][I].\n${approved?'Игрок понесёт наказание по следующему пункту общих правил серверов;':'Нарушение не подтверждено. Тем не менее, обратите внимание на следующий пункт правил;'}[/I][/COLOR][/SIZE]\n[SPOILER="Посмотреть пункт правил"][COLOR=rgb(209,72,65)][SIZE=6][I]?.??.[/I][/SIZE][/COLOR][SIZE=6][I] [COLOR=rgb(209,213,216)]Описание пункта правил[/COLOR][/I][/SIZE][COLOR=rgb(209,72,65)][SIZE=6][I] | Наказание[/I][/SIZE][/COLOR][/SPOILER]`;
        defs.players.find(t => t.id === 'p8').content = stub(true);
        defs.players.find(t => t.id === 'p9').content = stub(false);
        Object.entries(RULES).forEach(([rule, r]) => {
            if (r.set !== 'general') return; // правила организаций/лидеров — через конструктор, мастер и Alt+K
            const label = r.note ? `${r.num} прим.` : r.num;
            [[true, r.a], [false, r.d]].forEach(([approved, id]) => {
                const word = approved ? 'Одобрено' : 'Отказано';
                defs.players.push({
                    id, isRaw:true, isPinned:false, isNew:false, uses:0, rule,
                    prefix: approved ? P.ACCEPT : P.UNACCEPT,
                    title: `${word} — ${r.short} [${label}]`,
                    tags: `игроки, жалоба, ${word.toLowerCase()}, пункт ${r.num}, ${r.tags}`,
                    content: ruleBody(approved, rule),
                });
            });
        });
        return defs;
    }
    const DEFAULT_TEMPLATES = buildDefaultTemplates();
    const DEFAULT_BY_ID = {};
    Object.entries(DEFAULT_TEMPLATES).forEach(([tab, arr]) => arr.forEach(t => { DEFAULT_BY_ID[t.id] = { tab, tpl: t }; }));
    // поля шаблона, которые пользователь может менять; только они попадают в overrides
    const TPL_FIELDS = ['title', 'prefix', 'tags', 'content', 'isPinned', 'isNew', 'uses'];
    // шаблоны, чей текст изменён в 6.3 — при переносе из v5 старый текст не считаем правкой пользователя
    const CHANGED_IN_63 = new Set(['rb2', 'rb3', 'rb4', 'o4']);

