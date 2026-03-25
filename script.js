/* ── State ───────────────────────────────────────────────── */
let mergedJson = null;
let isSorted   = false;

/* ── Elements ────────────────────────────────────────────── */
const dropZone1   = document.getElementById('dropZone1');
const dropZone2   = document.getElementById('dropZone2');
const fileInput1  = document.getElementById('fileInput1');
const fileInput2  = document.getElementById('fileInput2');
const zoneFile1   = document.getElementById('zoneFile1');
const zoneFile2   = document.getElementById('zoneFile2');
const mergeBtn    = document.getElementById('mergeBtn');
const clearBtn    = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const terminal    = document.getElementById('terminal');
const statsRow    = document.getElementById('statsRow');
const themeToggle = document.getElementById('themeToggle');
const toastContainer = document.getElementById('toastContainer');

const totalItemsEl = document.getElementById('totalItems');
const uniqueTypesEl = document.getElementById('uniqueTypes');
const longestNameEl = document.getElementById('longestName');
const avgLengthEl   = document.getElementById('avgLength');

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setupZone(dropZone1, fileInput1, zoneFile1, 1);
    setupZone(dropZone2, fileInput2, zoneFile2, 2);
    mergeBtn.addEventListener('click', runMerge);
    clearBtn.addEventListener('click', clearAll);
    downloadBtn.addEventListener('click', downloadJson);
    themeToggle.addEventListener('click', toggleTheme);
});

/* ── Theme ───────────────────────────────────────────────── */
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.dataset.theme === 'dark';
    html.dataset.theme = isDark ? 'light' : 'dark';
    document.getElementById('iconDark').style.display  = isDark ? 'none' : '';
    document.getElementById('iconLight').style.display = isDark ? '' : 'none';
}

/* ── Upload zones ────────────────────────────────────────── */
function setupZone(zone, input, label, num) {
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', e => onFileChosen(e.target.files[0], zone, label, num));

    zone.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragover',  e => { e.preventDefault(); e.stopPropagation(); });
    zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.json')) {
            toast('Only .json files are accepted', 'error'); return;
        }
        // inject into input
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        onFileChosen(file, zone, label, num);
    });
}

function onFileChosen(file, zone, label, num) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
        toast('Only .json files are accepted', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
        toast('File exceeds 10 MB limit', 'error'); return;
    }

    label.textContent = `${truncateName(file.name)}  (${fmtSize(file.size)})`;
    zone.classList.add('has-file');
    logLine(`Loaded → ${file.name}`, 'success');
    toast(`File ${num} loaded: ${file.name}`, 'success');
}

/* ── Merge ───────────────────────────────────────────────── */
async function runMerge() {
    const f1 = fileInput1.files[0];
    const f2 = fileInput2.files[0];
    if (!f1 || !f2) {
        toast('Please load both JSON files first', 'error');
        return;
    }

    clearTerminal();
    logLine('Reading files...', 'info');

    try {
        const [j1, j2] = await Promise.all([readJson(f1), readJson(f2)]);
        logLine(`Parsed → ${f1.name}`, '');
        logLine(`Parsed → ${f2.name}`, '');

        logLine('Merging...', 'info');
        mergedJson = deepMerge(j1, j2);

        logLine('Sorting model data...', 'info');
        sortModelData(mergedJson);
        sortAlphabetically();

        // Log each item type
        if (mergedJson.items) {
            for (const type in mergedJson.items) {
                const count = Array.isArray(mergedJson.items[type]) ? mergedJson.items[type].length : '?';
                logLine(`Generated → ${type}  [${count} entries]`, '');
            }
        }

        logLine('Done.', 'success');
        updateStats();
        statsRow.style.display = 'grid';
        downloadBtn.disabled = false;
        isSorted = true;
        toast('Merge complete!', 'success');
    } catch (err) {
        logLine(`Error: ${err.message}`, 'error');
        toast(err.message, 'error');
    }
}

function readJson(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => {
            try { res(JSON.parse(e.target.result)); }
            catch { rej(new Error(`Invalid JSON in ${file.name}`)); }
        };
        r.onerror = () => rej(new Error(`Could not read ${file.name}`));
        r.readAsText(file);
    });
}

function deepMerge(a, b) {
    const out = JSON.parse(JSON.stringify(a));
    for (const k in b) {
        if (!Object.prototype.hasOwnProperty.call(b, k)) continue;
        if (k in out && !Array.isArray(out[k]) && typeof out[k] === 'object' && typeof b[k] === 'object') {
            out[k] = deepMerge(out[k], b[k]);
        } else if (k in out && Array.isArray(out[k]) && Array.isArray(b[k])) {
            const seen = new Set(out[k].map(i => i.custom_model_data));
            out[k] = [...out[k], ...b[k].filter(i => !seen.has(i.custom_model_data))];
        } else {
            out[k] = b[k];
        }
    }
    return out;
}

function sortModelData(json) {
    if (!json.items) return;
    for (const t in json.items) {
        if (Array.isArray(json.items[t]))
            json.items[t].sort((a, b) => (a.custom_model_data || 0) - (b.custom_model_data || 0));
    }
}

function sortAlphabetically() {
    if (!mergedJson?.items) return;
    const sorted = {};
    Object.keys(mergedJson.items)
        .sort((a, b) => a.replace('minecraft:','').localeCompare(b.replace('minecraft:','')))
        .forEach(k => sorted[k] = mergedJson.items[k]);
    mergedJson.items = sorted;
}

/* ── Stats ───────────────────────────────────────────────── */
function updateStats() {
    if (!mergedJson?.items) return;
    let total = 0, totalLen = 0, longest = 0;
    const types = new Set();
    for (const t in mergedJson.items) {
        types.add(t);
        if (Array.isArray(mergedJson.items[t])) {
            for (const item of mergedJson.items[t]) {
                total++;
                if (item.name) { totalLen += item.name.length; longest = Math.max(longest, item.name.length); }
            }
        }
    }
    totalItemsEl.textContent = total.toLocaleString();
    uniqueTypesEl.textContent = types.size.toLocaleString();
    longestNameEl.textContent = longest;
    avgLengthEl.textContent   = total ? Math.round(totalLen / total) : 0;
}

/* ── Download ────────────────────────────────────────────── */
function downloadJson() {
    if (!mergedJson) { toast('Nothing to download', 'error'); return; }
    const ts   = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    const name = `geyser_merged_${isSorted ? 'sorted_' : ''}${ts}.json`;
    const blob = new Blob([JSON.stringify(mergedJson, null, 2)], { type: 'application/json' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    logLine(`Downloaded → ${name}`, 'success');
    toast(`Downloaded ${name}`, 'success');
}

/* ── Clear ───────────────────────────────────────────────── */
function clearAll() {
    fileInput1.value = '';
    fileInput2.value = '';
    zoneFile1.textContent = 'No file selected';
    zoneFile2.textContent = 'No file selected';
    dropZone1.classList.remove('has-file');
    dropZone2.classList.remove('has-file');
    clearTerminal();
    statsRow.style.display = 'none';
    downloadBtn.disabled = true;
    mergedJson = null;
    isSorted   = false;
    toast('Cleared', 'warn');
}

/* ── Terminal helpers ────────────────────────────────────── */
function clearTerminal() {
    terminal.innerHTML = '';
}

function logLine(text, type = '') {
    const line = document.createElement('span');
    line.className = `log-line log-${type}`;

    if (type === '') {
        // "Generated → name" style
        const parts = text.split('→');
        if (parts.length === 2) {
            line.innerHTML = `${escHtml(parts[0])}<span class="log-arrow">→</span><span class="log-name">${escHtml(parts[1])}</span>`;
        } else {
            line.textContent = text;
        }
    } else {
        line.textContent = text;
    }

    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Toast ───────────────────────────────────────────────── */
function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity .25s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 260);
    }, 3500);
}

/* ── Utils ───────────────────────────────────────────────── */
function truncateName(name, max = 14) {
    const dot = name.lastIndexOf('.');
    const ext  = dot !== -1 ? name.slice(dot) : '';
    const base = dot !== -1 ? name.slice(0, dot) : name;
    if (base.length <= max) return name;
    return base.slice(0, max) + '...' + ext;
}

function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
}
