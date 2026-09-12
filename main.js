import { normalizeUrl, normalizeAlias, scopeToCharger } from './utils.js';

const currentSeason = 17

// 同じシーズン・ルールのJSONを何度もfetchしないようにキャッシュする
const dataCache = {};

async function loadRuleData(season, rule){
  const key = `${season}/${rule}`;
  if(dataCache[key]) return dataCache[key];

  const res = await fetch(`data/${season}/${rule}.json`);
  if(!res.ok){
    throw new Error(`データの取得に失敗しました: data/${season}/${rule}.json`);
  }
  const json = await res.json();
  dataCache[key] = json;
  return json;
}
  // 指定シーズンの4ルール分をまとめて取得する（使用率の集計に使う）
  async function loadSeasonAllRules(season){
    const [eria, yagura, hoko, asari] = await Promise.all([
      loadRuleData(season, 'eria'),
      loadRuleData(season, 'yagura'),
      loadRuleData(season, 'hoko'),
      loadRuleData(season, 'asari'),
    ]);
    return { eria, yagura, hoko, asari };
  }

  // 全シーズン分の4ルールを取得して1つにまとめる(「全シーズン合算」表示用)。
  // 取得できないシーズンがあっても、そのシーズン分を単に含めないだけにする。
  async function loadAllSeasonsAllRules(){
    const perSeason = await Promise.all(SEASONS.map(s => loadSeasonAllRules(s.id).catch(() => null)));
    const combined = { eria: [], yagura: [], hoko: [], asari: [] };
    perSeason.forEach(seasonRules => {
      if(!seasonRules) return;
      RULES.forEach(r => { combined[r] = combined[r].concat(seasonRules[r] || []); });
    });
    return combined;
  }

  // 全シーズンのrosterを合算(重複なし)する。1つもroster.jsonが無ければnullを返し、
  // 「未使用ブキの補完」をしない従来通りの挙動にフォールバックする。
  async function loadAllSeasonsRoster(){
    const perSeason = await Promise.all(SEASONS.map(s => loadSeasonRoster(s.id)));
    const merged = new Set();
    let hasAny = false;
    perSeason.forEach(roster => {
      if(Array.isArray(roster)){
        hasAny = true;
        roster.forEach(w => merged.add(w));
      }
    });
    return hasAny ? Array.from(merged) : null;
  }

// ブキ名 -> {main, sub, special, category, range} の対応表。
// パスは実際に配置した場所に合わせて変更してください。
const WEAPON_INFO_URL = 'data/weapondata.json';
let weaponInfoPromise = null;
function loadWeaponInfo(){
  if(!weaponInfoPromise){
    weaponInfoPromise = fetch(WEAPON_INFO_URL).then(res => {
      if(!res.ok) throw new Error(`ブキ対応表の取得に失敗しました: ${WEAPON_INFO_URL}`);
      return res.json();
    });
  }
  return weaponInfoPromise;
}

// そのシーズン時点で実在するブキの一覧。
const rosterCache = {};
async function loadSeasonRoster(season){
  const key = String(season);
  if(key in rosterCache) return rosterCache[key];
  try{
    const res = await fetch(`data/${season}/roster.json`);
    if(!res.ok) throw new Error('roster not found');
    rosterCache[key] = await res.json();
  }catch(err){
    rosterCache[key] = null;
  }
  return rosterCache[key];
}

// ページ,ボタンの状態切り替え
let historyInitialized = false;
function showPage(page) {
  document.querySelectorAll('.view').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');

  document.querySelectorAll('header button').forEach(btn => {
    btn.classList.remove('active-btn');
  });

  document.querySelector(`button[data-page="${page}"]`)
    .classList.add('active-btn');

  // 歴代ページは全シーズン分fetchするので、実際に開かれるまで初期化を遅らせる
  if(page === 'history' && !historyInitialized){
    historyInitialized = true;
    initHistoryPage();
  }
}

// ページ読み込み時に、すべてのボタンにクリックイベントを設定する
document.querySelectorAll('header button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const page = e.currentTarget.getAttribute('data-page');
    showPage(page);
  });
});

// ルールタブ切り替え（ランキング）
document.querySelector('.rule-tabs[data-target="ranking"]').addEventListener('click', (e) => {
  const btn = e.target.closest('.rule-tab');
  if(!btn) return;
  document.querySelectorAll('.rule-tabs[data-target="ranking"] .rule-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRanking(btn.dataset.rule);
});

// 集計軸タブ切り替え（ブキ別使用率）
document.getElementById('usage-dim-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.dim-tab');
  if(!btn) return;
  document.querySelectorAll('#usage-dim-tabs .dim-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderUsage(btn.dataset.dim);
});

// シーズン一覧
function getSeason(s) {
  const year = 2022 + Math.floor((s + 1) / 4);
  const seasons = ["秋", "冬", "春", "夏"];
  const season = seasons[(s - 1) % 4];

  return `${year+season}`;
}

function getEndDate(n) {
  return new Date(2022, 11 + (n - 1) * 3, 1);
}

function generateSeasons(count){
  const seasons = [];
  let end = getEndDate(count);
  for (let i = count; i >= 2; i--) {
    const endDate = new Date(end);
    const startDate = new Date(end);
    startDate.setMonth(startDate.getMonth() - 3); 
    seasons.push({ id: `${i}`, label: `${getSeason(i)}`, start: startDate, end: endDate });
    end = startDate;
  }
  return seasons;
}
const SEASONS = generateSeasons(currentSeason);

function formatDate(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function populateSeasonSelect(selectEl){
  selectEl.innerHTML = SEASONS.map(s => `<option value="${s.id}">${s.label}</option>`).join('');
}
function updateSeasonPeriod(selectEl, periodEl){
  if(selectEl.value === 'all'){
    periodEl.textContent = '全シーズン';
    return;
  }
  const season = SEASONS.find(s => s.id === selectEl.value);
  periodEl.textContent = season ? `${formatDate(season.start)} ~ ${formatDate(season.end)}` : '';
}

/* ============ 表示ロジック ============ */

// Xパワーを常に小数第一位まで表示する(3391 -> "3391.0")
function formatPower(power){
  const n = Number(power);
  return Number.isFinite(n) ? n.toFixed(1) : power;
}

// 指定ルールについて、全シーズン分のランキングJSONをまとめて取得し、
// 1つの配列にする(シーズンが無い/取得できないものは単に含めない)
async function loadAllSeasonsRanking(rule){
  const results = await Promise.all(SEASONS.map(async season => {
    try{
      const rows = await loadRuleData(season.id, rule);
      return rows.map(row => ({ ...row, seasonId: season.id, seasonLabel: season.label }));
    }catch(err){
      return [];
    }
  }));
  return results.flat();
}

async function renderRanking(rule){
  const list = document.getElementById('rank-list');
  const seasonValue = document.getElementById('ranking-season').value;
  const isAllSeasons = seasonValue === 'all';
  const query = document.getElementById('ranking-filter').value.trim().toLowerCase();

  // 連打・素早い切り替え対策: このrender呼び出しが最新かどうかの目印
  const requestId = ++renderRanking._requestId;

  list.innerHTML = '<div class="empty-note">読み込み中…</div>';

  let combined;
  try{
    if(isAllSeasons){
      combined = await loadAllSeasonsRanking(rule);
    }else{
      const data = await loadRuleData(seasonValue, rule);
      combined = data.map((row, i) => ({ ...row, rank: i + 1 })); // 配列の並び順をそのまま順位にする
    }
  }catch(err){
    if(requestId !== renderRanking._requestId) return; // 古いリクエストなら無視
    list.innerHTML = `<div class="empty-note">${err.message}</div>`;
    return;
  }
  if(requestId !== renderRanking._requestId) return; // 待っている間に別の操作をされていたら無視

  if(isAllSeasons){
    // 全シーズン合算のときだけ、Xパワーの高い順に並べ替えて順位を振り直す(同着は1,2,2,4...)
    combined.sort((a, b) => (b.power ?? -Infinity) - (a.power ?? -Infinity));
    const ranks = [];
    combined.forEach((row, i) => {
      if(i === 0){ ranks.push(1); return; }
      ranks.push(row.power === combined[i - 1].power ? ranks[i - 1] : i + 1);
    });
    combined = combined.map((row, i) => ({ ...row, rank: ranks[i] }));
  }

  const rows = combined.filter(row => {
    if(!query) return true;
    return row.name.toLowerCase().includes(query) || row.weapon.toLowerCase().includes(query);
  });

  if(rows.length === 0){
    list.innerHTML = '<div class="empty-note">該当するプレイヤー・ブキが見つかりませんでした</div>';
    return;
  }

  list.innerHTML = rows.map(row => `
    <div class="rank-row ${row.rank === 1 ? 'top' : row.rank === 2 ? 'second' : row.rank === 3 ? 'third' : ''}">
      <div class="content">
        <div class="rank-num">${row.rank}</div>
        <img class="weapon-icon" src="assets/${normalizeUrl(row.weapon)}.png" alt="${row.weapon}">
        <div class="row-main">
          <div class="row-name">${row.name}</div>
          <div class="row-weapon">${row.weapon}</div>
        </div>
        ${isAllSeasons ? `<div class="history-season-tag">${row.seasonLabel}</div>` : ''}
        <div class="row-power">${formatPower(row.power)}</div>
      </div>
    </div>
  `).join('');
}

renderRanking._requestId = 0;

const RULES = ['eria', 'yagura', 'hoko', 'asari'];
const DIM_LABELS = { set:'セット', main:'メイン', sub:'サブ', special:'スペシャル', category:'カテゴリ', range:'射程' };

function groupKeyFor(weaponName, dimension, weaponInfo, mergeScope){
  weaponName = normalizeAlias(weaponName)
  if(mergeScope) weaponName = scopeToCharger(weaponName)
  if(dimension === 'set') return weaponName;
  const info = weaponInfo[weaponName];
  if(!info || !info[dimension]){
    return weaponName; // 対応表に無い場合はブキ名そのままでフォールバック
  }
  return info[dimension];
}
function computeGroupStats(allRules, weaponInfo, dimension, roster, mergeScope){
  const totals = {};
  const groupCounts = {};

  RULES.forEach(rule => {
    const rows = allRules[rule] || [];
    totals[rule] = rows.length;
    rows.forEach(row => {
      const key = groupKeyFor(row.weapon, dimension, weaponInfo, mergeScope);
      if(!groupCounts[key]) groupCounts[key] = { eria:0, yagura:0, hoko:0, asari:0 };
      groupCounts[key][rule]++;
    });
  });

  // roster済みのブキから、誰にも使われていないグループも0件で追加し、
  // グループごとに何種類のブキが属しているか(母数)を数える
  const groupSize = {};
  if(Array.isArray(roster)){
    roster.forEach(weaponName => {
      if(mergeScope) {
        if (weaponName != scopeToCharger(weaponName)) return;
      }
      const key = groupKeyFor(weaponName, dimension, weaponInfo, mergeScope);
      if(!groupCounts[key]) groupCounts[key] = { eria:0, yagura:0, hoko:0, asari:0 };
      groupSize[key] = (groupSize[key] || 0) + 1;
    });
  }

  const overallTotal = RULES.reduce((sum, r) => sum + totals[r], 0);

  const rows = Object.entries(groupCounts).map(([key, counts]) => {
    const pct = {};
    RULES.forEach(r => { pct[r] = totals[r] ? (counts[r] / totals[r] * 100) : 0; });
    const overallCount = RULES.reduce((sum, r) => sum + counts[r], 0);
    const overallPct = overallTotal ? (overallCount / overallTotal * 100) : 0;
    return { key, counts, overallCount, pct, overallPct, groupSize: groupSize[key] };
  });

  return rows; // ソートは表示側(renderUsageTable)で指標・列に応じて行う
}


const COLUMNS = ['eria', 'yagura', 'hoko', 'asari', 'overall'];
const COLUMN_LABELS = { eria:'エリア', yagura:'ヤグラ', hoko:'ホコ', asari:'アサリ', overall:'全体', delta:'増減' };

// 使用率ビューの現在の状態(取得済みデータ・表示指標・ソート列)をまとめて持っておく。
// こうしておくと、指標やソート列を変えるだけの操作では再fetchせずに再描画だけで済む。
const usageState = {
  rows: null,
  prevRows: null,
  metric: 'pct',                          // 'pct' | 'count' | 'hensachi'
  sort: { column: 'overall', direction: 'desc' },
  mergeScope: false,                       // 「スコープをチャージャーと同一視する」
};

function computeStats(values){
  const n = values.length || 1;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

// 偏差値の計算に使う「その列(ルール/全体)内での平均・標準偏差」を、
// 表示中のグループ一覧(rows)全体から求める
function computeStatsByColumn(rows){
  const stats = {};
  COLUMNS.forEach(col => {
    const values = rows.map(r => col === 'overall' ? r.overallPct : r.pct[col]);
    stats[col] = computeStats(values);
  });
  return stats;
}

// 指標(割合/人数/偏差値)に応じて、そのセルに表示すべき値を返す
function getDisplayValue(row, column, metric, statsByColumn){
  if(metric === 'count'){
    return column === 'overall' ? row.overallCount : row.counts[column];
  }
  const pctValue = column === 'overall' ? row.overallPct : row.pct[column];
  if(metric === 'hensachi'){
    const { mean, std } = statsByColumn[column];
    return std === 0 ? 50 : 50 + 10 * (pctValue - mean) / std;
  }
  return pctValue; // 'pct'
}

function formatValue(value, metric, column){
  if(metric === 'count') return `${Math.round(value)}`;
  if(metric === 'hensachi') return value.toFixed(1);
  // 割合(%): %記号は付けない。全体は元の値が小数第二位までしか出ないので、丸めずそのまま2桁で表示する
  const decimals = column === 'overall' ? 2 : 1;
  return value.toFixed(decimals);
}

function formatDelta(value, metric){
  if(value === null) return '-';
  const sign = value > 0 ? '+' : '';
  if(metric === 'count') return `${sign}${Math.round(value)}`;
  if(metric === 'hensachi') return `${sign}${value.toFixed(1)}`;
  // 割合(%): %記号なし、全体と同様に小数第二位まで丸めずに表示
  return `${sign}${value.toFixed(2)}`;
}

// ルールごとのアクセントカラーをCSS変数から取得(色をCSSと二重管理しないため)
const RULE_HEX = {};
(function initRuleHex(){
  const styles = getComputedStyle(document.documentElement);
  //RULES.forEach(r => { RULE_HEX[r] = styles.getPropertyValue(`--${r}`).trim(); });
  RULES.forEach(r => { RULE_HEX[r] = styles.getPropertyValue(`--rules`).trim(); });
  RULE_HEX.overall = styles.getPropertyValue('--overall').trim();
})();

// 増減の色。数値(絶対値)が大きいほどグレーからこの色に近づける
const DELTA_UP_HEX = '#b4ff2b';   // 増加 = エリアと同じ緑系
const DELTA_DOWN_HEX = '#fe2b52';     // 減少 = 赤系
const MUTED_HEX = '#8d8d96';          // var(--text-mute) 相当(変化なしの色)

function hexToRgbArray(hex){
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

// グレー(MUTED_HEX)からtoHexへ、t(0〜1)の割合で線形補間した色を返す
function mixFromMuted(toHex, t){
  const a = hexToRgbArray(MUTED_HEX);
  const b = hexToRgbArray(toHex);
  const ratio = Math.max(0, Math.min(1, t));
  const mixed = a.map((v, i) => Math.round(v + (b[i] - v) * ratio));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function withAlpha(hex, alpha){
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

// 値が列内の最大値に対してどれくらいかで背景の濃さを変える(簡易ヒートマップ)
function heatStyle(value, max, colorKey){
  if(max <= 0) return '';
  const ratio = Math.max(0, Math.min(1, value / max));
  const alpha = 0.04 + ratio * 0.46; //0.08 + ratio * 0.32
  return `background:${withAlpha(RULE_HEX[colorKey], alpha)}`;
}

function buildTheadRow(){
  const cols = ['eria', 'yagura', 'hoko', 'asari', 'overall', 'delta'];
  const ths = cols.map(col => {
    const active = usageState.sort.column === col;
    const arrow = active ? (usageState.sort.direction === 'desc' ? '▼' : '▲') : '';
    return `<th class="sortable ${active ? 'active' : ''}" data-sort="${col}">${COLUMN_LABELS[col]}${arrow ? ` <span class="sort-arrow">${arrow}</span>` : ''}</th>`;
  }).join('');
  return `<tr><th>順位</th><th>ウェポン</th>${ths}</tr>`;
}

// fetch済みのusageState.rows/prevRowsをもとに、現在の指標・ソート列でテーブルを組み立てる。
// 指標やソート列の切り替えだけならここだけが呼ばれ、再fetchは発生しない。
function renderUsageTable(){
  const wrap = document.getElementById('usage-table-wrap');
  const { rows, prevRows, metric, sort, dimension } = usageState;
  if(!rows) return;
  if(rows.length === 0){
    wrap.innerHTML = '<div class="empty-note">データがありません</div>';
    return;
  }

  const statsByColumn = computeStatsByColumn(rows);
  const prevStatsByColumn = prevRows ? computeStatsByColumn(prevRows) : null;
  const prevByKey = {};
  if(prevRows) prevRows.forEach(r => { prevByKey[r.key] = r; });

  const enriched = rows.map(row => {
    const displayValues = {};
    COLUMNS.forEach(col => { displayValues[col] = getDisplayValue(row, col, metric, statsByColumn); });

    let delta = null;
    const prevRow = prevByKey[row.key];
    if(prevRow && prevStatsByColumn){
      const prevOverall = getDisplayValue(prevRow, 'overall', metric, prevStatsByColumn);
      delta = displayValues.overall - prevOverall;
    }
    return { key: row.key, displayValues, delta, groupSize: row.groupSize };
  });

  // 選択中の列(エリア/ヤグラ/ホコ/アサリ/全体/増減)を基準にソートする。
  // 増減が無い(前シーズン無し)行は、どちら向きにソートしても常に末尾に来るようにする。
  const sortValue = (row) => {
    const raw = sort.column === 'delta' ? row.delta : row.displayValues[sort.column];
    if(raw === null || raw === undefined) return sort.direction === 'desc' ? -Infinity : Infinity;
    return raw;
  };
  enriched.sort((a, b) => sort.direction === 'desc' ? sortValue(b) - sortValue(a) : sortValue(a) - sortValue(b));

  const maxByColumn = {};
  COLUMNS.forEach(col => { maxByColumn[col] = Math.max(...enriched.map(r => r.displayValues[col])); });

  const deltaEps = metric === 'count' ? 0.5 : 0.025;

  // 増減の色の濃さを決めるための、表示中の行の中での最大絶対値
  const maxAbsDelta = Math.max(0, ...enriched.map(r => r.delta === null ? 0 : Math.abs(r.delta)));

const sortDisplayKey = (row, index) => {
  if(sort.column === 'delta'){
    return row.delta === null ? `__none_${index}` : formatDelta(row.delta, metric);
  }
  return formatValue(row.displayValues[sort.column], metric, sort.column);
};
const ranks = [];
enriched.forEach((row, i) => {
  if(i === 0){ ranks.push(1); return; }
  ranks.push(sortDisplayKey(row, i) === sortDisplayKey(enriched[i - 1], i - 1) ? ranks[i - 1] : i + 1);
});

const bodyRows = enriched.map((row, i) => {
  const ruleCells = RULES.map(r => `
    <td class="metric" style="${heatStyle(row.displayValues[r], maxByColumn[r], r)}">${formatValue(row.displayValues[r], metric, r)}</td>
  `).join('');

  let diffClass = 'diff-flat';
  let diffText = '-';
  let diffStyle = '';
  if(row.delta !== null){
    const isUp = row.delta > deltaEps;
    const isDown = row.delta < -deltaEps;
    diffClass = isUp ? 'diff-up' : (isDown ? 'diff-down' : 'diff-flat');
    diffText = formatDelta(row.delta, metric);
    if(isUp || isDown){
      const ratio = maxAbsDelta ? Math.abs(row.delta) / maxAbsDelta : 0;
      const intensity = 0.35 + ratio * 0.65; // 小さい増減でも見分けがつくよう最低限の濃さを確保
      diffStyle = `color:${mixFromMuted(isUp ? DELTA_UP_HEX : DELTA_DOWN_HEX, intensity)}`;
    }
  }

  return `
    <tr>
      <td class="rank">${ranks[i]}</td>
      <td class="label">
        <img class="usage-icon" src="assets/${normalizeUrl(row.key)}.png" alt="${row.key}" onerror="this.onerror=null; this.src='assets/_fallback.png';">
        <span class="label-text">${row.key}${row.groupSize != null && dimension !== 'set' ? `<span class="label-count"> (${row.groupSize})</span>` : ''}</span>
      </td>
      ${ruleCells}
      <td class="metric overall" style="${heatStyle(row.displayValues.overall, maxByColumn.overall, 'overall')}">${formatValue(row.displayValues.overall, metric, 'overall')}</td>
      <td class="metric ${diffClass}" style="${diffStyle}">${diffText}</td>
    </tr>
  `;
}).join('');

  wrap.innerHTML = `
    <table class="usage-table">
      <thead>${buildTheadRow()}</thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

// シーズン・ルールのJSONを取得して集計し直す(ここは指標/ソートを変えただけでは呼ばれない)
  // シーズン・ルールのJSONを取得して集計し直す(ここは指標/ソートを変えただけでは呼ばれない)
  async function renderUsage(dimension){
    const wrap = document.getElementById('usage-table-wrap');
    const seasonValue = document.getElementById('usage-season').value;
    const isAllSeasons = seasonValue === 'all';

    const requestId = ++renderUsage._requestId;
    wrap.innerHTML = '<div class="empty-note">読み込み中…</div>';

    let allRules, weaponInfo, roster;
    try{
      if(isAllSeasons){
        [allRules, weaponInfo, roster] = await Promise.all([
          loadAllSeasonsAllRules(),
          loadWeaponInfo(),
          loadAllSeasonsRoster(),
        ]);
      }else{
        const season = Number(seasonValue);
        [allRules, weaponInfo, roster] = await Promise.all([
          loadSeasonAllRules(season),
          loadWeaponInfo(),
          loadSeasonRoster(season),
        ]);
      }
    }catch(err){
      if(requestId !== renderUsage._requestId) return;
      wrap.innerHTML = `<div class="empty-note">${err.message}</div>`;
      return;
    }
    if(requestId !== renderUsage._requestId) return;

    usageState.dimension = dimension;
    usageState.rows = computeGroupStats(allRules, weaponInfo, dimension, roster, usageState.mergeScope);

    // 前シーズンとの比較(増減)。「全シーズン合算」のときは比較対象が無いのでスキップする
    let prevRows = null;
    if(!isAllSeasons){
      const season = Number(seasonValue);
      const prevSeason = SEASONS.find(s => Number(s.id) === season - 1);
      if(prevSeason){
        try{
          const [prevAllRules, prevRoster] = await Promise.all([
            loadSeasonAllRules(prevSeason.id),
            loadSeasonRoster(prevSeason.id),
          ]);
          prevRows = computeGroupStats(prevAllRules, weaponInfo, dimension, prevRoster, usageState.mergeScope);
        }catch(err){
          // 前シーズンのデータが無ければ増減は "-" のままでよい
        }
      }
    }
    if(requestId !== renderUsage._requestId) return;
    usageState.prevRows = prevRows;

    renderUsageTable();
  }
  renderUsage._requestId = 0;

// 表示指標タブ切り替え（割合 / 人数 / 偏差値）。再fetchはせず再描画のみ
document.getElementById('usage-metric-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.dim-tab');
  if(!btn) return;
  document.querySelectorAll('#usage-metric-tabs .dim-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  usageState.metric = btn.dataset.metric;
  renderUsageTable();
});

// 列見出しクリックでソート切り替え（同じ列なら昇順・降順をトグル）
document.getElementById('usage-table-wrap').addEventListener('click', (e) => {
  const th = e.target.closest('th.sortable');
  if(!th) return;
  const col = th.dataset.sort;
  if(usageState.sort.column === col){
    usageState.sort.direction = usageState.sort.direction === 'desc' ? 'asc' : 'desc';
  }else{
    usageState.sort = { column: col, direction: 'desc' };
  }
  renderUsageTable();
});


// 「スコープをチャージャーと同一視する」チェックボックス。
// グループ分け自体が変わるので、指標/ソートの切替とは違い再集計が必要。
// ただしfetch結果はキャッシュされているので、実際に通信が再発生するわけではない。
document.getElementById('scope-merge-toggle').addEventListener('change', (e) => {
  usageState.mergeScope = e.target.checked;
  const dim = document.querySelector('#usage-dim-tabs .dim-tab.active').dataset.dim;
  renderUsage(dim);
});

/* ============ 歴代ページ ============ */

// プルダウンに出す選択肢(集計軸ごとに「表示したい順番」の配列)を
// data/weaponOptions.json から取得する。他の対応表と同じく、1度取得したら使い回す。
const WEAPON_OPTIONS_URL = 'data/weapons.json';
let weaponOptionsPromise = null;
function loadWeaponOptions(){
  if(!weaponOptionsPromise){
    weaponOptionsPromise = fetch(WEAPON_OPTIONS_URL).then(res => {
      if(!res.ok) throw new Error(`選択肢一覧の取得に失敗しました: ${WEAPON_OPTIONS_URL}`);
      return res.json();
    });
  }
  return weaponOptionsPromise;
}

async function populateHistoryWeaponSelect(dimension){
  const select = document.getElementById('history-weapon-select');
  const prevValue = select.value;
  select.innerHTML = '<option>読み込み中…</option>';

  let options;
  try{
    options = await loadWeaponOptions();
  }catch(err){
    select.innerHTML = `<option>${err.message}</option>`;
    return;
  }

  const values = options[dimension] || [];
  select.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join('');
  if(values.includes(prevValue)) select.value = prevValue;
}

function updateHistoryWeaponHeading(){
  const heading = document.getElementById('history-weapon-heading');
  const value = document.getElementById('history-weapon-select').value;
  if(!value){ heading.innerHTML = ''; return; }
  heading.innerHTML = `
    <img class="usage-icon" src="assets/${normalizeUrl(value)}.png" alt="${value}" onerror="this.onerror=null; this.src='assets/_fallback.png';">
    <span>${value}</span>
  `;
}

const historyWeaponState = { requestId: 0 };

// そのシーズンの「全体」列の値を1つ返す。存在しなければnull、
// 存在するが未使用なら0として扱う(増減の計算に使う)
function overallValueForEntry(entry, metric){
  if(entry.row) return metric === 'count' ? entry.row.overallCount : entry.row.overallPct;
  return entry.existed ? 0 : null;
}

function buildHistoryWeaponTable(seasonResults, metric){
  const cols = ['eria', 'yagura', 'hoko', 'asari', 'overall'];

  // ヒートマップの濃淡計算用に、実際にそのブキが存在したシーズンだけで列ごとの最大値を出す
  const maxByColumn = {};
  cols.forEach(col => {
    const values = seasonResults
      .filter(r => r.row)
      .map(r => metric === 'count'
        ? (col === 'overall' ? r.row.overallCount : r.row.counts[col])
        : (col === 'overall' ? r.row.overallPct : r.row.pct[col]));
    maxByColumn[col] = values.length ? Math.max(...values) : 0;
  });

  // 前シーズン比の増減(全体列基準)。存在しない/前シーズンが無い場合はnull("-"表示)
  const deltas = seasonResults.map((entry, i) => {
    if(i === 0) return null;
    const prevValue = overallValueForEntry(seasonResults[i - 1], metric);
    const currValue = overallValueForEntry(seasonResults[i], metric);
    if(prevValue === null || currValue === null) return null;
    return currValue - prevValue;
  });
  const deltaEps = metric === 'count' ? 0.5 : 0.025;
  const maxAbsDelta = Math.max(0, ...deltas.map(d => d === null ? 0 : Math.abs(d)));

  const bodyRows = seasonResults.map(({ season, row, existed }, i) => {
    const delta = deltas[i];
    let diffText = '-';
    let diffStyle = '';
    if(delta !== null){
      diffText = formatDelta(delta, metric);
      const isUp = delta > deltaEps;
      const isDown = delta < -deltaEps;
      if(isUp || isDown){
        const ratio = maxAbsDelta ? Math.abs(delta) / maxAbsDelta : 0;
        const intensity = 0.35 + ratio * 0.65;
        diffStyle = `color:${mixFromMuted(isUp ? DELTA_UP_HEX : DELTA_DOWN_HEX, intensity)}`;
      }
    }
    const deltaCell = `<td class="metric ${delta === null ? 'diff-flat' : ''}" style="${diffStyle}">${diffText}</td>`;

    if(!row){
      // rosterで存在が確認できるのに使用実績が無いシーズンは0、
      // そもそも存在しない(であろう)シーズンは"-"にする
      const cells = cols.map(col => `<td class="metric diff-flat">${existed ? formatValue(0, metric, col) : '-'}</td>`).join('');
      return `<tr><td class="label">${season.label}</td>${cells}${deltaCell}</tr>`;
    }
    const cells = cols.map(col => {
      const value = metric === 'count'
        ? (col === 'overall' ? row.overallCount : row.counts[col])
        : (col === 'overall' ? row.overallPct : row.pct[col]);
      return `<td class="metric ${col === 'overall' ? 'overall' : ''}" style="${heatStyle(value, maxByColumn[col], col)}">${formatValue(value, metric, col)}</td>`;
    }).join('');
    return `<tr><td class="label">${season.label}</td>${cells}${deltaCell}</tr>`;
  }).join('');

  return `
    <table class="usage-table history-weapon-table">
      <thead>
        <tr><th>シーズン</th><th>エリア</th><th>ヤグラ</th><th>ホコ</th><th>アサリ</th><th>全体</th><th>増減</th></tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

async function renderHistoryWeaponTable(){
  const wrap = document.getElementById('history-weapon-table-wrap');
  const dimension = document.querySelector('#history-dim-tabs .dim-tab.active').dataset.dim;
  const metric = document.querySelector('#history-metric-tabs .dim-tab.active').dataset.metric;
  const selectedValue = document.getElementById('history-weapon-select').value;

  if(!selectedValue){
    wrap.innerHTML = '<div class="empty-note">データがありません</div>';
    return;
  }

  const requestId = ++historyWeaponState.requestId;
  wrap.innerHTML = '<div class="empty-note">読み込み中…</div>';

  let weaponInfo;
  try{
    weaponInfo = await loadWeaponInfo();
  }catch(err){
    if(requestId !== historyWeaponState.requestId) return;
    wrap.innerHTML = `<div class="empty-note">${err.message}</div>`;
    return;
  }

  // 変遷として見やすいよう、古いシーズンから新しいシーズンの順に並べる
  const orderedSeasons = [...SEASONS].sort((a, b) => Number(a.id) - Number(b.id));

  const seasonResults = await Promise.all(orderedSeasons.map(async season => {
    try{
      const [allRules, roster] = await Promise.all([
        loadSeasonAllRules(season.id),
        loadSeasonRoster(season.id),
      ]);
      const stats = computeGroupStats(allRules, weaponInfo, dimension, roster, false);
      const row = stats.find(r => r.key === selectedValue);
      // rosterが取れない場合は「存在しない」と判定できないので、存在扱い(0%)にしておく
      const existed = row ? true : !Array.isArray(roster);
      return { season, row, existed };
    }catch(err){
      return { season, row: null, existed: false };
    }
  }));

  if(requestId !== historyWeaponState.requestId) return;

  wrap.innerHTML = buildHistoryWeaponTable(seasonResults, metric);
}

async function initHistoryPage(){
  await populateHistoryWeaponSelect('set');
  updateHistoryWeaponHeading();
  renderHistoryWeaponTable();
}

// 集計軸タブ切り替え（ブキ別の歴代推移）。選べるブキの一覧も軸に合わせて作り直す
document.getElementById('history-dim-tabs').addEventListener('click', async (e) => {
  const btn = e.target.closest('.dim-tab');
  if(!btn) return;
  document.querySelectorAll('#history-dim-tabs .dim-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await populateHistoryWeaponSelect(btn.dataset.dim);
  updateHistoryWeaponHeading();
  renderHistoryWeaponTable();
});

document.getElementById('history-weapon-select').addEventListener('change', () => {
  updateHistoryWeaponHeading();
  renderHistoryWeaponTable();
});

document.getElementById('history-metric-tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('.dim-tab');
  if(!btn) return;
  document.querySelectorAll('#history-metric-tabs .dim-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistoryWeaponTable();
});

// 初期表示
populateSeasonSelect(document.getElementById('ranking-season'));
populateSeasonSelect(document.getElementById('usage-season'));
document.getElementById('ranking-season').insertAdjacentHTML('beforeend', '<option value="all">全シーズン合算</option>');
document.getElementById('usage-season').insertAdjacentHTML('beforeend', '<option value="all">全シーズン合算</option>');
updateSeasonPeriod(document.getElementById('ranking-season'), document.getElementById('ranking-season-period'));
updateSeasonPeriod(document.getElementById('usage-season'), document.getElementById('usage-season-period'));

document.getElementById('ranking-season').addEventListener('change', (e) => {
  updateSeasonPeriod(e.target, document.getElementById('ranking-season-period'));
  const rule = document.querySelector('#ranking .rule-tab.active').dataset.rule;
  renderRanking(rule);
});

document.getElementById('ranking-filter').addEventListener('input', () => {
  const rule = document.querySelector('#ranking .rule-tab.active').dataset.rule;
  renderRanking(rule);
});

document.getElementById('usage-season').addEventListener('change', (e) => {
  updateSeasonPeriod(e.target, document.getElementById('usage-season-period'));
  const dim = document.querySelector('#usage-dim-tabs .dim-tab.active').dataset.dim;
  renderUsage(dim);
});
renderRanking('eria');
renderUsage('set');
