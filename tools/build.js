#!/usr/bin/env node
// Сборка NL Helper: склеивает src/*.js (по порядку имён) в один nl_helper.js для Tampermonkey.
//   node tools/build.js          — собрать nl_helper.js
//   node tools/build.js --check  — проверить, что nl_helper.js совпадает со сборкой из src/ (для CI)
// Зависимостей нет — нужен только Node.js 18+.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const outFile = path.join(root, 'nl_helper.js');
const check = process.argv.includes('--check');

const files = fs.readdirSync(srcDir).filter(f => /^\d{2}-.+\.js$/.test(f)).sort();
if (!files.length) { console.error('В src/ нет модулей'); process.exit(1); }
const out = files.map(f => fs.readFileSync(path.join(srcDir, f), 'utf8')).join('');

// версия в заголовке userscript и константа VERSION должны совпадать
const metaVer = (out.match(/^\/\/ @version\s+(\S+)/m) || [])[1];
const constVer = (out.match(/const VERSION = '([^']+)'/) || [])[1];
if (!metaVer || metaVer !== constVer) {
    console.error(`Версии не совпадают: @version ${metaVer} / VERSION ${constVer}`);
    process.exit(1);
}

// синтаксис проверяем до записи, чтобы не сломать рабочий файл
const tmp = path.join(require('os').tmpdir(), `nl_helper_build_${process.pid}.js`);
fs.writeFileSync(tmp, out);
try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
catch (e) { console.error('Синтаксическая ошибка в сборке:\n' + String(e.stderr || e.message)); process.exit(1); }
finally { fs.unlinkSync(tmp); }

if (check) {
    const cur = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    if (cur !== out) {
        console.error('nl_helper.js не совпадает со сборкой из src/. Запустите: npm run build');
        process.exit(1);
    }
    console.log(`OK: nl_helper.js v${metaVer} совпадает со сборкой (${files.length} модулей)`);
} else {
    fs.writeFileSync(outFile, out);
    console.log(`Собрано: nl_helper.js v${metaVer} — ${files.length} модулей, ${(Buffer.byteLength(out) / 1024).toFixed(1)} КБ`);
}
