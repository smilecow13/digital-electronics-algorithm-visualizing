// ============================================================
// ui.js — Render & Tương tác cao cấp cho QMC Visualizer (HUST Standard)
// Tách biệt hoàn toàn DOM khỏi thuật toán của algorithm.js.
// ============================================================

// ---- Bảng màu Neon cao cấp cho các tích cực tiểu được chọn -------
const PI_COLORS = [
  { r: 2, g: 132, b: 199, label: 'cyan' }, // Xanh dương sáng
  { r: 124, g: 58, b: 237, label: 'purple' }, // Tím đậm
  { r: 5, g: 150, b: 105, label: 'emerald' }, // Xanh lục neon
  { r: 217, g: 119, b: 6, label: 'amber' }, // Vàng cam ấm
  { r: 220, g: 38, b: 38, label: 'rose' }, // Đỏ hồng neon
  { r: 219, g: 39, b: 119, label: 'pink' }, // Hồng cánh sen
  { r: 101, g: 163, b: 13, label: 'lime' }, // Xanh chuối
  { r: 13, g: 148, b: 136, label: 'teal' }, // Xanh ngọc
];

const GRAY_1 = [0, 1];
const GRAY_2 = [0, 1, 3, 2];

// ---- Khởi tạo tham chiếu DOM ---------------------------------
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
};

// ---- Trạng thái ứng dụng (Application State) -----------------
let currentResult = null;
let currentMinterms = [];
let currentDontCares = [];
let activeRoundIndex = 0;

// Stepper state
let stepperMode = false;
let currentStep = 0;
let steps = [];

// K-map & Interactive state
let activeKmapGroup = -1; // -1: hiện tất cả, >=0: highlight một nhóm cố định

// ---- THÀNH PHẦN 0: CHUYỂN ĐỔI CHẾ ĐỘ SÁNG / TỐI (THEME TOGGLE) -

/**
 * Khởi tạo theme dựa trên cài đặt cũ hoặc mặc định là Sáng (Light Theme)
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
 * Cập nhật SVG icon của nút chuyển đổi Theme
 */
const updateThemeIcon = (isDark) => {
  if (isDark) {
    // Hiển thị Sun Icon (để bấm chuyển sang Light)
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
    dom.btnThemeToggle.setAttribute('title', 'Chuyển sang chế độ Sáng');
  } else {
    // Hiển thị Moon Icon (để bấm chuyển sang Dark)
    dom.themeIcon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    dom.btnThemeToggle.setAttribute('title', 'Chuyển sang chế độ Tối');
  }
};

/**
 * Thực hiện đảo chế độ sáng/tối
 */
const toggleTheme = () => {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);

  // Vẽ lại cổng logic nếu đang hiển thị để cập nhật màu sắc các mối nối
  if (currentResult) {
    renderLogicGates(currentResult);
  }
};

// ---- Parse dữ liệu đầu vào ------------------------------------

const parseIntList = (str) => {
  const trimmed = str.trim();
  if (trimmed === '') return [];
  return trimmed
    .split(/[\s,]+/)
    .filter((s) => s !== '')
    .map((s) => {
      const n = parseInt(s, 10);
      if (isNaN(n) || n < 0) throw new Error(`"${s}" không phải số nguyên hợp lệ`);
      return n;
    });
};

const validateInput = (minterms, dontCares) => {
  if (minterms.length === 0) {
    throw new Error('Vui lòng nhập ít nhất 1 minterm.');
  }
  const mintermSet = new Set(minterms);
  for (const d of dontCares) {
    if (mintermSet.has(d)) {
      throw new Error(`Giá trị ${d} xuất hiện ở cả minterms và don't cares.`);
    }
  }
  if (mintermSet.size !== minterms.length) {
    throw new Error('Có giá trị trùng lặp trong phần minterms.');
  }
  const dcSet = new Set(dontCares);
  if (dcSet.size !== dontCares.length) {
    throw new Error("Có giá trị trùng lặp trong phần don't cares.");
  }
};

// ---- Hiển thị thông báo lỗi ---------------------------------
const showError = (msg) => {
  const textSpan = dom.errorMsg.querySelector('#error-text');
  if (textSpan) textSpan.textContent = msg;
  else dom.errorMsg.textContent = msg;
  dom.errorMsg.classList.add('visible');
};

const hideError = () => {
  dom.errorMsg.classList.remove('visible');
};

// ---- Các hàm hỗ trợ Render chung ----------------------------

/**
 * Tạo cấu trúc HTML cho pattern nhị phân có phân biệt màu sắc 0, 1, X
 * HUST Standard: Hỗ trợ đóng khung chữ nhật bao quanh nếu là tích cực tiểu (EPI/PI)
 */
const renderPattern = (pattern, usedInMerge = false) => {
  let html = `<span class="pattern${!usedInMerge ? ' pattern-pi-framed' : ''}">`;
  for (const ch of pattern) {
    if (ch === '0') html += '<span class="bit-0">0</span>';
    else if (ch === '1') html += '<span class="bit-1">1</span>';
    else html += '<span class="bit-dash">X</span>'; // Triệt tiêu biểu diễn bằng chữ X in hoa
  }
  html += '</span>';
  return html;
};

const piColor = (idx, alpha = 1) => {
  const c = PI_COLORS[idx % PI_COLORS.length];
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
};

// ---- THÀNH PHẦN 1: BỘ CHỌN MINTERM LƯỚI SỐ TƯƠNG TÁC --------

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

// ---- THÀNH PHẦN 2: TỔNG QUAN HÀM BOOLEAN KẾT QUẢ ------------

// ---- THÀNH PHẦN 2: TỔNG QUAN HÀM BOOLEAN KẾT QUẢ ------------

const renderSummary = (result, minterms, dontCares) => {
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, result.numVars).split('').join(', ');
  const chips = []
  dom.summaryInfo.innerHTML = chips.map((c) => `<span class="info-chip">${c}</span>`).join('');

  // Hiển thị Dạng tối thiểu R_min(F) [HUST Standard]
  dom.expressionValue.innerHTML = `R<sub>min</sub>(F) = ${result.expression}`;

  const epiCount = result.essentialPIs.length;
  const additionalCount = result.selectedPIs.length - epiCount;
  let metaHTML = `<span class="expression-meta__item">
    <span class="expression-meta__dot expression-meta__dot--epi"></span>
    ${epiCount} tích cực tiểu thiết yếu (EPI)
  </span>`;
  if (additionalCount > 0) {
    metaHTML += `<span class="expression-meta__item">
      <span class="expression-meta__dot expression-meta__dot--additional"></span>
      ${additionalCount} tích cực tiểu bổ sung tối ưu
    </span>`;
  }
  dom.expressionMeta.innerHTML = metaHTML;
};

// ---- THÀNH PHẦN 3: ROUND TABS & MERGE (CROSS-HIGHLIGHT) -----

const renderRoundTabs = (rounds) => {
  dom.roundTabs.innerHTML = '';
  rounds.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'round-tab' + (idx === activeRoundIndex ? ' active' : '');
    // Đặt tên tab là Khối K^idx chuẩn slide HUST
    btn.innerHTML = idx === 0 ? 'Khối K<sup>0</sup> (Nhóm gốc)' : `Khối K<sup>${idx}</sup>`;
    btn.addEventListener('click', () => {
      activeRoundIndex = idx;
      renderRoundTabs(rounds);
      renderMergeTable(rounds[idx], idx);
    });
    dom.roundTabs.appendChild(btn);
  });
  dom.roundsCount.textContent = `${rounds.length} vòng`;
};

const renderMergeTable = (round, roundIdx = 0) => {
  dom.mergeThead.innerHTML = `<tr><th>Nhóm hàng</th><th>Pattern nhị phân</th><th>Tích chuẩn (Minterm)</th><th>Trạng thái</th></tr>`;

  const groups = round.groups;
  const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
  let html = '';

  for (const key of groupKeys) {
    // Đổi tên nhóm phân theo số bit 1 thành nhóm K_key
    html += `<tr class="group-header"><td colspan="4">Nhóm K<sub>${key}</sub> (${key} bit 1 — ${groups[key].length} tích cực tiểu)</td></tr>`;
    for (const imp of groups[key]) {
      // HUST Standard: 
      // - Nếu đã được gộp (usedInMerge): render bình thường và chèn chữ V in hoa màu lục bên phải pattern!
      // - Nếu chưa được gộp (tích cực tiểu): bao pattern trong khung chữ nhật nét liền rực rỡ!
      const statusBadge = imp.usedInMerge
        ? '<span class="status-badge status-badge--merged">✓ Đã gộp</span>'
        : '<span class="status-badge status-badge--pi">★ Tích cực tiểu</span>';

      const isClickable = roundIdx > 0 ? ' class="clickable-row"' : '';
      const checkMarkText = imp.usedInMerge
        ? '<span style="color:var(--accent-emerald); font-weight:900; margin-left: 8px;" title="Đã gộp nhóm (merged)">V</span>'
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

// ---- THÀNH PHẦN 4: HIỂN THỊ CÁC tích cực tiểu DƯỚI DẠNG CHIPS -

const renderPIList = (result) => {
  dom.piCount.textContent = `${result.primeImplicants.length} tích cực tiểu`;

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
        label = ' (chọn)';
      }

      if (pi.pattern in piColorIndex) {
        const idx = piColorIndex[pi.pattern];
        colorDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${piColor(idx)};margin-right:6px;vertical-align:middle;box-shadow:0 0 5px ${piColor(idx)}"></span>`;
      }

      // Ở đâyPI hiển thị đóng khung chữ nhật đúng chuẩn slide HUST!
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

// ---- THÀNH PHẦN 5: BẢNG BAO PHỦ TƯƠNG TÁC (COVERAGE CHART) --

const renderPIChart = (result) => {
  const allChartMinterms = new Set();
  for (const covered of Object.values(result.chart)) {
    for (const m of covered) allChartMinterms.add(m);
  }
  const sortedMinterms = [...allChartMinterms].sort((a, b) => a - b);

  const essentialPatterns = new Set(result.essentialPIs.map((pi) => pi.pattern));
  const selectedPatterns = new Set(result.selectedPIs.map((pi) => pi.pattern));

  // TÍNH TOÁN ĐỘ PHỦ TỪNG CỘT ĐỂ VẼ DẤU Ⓧ THIẾT YẾU KHOANH TRÒN
  const mintermCoverageCount = {};
  sortedMinterms.forEach((m) => {
    let count = 0;
    for (const covered of Object.values(result.chart)) {
      if (covered.has(m)) count++;
    }
    mintermCoverageCount[m] = count;
  });

  // Bảng bao phủ tiêu đề
  let theadHTML = '<tr><th>tích cực tiểu \\ Minterm</th>';
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
    tbodyHTML += `<td>${renderPattern(pattern, false)}${tag}</td>`; // PI trong chart cũng được đóng khung

    sortedMinterms.forEach((m, colIdx) => {
      if (covered.has(m)) {
        // HUST Standard: 
        // - Cột chỉ có duy nhất 1 dấu phủ: Vẽ chữ Ⓧ (X khoanh tròn) rực rỡ!
        // - Cột có nhiều hơn 1 dấu phủ: Vẽ chữ X in hoa thông thường!
        if (mintermCoverageCount[m] === 1) {
          tbodyHTML += `<td data-col="${colIdx}"><span class="chart-cell-x chart-cell-x--essential" title="Điểm phủ quyết định thiết yếu (EPI)">Ⓧ</span></td>`;
        } else {
          tbodyHTML += `<td data-col="${colIdx}"><span class="chart-cell-x" title="Điểm phủ thường">X</span></td>`;
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

// ---- THÀNH PHẦN 6: tích cực tiểu ĐÃ CHỌN TỐI ƯU ------------------

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
    return `<span class="${chipClass}" data-pattern="${pi.pattern}" title="= ${term}, bao phủ {${pi.minterms.join(', ')}}">${dot}${patternFramed} → ${term}</span>`;
  };

  if (result.essentialPIs.length === 0) {
    dom.essentialPiList.innerHTML = '<span class="info-chip" style="color:var(--text-muted)">Không có tích cực tiểu thiết yếu</span>';
  } else {
    dom.essentialPiList.innerHTML = result.essentialPIs.map(createPiHTML).join('');
  }

  const additionalPIs = result.selectedPIs.filter((pi) => !essentialPatterns.has(pi.pattern));
  if (additionalPIs.length === 0) {
    dom.additionalPiList.innerHTML = '<span class="info-chip" style="color:var(--text-muted)">Không cần chọn thêm tích cực tiểu bổ sung</span>';
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

// ---- THÀNH PHẦN 7: BẢN ĐỒ KARNAUGH VÀ SVG LOOP OVERLAY ------

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
  dom.kmapVarsBadge.textContent = `${numVars} biến`;

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

  let html = '<span class="kmap-legend-label">Chú thích các tích cực tiểu:</span>';

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

// ---- THÀNH PHẦN 8: SƠ ĐỒ CỔNG LOGIC TỰ ĐỘNG SINH BẰNG SVG ----

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
      <text x="30" y="45" class="gate-text" style="font-size:14px">Đầu vào R_min(F) luôn bằng logic 1:</text>
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

    svgHTML += `<!-- Cổng AND #${idx} (${term}) -->`;

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

    svgHTML += `<!-- Cổng NAND #${idx} (${term}) -->`;

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

    svgHTML += `<!-- Cổng NOR #${idx} (${term}) -->`;

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

// ---- THÀNH PHẦN 9: ĐIỀU KHIỂN XEM TỪNG BƯỚC (STEPPER) -------

const buildSteps = (result) => {
  const s = [];
  s.push({ label: 'Tổng quan', cardId: 'summary-card', icon: '📊' });
  s.push({ label: 'Quá trình Merge', cardId: 'rounds-card', icon: '🔄' });
  s.push({ label: 'Các tích cực tiểu', cardId: 'pi-card', icon: '⭐' });
  s.push({ label: 'Bảng bao phủ', cardId: 'chart-card', icon: '📋' });
  s.push({ label: 'Các tích cực tiểu đã chọn', cardId: 'selected-card', icon: '✅' });

  if (result.numVars >= 2 && result.numVars <= 4) {
    s.push({ label: 'Karnaugh Map', cardId: 'kmap-card', icon: '🗺️' });
  }

  if (result.expression !== '0') {
    s.push({ label: 'Sơ đồ Cổng Logic', cardId: 'logic-card', icon: '🔌' });
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
  dom.stepperLabel.innerHTML = `<strong>${step.icon} ${step.label}</strong> — Bước ${currentStep + 1} / ${steps.length}`;

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
};

const toggleStepperMode = () => {
  stepperMode = !stepperMode;

  if (stepperMode) {
    dom.btnToggleMode.textContent = '📋 Xem tất cả';
    dom.btnToggleMode.classList.add('active');
    dom.stepperControls.classList.remove('hidden');

    currentStep = 0;
    goToStep(0);
  } else {
    dom.btnToggleMode.textContent = '📖 Xem từng bước';
    dom.btnToggleMode.classList.remove('active');
    dom.stepperControls.classList.add('hidden');

    const allCards = dom.resultsSection.querySelectorAll('.result-card');
    allCards.forEach((card) => {
      card.classList.remove('step-hidden', 'step-enter');
    });

    if (currentResult) {
      if (currentResult.numVars >= 2 && currentResult.numVars <= 4) {
        dom.kmapCard.classList.remove('hidden');
      }
      dom.logicCard.classList.remove('hidden');
    }
  }
};

// ---- CHUYỂN ĐỔI TAB TỰ ĐỘNG CHO CỘT TRÁI VÀ CỘT PHẢI --------

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

// ---- TRÌNH CHẠY THUẬT TOÁN CHÍNH (MAIN ENTRY POINT) --------

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
          throw new Error(`Giá trị ${t} vượt quá giới hạn ${maxVal} của ${numVarsOverride} biến.`);
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

    // Biến đổi De Morgan và dựng sơ đồ NAND/NOR
    dom.demorganNandBox.innerHTML = generateDeMorganNAND(result.selectedPIs, result.numVars);
    dom.demorganNorBox.innerHTML = generateDeMorganNOR(result.selectedPIs, result.numVars);
    renderNANDGates(result);
    renderNORGates(result);

    // Khôi phục Tabs về mặc định khi bắt đầu chạy mới
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

// ---- XÓA SẠCH DỮ LIỆU (CLEAR ALL) --------------------------

const clearAll = () => {
  dom.inputMinterms.value = '';
  dom.inputDontCares.value = '';
  dom.inputNumVars.value = 'auto';
  hideError();
  dom.resultsSection.classList.add('hidden');
  dom.stepperControls.classList.add('hidden');
  dom.btnToggleMode.classList.remove('active');
  dom.btnToggleMode.textContent = '📖 Xem từng bước';

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

// ---- NẠP CÁC VÍ DỤ MẪU (PRESETS) --------------------------

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

// ---- GẮN SỰ KIỆN LẮNG NGHE (EVENT LISTENERS) ----------------

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

// ---- THÀNH PHẦN: ĐIỀU HƯỚNG LANDING PAGE ↔ WORKSPACE --------

const landingPage = document.getElementById('landing-page');
const workspacePage = document.getElementById('workspace-page');
const navBreadcrumb = document.getElementById('navbar-breadcrumb');
const breadcrumbText = document.getElementById('breadcrumb-text');
const btnGoHome = document.getElementById('btn-go-home');

/**
 * Hiển thị Landing Page, ẩn Workspace
 */
const showLanding = () => {
  landingPage.classList.remove('hidden');
  workspacePage.classList.add('hidden');
  navBreadcrumb.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * Hiển thị Workspace, ẩn Landing
 * @param {string} cardTitle   - Tên chức năng hiển thị trên breadcrumb
 * @param {string|null} tabId  - ID của vis-tab cần kích hoạt (nếu có)
 */
const showWorkspace = (cardTitle, tabId = null) => {
  landingPage.classList.add('hidden');
  workspacePage.classList.remove('hidden');
  navBreadcrumb.classList.remove('hidden');
  breadcrumbText.textContent = cardTitle;
  // Chỉ lock scroll trên desktop (dashboard fixed viewport)
  document.body.style.overflow = window.innerWidth >= 1024 ? 'hidden' : 'auto';

  // Chuyển sang đúng tab visualisation nếu được chỉ định
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
 * Khởi tạo sự kiện click cho toàn bộ cards trên Landing Page
 */
const initLandingCards = () => {
  const cards = document.querySelectorAll('.landing__card');

  const cardMeta = {
    'kmap-card': 'Bìa Karnaugh (K-map)',
    'logic-card': 'Mạch AND-OR',
    'nand-card': 'Mạch NAND-only',
    'nor-card': 'Mạch NOR-only',
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
 * Logo/Brand → quay về Landing
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
  showLanding(); // Bắt đầu ở Landing page
});

