// ============================================================
// ui.js â€” Render & TÆ°Æ¡ng tÃ¡c cao cáº¥p cho QMC Visualizer (HUST Standard)
// TÃ¡ch biá»‡t hoÃ n toÃ n DOM khá»i thuáº­t toÃ¡n cá»§a algorithm.js.
// ============================================================

// ---- Báº£ng mÃ u Neon cao cáº¥p cho cÃ¡c tÃ­ch cá»±c tiá»ƒu Ä‘Æ°á»£c chá»n -------
const PI_COLORS = [
  { r: 2, g: 132, b: 199, label: 'cyan' }, // Xanh dÆ°Æ¡ng sÃ¡ng
  { r: 124, g: 58, b: 237, label: 'purple' }, // TÃ­m Ä‘áº­m
  { r: 5, g: 150, b: 105, label: 'emerald' }, // Xanh lá»¥c neon
  { r: 217, g: 119, b: 6, label: 'amber' }, // VÃ ng cam áº¥m
  { r: 220, g: 38, b: 38, label: 'rose' }, // Äá» há»“ng neon
  { r: 219, g: 39, b: 119, label: 'pink' }, // Há»“ng cÃ¡nh sen
  { r: 101, g: 163, b: 13, label: 'lime' }, // Xanh chuá»‘i
  { r: 13, g: 148, b: 136, label: 'teal' }, // Xanh ngá»c
];

const GRAY_1 = [0, 1];
const GRAY_2 = [0, 1, 3, 2];

// ---- Khá»Ÿi táº¡o tham chiáº¿u DOM ---------------------------------
const dom = {
  inputMinterms: document.getElementById('input-minterms'),
  inputDontCares: document.getElementById('input-dontcares'),
  inputNumVars: document.getElementById('input-numvars'),
  btnRun: document.getElementById('btn-run'),
  btnClear: document.getElementById('btn-clear'),
  errorMsg: document.getElementById('error-msg'),
  resultsSection: document.getElementById('results-section'),
  summaryInfo: document.getElementById('summary-info'),
  expressionValue: document.getElementById('expression-value'),
  expressionMeta: document.getElementById('expression-meta'),
  roundsCount: document.getElementById('rounds-count'),
  roundTabs: document.getElementById('round-tabs'),
  mergeThead: document.getElementById('merge-thead'),
  mergeTbody: document.getElementById('merge-tbody'),
  piCount: document.getElementById('pi-count'),
  piList: document.getElementById('pi-list'),
  chartThead: document.getElementById('chart-thead'),
  chartTbody: document.getElementById('chart-tbody'),
  essentialPiList: document.getElementById('essential-pi-list'),
  additionalPiList: document.getElementById('additional-pi-list'),

  // Stepper mode
  btnToggleMode: document.getElementById('btn-toggle-mode'),
  stepperControls: document.getElementById('stepper-controls'),
  stepperProgress: document.getElementById('stepper-progress'),
  stepperLabel: document.getElementById('stepper-label'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),

  // Karnaugh Map
  kmapCard: document.getElementById('kmap-card'),
  kmapGrid: document.getElementById('kmap-grid'),
  kmapSvgOverlay: document.getElementById('kmap-svg-overlay'),
  kmapLegend: document.getElementById('kmap-legend'),
  kmapVarsBadge: document.getElementById('kmap-vars-badge'),

  // Logic Gate Card
  logicCard: document.getElementById('logic-card'),
  logicSvgWrapper: document.getElementById('logic-svg-wrapper'),
  logicNandSvgWrapper: document.getElementById('logic-nand-svg-wrapper'),
  logicNorSvgWrapper: document.getElementById('logic-nor-svg-wrapper'),
  demorganNandBox: document.getElementById('demorgan-nand-box'),
  demorganNorBox: document.getElementById('demorgan-nor-box'),

  // Picker & Examples & Theme Toggle
  pickerContainer: document.getElementById('picker-container'),
  pickerGrid: document.getElementById('picker-grid'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  themeIcon: document.getElementById('theme-icon'),
  example1: document.getElementById('example-1'),
  example2: document.getElementById('example-2'),
  example3: document.getElementById('example-3'),
  codeTracePanel: document.getElementById('code-trace-panel'),
};

// ---- Tráº¡ng thÃ¡i á»©ng dá»¥ng (Application State) -----------------
let currentResult = null;
let currentMinterms = [];
let currentDontCares = [];
let activeRoundIndex = 0;

// Stepper state
let stepperMode = false;
let currentStep = 0;
let steps = [];

// K-map & Interactive state
let activeKmapGroup = -1; // -1: hiá»‡n táº¥t cáº£, >=0: highlight má»™t nhÃ³m cá»‘ Ä‘á»‹nh

// ---- THÃ€NH PHáº¦N 0: CHUYá»‚N Äá»”I CHáº¾ Äá»˜ SÃNG / Tá»I (THEME TOGGLE) -

/**
 * Khá»Ÿi táº¡o theme dá»±a trÃªn cÃ i Ä‘áº·t cÅ© hoáº·c máº·c Ä‘á»‹nh lÃ  SÃ¡ng (Light Theme)
 */
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeIcon(true);
  } else {
    document.body.classList.remove('dark-theme');
    updateThemeIcon(false);
  }
};

/**
 * Cáº­p nháº­t SVG icon cá»§a nÃºt chuyá»ƒn Ä‘á»•i Theme
 */
const updateThemeIcon = (isDark) => {
  if (isDark) {
    // Hiá»ƒn thá»‹ Sun Icon (Ä‘á»ƒ báº¥m chuyá»ƒn sang Light)
    dom.themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    dom.btnThemeToggle.setAttribute('title', 'Chuyá»ƒn sang cháº¿ Ä‘á»™ SÃ¡ng');
  } else {
    // Hiá»ƒn thá»‹ Moon Icon (Ä‘á»ƒ báº¥m chuyá»ƒn sang Dark)
    dom.themeIcon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    dom.btnThemeToggle.setAttribute('title', 'Chuyá»ƒn sang cháº¿ Ä‘á»™ Tá»‘i');
  }
};

/**
 * Thá»±c hiá»‡n Ä‘áº£o cháº¿ Ä‘á»™ sÃ¡ng/tá»‘i
 */
const toggleTheme = () => {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);

  // Váº½ láº¡i cá»•ng logic náº¿u Ä‘ang hiá»ƒn thá»‹ Ä‘á»ƒ cáº­p nháº­t mÃ u sáº¯c cÃ¡c má»‘i ná»‘i
  if (currentResult) {
    renderLogicGates(currentResult);
  }
};

// ---- Parse dá»¯ liá»‡u Ä‘áº§u vÃ o ------------------------------------

const parseIntList = (str) => {
  const trimmed = str.trim();
  if (trimmed === '') return [];
  return trimmed
    .split(/[\s,]+/)
    .filter((s) => s !== '')
    .map((s) => {
      const n = parseInt(s, 10);
      if (isNaN(n) || n < 0) throw new Error(`"${s}" khÃ´ng pháº£i sá»‘ nguyÃªn há»£p lá»‡`);
      return n;
    });
};

const validateInput = (minterms, dontCares) => {
  if (minterms.length === 0) {
    throw new Error('Vui lÃ²ng nháº­p Ã­t nháº¥t 1 minterm.');
  }
  const mintermSet = new Set(minterms);
  for (const d of dontCares) {
    if (mintermSet.has(d)) {
      throw new Error(`GiÃ¡ trá»‹ ${d} xuáº¥t hiá»‡n á»Ÿ cáº£ minterms vÃ  don't cares.`);
    }
  }
  if (mintermSet.size !== minterms.length) {
    throw new Error('CÃ³ giÃ¡ trá»‹ trÃ¹ng láº·p trong pháº§n minterms.');
  }
  const dcSet = new Set(dontCares);
  if (dcSet.size !== dontCares.length) {
    throw new Error("CÃ³ giÃ¡ trá»‹ trÃ¹ng láº·p trong pháº§n don't cares.");
  }
};

// ---- Hiá»ƒn thá»‹ thÃ´ng bÃ¡o lá»—i ---------------------------------
const showError = (msg) => {
  const textSpan = dom.errorMsg.querySelector('#error-text');
  if (textSpan) textSpan.textContent = msg;
  else dom.errorMsg.textContent = msg;
  dom.errorMsg.classList.add('visible');
};

const hideError = () => {
  dom.errorMsg.classList.remove('visible');
};

// ---- CÃ¡c hÃ m há»— trá»£ Render chung ----------------------------

/**
 * Táº¡o cáº¥u trÃºc HTML cho pattern nhá»‹ phÃ¢n cÃ³ phÃ¢n biá»‡t mÃ u sáº¯c 0, 1, X
 * HUST Standard: Há»— trá»£ Ä‘Ã³ng khung chá»¯ nháº­t bao quanh náº¿u lÃ  tÃ­ch cá»±c tiá»ƒu (EPI/PI)
 */
const renderPattern = (pattern, usedInMerge = false) => {
  let html = `<span class="pattern${!usedInMerge ? ' pattern-pi-framed' : ''}">`;
  for (const ch of pattern) {
    if (ch === '0') html += '<span class="bit-0">0</span>';
    else if (ch === '1') html += '<span class="bit-1">1</span>';
    else html += '<span class="bit-dash">X</span>'; // Triá»‡t tiÃªu biá»ƒu diá»…n báº±ng chá»¯ X in hoa
  }
  html += '</span>';
  return html;
};

const piColor = (idx, alpha = 1) => {
  const c = PI_COLORS[idx % PI_COLORS.length];
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
};

// ---- THÃ€NH PHáº¦N 1: Bá»˜ CHá»ŒN MINTERM LÆ¯á»šI Sá» TÆ¯Æ NG TÃC --------

const renderMintermPicker = () => {
  const numVarsSelect = dom.inputNumVars.value;
  const numVars = numVarsSelect === 'auto' ? 4 : parseInt(numVarsSelect, 10);

  if (numVars > 6) {
    dom.pickerContainer.classList.add('hidden');
    return;
  }

  dom.pickerContainer.classList.remove('hidden');

  const totalCells = Math.pow(2, numVars);
  let html = '';

  let mintermSet = new Set();
  let dcSet = new Set();
  try {
    mintermSet = new Set(parseIntList(dom.inputMinterms.value));
    dcSet = new Set(parseIntList(dom.inputDontCares.value));
  } catch (e) { }

  for (let i = 0; i < totalCells; i++) {
    let cellClass = 'picker-cell';
    let valText = '0';

    if (mintermSet.has(i)) {
      cellClass += ' picker-cell--minterm';
      valText = '1';
    } else if (dcSet.has(i)) {
      cellClass += ' picker-cell--dontcare';
      valText = 'X';
    }

    html += `<div class="${cellClass}" data-val="${i}">
      <span class="picker-cell__num">m${i}</span>
      <span class="picker-cell__val">${valText}</span>
    </div>`;
  }

  let cols = 8;
  if (numVars === 2) cols = 2;
  else if (numVars === 3) cols = 4;
  else if (numVars === 4) cols = 8;
  else if (numVars === 5) cols = 8;
  else if (numVars === 6) cols = 8;

  dom.pickerGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  dom.pickerGrid.innerHTML = html;

  const cells = dom.pickerGrid.querySelectorAll('.picker-cell');
  cells.forEach((cell) => {
    cell.addEventListener('click', () => {
      const val = parseInt(cell.getAttribute('data-val'), 10);
      const valSpan = cell.querySelector('.picker-cell__val');

      if (cell.classList.contains('picker-cell--minterm')) {
        cell.classList.remove('picker-cell--minterm');
        cell.classList.add('picker-cell--dontcare');
        valSpan.textContent = 'X';
      } else if (cell.classList.contains('picker-cell--dontcare')) {
        cell.classList.remove('picker-cell--dontcare');
        valSpan.textContent = '0';
      } else {
        cell.classList.add('picker-cell--minterm');
        valSpan.textContent = '1';
      }

      syncPickerToText();
    });
  });
};

const syncPickerToText = () => {
  const cells = dom.pickerGrid.querySelectorAll('.picker-cell');
  const minterms = [];
  const dontCares = [];

  cells.forEach((cell) => {
    const val = parseInt(cell.getAttribute('data-val'), 10);
    if (cell.classList.contains('picker-cell--minterm')) {
      minterms.push(val);
    } else if (cell.classList.contains('picker-cell--dontcare')) {
      dontCares.push(val);
    }
  });

  dom.inputMinterms.value = minterms.join(', ');
  dom.inputDontCares.value = dontCares.join(', ');
};

const syncTextToPicker = () => {
  if (dom.pickerContainer.classList.contains('hidden')) return;

  let mintermSet = new Set();
  let dcSet = new Set();
  try {
    mintermSet = new Set(parseIntList(dom.inputMinterms.value));
    dcSet = new Set(parseIntList(dom.inputDontCares.value));
  } catch (e) {
    return;
  }

  const cells = dom.pickerGrid.querySelectorAll('.picker-cell');
  cells.forEach((cell) => {
    const val = parseInt(cell.getAttribute('data-val'), 10);
    const valSpan = cell.querySelector('.picker-cell__val');

    cell.classList.remove('picker-cell--minterm', 'picker-cell--dontcare');

    if (mintermSet.has(val)) {
      cell.classList.add('picker-cell--minterm');
      valSpan.textContent = '1';
    } else if (dcSet.has(val)) {
      cell.classList.add('picker-cell--dontcare');
      valSpan.textContent = 'X';
    } else {
      valSpan.textContent = '0';
    }
  });
};

// ---- THÃ€NH PHáº¦N 2: Tá»”NG QUAN HÃ€M BOOLEAN Káº¾T QUáº¢ ------------

// ---- THÃ€NH PHáº¦N 2: Tá»”NG QUAN HÃ€M BOOLEAN Káº¾T QUáº¢ ------------

const renderSummary = (result, minterms, dontCares) => {
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, result.numVars).split('').join(', ');
  const chips = []
  dom.summaryInfo.innerHTML = chips.map((c) => `<span class="info-chip">${c}</span>`).join('');

  // Hiá»ƒn thá»‹ Dáº¡ng tá»‘i thiá»ƒu R_min(F) [HUST Standard]
  dom.expressionValue.innerHTML = `R<sub>min</sub>(F) = ${result.expression}`;

  const epiCount = result.essentialPIs.length;
  const additionalCount = result.selectedPIs.length - epiCount;
  let metaHTML = `<span class="expression-meta__item">
    <span class="expression-meta__dot expression-meta__dot--epi"></span>
    ${epiCount} tÃ­ch cá»±c tiá»ƒu thiáº¿t yáº¿u (EPI)
  </span>`;
  if (additionalCount > 0) {
    metaHTML += `<span class="expression-meta__item">
      <span class="expression-meta__dot expression-meta__dot--additional"></span>
      ${additionalCount} tÃ­ch cá»±c tiá»ƒu bá»• sung tá»‘i Æ°u
    </span>`;
  }
  dom.expressionMeta.innerHTML = metaHTML;
};

// ---- THÃ€NH PHáº¦N 3: ROUND TABS & MERGE (CROSS-HIGHLIGHT) -----

const renderRoundTabs = (rounds) => {
  dom.roundTabs.innerHTML = '';
  rounds.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'round-tab' + (idx === activeRoundIndex ? ' active' : '');
    // Äáº·t tÃªn tab lÃ  Khá»‘i K^idx chuáº©n slide HUST
    btn.innerHTML = idx === 0 ? 'Khá»‘i K<sup>0</sup> (NhÃ³m gá»‘c)' : `Khá»‘i K<sup>${idx}</sup>`;
    btn.addEventListener('click', () => {
      activeRoundIndex = idx;
      renderRoundTabs(rounds);
      renderMergeTable(rounds[idx], idx);
    });
    dom.roundTabs.appendChild(btn);
  });
  dom.roundsCount.textContent = `${rounds.length} vÃ²ng`;
};

const renderMergeTable = (round, roundIdx = 0) => {
  dom.mergeThead.innerHTML = `<tr><th>NhÃ³m hÃ ng</th><th>Pattern nhá»‹ phÃ¢n</th><th>TÃ­ch chuáº©n (Minterm)</th><th>Tráº¡ng thÃ¡i</th></tr>`;

  const groups = round.groups;
  const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  let html = '';

  for (const key of groupKeys) {
    // Äá»•i tÃªn nhÃ³m phÃ¢n theo sá»‘ bit 1 thÃ nh nhÃ³m K_key
    html += `<tr class="group-header"><td colspan="4">NhÃ³m K<sub>${key}</sub> (${key} bit 1 â€” ${groups[key].length} tÃ­ch cá»±c tiá»ƒu)</td></tr>`;
    for (const imp of groups[key]) {
      // HUST Standard: 
      // - Náº¿u Ä‘Ã£ Ä‘Æ°á»£c gá»™p (usedInMerge): render bÃ¬nh thÆ°á»ng vÃ  chÃ¨n chá»¯ V in hoa mÃ u lá»¥c bÃªn pháº£i pattern!
      // - Náº¿u chÆ°a Ä‘Æ°á»£c gá»™p (tÃ­ch cá»±c tiá»ƒu): bao pattern trong khung chá»¯ nháº­t nÃ©t liá»n rá»±c rá»¡!
      const statusBadge = imp.usedInMerge
        ? '<span class="status-badge status-badge--merged">âœ“ ÄÃ£ gá»™p</span>'
        : '<span class="status-badge status-badge--pi">â˜… TÃ­ch cá»±c tiá»ƒu</span>';

      const isClickable = roundIdx > 0 ? ' class="clickable-row"' : '';
      const checkMarkText = imp.usedInMerge
        ? '<span style="color:var(--accent-emerald); font-weight:900; margin-left: 8px;" title="ÄÃ£ gá»™p nhÃ³m (merged)">V</span>'
        : '';

      html += `<tr${isClickable} data-pattern="${imp.pattern}" data-minterms="${imp.minterms.join(',')}">
        <td style="color:var(--text-secondary); font-weight:700">K<sub>${key}</sub></td>
        <td>${renderPattern(imp.pattern, imp.usedInMerge)}${checkMarkText}</td>
        <td class="minterms-list">{${imp.minterms.join(', ')}}</td>
        <td>${statusBadge}</td>
      </tr>`;
    }
  }
  dom.mergeTbody.innerHTML = html;

  if (roundIdx > 0) {
    setupCrossMergeHighlight(roundIdx);
  }
};

const setupCrossMergeHighlight = (roundIdx) => {
  const rows = dom.mergeTbody.querySelectorAll('tr.clickable-row');
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      const mintermsStr = row.getAttribute('data-minterms');
      if (!mintermsStr) return;
      const targetMinterms = new Set(mintermsStr.split(',').map(Number));

      activeRoundIndex = roundIdx - 1;
      renderRoundTabs(currentResult.rounds);
      renderMergeTable(currentResult.rounds[activeRoundIndex], activeRoundIndex);

      setTimeout(() => {
        const prevRows = dom.mergeTbody.querySelectorAll('tr');
        let firstMatchRow = null;

        prevRows.forEach((r) => {
          const mStr = r.getAttribute('data-minterms');
          if (!mStr) return;
          const rowMinterms = mStr.split(',').map(Number);

          const isSubset = rowMinterms.every((m) => targetMinterms.has(m));
          if (isSubset) {
            r.classList.add('flash-highlight');
            if (!firstMatchRow) firstMatchRow = r;

            setTimeout(() => {
              r.classList.remove('flash-highlight');
            }, 2200);
          }
        });

        if (firstMatchRow) {
          firstMatchRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    });
  });
};

// ---- THÃ€NH PHáº¦N 4: HIá»‚N THá»Š CÃC tÃ­ch cá»±c tiá»ƒu DÆ¯á»šI Dáº NG CHIPS -

const renderPIList = (result) => {
  dom.piCount.textContent = `${result.primeImplicants.length} tÃ­ch cá»±c tiá»ƒu`;

  const essentialPatterns = new Set(result.essentialPIs.map((pi) => pi.pattern));
  const selectedPatterns = new Set(result.selectedPIs.map((pi) => pi.pattern));

  const piColorIndex = {};
  result.selectedPIs.forEach((pi, idx) => {
    piColorIndex[pi.pattern] = idx;
  });

  dom.piList.innerHTML = result.primeImplicants
    .map((pi) => {
      let cls = 'pi-chip';
      let label = '';
      let colorDot = '';
      if (essentialPatterns.has(pi.pattern)) {
        cls += ' pi-chip--essential';
        label = ' (EPI)';
      } else if (selectedPatterns.has(pi.pattern)) {
        cls += ' pi-chip--selected';
        label = ' (chá»n)';
      }

      if (pi.pattern in piColorIndex) {
        const idx = piColorIndex[pi.pattern];
        colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${piColor(idx)};margin-right:6px;vertical-align:middle;box-shadow:0 0 5px ${piColor(idx)}"></span>`;
      }

      // á»ž Ä‘Ã¢yPI hiá»ƒn thá»‹ Ä‘Ã³ng khung chá»¯ nháº­t Ä‘Ãºng chuáº©n slide HUST!
      const patternFramedHTML = renderPattern(pi.pattern, false);

      return `<span class="${cls}" data-pattern="${pi.pattern}" title="Minterms: {${pi.minterms.join(', ')}}">${colorDot}${patternFramedHTML}${label}</span>`;
    })
    .join('');

  setupPIChipHover();
};

const setupPIChipHover = () => {
  const chips = dom.piList.querySelectorAll('.pi-chip[data-pattern]');
  chips.forEach((chip) => {
    chip.addEventListener('mouseenter', () => {
      const pattern = chip.getAttribute('data-pattern');
      highlightKmapByPattern(pattern);
      highlightLogicGateByPattern(pattern);
    });
    chip.addEventListener('mouseleave', () => {
      clearKmapHighlight();
      clearLogicHighlight();
      if (activeKmapGroup >= 0) {
        highlightKmapGroup(activeKmapGroup);
        const pi = currentResult.selectedPIs[activeKmapGroup];
        if (pi) highlightLogicGateByPattern(pi.pattern);
      }
    });
  });
};

// ---- THÃ€NH PHáº¦N 5: Báº¢NG BAO PHá»¦ TÆ¯Æ NG TÃC (COVERAGE CHART) --

const renderPIChart = (result) => {
  const allChartMinterms = new Set();
  for (const covered of Object.values(result.chart)) {
    for (const m of covered) allChartMinterms.add(m);
  }
  const sortedMinterms = [...allChartMinterms].sort((a, b) => a - b);

  const essentialPatterns = new Set(result.essentialPIs.map((pi) => pi.pattern));
  const selectedPatterns = new Set(result.selectedPIs.map((pi) => pi.pattern));

  // TÃNH TOÃN Äá»˜ PHá»¦ Tá»ªNG Cá»˜T Äá»‚ Váº¼ Dáº¤U â“ THIáº¾T Yáº¾U KHOANH TRÃ’N
  const mintermCoverageCount = {};
  sortedMinterms.forEach((m) => {
    let count = 0;
    for (const covered of Object.values(result.chart)) {
      if (covered.has(m)) count++;
    }
    mintermCoverageCount[m] = count;
  });

  // Báº£ng bao phá»§ tiÃªu Ä‘á»
  let theadHTML = '<tr><th>tÃ­ch cá»±c tiá»ƒu \\ Minterm</th>';
  sortedMinterms.forEach((m, colIdx) => {
    theadHTML += `<th data-col="${colIdx}" data-minterm="${m}">${m}</th>`;
  });
  theadHTML += '</tr>';
  dom.chartThead.innerHTML = theadHTML;

  // Body
  let tbodyHTML = '';
  const chartEntries = Object.entries(result.chart);

  chartEntries.forEach(([pattern, covered], rowIdx) => {
    const isEssential = essentialPatterns.has(pattern);
    const isSelected = selectedPatterns.has(pattern);
    let rowClass = isEssential ? 'essential-row' : '';

    let tag = '';
    if (isEssential) tag = ' <span class="status-badge status-badge--pi" style="font-size:0.6rem">EPI</span>';
    else if (isSelected) tag = ' <span class="status-badge status-badge--merged" style="font-size:0.6rem">SEL</span>';

    tbodyHTML += `<tr class="${rowClass}" data-row="${rowIdx}" data-pattern="${pattern}">`;
    tbodyHTML += `<td>${renderPattern(pattern, false)}${tag}</td>`; // PI trong chart cÅ©ng Ä‘Æ°á»£c Ä‘Ã³ng khung

    sortedMinterms.forEach((m, colIdx) => {
      if (covered.has(m)) {
        // HUST Standard: 
        // - Cá»™t chá»‰ cÃ³ duy nháº¥t 1 dáº¥u phá»§: Váº½ chá»¯ â“ (X khoanh trÃ²n) rá»±c rá»¡!
        // - Cá»™t cÃ³ nhiá»u hÆ¡n 1 dáº¥u phá»§: Váº½ chá»¯ X in hoa thÃ´ng thÆ°á»ng!
        if (mintermCoverageCount[m] === 1) {
          tbodyHTML += `<td data-col="${colIdx}"><span class="chart-cell-x chart-cell-x--essential" title="Äiá»ƒm phá»§ quyáº¿t Ä‘á»‹nh thiáº¿t yáº¿u (EPI)">â“</span></td>`;
        } else {
          tbodyHTML += `<td data-col="${colIdx}"><span class="chart-cell-x" title="Äiá»ƒm phá»§ thÆ°á»ng">X</span></td>`;
        }
      } else {
        tbodyHTML += `<td data-col="${colIdx}"></td>`;
      }
    });
    tbodyHTML += '</tr>';
  });

  dom.chartTbody.innerHTML = tbodyHTML;
  setupChartHover();
};

const setupChartHover = () => {
  const table = document.getElementById('chart-table');
  if (!table) return;

  const allCells = table.querySelectorAll('td[data-col], th[data-col]');

  const headerCells = table.querySelectorAll('th[data-col]');
  headerCells.forEach((th) => {
    th.addEventListener('mouseenter', () => {
      const col = th.getAttribute('data-col');
      const minterm = th.getAttribute('data-minterm');
      allCells.forEach((cell) => {
        if (cell.getAttribute('data-col') === col) cell.classList.add('col-highlight');
      });
      th.classList.add('col-highlight');
      if (minterm !== null) highlightKmapMinterm(parseInt(minterm, 10));
    });
    th.addEventListener('mouseleave', () => {
      allCells.forEach((cell) => cell.classList.remove('col-highlight'));
      clearKmapHighlight();
      if (activeKmapGroup >= 0) highlightKmapGroup(activeKmapGroup);
    });
  });

  const rows = table.querySelectorAll('tbody tr');
  rows.forEach((row) => {
    row.addEventListener('mouseenter', () => {
      row.classList.add('row-highlight');
      const pattern = row.getAttribute('data-pattern');
      if (pattern) {
        highlightKmapByPattern(pattern);
        highlightLogicGateByPattern(pattern);
      }
    });
    row.addEventListener('mouseleave', () => {
      row.classList.remove('row-highlight');
      clearKmapHighlight();
      clearLogicHighlight();
      if (activeKmapGroup >= 0) {
        highlightKmapGroup(activeKmapGroup);
        const pi = currentResult.selectedPIs[activeKmapGroup];
        if (pi) highlightLogicGateByPattern(pi.pattern);
      }
    });
  });
};

// ---- THÃ€NH PHáº¦N 6: tÃ­ch cá»±c tiá»ƒu ÄÃƒ CHá»ŒN Tá»I Æ¯U ------------------

const renderSelectedPIs = (result) => {
  const essentialPatterns = new Set(result.essentialPIs.map((pi) => pi.pattern));
  const piColorIndex = {};
  result.selectedPIs.forEach((pi, idx) => { piColorIndex[pi.pattern] = idx; });

  const createPiHTML = (pi) => {
    const term = patternToTerm(pi.pattern, result.numVars);
    const idx = piColorIndex[pi.pattern];
    const color = idx !== undefined ? piColor(idx) : 'transparent';
    const dot = idx !== undefined ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};margin-right:6px;vertical-align:middle;box-shadow:0 0 5px ${color}"></span>` : '';
    const isEpi = essentialPatterns.has(pi.pattern);
    const chipClass = isEpi ? 'pi-chip pi-chip--essential' : 'pi-chip pi-chip--selected';
    const patternFramed = renderPattern(pi.pattern, false);
    return `<span class="${chipClass}" data-pattern="${pi.pattern}" title="= ${term}, bao phá»§ {${pi.minterms.join(', ')}}">${dot}${patternFramed} â†’ ${term}</span>`;
  };

  if (result.essentialPIs.length === 0) {
    dom.essentialPiList.innerHTML = '<span class="info-chip" style="color:var(--text-muted)">KhÃ´ng cÃ³ tÃ­ch cá»±c tiá»ƒu thiáº¿t yáº¿u</span>';
  } else {
    dom.essentialPiList.innerHTML = result.essentialPIs.map(createPiHTML).join('');
  }

  const additionalPIs = result.selectedPIs.filter((pi) => !essentialPatterns.has(pi.pattern));
  if (additionalPIs.length === 0) {
    dom.additionalPiList.innerHTML = '<span class="info-chip" style="color:var(--text-muted)">KhÃ´ng cáº§n chá»n thÃªm tÃ­ch cá»±c tiá»ƒu bá»• sung</span>';
  } else {
    dom.additionalPiList.innerHTML = additionalPIs.map(createPiHTML).join('');
  }

  const allSelectedChips = document.querySelectorAll('#essential-pi-list .pi-chip[data-pattern], #additional-pi-list .pi-chip[data-pattern]');
  allSelectedChips.forEach((chip) => {
    chip.addEventListener('mouseenter', () => {
      const pattern = chip.getAttribute('data-pattern');
      highlightKmapByPattern(pattern);
      highlightLogicGateByPattern(pattern);
    });
    chip.addEventListener('mouseleave', () => {
      clearKmapHighlight();
      clearLogicHighlight();
      if (activeKmapGroup >= 0) {
        highlightKmapGroup(activeKmapGroup);
        const pi = currentResult.selectedPIs[activeKmapGroup];
        if (pi) highlightLogicGateByPattern(pi.pattern);
      }
    });
  });
};

// ---- THÃ€NH PHáº¦N 7: Báº¢N Äá»’ KARNAUGH VÃ€ SVG LOOP OVERLAY ------

const getKmapLayout = (numVars) => {
  if (numVars === 2) return { rows: GRAY_1, cols: GRAY_1, rowVars: 'A', colVars: 'B' };
  if (numVars === 3) return { rows: GRAY_1, cols: GRAY_2, rowVars: 'A', colVars: 'BC' };
  if (numVars === 4) return { rows: GRAY_2, cols: GRAY_2, rowVars: 'AB', colVars: 'CD' };
  return null;
};

const getMinterm = (rowGrayVal, colGrayVal, numVars) => {
  if (numVars === 2) return rowGrayVal * 2 + colGrayVal;
  if (numVars === 3) return rowGrayVal * 4 + colGrayVal;
  if (numVars === 4) return rowGrayVal * 4 + colGrayVal;
  return 0;
};

const renderKmap = (result, minterms, dontCares) => {
  const numVars = result.numVars;
  const layout = getKmapLayout(numVars);

  if (!layout) {
    dom.kmapCard.classList.add('hidden');
    return;
  }

  dom.kmapCard.classList.remove('hidden');
  dom.kmapVarsBadge.textContent = `${numVars} biáº¿n`;

  const mintermSet = new Set(minterms);
  const dcSet = new Set(dontCares);

  let html = '';

  html += `<div class="kmap-cell kmap-cell--corner">${layout.rowVars}\\${layout.colVars}</div>`;

  for (const colVal of layout.cols) {
    const label = colVal.toString(2).padStart(layout.colVars.length, '0');
    html += `<div class="kmap-cell kmap-cell--header-col">${label}</div>`;
  }

  for (const rowVal of layout.rows) {
    const rowLabel = rowVal.toString(2).padStart(layout.rowVars.length, '0');
    html += `<div class="kmap-cell kmap-cell--header-row">${rowLabel}</div>`;

    for (const colVal of layout.cols) {
      const m = getMinterm(rowVal, colVal, numVars);
      let cellClass = 'kmap-cell';
      let value = '0';

      if (mintermSet.has(m)) {
        cellClass += ' kmap-cell--value-1';
        value = '1';
      } else if (dcSet.has(m)) {
        cellClass += ' kmap-cell--value-dc';
        value = 'X';
      } else {
        cellClass += ' kmap-cell--value-0';
      }

      html += `<div class="${cellClass}" data-kmap-minterm="${m}">
        <span class="kmap-cell__minterm">m${m}</span>
        <span class="kmap-cell__value">${value}</span>
      </div>`;
    }
  }

  dom.kmapGrid.style.gridTemplateColumns = `64px repeat(${layout.cols.length}, 76px)`;
  dom.kmapGrid.innerHTML = html;

  const gridWidth = 64 + layout.cols.length * 76;
  const gridHeight = 42 + layout.rows.length * 66;
  dom.kmapSvgOverlay.setAttribute('viewBox', `0 0 ${gridWidth} ${gridHeight}`);
  dom.kmapSvgOverlay.style.width = `${gridWidth}px`;
  dom.kmapSvgOverlay.style.height = `${gridHeight}px`;

  applyKmapGroupColors(result);
  renderKmapLegend(result);
};

const applyKmapGroupColors = (result) => {
  if (!result || !result.selectedPIs) return;

  const allCells = dom.kmapGrid.querySelectorAll('.kmap-cell[data-kmap-minterm]');
  allCells.forEach((cell) => {
    cell.style.background = '';
  });

  const mintermToPIs = {};
  result.selectedPIs.forEach((pi, idx) => {
    for (const m of pi.minterms) {
      if (!mintermToPIs[m]) mintermToPIs[m] = [];
      mintermToPIs[m].push(idx);
    }
  });

  allCells.forEach((cell) => {
    const m = parseInt(cell.getAttribute('data-kmap-minterm'), 10);
    const piIndices = mintermToPIs[m];
    if (piIndices && piIndices.length > 0) {
      const primaryIdx = piIndices[0];

      if (piIndices.length > 1) {
        const stops = piIndices.map((idx, i) => {
          const pct1 = (i / piIndices.length) * 100;
          const pct2 = ((i + 1) / piIndices.length) * 100;
          return `${piColor(idx, 0.08)} ${pct1}%, ${piColor(idx, 0.08)} ${pct2}%`;
        }).join(', ');
        cell.style.background = `linear-gradient(135deg, ${stops})`;
      } else {
        cell.style.background = piColor(primaryIdx, 0.06);
      }
    }
  });
};

const renderKmapLegend = (result) => {
  if (!result || !result.selectedPIs) return;

  let html = '<span class="kmap-legend-label">ChÃº thÃ­ch cÃ¡c tÃ­ch cá»±c tiá»ƒu:</span>';

  result.selectedPIs.forEach((pi, idx) => {
    const term = patternToTerm(pi.pattern, result.numVars);
    const isActive = activeKmapGroup === idx;
    html += `<span class="kmap-legend-item${isActive ? ' active' : ''}" data-group-idx="${idx}">
      <span class="kmap-legend-dot" style="background:${piColor(idx)};box-shadow:0 0 5px ${piColor(idx)}"></span>
      ${pi.pattern} = ${term}
    </span>`;
  });

  dom.kmapLegend.innerHTML = html;

  const items = dom.kmapLegend.querySelectorAll('.kmap-legend-item');
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.getAttribute('data-group-idx'), 10);
      if (activeKmapGroup === idx) {
        activeKmapGroup = -1;
        clearKmapHighlight();
        clearLogicHighlight();
      } else {
        activeKmapGroup = idx;
        highlightKmapGroup(idx);
        const pi = currentResult.selectedPIs[idx];
        if (pi) highlightLogicGateByPattern(pi.pattern);
      }

      items.forEach((it) => it.classList.remove('active'));
      if (activeKmapGroup >= 0) item.classList.add('active');
    });

    item.addEventListener('mouseenter', () => {
      const idx = parseInt(item.getAttribute('data-group-idx'), 10);
      highlightKmapGroup(idx);
      const pi = currentResult.selectedPIs[idx];
      if (pi) highlightLogicGateByPattern(pi.pattern);
    });

    item.addEventListener('mouseleave', () => {
      if (activeKmapGroup >= 0) {
        highlightKmapGroup(activeKmapGroup);
        const pi = currentResult.selectedPIs[activeKmapGroup];
        if (pi) highlightLogicGateByPattern(pi.pattern);
      } else {
        clearKmapHighlight();
        clearLogicHighlight();
      }
    });
  });
};

const drawKmapSvgLoop = (groupIdx, minterms, color) => {
  if (!currentResult) return;
  const numVars = currentResult.numVars;
  const layout = getKmapLayout(numVars);
  if (!layout) return;

  const cellPositions = [];
  minterms.forEach((m) => {
    for (let r = 0; r < layout.rows.length; r++) {
      for (let c = 0; c < layout.cols.length; c++) {
        if (getMinterm(layout.rows[r], layout.cols[c], numVars) === m) {
          cellPositions.push({ row: r, col: c });
        }
      }
    }
  });

  if (cellPositions.length === 0) return;

  const rowsInGroup = [...new Set(cellPositions.map(p => p.row))].sort((a, b) => a - b);
  const colsInGroup = [...new Set(cellPositions.map(p => p.col))].sort((a, b) => a - b);

  const totalRows = layout.rows.length;
  const totalCols = layout.cols.length;

  let svgContent = '';

  const isWrapCol = colsInGroup.includes(0) && colsInGroup.includes(3) && !colsInGroup.includes(1) && !colsInGroup.includes(2) && totalCols === 4;
  const isWrapRow = rowsInGroup.includes(0) && rowsInGroup.includes(3) && !rowsInGroup.includes(1) && !rowsInGroup.includes(2) && totalRows === 4;

  const strokeColor = color || piColor(groupIdx, 1);
  const bgColor = color ? color.replace('1)', '0.07)') : piColor(groupIdx, 0.07);

  const drawRect = (rMin, rMax, cMin, cMax, padding = 4) => {
    const x = 64 + cMin * 76 + padding;
    const y = 42 + rMin * 66 + padding;
    const w = (cMax - cMin + 1) * 76 - padding * 2;
    const h = (rMax - rMin + 1) * 66 - padding * 2;
    return `<rect class="kmap-svg-loop" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" ry="12" style="--loop-stroke:${strokeColor}; --loop-bg:${bgColor}"></rect>`;
  };

  const drawLeftOpen = (rMin, rMax, padding = 4) => {
    const xLeft = 64 - 12;
    const y = 42 + rMin * 66 + padding;
    const w = 76 + 12 - padding;
    const h = (rMax - rMin + 1) * 66 - padding * 2;
    return `<rect class="kmap-svg-loop" x="${xLeft}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" style="--loop-stroke:${strokeColor}; --loop-bg:${bgColor}"></rect>`;
  };

  const drawRightOpen = (rMin, rMax, padding = 4) => {
    const xRight = 64 + 3 * 76 + padding;
    const y = 42 + rMin * 66 + padding;
    const w = 76 + 12 - padding;
    const h = (rMax - rMin + 1) * 66 - padding * 2;
    return `<rect class="kmap-svg-loop" x="${xRight}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" style="--loop-stroke:${strokeColor}; --loop-bg:${bgColor}"></rect>`;
  };

  const drawTopOpen = (cMin, cMax, padding = 4) => {
    const x = 64 + cMin * 76 + padding;
    const y = 42 - 12;
    const w = (cMax - cMin + 1) * 76 - padding * 2;
    const h = 66 + 12 - padding;
    return `<rect class="kmap-svg-loop" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" style="--loop-stroke:${strokeColor}; --loop-bg:${bgColor}"></rect>`;
  };

  const drawBottomOpen = (cMin, cMax, padding = 4) => {
    const x = 64 + cMin * 76 + padding;
    const y = 42 + 3 * 66 + padding;
    const w = (cMax - cMin + 1) * 76 - padding * 2;
    const h = 66 + 12 - padding;
    return `<rect class="kmap-svg-loop" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" style="--loop-stroke:${strokeColor}; --loop-bg:${bgColor}"></rect>`;
  };

  if (isWrapCol && isWrapRow) {
    svgContent += drawLeftOpen(0, 0);
    svgContent += drawRightOpen(0, 0);
    svgContent += drawLeftOpen(3, 3);
    svgContent += drawRightOpen(3, 3);
  }
  else if (isWrapCol) {
    const rMin = Math.min(...rowsInGroup);
    const rMax = Math.max(...rowsInGroup);
    svgContent += drawLeftOpen(rMin, rMax);
    svgContent += drawRightOpen(rMin, rMax);
  }
  else if (isWrapRow) {
    const cMin = Math.min(...colsInGroup);
    const cMax = Math.max(...colsInGroup);
    svgContent += drawTopOpen(cMin, cMax);
    svgContent += drawBottomOpen(cMin, cMax);
  }
  else {
    const rMin = Math.min(...rowsInGroup);
    const rMax = Math.max(...rowsInGroup);
    const cMin = Math.min(...colsInGroup);
    const cMax = Math.max(...colsInGroup);
    svgContent += drawRect(rMin, rMax, cMin, cMax);
  }

  dom.kmapSvgOverlay.innerHTML = svgContent;
};

const highlightKmapGroup = (groupIdx) => {
  if (!currentResult || !currentResult.selectedPIs[groupIdx]) return;
  const pi = currentResult.selectedPIs[groupIdx];
  const mintermSet = new Set(pi.minterms);

  const allCells = dom.kmapGrid.querySelectorAll('.kmap-cell[data-kmap-minterm]');
  allCells.forEach((cell) => {
    const m = parseInt(cell.getAttribute('data-kmap-minterm'), 10);
    if (mintermSet.has(m)) {
      cell.classList.add('kmap-group-active');
      cell.classList.remove('kmap-group-dimmed');
    } else {
      cell.classList.remove('kmap-group-active');
      cell.classList.add('kmap-group-dimmed');
    }
  });

  drawKmapSvgLoop(groupIdx, pi.minterms);
};

const highlightKmapByPattern = (pattern) => {
  if (!currentResult) return;
  const idx = currentResult.selectedPIs.findIndex((pi) => pi.pattern === pattern);

  if (idx >= 0) {
    highlightKmapGroup(idx);
  } else {
    const pi = currentResult.primeImplicants.find((p) => p.pattern === pattern);
    if (pi) {
      const mintermSet = new Set(pi.minterms);
      const allCells = dom.kmapGrid.querySelectorAll('.kmap-cell[data-kmap-minterm]');
      allCells.forEach((cell) => {
        const m = parseInt(cell.getAttribute('data-kmap-minterm'), 10);
        if (mintermSet.has(m)) {
          cell.classList.add('kmap-group-active');
          cell.classList.remove('kmap-group-dimmed');
        } else {
          cell.classList.remove('kmap-group-active');
          cell.classList.add('kmap-group-dimmed');
        }
      });
      drawKmapSvgLoop(-1, pi.minterms, 'rgba(255, 255, 255, 0.7)');
    }
  }
};

const highlightKmapMinterm = (minterm) => {
  const allCells = dom.kmapGrid.querySelectorAll('.kmap-cell[data-kmap-minterm]');
  allCells.forEach((cell) => {
    const m = parseInt(cell.getAttribute('data-kmap-minterm'), 10);
    if (m === minterm) {
      cell.classList.add('kmap-group-active');
      cell.classList.remove('kmap-group-dimmed');
    } else {
      cell.classList.remove('kmap-group-active');
      cell.classList.add('kmap-group-dimmed');
    }
  });
  drawKmapSvgLoop(-1, [minterm], 'var(--accent-cyan)');
};

const clearKmapHighlight = () => {
  const allCells = dom.kmapGrid.querySelectorAll('.kmap-cell[data-kmap-minterm]');
  allCells.forEach((cell) => {
    cell.classList.remove('kmap-group-active', 'kmap-group-dimmed');
  });
  dom.kmapSvgOverlay.innerHTML = '';
};

// ---- THÃ€NH PHáº¦N 8: SÆ  Äá»’ Cá»”NG LOGIC Tá»° Äá»˜NG SINH Báº°NG SVG ----

const renderLogicGates = (result) => {
  if (!result || result.expression === '0') {
    dom.logicCard.classList.add('hidden');
    return;
  }

  dom.logicCard.classList.remove('hidden');

  const selectedPIs = result.selectedPIs;
  const numVars = result.numVars;
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numVars).split('');

  if (result.expression === '1') {
    dom.logicSvgWrapper.innerHTML = `<svg width="250" height="80">
      <text x="30" y="45" class="gate-text" style="font-size:14px">Äáº§u vÃ o R_min(F) luÃ´n báº±ng logic 1:</text>
      <rect x="250" y="25" width="40" height="30" rx="4" class="gate-shape" style="stroke:var(--accent-emerald)"></rect>
      <text x="265" y="45" class="gate-text" style="fill:var(--accent-emerald); font-weight:800">1</text>
      <line x1="290" y1="40" x2="330" y2="40" stroke="var(--accent-emerald)" stroke-width="2.5"></line>
      <text x="340" y="45" class="gate-text" style="fill:var(--accent-emerald); font-size:14px; font-weight:800">F</text>
    </svg>`;
    return;
  }

  const inputX = {};
  let currentX = 50;

  varNames.forEach((v) => {
    inputX[v] = { normal: currentX, not: currentX + 22 };
    currentX += 45;
  });

  const busWidth = currentX + 15;
  const andGatesCount = selectedPIs.length;

  const andGatesY = [];
  let currentY = 50;
  selectedPIs.forEach(() => {
    andGatesY.push(currentY);
    currentY += 80;
  });

  const svgHeight = currentY + 40;
  const svgWidth = busWidth + 300;

  let svgHTML = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

  varNames.forEach((v) => {
    const coords = inputX[v];
    svgHTML += `
      <text x="${coords.normal - 5}" y="25" class="gate-text">${v}</text>
      <line x1="${coords.normal}" y1="35" x2="${coords.normal}" y2="${svgHeight - 40}" class="gate-wire" id="wire-${v}"></line>
    `;

    const notY = 40;
    svgHTML += `
      <line x1="${coords.normal}" y1="${notY}" x2="${coords.not - 10}" y2="${notY}" class="gate-wire" id="wire-${v}-not-in"></line>
      <polygon points="${coords.not - 10},${notY - 6} ${coords.not - 10},${notY + 6} ${coords.not - 2},${notY}" class="gate-shape" style="stroke:var(--accent-purple)"></polygon>
      <circle cx="${coords.not - 1.5}" cy="${notY}" r="1.5" style="fill:none; stroke:var(--accent-purple); stroke-width:1.5"></circle>
      <line x1="${coords.not}" y1="${notY}" x2="${coords.not}" y2="${svgHeight - 40}" class="gate-wire" id="wire-${v}-not"></line>
      <circle cx="${coords.normal}" cy="${notY}" r="3" class="gate-junction" id="junc-${v}-${notY}"></circle>
    `;
  });

  const andX = busWidth + 50;
  const orX = andX + 160;
  const orY = svgHeight / 2 - 10;

  selectedPIs.forEach((pi, idx) => {
    const gateY = andGatesY[idx];
    const term = patternToTerm(pi.pattern, numVars);
    const color = piColor(idx);

    svgHTML += `<!-- Cá»•ng AND #${idx} (${term}) -->`;

    let inputCount = 0;
    const connections = [];

    for (let i = 0; i < pi.pattern.length; i++) {
      const bit = pi.pattern[i];
      const v = varNames[i];
      if (bit === '1') {
        connections.push({ name: v, isNot: false, x: inputX[v].normal });
        inputCount++;
      } else if (bit === '0') {
        connections.push({ name: v, isNot: true, x: inputX[v].not });
        inputCount++;
      }
    }

    connections.forEach((conn, cIdx) => {
      let wireY = gateY + 10;
      if (connections.length > 1) {
        wireY = gateY + 5 + (cIdx / (connections.length - 1)) * 20;
      }
      const wireId = conn.isNot ? `wire-${conn.name}-not` : `wire-${conn.name}`;
      svgHTML += `
        <line x1="${conn.x}" y1="${wireY}" x2="${andX}" y2="${wireY}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></line>
        <circle cx="${conn.x}" cy="${wireY}" r="3" class="gate-junction" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></circle>
      `;
    });

    let andPath = '';
    if (inputCount > 1) {
      andPath = `M ${andX} ${gateY} L ${andX + 18} ${gateY} A 15 15 0 0 1 ${andX + 18} ${gateY + 30} L ${andX} ${gateY + 30} Z`;
    } else {
      andPath = `M ${andX} ${gateY} L ${andX + 22} ${gateY + 15} L ${andX} ${gateY + 30} Z`;
    }

    svgHTML += `
      <path d="${andPath}" class="gate-shape" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
      <text x="${andX + 4}" y="${gateY + 19}" class="gate-text" style="font-size:9px; opacity:0.65">${inputCount > 1 ? 'AND' : 'BUF'}</text>
      <text x="${andX + 38}" y="${gateY - 4}" class="gate-text" style="font-size:10px; fill:${color}">${term}</text>
    `;

    const outputY = gateY + 15;
    svgHTML += `
      <path d="M ${andX + 30} ${outputY} L ${orX - 35} ${outputY} L ${orX - 15} ${orY + 15 + (idx - andGatesCount / 2) * 8}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
    `;
  });

  const orPath = `M ${orX} ${orY} C ${orX + 8} ${orY + 6} ${orX + 10} ${orY + 12} ${orX + 28} ${orY + 15} C ${orX + 10} ${orY + 18} ${orX + 8} ${orY + 24} ${orX} ${orY + 30} C ${orX + 7} ${orY + 20} ${orX + 7} ${orY + 10} ${orX} ${orY} Z`;

  svgHTML += `
    <path d="${orPath}" class="gate-shape" id="or-gate" style="stroke:var(--accent-cyan); fill:var(--bg-elevated); filter:drop-shadow(0 1px 4px var(--accent-cyan-glow))"></path>
    <text x="${orX + 5}" y="${orY + 19}" class="gate-text" style="font-size:9px; fill:var(--accent-cyan)">OR</text>
    
    <line x1="${orX + 28}" y1="${orY + 15}" x2="${orX + 65}" y2="${orY + 15}" class="gate-wire" id="wire-output-f" style="--accent-color:var(--accent-cyan)"></line>
    <text x="${orX + 72}" y="${orY + 20}" class="gate-text" style="font-size:15px; fill:var(--accent-cyan); font-weight:900">F</text>
  `;

  svgHTML += '</svg>';
  dom.logicSvgWrapper.innerHTML = svgHTML;
};

const highlightLogicGateByPattern = (pattern) => {
  if (!currentResult) return;

  const wrappers = [dom.logicSvgWrapper, dom.logicNandSvgWrapper, dom.logicNorSvgWrapper];
  wrappers.forEach(wrapper => {
    if (!wrapper) return;
    const elements = wrapper.querySelectorAll(`[data-pi-pattern="${pattern}"]`);
    elements.forEach((el) => {
      if (el.tagName === 'line' || el.tagName === 'path') {
        el.classList.add('gate-wire--active');
      }
      if (el.classList.contains('gate-shape')) {
        el.classList.add('gate-shape--active');
      }
      if (el.classList.contains('gate-junction')) {
        el.classList.add('gate-junction--active');
      }
    });

    const idx = currentResult.selectedPIs.findIndex((pi) => pi.pattern === pattern);
    if (idx >= 0) {
      const pi = currentResult.selectedPIs[idx];
      const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, currentResult.numVars);
      for (let i = 0; i < pi.pattern.length; i++) {
        const bit = pi.pattern[i];
        const v = varNames[i];
        const color = piColor(idx);

        const wireIds = [
          bit === '1' ? `#wire-${v}` : `#wire-${v}-not`,
          bit === '1' ? `#nand-wire-${v}` : `#nand-wire-${v}-not`,
          bit === '1' ? `#nor-wire-${v}` : `#nor-wire-${v}-not`
        ];

        wireIds.forEach(id => {
          const wire = wrapper.querySelector(id);
          if (wire) {
            wire.classList.add('gate-wire--active');
            wire.style.setProperty('--accent-color', color);
          }
        });

        if (bit === '0') {
          const wireIn = wrapper.querySelector(`#wire-${v}-not-in`);
          if (wireIn) {
            wireIn.classList.add('gate-wire--active');
            wireIn.style.setProperty('--accent-color', color);
          }
          const nandIn1 = wrapper.querySelector(`#nand-wire-${v}-not-in1`);
          const nandIn2 = wrapper.querySelector(`#nand-wire-${v}-not-in2`);
          if (nandIn1) {
            nandIn1.classList.add('gate-wire--active');
            nandIn1.style.setProperty('--accent-color', color);
          }
          if (nandIn2) {
            nandIn2.classList.add('gate-wire--active');
            nandIn2.style.setProperty('--accent-color', color);
          }
          const norIn1 = wrapper.querySelector(`#nor-wire-${v}-not-in1`);
          const norIn2 = wrapper.querySelector(`#nor-wire-${v}-not-in2`);
          if (norIn1) {
            norIn1.classList.add('gate-wire--active');
            norIn1.style.setProperty('--accent-color', color);
          }
          if (norIn2) {
            norIn2.classList.add('gate-wire--active');
            norIn2.style.setProperty('--accent-color', color);
          }
        }
      }
    }
  });
};

const clearLogicHighlight = () => {
  const wrappers = [dom.logicSvgWrapper, dom.logicNandSvgWrapper, dom.logicNorSvgWrapper];
  wrappers.forEach(wrapper => {
    if (!wrapper) return;
    const activeElements = wrapper.querySelectorAll('.gate-wire--active, .gate-shape--active, .gate-junction--active');
    activeElements.forEach((el) => {
      el.classList.remove('gate-wire--active', 'gate-shape--active', 'gate-junction--active');
      el.style.removeProperty('--accent-color');
    });
  });
};

const renderNANDGates = (result) => {
  if (!result || result.expression === '0') {
    dom.logicNandSvgWrapper.innerHTML = '';
    return;
  }

  const selectedPIs = result.selectedPIs;
  const numVars = result.numVars;
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numVars).split('');

  if (result.expression === '1') {
    dom.logicNandSvgWrapper.innerHTML = `<svg width="250" height="80">
      <rect x="250" y="25" width="40" height="30" rx="4" class="gate-shape" style="stroke:var(--accent-emerald)"></rect>
      <text x="265" y="45" class="gate-text" style="fill:var(--accent-emerald); font-weight:800">1</text>
    </svg>`;
    return;
  }

  const inputX = {};
  let currentX = 50;
  varNames.forEach((v) => {
    inputX[v] = { normal: currentX, not: currentX + 22 };
    currentX += 45;
  });

  const busWidth = currentX + 15;
  const nandGatesCount = selectedPIs.length;

  const andGatesY = [];
  let currentY = 50;
  selectedPIs.forEach(() => {
    andGatesY.push(currentY);
    currentY += 80;
  });

  const svgHeight = currentY + 40;
  const svgWidth = busWidth + 300;

  let svgHTML = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

  varNames.forEach((v) => {
    const coords = inputX[v];
    svgHTML += `
      <text x="${coords.normal - 5}" y="25" class="gate-text">${v}</text>
      <line x1="${coords.normal}" y1="35" x2="${coords.normal}" y2="${svgHeight - 40}" class="gate-wire" id="nand-wire-${v}"></line>
    `;

    const notY = 40;
    svgHTML += `
      <line x1="${coords.normal}" y1="${notY - 6}" x2="${coords.not - 10}" y2="${notY - 6}" class="gate-wire" id="nand-wire-${v}-not-in1"></line>
      <line x1="${coords.normal}" y1="${notY + 6}" x2="${coords.not - 10}" y2="${notY + 6}" class="gate-wire" id="nand-wire-${v}-not-in2"></line>
      <path d="M ${coords.not - 10} ${notY - 10} L ${coords.not + 2} ${notY - 10} A 10 10 0 0 1 ${coords.not + 2} ${notY + 10} L ${coords.not - 10} ${notY + 10} Z" class="gate-shape" style="stroke:var(--accent-purple)"></path>
      <circle cx="${coords.not + 13}" cy="${notY}" r="2" style="fill:var(--bg-elevated); stroke:var(--accent-purple); stroke-width:1.5"></circle>
      <line x1="${coords.not + 15}" y1="${notY}" x2="${coords.not}" y2="${notY}" class="gate-wire" style="--accent-color:var(--accent-purple)"></line>
      <line x1="${coords.not}" y1="${notY}" x2="${coords.not}" y2="${svgHeight - 40}" class="gate-wire" id="nand-wire-${v}-not"></line>
      <circle cx="${coords.normal}" cy="${notY - 6}" r="2.5" class="gate-junction"></circle>
      <circle cx="${coords.normal}" cy="${notY + 6}" r="2.5" class="gate-junction"></circle>
    `;
  });

  const andX = busWidth + 50;
  const orX = andX + 160;
  const orY = svgHeight / 2 - 10;

  selectedPIs.forEach((pi, idx) => {
    const gateY = andGatesY[idx];
    const term = patternToTerm(pi.pattern, numVars);
    const color = piColor(idx);

    svgHTML += `<!-- Cá»•ng NAND #${idx} (${term}) -->`;

    let inputCount = 0;
    const connections = [];

    for (let i = 0; i < pi.pattern.length; i++) {
      const bit = pi.pattern[i];
      const v = varNames[i];
      if (bit === '1') {
        connections.push({ name: v, isNot: false, x: inputX[v].normal });
        inputCount++;
      } else if (bit === '0') {
        connections.push({ name: v, isNot: true, x: inputX[v].not });
        inputCount++;
      }
    }

    connections.forEach((conn, cIdx) => {
      let wireY = gateY + 10;
      if (connections.length > 1) {
        wireY = gateY + 5 + (cIdx / (connections.length - 1)) * 20;
      }
      svgHTML += `
        <line x1="${conn.x}" y1="${wireY}" x2="${andX}" y2="${wireY}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></line>
        <circle cx="${conn.x}" cy="${wireY}" r="3" class="gate-junction" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></circle>
      `;
    });

    svgHTML += `
      <path d="M ${andX} ${gateY} L ${andX + 18} ${gateY} A 15 15 0 0 1 ${andX + 18} ${gateY + 30} L ${andX} ${gateY + 30} Z" class="gate-shape" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
      <circle cx="${andX + 34.5}" cy="${gateY + 15}" r="2" class="gate-shape" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}; fill:var(--bg-elevated); stroke-width:1.5"></circle>
      <text x="${andX + 38}" y="${gateY - 4}" class="gate-text" style="font-size:10px; fill:${color}">${term}</text>
    `;

    const outputY = gateY + 15;
    svgHTML += `
      <path d="M ${andX + 36.5} ${outputY} L ${orX - 35} ${outputY} L ${orX - 15} ${orY + 15 + (idx - nandGatesCount / 2) * 8}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
    `;
  });

  const orGateY = orY;
  svgHTML += `
    <path d="M ${orX} ${orGateY} L ${orX + 18} ${orGateY} A 15 15 0 0 1 ${orX + 18} ${orGateY + 30} L ${orX} ${orGateY + 30} Z" class="gate-shape" id="nand-gate-final" style="stroke:var(--accent-cyan); fill:var(--bg-elevated)"></path>
    <circle cx="${orX + 34.5}" cy="${orGateY + 15}" r="2" style="fill:var(--bg-elevated); stroke:var(--accent-cyan); stroke-width:1.5"></circle>
    <text x="${orX + 4}" y="${orGateY + 19}" class="gate-text" style="font-size:9px; fill:var(--accent-cyan)">NAND</text>
    
    <line x1="${orX + 36.5}" y1="${orGateY + 15}" x2="${orX + 65}" y2="${orGateY + 15}" class="gate-wire" id="nand-wire-output-f" style="--accent-color:var(--accent-cyan)"></line>
    <text x="${orX + 72}" y="${orGateY + 20}" class="gate-text" style="font-size:15px; fill:var(--accent-cyan); font-weight:900">F</text>
  `;

  svgHTML += '</svg>';
  dom.logicNandSvgWrapper.innerHTML = svgHTML;
};

const renderNORGates = (result) => {
  if (!result || result.expression === '0') {
    dom.logicNorSvgWrapper.innerHTML = '';
    return;
  }

  const selectedPIs = result.selectedPIs;
  const numVars = result.numVars;
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, numVars).split('');

  if (result.expression === '1') {
    dom.logicNorSvgWrapper.innerHTML = `<svg width="250" height="80">
      <rect x="250" y="25" width="40" height="30" rx="4" class="gate-shape" style="stroke:var(--accent-emerald)"></rect>
      <text x="265" y="45" class="gate-text" style="fill:var(--accent-emerald); font-weight:800">1</text>
    </svg>`;
    return;
  }

  const inputX = {};
  let currentX = 50;
  varNames.forEach((v) => {
    inputX[v] = { normal: currentX, not: currentX + 22 };
    currentX += 45;
  });

  const busWidth = currentX + 15;
  const norGatesCount = selectedPIs.length;

  const andGatesY = [];
  let currentY = 50;
  selectedPIs.forEach(() => {
    andGatesY.push(currentY);
    currentY += 80;
  });

  const svgHeight = currentY + 40;
  const svgWidth = busWidth + 300;

  let svgHTML = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

  varNames.forEach((v) => {
    const coords = inputX[v];
    svgHTML += `
      <text x="${coords.normal - 5}" y="25" class="gate-text">${v}</text>
      <line x1="${coords.normal}" y1="35" x2="${coords.normal}" y2="${svgHeight - 40}" class="gate-wire" id="nor-wire-${v}"></line>
    `;

    const notY = 40;
    svgHTML += `
      <line x1="${coords.normal}" y1="${notY - 6}" x2="${coords.not - 10}" y2="${notY - 6}" class="gate-wire" id="nor-wire-${v}-not-in1"></line>
      <line x1="${coords.normal}" y1="${notY + 6}" x2="${coords.not - 10}" y2="${notY + 6}" class="gate-wire" id="nor-wire-${v}-not-in2"></line>
      <path d="M ${coords.not - 10} ${notY - 10} C ${coords.not - 2} ${notY - 4} ${coords.not} ${notY + 2} ${coords.not + 18} ${notY} C ${coords.not} ${notY - 2} ${coords.not - 2} ${notY + 4} ${coords.not - 10} ${notY + 10} C ${coords.not - 3} ${notY} ${coords.not - 3} ${notY} ${coords.not - 10} ${notY - 10} Z" class="gate-shape" style="stroke:var(--accent-purple)"></path>
      <circle cx="${coords.not + 20.5}" cy="${notY}" r="2" style="fill:var(--bg-elevated); stroke:var(--accent-purple); stroke-width:1.5"></circle>
      <line x1="${coords.not + 22.5}" y1="${notY}" x2="${coords.not}" y2="${notY}" class="gate-wire" style="--accent-color:var(--accent-purple)"></line>
      <line x1="${coords.not}" y1="${notY}" x2="${coords.not}" y2="${svgHeight - 40}" class="gate-wire" id="nor-wire-${v}-not"></line>
      <circle cx="${coords.normal}" cy="${notY - 6}" r="2.5" class="gate-junction"></circle>
      <circle cx="${coords.normal}" cy="${notY + 6}" r="2.5" class="gate-junction"></circle>
    `;
  });

  const andX = busWidth + 50;
  const orX = andX + 160;
  const orY = svgHeight / 2 - 10;

  selectedPIs.forEach((pi, idx) => {
    const gateY = andGatesY[idx];
    const term = patternToTerm(pi.pattern, numVars);
    const color = piColor(idx);

    svgHTML += `<!-- Cá»•ng NOR #${idx} (${term}) -->`;

    let inputCount = 0;
    const connections = [];

    for (let i = 0; i < pi.pattern.length; i++) {
      const bit = pi.pattern[i];
      const v = varNames[i];
      if (bit === '1') {
        connections.push({ name: v, isNot: true, x: inputX[v].not });
        inputCount++;
      } else if (bit === '0') {
        connections.push({ name: v, isNot: false, x: inputX[v].normal });
        inputCount++;
      }
    }

    connections.forEach((conn, cIdx) => {
      let wireY = gateY + 10;
      if (connections.length > 1) {
        wireY = gateY + 5 + (cIdx / (connections.length - 1)) * 20;
      }
      svgHTML += `
        <line x1="${conn.x}" y1="${wireY}" x2="${andX}" y2="${wireY}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></line>
        <circle cx="${conn.x}" cy="${wireY}" r="3" class="gate-junction" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></circle>
      `;
    });

    const norPath = `M ${andX} ${gateY} C ${andX + 8} ${gateY + 6} ${andX + 10} ${gateY + 12} ${andX + 28} ${gateY + 15} C ${andX + 10} ${gateY + 18} ${andX + 8} ${gateY + 24} ${andX} ${gateY + 30} C ${andX + 7} ${gateY + 20} ${andX + 7} ${gateY + 10} ${andX} ${gateY} Z`;
    svgHTML += `
      <path d="${norPath}" class="gate-shape" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
      <circle cx="${andX + 30}" cy="${gateY + 15}" r="2" class="gate-shape" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}; fill:var(--bg-elevated); stroke-width:1.5"></circle>
      <text x="${andX + 38}" y="${gateY - 4}" class="gate-text" style="font-size:10px; fill:${color}">${term}</text>
    `;

    const outputY = gateY + 15;
    svgHTML += `
      <path d="M ${andX + 32} ${outputY} L ${orX - 35} ${outputY} L ${orX - 15} ${orY + 15 + (idx - norGatesCount / 2) * 8}" class="gate-wire" data-pi-pattern="${pi.pattern}" style="--accent-color:${color}"></path>
    `;
  });

  const orGateY = orY;
  const norPathFinal = `M ${orX} ${orGateY} C ${orX + 8} ${orGateY + 6} ${orX + 10} ${orGateY + 12} ${orX + 28} ${orGateY + 15} C ${orX + 10} ${orGateY + 18} ${orX + 8} ${orGateY + 24} ${orX} ${orGateY + 30} C ${orX + 7} ${orGateY + 20} ${orX + 7} ${orGateY + 10} ${orX} ${orGateY} Z`;
  svgHTML += `
    <path d="${norPathFinal}" class="gate-shape" id="nor-gate-final" style="stroke:var(--accent-cyan); fill:var(--bg-elevated)"></path>
    <circle cx="${orX + 30}" cy="${orGateY + 15}" r="2" style="fill:var(--bg-elevated); stroke:var(--accent-cyan); stroke-width:1.5"></circle>
    <text x="${orX + 4}" y="${orGateY + 19}" class="gate-text" style="font-size:9px; fill:var(--accent-cyan)">NOR</text>
  `;

  if (selectedPIs.length > 1) {
    const invX = orX + 65;
    svgHTML += `
      <line x1="${orX + 32}" y1="${orGateY + 15}" x2="${invX}" y2="${orGateY + 9}" class="gate-wire" style="--accent-color:var(--accent-cyan)"></line>
      <line x1="${orX + 32}" y1="${orGateY + 15}" x2="${invX}" y2="${orGateY + 21}" class="gate-wire" style="--accent-color:var(--accent-cyan)"></line>
      <path d="M ${invX} ${orGateY} C ${invX + 8} ${orGateY + 6} ${invX + 10} ${orGateY + 12} ${invX + 28} ${orGateY + 15} C ${invX + 10} ${orGateY + 18} ${invX + 8} ${orGateY + 24} ${invX} ${orGateY + 30} C ${invX + 7} ${orGateY + 20} ${invX + 7} ${orGateY + 10} ${invX} ${orGateY} Z" class="gate-shape" id="nor-gate-inv" style="stroke:var(--accent-cyan); fill:var(--bg-elevated)"></path>
      <circle cx="${invX + 30}" cy="${orGateY + 15}" r="2" style="fill:var(--bg-elevated); stroke:var(--accent-cyan); stroke-width:1.5"></circle>
      <line x1="${invX + 32}" y1="${orGateY + 15}" x2="${invX + 60}" y2="${orGateY + 15}" class="gate-wire" id="nor-wire-output-f" style="--accent-color:var(--accent-cyan)"></line>
      <text x="${invX + 67}" y="${orGateY + 20}" class="gate-text" style="font-size:15px; fill:var(--accent-cyan); font-weight:900">F</text>
    `;
  } else {
    svgHTML += `
      <line x1="${orX + 32}" y1="${orGateY + 15}" x2="${orX + 65}" y2="${orGateY + 15}" class="gate-wire" id="nor-wire-output-f" style="--accent-color:var(--accent-cyan)"></line>
      <text x="${orX + 72}" y="${orGateY + 20}" class="gate-text" style="font-size:15px; fill:var(--accent-cyan); font-weight:900">F</text>
    `;
  }

  svgHTML += '</svg>';
  dom.logicNorSvgWrapper.innerHTML = svgHTML;
};

// ---- THÃ€NH PHáº¦N 9: ÄIá»€U KHIá»‚N XEM Tá»ªNG BÆ¯á»šC (STEPPER) -------

const buildSteps = (result) => {
  const s = [];
  s.push({ label: 'Tá»•ng quan', cardId: 'summary-card', icon: 'ðŸ“Š' });
  s.push({ label: 'QuÃ¡ trÃ¬nh Merge', cardId: 'rounds-card', icon: 'ðŸ”„' });
  s.push({ label: 'CÃ¡c tÃ­ch cá»±c tiá»ƒu', cardId: 'pi-card', icon: 'â­' });
  s.push({ label: 'Báº£ng bao phá»§', cardId: 'chart-card', icon: 'ðŸ“‹' });
  s.push({ label: 'CÃ¡c tÃ­ch cá»±c tiá»ƒu Ä‘Ã£ chá»n', cardId: 'selected-card', icon: 'âœ…' });

  if (result.numVars >= 2 && result.numVars <= 4) {
    s.push({ label: 'Karnaugh Map', cardId: 'kmap-card', icon: 'ðŸ—ºï¸' });
  }

  if (result.expression !== '0') {
    s.push({ label: 'SÆ¡ Ä‘á»“ Cá»•ng Logic', cardId: 'logic-card', icon: 'ðŸ”Œ' });
  }

  return s;
};

const renderStepperProgress = () => {
  let html = '';
  steps.forEach((step, idx) => {
    if (idx > 0) {
      const connectorClass = idx <= currentStep ? 'completed' : '';
      html += `<span class="stepper-connector ${connectorClass}"></span>`;
    }
    let dotClass = 'stepper-dot';
    if (idx === currentStep) dotClass += ' active';
    else if (idx < currentStep) dotClass += ' completed';
    html += `<span class="${dotClass}" data-step="${idx}" title="${step.label}"></span>`;
  });
  dom.stepperProgress.innerHTML = html;

  const dots = dom.stepperProgress.querySelectorAll('.stepper-dot');
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-step'), 10);
      goToStep(idx);
    });
  });

  const step = steps[currentStep];
  dom.stepperLabel.innerHTML = `<strong>${step.icon} ${step.label}</strong> â€” BÆ°á»›c ${currentStep + 1} / ${steps.length}`;

  dom.btnPrev.disabled = currentStep === 0;
  dom.btnNext.disabled = currentStep === steps.length - 1;
};

const goToStep = (idx) => {
  if (idx < 0 || idx >= steps.length) return;
  currentStep = idx;

  const allCards = dom.resultsSection.querySelectorAll('.result-card');
  allCards.forEach((card) => {
    card.classList.add('step-hidden');
    card.classList.remove('step-enter');
  });

  const step = steps[currentStep];
  const card = document.getElementById(step.cardId);
  if (card) {
    card.classList.remove('step-hidden', 'hidden');
    card.classList.add('step-enter');
  }

  renderStepperProgress();
  if (typeof updateCodeTrace === 'function') updateCodeTrace(currentStep);
};

const toggleStepperMode = () => {
  stepperMode = !stepperMode;

  if (stepperMode) {
    dom.btnToggleMode.textContent = '📋 Xem tất cả';
    dom.btnToggleMode.classList.add('active');
    dom.stepperControls.classList.remove('hidden');
    if (dom.codeTracePanel) dom.codeTracePanel.classList.remove('hidden');

    currentStep = 0;
    goToStep(0);
  } else {
    dom.btnToggleMode.textContent = '📖 Xem từng bước';
    dom.btnToggleMode.classList.remove('active');
    dom.stepperControls.classList.add('hidden');
    if (dom.codeTracePanel) dom.codeTracePanel.classList.add('hidden');

    const allCards = dom.resultsSection.querySelectorAll('.result-card');
    allCards.forEach((card) => {
      card.classList.remove('step-hidden', 'hidden', 'step-enter');
    });

    if (currentResult) {
      if (currentResult.numVars >= 2 && currentResult.numVars <= 4) {
        dom.kmapCard.classList.remove('hidden');
      }
      dom.logicCard.classList.remove('hidden');
    }
  }
};

// ---- CHUYá»‚N Äá»”I TAB Tá»° Äá»˜NG CHO Cá»˜T TRÃI VÃ€ Cá»˜T PHáº¢I --------

const initLeftTabs = () => {
  const container = document.getElementById('left-tabs-container');
  if (!container) return;

  const tabs = container.querySelectorAll('.left-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelector('.left-tab.active')?.classList.remove('active');
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-target');

      const leftCards = ['summary-card', 'rounds-card', 'pi-card', 'chart-card', 'selected-card'];
      leftCards.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
          if (id === targetId) card.classList.remove('hidden');
          else card.classList.add('hidden');
        }
      });
    });
  });
};

const initVisTabs = () => {
  const container = document.getElementById('vis-tabs-container');
  if (!container) return;

  const tabs = container.querySelectorAll('.vis-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelector('.vis-tab.active')?.classList.remove('active');
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-target');

      const visContents = ['kmap-card', 'logic-card', 'nand-card', 'nor-card'];
      visContents.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
          if (id === targetId) card.classList.remove('hidden');
          else card.classList.add('hidden');
        }
      });
    });
  });
};

// ---- TRÃŒNH CHáº Y THUáº¬T TOÃN CHÃNH (MAIN ENTRY POINT) --------

const runAlgorithm = () => {
  hideError();

  try {
    const minterms = parseIntList(dom.inputMinterms.value);
    const dontCares = parseIntList(dom.inputDontCares.value);
    validateInput(minterms, dontCares);

    const numVarsSelect = dom.inputNumVars.value;
    const numVarsOverride = numVarsSelect === 'auto' ? null : parseInt(numVarsSelect, 10);

    if (numVarsOverride) {
      const maxVal = Math.pow(2, numVarsOverride) - 1;
      const allTerms = [...minterms, ...dontCares];
      for (const t of allTerms) {
        if (t > maxVal) {
          throw new Error(`GiÃ¡ trá»‹ ${t} vÆ°á»£t quÃ¡ giá»›i háº¡n ${maxVal} cá»§a ${numVarsOverride} biáº¿n.`);
        }
      }
    }

    const result = quineMcCluskey(minterms, dontCares, numVarsOverride);
    currentResult = result;
    currentMinterms = minterms;
    currentDontCares = dontCares;
    activeRoundIndex = 0;
    activeKmapGroup = -1;

    renderSummary(result, minterms, dontCares);
    renderRoundTabs(result.rounds);
    renderMergeTable(result.rounds[0], 0);
    renderPIList(result);
    renderPIChart(result);
    renderSelectedPIs(result);

    renderKmap(result, minterms, dontCares);
    renderLogicGates(result);

    // Biáº¿n Ä‘á»•i De Morgan vÃ  dá»±ng sÆ¡ Ä‘á»“ NAND/NOR
    dom.demorganNandBox.innerHTML = generateDeMorganNAND(result.selectedPIs, result.numVars);
    dom.demorganNorBox.innerHTML = generateDeMorganNOR(result.selectedPIs, result.numVars);
    renderNANDGates(result);
    renderNORGates(result);

    // KhÃ´i phá»¥c Tabs vá» máº·c Ä‘á»‹nh khi báº¯t Ä‘áº§u cháº¡y má»›i
    const leftTabContainer = document.getElementById('left-tabs-container');
    if (leftTabContainer) {
      leftTabContainer.querySelector('.left-tab.active')?.classList.remove('active');
      leftTabContainer.querySelector('.left-tab[data-target="summary-card"]')?.classList.add('active');
      const leftCards = ['summary-card', 'rounds-card', 'pi-card', 'chart-card', 'selected-card'];
      leftCards.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
          if (id === 'summary-card') card.classList.remove('hidden');
          else card.classList.add('hidden');
        }
      });
    }

    const visTabContainer = document.getElementById('vis-tabs-container');
    if (visTabContainer) {
      visTabContainer.querySelector('.vis-tab.active')?.classList.remove('active');
      visTabContainer.querySelector('.vis-tab[data-target="kmap-card"]')?.classList.add('active');
      const visContents = ['kmap-card', 'logic-card', 'nand-card', 'nor-card'];
      visContents.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
          if (id === 'kmap-card') card.classList.remove('hidden');
          else card.classList.add('hidden');
        }
      });
    }

    steps = buildSteps(result);

    if (stepperMode) {
      currentStep = 0;
      goToStep(0);
      renderStepperProgress();
      if (dom.codeTracePanel) dom.codeTracePanel.classList.remove('hidden');
    } else {
      if (dom.codeTracePanel) dom.codeTracePanel.classList.add('hidden');
    }

    dom.resultsSection.classList.remove('hidden');

    setTimeout(() => {
      dom.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  } catch (err) {
    showError(err.message);
    dom.resultsSection.classList.add('hidden');
  }
};

// ---- XÃ“A Sáº CH Dá»® LIá»†U (CLEAR ALL) --------------------------

const clearAll = () => {
  dom.inputMinterms.value = '';
  dom.inputDontCares.value = '';
  dom.inputNumVars.value = 'auto';
  dom.resultsSection.classList.add('hidden');
  if (dom.codeTracePanel) dom.codeTracePanel.classList.add('hidden');
  hideError();
  dom.stepperControls.classList.add('hidden');
  dom.btnToggleMode.classList.remove('active');
  dom.btnToggleMode.textContent = 'ðŸ“– Xem tá»«ng bÆ°á»›c';

  currentResult = null;
  stepperMode = false;
  currentStep = 0;
  activeKmapGroup = -1;

  dom.demorganNandBox.innerHTML = '';
  dom.demorganNorBox.innerHTML = '';
  dom.logicNandSvgWrapper.innerHTML = '';
  dom.logicNorSvgWrapper.innerHTML = '';

  renderMintermPicker();
};

// ---- Náº P CÃC VÃ Dá»¤ MáºªU (PRESETS) --------------------------

const examples = {
  1: { minterms: '0, 1, 2, 5, 6, 7', dontCares: '', numVars: '3' },
  2: { minterms: '0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15', dontCares: '', numVars: '4' },
  3: { minterms: '1, 3, 7, 11, 15', dontCares: '0, 2, 5', numVars: '4' },
};

const loadExample = (id) => {
  const ex = examples[id];
  if (!ex) return;

  dom.inputMinterms.value = ex.minterms;
  dom.inputDontCares.value = ex.dontCares;
  dom.inputNumVars.value = ex.numVars;

  renderMintermPicker();

  dom.inputMinterms.style.transition = 'border-color 0.3s';
  dom.inputMinterms.style.borderColor = 'var(--accent-purple)';
  setTimeout(() => { dom.inputMinterms.style.borderColor = ''; }, 600);
};

// ---- Gáº®N Sá»° KIá»†N Láº®NG NGHE (EVENT LISTENERS) ----------------

dom.btnRun.addEventListener('click', runAlgorithm);
dom.btnClear.addEventListener('click', clearAll);

dom.example1.addEventListener('click', () => loadExample(1));
dom.example2.addEventListener('click', () => loadExample(2));
dom.example3.addEventListener('click', () => loadExample(3));

dom.inputMinterms.addEventListener('keydown', (e) => { if (e.key === 'Enter') runAlgorithm(); });
dom.inputDontCares.addEventListener('keydown', (e) => { if (e.key === 'Enter') runAlgorithm(); });

dom.inputNumVars.addEventListener('change', renderMintermPicker);

dom.inputMinterms.addEventListener('input', syncTextToPicker);
dom.inputDontCares.addEventListener('input', syncTextToPicker);

dom.btnToggleMode.addEventListener('click', toggleStepperMode);
dom.btnPrev.addEventListener('click', () => goToStep(currentStep - 1));
dom.btnNext.addEventListener('click', () => goToStep(currentStep + 1));

dom.btnThemeToggle.addEventListener('click', toggleTheme);

document.addEventListener('keydown', (e) => {
  if (!stepperMode || !currentResult) return;
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    goToStep(currentStep - 1);
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    goToStep(currentStep + 1);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (stepperMode) toggleStepperMode();
  }
});

// ---- THÃ€NH PHáº¦N: ÄIá»€U HÆ¯á»šNG LANDING PAGE â†” WORKSPACE --------

const landingPage = document.getElementById('landing-page');
const workspacePage = document.getElementById('workspace-page');
const navBreadcrumb = document.getElementById('navbar-breadcrumb');
const breadcrumbText = document.getElementById('breadcrumb-text');
const btnGoHome = document.getElementById('btn-go-home');

/**
 * Hiá»ƒn thá»‹ Landing Page, áº©n Workspace
 */
const showLanding = () => {
  landingPage.classList.remove('hidden');
  workspacePage.classList.add('hidden');
  navBreadcrumb.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * Hiá»ƒn thá»‹ Workspace, áº©n Landing
 * @param {string} cardTitle   - TÃªn chá»©c nÄƒng hiá»ƒn thá»‹ trÃªn breadcrumb
 * @param {string|null} tabId  - ID cá»§a vis-tab cáº§n kÃ­ch hoáº¡t (náº¿u cÃ³)
 */
const showWorkspace = (cardTitle, tabId = null) => {
  landingPage.classList.add('hidden');
  workspacePage.classList.remove('hidden');
  navBreadcrumb.classList.remove('hidden');
  breadcrumbText.textContent = cardTitle;
  // Chá»‰ lock scroll trÃªn desktop (dashboard fixed viewport)
  document.body.style.overflow = window.innerWidth >= 1024 ? 'hidden' : 'auto';

  // Chuyá»ƒn sang Ä‘Ãºng tab visualisation náº¿u Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh
  if (tabId) {
    const allVisTabs = document.querySelectorAll('.vis-tab');
    const allVisContent = document.querySelectorAll('.vis-content');
    allVisTabs.forEach(t => t.classList.remove('active'));
    allVisContent.forEach(c => c.classList.add('hidden'));

    const targetTab = document.querySelector(`.vis-tab[data-target="${tabId}"]`);
    const targetContent = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (targetContent) targetContent.classList.remove('hidden');
  }
};

/**
 * Khá»Ÿi táº¡o sá»± kiá»‡n click cho toÃ n bá»™ cards trÃªn Landing Page
 */
const initLandingCards = () => {
  const cards = document.querySelectorAll('.landing__card');

  const cardMeta = {
    'kmap-card': 'BÃ¬a Karnaugh (K-map)',
    'logic-card': 'Máº¡ch AND-OR',
    'nand-card': 'Máº¡ch NAND-only',
    'nor-card': 'Máº¡ch NOR-only',
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const tabId = card.getAttribute('data-tab') || null;
      const title = tabId ? (cardMeta[tabId] || card.querySelector('.landing__card-title').textContent)
        : card.querySelector('.landing__card-title').textContent;
      showWorkspace(title, tabId);
    });
  });
};

/**
 * Logo/Brand â†’ quay vá» Landing
 */
if (btnGoHome) {
  btnGoHome.addEventListener('click', (e) => {
    e.preventDefault();
    showLanding();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderMintermPicker();
  initLeftTabs();
  initVisTabs();
  initLandingCards();
  showLanding(); // Báº¯t Ä‘áº§u á»Ÿ Landing page
});


// ---- Code Trace Panel -----------------------------------------
const STEP_LINE_MAP = {
  0: [1],
  1: [2],
  2: [3, 4, 5, 6, 7, 8, 9],
  3: [10],
  4: [11],
  5: [12],
  6: [13],
};

const updateCodeTrace = (stepIdx) => {
  if (!dom.codeTracePanel) return;
  if (!stepperMode) {
    document.querySelectorAll('.code-line').forEach(el => {
      el.classList.remove('active');
      el.classList.add('done');
    });
    const lastLine = document.querySelector('.code-line[data-line="13"]');
    if (lastLine) {
      lastLine.classList.remove('done');
      lastLine.classList.add('active');
    }
    const inspector = document.getElementById('state-inspector');
    if (inspector) inspector.textContent = 'Hoàn thành tính toán!';
    return;
  }

  document.querySelectorAll('.code-line').forEach(el => {
    el.classList.remove('active', 'done');
  });

  const targetLines = STEP_LINE_MAP[stepIdx] || [];

  for (let i = 0; i < stepIdx; i++) {
    const prevLines = STEP_LINE_MAP[i] || [];
    prevLines.forEach(lNum => {
      const el = document.querySelector('.code-line[data-line="' + lNum + '"]');
      if (el) el.classList.add('done');
    });
  }

  targetLines.forEach(lNum => {
    const el = document.querySelector('.code-line[data-line="' + lNum + '"]');
    if (el) el.classList.add('active');
  });

  const inspector = document.getElementById('state-inspector');
  if (inspector && currentResult) {
    let msg = '';
    switch (stepIdx) {
      case 0: msg = 'Khởi tạo: phân tích minterms và don''t cares -> chuỗi nhị phân.'; break;
      case 1: msg = 'Đang phân chia các implicant thành nhóm theo số lượng bit ''1''.'; break;
      case 2: msg = 'Thực hiện gộp các nhóm lân cận...'; break;
      case 3: msg = 'Lập PI Chart phủ các minterms.'; break;
      case 4: msg = 'Tìm các Essential PIs.'; break;
      case 5: msg = 'Sử dụng phuong pháp Petrick cho các minterms còn lại.'; break;
      case 6: msg = 'Tổng hợp R_min(F) = ' + currentResult.expression; break;
      default: msg = 'Đang xử lý...';
    }
    inspector.textContent = msg;
  }
};
