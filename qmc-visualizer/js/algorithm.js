// ============================================================
// algorithm.js — Core logic Quine-McCluskey (HUST Standard)
// Không có DOM API nào ở đây. Chỉ thuần thuật toán.
// Sử dụng ký tự 'X' in hoa làm bit triệt tiêu theo slide bài giảng.
// ============================================================

// ---- Hàm tiện ích ------------------------------------------------

/**
 * Đếm số bit 1 trong một pattern (bỏ qua dấu 'X')
 */
const countOnes = (pattern) => {
  let count = 0;
  for (const ch of pattern) {
    if (ch === '1') count++;
  }
  return count;
};

/**
 * Chuyển số nguyên sang chuỗi nhị phân có độ dài cố định
 */
const toBinary = (num, numVars) => {
  return num.toString(2).padStart(numVars, '0');
};

/**
 * Tính số biến cần thiết từ giá trị lớn nhất trong tập minterm + don't care
 */
const calcNumVars = (minterms, dontCares) => {
  const allTerms = [...minterms, ...dontCares];
  if (allTerms.length === 0) return 1;
  const maxVal = Math.max(...allTerms);
  if (maxVal === 0) return 1;
  return Math.max(Math.ceil(Math.log2(maxVal + 1)), 1);
};

// ---- Bước 1: Tạo implicant ban đầu & nhóm theo số bit 1 ----------

/**
 * Tạo danh sách implicant ban đầu từ minterms và don't cares.
 * Don't care tham gia nhóm bình thường.
 */
const createInitialImplicants = (minterms, dontCares, numVars) => {
  const allTerms = [...minterms, ...dontCares];
  return allTerms.map((term) => ({
    pattern: toBinary(term, numVars),
    minterms: [term],
    usedInMerge: false
  }));
};

/**
 * Nhóm các implicant theo số bit 1 trong pattern.
 * Trả về object { 0: [...], 1: [...], 2: [...], ... }
 */
const groupByOnes = (implicants) => {
  const groups = {};
  for (const imp of implicants) {
    const ones = countOnes(imp.pattern);
    if (!groups[ones]) groups[ones] = [];
    groups[ones].push(imp);
  }
  return groups;
};

// ---- Bước 2: Merge hai implicant khác nhau đúng 1 bit -------------

/**
 * So sánh hai pattern, trả về vị trí khác nhau nếu chỉ khác đúng 1 bit.
 * Trả về -1 nếu khác > 1 bit hoặc khác ở vị trí đã là 'X' triệt tiêu.
 */
const diffPosition = (patternA, patternB) => {
  let diffPos = -1;
  for (let i = 0; i < patternA.length; i++) {
    if (patternA[i] !== patternB[i]) {
      // Nếu một trong hai đã là 'X' thì không ghép được
      if (patternA[i] === 'X' || patternB[i] === 'X') return -1;
      // Nếu đã tìm thấy 1 vị trí khác trước đó → > 1 bit khác
      if (diffPos !== -1) return -1;
      diffPos = i;
    }
  }
  return diffPos;
};

/**
 * Ghép hai implicant thành một implicant mới.
 * Vị trí khác nhau được thay bằng 'X' in hoa.
 * Mảng minterms là hợp (union) của hai mảng gốc, sắp xếp tăng dần.
 */
const mergeImplicants = (impA, impB, diffPos) => {
  const newPattern =
    impA.pattern.substring(0, diffPos) +
    'X' +
    impA.pattern.substring(diffPos + 1);

  // Union minterms, loại bỏ trùng, sắp xếp
  const mergedMinterms = [...new Set([...impA.minterms, ...impB.minterms])].sort(
    (a, b) => a - b
  );

  return {
    pattern: newPattern,
    minterms: mergedMinterms,
    usedInMerge: false
  };
};

// ---- Bước 3: Một vòng merge hoàn chỉnh ----------------------------

/**
 * Thực hiện một vòng merge: so sánh các nhóm liền kề (chênh 1 bit 1).
 * Trả về mảng implicant mới (đã loại trùng theo pattern).
 * Đánh dấu usedInMerge = true cho các implicant đã được ghép.
 */
const performOneRound = (groups) => {
  const newImplicants = [];
  const seen = new Set(); // tránh trùng pattern
  const groupKeys = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < groupKeys.length - 1; i++) {
    const currentGroup = groups[groupKeys[i]];
    const nextGroup = groups[groupKeys[i + 1]];

    // Chỉ so sánh nhóm chênh nhau đúng 1 (groupKeys[i+1] - groupKeys[i] === 1)
    if (groupKeys[i + 1] - groupKeys[i] !== 1) continue;

    for (const impA of currentGroup) {
      for (const impB of nextGroup) {
        const pos = diffPosition(impA.pattern, impB.pattern);
        if (pos !== -1) {
          // Đánh dấu cả hai đã được dùng để merge
          impA.usedInMerge = true;
          impB.usedInMerge = true;

          const merged = mergeImplicants(impA, impB, pos);
          if (!seen.has(merged.pattern)) {
            seen.add(merged.pattern);
            newImplicants.push(merged);
          }
        }
      }
    }
  }

  return newImplicants;
};

// ---- Bước 4: Lặp merge đến khi không ghép được nữa ----------------

/**
 * Chạy toàn bộ quá trình merge.
 * Trả về { rounds, primeImplicants }.
 * rounds[0] = vòng đầu tiên (nhóm gốc), rounds[1] = sau merge lần 1, ...
 */
const findPrimeImplicants = (minterms, dontCares, numVars) => {
  // Tạo implicant ban đầu
  const initialImplicants = createInitialImplicants(minterms, dontCares, numVars);
  const initialGroups = groupByOnes(initialImplicants);

  const rounds = [{ groups: deepCloneGroups(initialGroups) }];

  let currentImplicants = initialImplicants;
  let currentGroups = initialGroups;

  while (true) {
    const newImplicants = performOneRound(currentGroups);

    // Lưu lại trạng thái groups sau khi merge (usedInMerge đã được cập nhật)
    rounds[rounds.length - 1] = { groups: deepCloneGroups(currentGroups) };

    if (newImplicants.length === 0) break;

    const newGroups = groupByOnes(newImplicants);
    rounds.push({ groups: deepCloneGroups(newGroups) });

    currentImplicants = newImplicants;
    currentGroups = newGroups;
  }

  // Thu thập Prime Implicants: tất cả implicant có usedInMerge = false qua mọi vòng
  const primeImplicants = [];
  const seenPatterns = new Set();

  for (const round of rounds) {
    for (const key of Object.keys(round.groups)) {
      for (const imp of round.groups[key]) {
        if (!imp.usedInMerge && !seenPatterns.has(imp.pattern)) {
          seenPatterns.add(imp.pattern);
          primeImplicants.push({
            pattern: imp.pattern,
            minterms: [...imp.minterms],
            usedInMerge: false
          });
        }
      }
    }
  }

  return { rounds, primeImplicants };
};

/**
 * Deep clone object groups để lưu snapshot (tránh tham chiếu bị thay đổi)
 */
const deepCloneGroups = (groups) => {
  const cloned = {};
  for (const key of Object.keys(groups)) {
    cloned[key] = groups[key].map((imp) => ({
      pattern: imp.pattern,
      minterms: [...imp.minterms],
      usedInMerge: imp.usedInMerge
    }));
  }
  return cloned;
};

// ---- Bước 5: PI Chart (don't care không có cột) --------------------

/**
 * Xây dựng PI Chart.
 * Key = pattern của PI, Value = Set các minterm (chỉ minterm thật, không có don't care) mà PI cover.
 */
const buildPIChart = (primeImplicants, minterms) => {
  const mintermSet = new Set(minterms);
  const chart = {};

  for (const pi of primeImplicants) {
    // Chỉ giữ lại minterm thật (loại don't care)
    const covered = new Set(pi.minterms.filter((m) => mintermSet.has(m)));
    if (covered.size > 0) {
      chart[pi.pattern] = covered;
    }
  }

  return chart;
};

// ---- Bước 6: Tìm Essential PI --------------------------------------

/**
 * Tìm Essential Prime Implicants.
 * EPI = PI duy nhất cover một minterm nào đó.
 * Trả về mảng các pattern EPI.
 */
const findEssentialPIs = (chart, minterms) => {
  const essentialPatterns = new Set();

  for (const m of minterms) {
    // Tìm tất cả PI cover minterm m
    const coveringPIs = [];
    for (const [pattern, covered] of Object.entries(chart)) {
      if (covered.has(m)) {
        coveringPIs.push(pattern);
      }
    }
    // Nếu chỉ có đúng 1 PI cover → đó là Essential PI
    if (coveringPIs.length === 1) {
      essentialPatterns.add(coveringPIs[0]);
    }
  }

  return [...essentialPatterns];
};

// ---- Bước 7: Petrick's Method cho minterms còn lại -----------------

/**
 * Sau khi chọn EPI, tìm minterms chưa được cover.
 */
const findUncoveredMinterms = (minterms, selectedPatterns, chart) => {
  const coveredMinterms = new Set();
  for (const pattern of selectedPatterns) {
    if (chart[pattern]) {
      for (const m of chart[pattern]) {
        coveredMinterms.add(m);
      }
    }
  }
  return minterms.filter((m) => !coveredMinterms.has(m));
};

/**
 * Petrick's method: tìm tập PI tối thiểu cover tất cả minterms còn lại.
 * Dùng Product-of-Sums → Sum-of-Products → chọn tích nhỏ nhất.
 */
const petrickMethod = (uncoveredMinterms, chart) => {
  if (uncoveredMinterms.length === 0) return [];

  // Lọc ra chỉ các PI cover ít nhất 1 minterm chưa được cover
  const uncoveredSet = new Set(uncoveredMinterms);
  const relevantPIs = Object.keys(chart).filter((pattern) => {
    for (const m of chart[pattern]) {
      if (uncoveredSet.has(m)) return true;
    }
    return false;
  });

  // Fallback sang greedy nếu quá nhiều PI (tránh bùng nổ tổ hợp)
  if (relevantPIs.length > 20) {
    return greedyCover(uncoveredMinterms, chart, relevantPIs);
  }

  // Xây dựng Product of Sums
  let productOfSums = [];
  for (const m of uncoveredMinterms) {
    const clause = [];
    for (const pattern of relevantPIs) {
      if (chart[pattern].has(m)) {
        clause.push(pattern);
      }
    }
    if (clause.length > 0) {
      productOfSums.push(clause);
    }
  }

  if (productOfSums.length === 0) return [];

  // Nhân phân phối để chuyển sang Sum of Products
  let sumOfProducts = productOfSums[0].map((p) => new Set([p]));

  for (let i = 1; i < productOfSums.length; i++) {
    const newSOP = [];
    const clause = productOfSums[i];

    for (const existingProduct of sumOfProducts) {
      for (const pattern of clause) {
        const newProduct = new Set(existingProduct);
        newProduct.add(pattern);
        newSOP.push(newProduct);
      }
    }

    // Giảm số lượng products bằng absorption (loại bỏ superset)
    sumOfProducts = absorbProducts(newSOP);

    // Safety: nếu bùng nổ quá lớn, fallback
    if (sumOfProducts.length > 10000) {
      return greedyCover(uncoveredMinterms, chart, relevantPIs);
    }
  }

  // Chọn product có ít PI nhất; nếu bằng nhau → chọn tổng literal ít nhất
  let bestProduct = null;
  let bestSize = Infinity;
  let bestLiteralCount = Infinity;

  for (const product of sumOfProducts) {
    const size = product.size;
    const literalCount = [...product].reduce(
      (sum, p) => sum + countLiterals(p),
      0
    );
    if (
      size < bestSize ||
      (size === bestSize && literalCount < bestLiteralCount)
    ) {
      bestProduct = product;
      bestSize = size;
      bestLiteralCount = literalCount;
    }
  }

  return bestProduct ? [...bestProduct] : [];
};

/**
 * Absorption: loại bỏ các product là superset của product khác
 */
const absorbProducts = (products) => {
  products.sort((a, b) => a.size - b.size);

  const result = [];
  for (let i = 0; i < products.length; i++) {
    let isAbsorbed = false;
    for (let j = 0; j < result.length; j++) {
      if (isSubset(result[j], products[i])) {
        isAbsorbed = true;
        break;
      }
    }
    if (!isAbsorbed) {
      result.push(products[i]);
    }
  }
  return result;
};

/**
 * Kiểm tra setA ⊆ setB
 */
const isSubset = (setA, setB) => {
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};

/**
 * Đếm số literal trong một pattern (số ký tự khác 'X')
 */
const countLiterals = (pattern) => {
  let count = 0;
  for (const ch of pattern) {
    if (ch !== 'X') count++;
  }
  return count;
};

// ---- Bước 8: Sinh biểu thức Boolean --------------------------------

/**
 * Chuyển pattern thành term Boolean.
 * Ví dụ: pattern "0X10", numVars=4 → "A'C"
 */
const patternToTerm = (pattern, numVars) => {
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let term = '';

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      term += varNames[i];
    } else if (pattern[i] === '0') {
      term += varNames[i] + "'";
    }
    // 'X' → bỏ qua
  }

  // Trường hợp tất cả đều là 'X' (cover all)
  if (term === '') term = '1';

  return term;
};

/**
 * Sinh biểu thức Boolean cuối cùng từ danh sách các pattern đã chọn.
 */
const generateExpression = (selectedPatterns, numVars) => {
  if (selectedPatterns.length === 0) return '0';

  const terms = selectedPatterns.map((p) => patternToTerm(p, numVars));

  // Nếu có term = '1' thì kết quả = '1'
  if (terms.includes('1')) return '1';

  return terms.join(' + ');
};

// ---- Hàm chính: chạy toàn bộ thuật toán ----------------------------

/**
 * Entry point: chạy Quine-McCluskey hoàn chỉnh.
 */
const quineMcCluskey = (minterms, dontCares = [], numVarsOverride = null) => {
  const numVars = numVarsOverride || calcNumVars(minterms, dontCares);

  if (minterms.length === 0) {
    return {
      numVars,
      rounds: [],
      primeImplicants: [],
      chart: {},
      essentialPIs: [],
      selectedPIs: [],
      expression: '0'
    };
  }

  const { rounds, primeImplicants } = findPrimeImplicants(
    minterms,
    dontCares,
    numVars
  );

  const chart = buildPIChart(primeImplicants, minterms);
  const essentialPIPatterns = findEssentialPIs(chart, minterms);
  const uncovered = findUncoveredMinterms(minterms, essentialPIPatterns, chart);
  const additionalPIPatterns = petrickMethod(uncovered, chart);
  const selectedPIPatterns = [...essentialPIPatterns, ...additionalPIPatterns];

  const piMap = {};
  for (const pi of primeImplicants) {
    piMap[pi.pattern] = pi;
  }

  const essentialPIs = essentialPIPatterns
    .map((p) => piMap[p])
    .filter(Boolean);
  const selectedPIs = selectedPIPatterns
    .map((p) => piMap[p])
    .filter(Boolean);

  const expression = generateExpression(selectedPIPatterns, numVars);

  return {
    numVars,
    rounds,
    primeImplicants,
    chart,
    essentialPIs,
    selectedPIs,
    expression
  };
};

// ---- Bước 9: Thuật toán biến đổi De Morgan sang NAND/NOR 2 đầu vào ---

const overbar = (str) => `<span style="border-top: 1.5px solid currentColor; display: inline-block; padding-top: 1px; line-height: 1.1;">${str}</span>`;

const generateDeMorganNAND = (selectedPIs, numVars) => {
  if (selectedPIs.length === 0) return "F = 0";
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (selectedPIs.length === 1 && selectedPIs[0].pattern.replace(/X/g, '') === '') {
    return "F = 1";
  }

  const termStrings = selectedPIs.map(pi => {
    const lits = [];
    for (let i = 0; i < pi.pattern.length; i++) {
      if (pi.pattern[i] === '1') lits.push(varNames[i]);
      else if (pi.pattern[i] === '0') lits.push(varNames[i] + "'");
    }
    return lits.join('·');
  });

  const sopStr = termStrings.map(t => t.length > 2 ? `(${t})` : t).join(' + ');

  let html = ``;
  html += `<div class="demorgan-step"><span class="step-num">B1</span> <b>Dạng tổng các tích cực tiểu (SOP):</b><br><span class="expr">F = ${sopStr}</span></div>`;

  html += `<div class="demorgan-step"><span class="step-num">B2</span> <b>Phủ định kép toàn bộ biểu thức:</b><br><span class="expr">F = ${overbar(overbar(sopStr))}</span></div>`;

  const nandTerms = termStrings.map(t => overbar(t));
  const innerProduct = nandTerms.join(' · ');
  html += `<div class="demorgan-step"><span class="step-num">B3</span> <b>Áp dụng định lý De Morgan chuyển Tổng thành Tích các phủ định:</b><br><span class="expr">F = ${overbar(innerProduct)}</span></div>`;

  let decompositionHTML = "";
  let needsDecomp = false;

  selectedPIs.forEach((pi, idx) => {
    const lits = [];
    for (let i = 0; i < pi.pattern.length; i++) {
      if (pi.pattern[i] === '1') lits.push(varNames[i]);
      else if (pi.pattern[i] === '0') lits.push(varNames[i] + "'");
    }

    if (lits.length > 2) {
      needsDecomp = true;
      let expr = lits[0];
      let stepsArr = [];
      for (let j = 1; j < lits.length; j++) {
        const nextExpr = `(${expr} · ${lits[j]})`;
        const nandForm = overbar(overbar(expr) + ' · ' + overbar(lits[j]));
        stepsArr.push(`${expr} · ${lits[j]} = ${nandForm}`);
        expr = nextExpr;
      }
      decompositionHTML += `<div style="margin-top:0.5rem; padding-left:1.5rem; font-size:0.88rem; color:var(--accent-purple);">
        • Phân rã tích cực tiểu ${termStrings[idx]}: ${stepsArr.join(' → ')}
      </div>`;
    }
  });

  if (needsDecomp) {
    html += `<div class="demorgan-step"><span class="step-num">B4</span> <b>Phân rã các cổng AND nhiều đầu vào về cổng NAND 2 đầu vào:</b>${decompositionHTML}</div>`;
  }

  return html;
};

const generateDeMorganNOR = (selectedPIs, numVars) => {
  if (selectedPIs.length === 0) return "F = 0";
  const varNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (selectedPIs.length === 1 && selectedPIs[0].pattern.replace(/X/g, '') === '') {
    return "F = 1";
  }

  const termStrings = selectedPIs.map(pi => {
    const lits = [];
    for (let i = 0; i < pi.pattern.length; i++) {
      if (pi.pattern[i] === '1') lits.push(varNames[i]);
      else if (pi.pattern[i] === '0') lits.push(varNames[i] + "'");
    }
    return lits.join('·');
  });

  const sopStr = termStrings.map(t => t.length > 2 ? `(${t})` : t).join(' + ');

  let html = ``;
  html += `<div class="demorgan-step"><span class="step-num">B1</span> <b>Dạng tổng các tích cực tiểu (SOP):</b><br><span class="expr">F = ${sopStr}</span></div>`;

  let termNORs = [];
  let decompSteps = [];

  selectedPIs.forEach((pi, idx) => {
    const lits = [];
    for (let i = 0; i < pi.pattern.length; i++) {
      if (pi.pattern[i] === '1') lits.push(varNames[i] + "'");
      else if (pi.pattern[i] === '0') lits.push(varNames[i]);
    }

    if (lits.length === 1) {
      termNORs.push(lits[0]);
    } else if (lits.length === 2) {
      const termNor = overbar(lits.join(' + '));
      termNORs.push(termNor);
      decompSteps.push(`• Tích cực tiểu ${termStrings[idx]} = ${termNor}`);
    } else {
      let expr = lits[0];
      let normalExpr = pi.pattern[0] === '1' ? varNames[0] : varNames[0] + "'";
      for (let j = 1; j < lits.length; j++) {
        const nextNormal = pi.pattern[j] === '1' ? varNames[j] : varNames[j] + "'";
        const combinedNor = overbar(overbar(normalExpr) + ' + ' + lits[j]);
        normalExpr = `(${normalExpr} · ${nextNormal})`;
        expr = combinedNor;
      }
      termNORs.push(expr);
      decompSteps.push(`• Tích cực tiểu ${termStrings[idx]} = ${expr}`);
    }
  });

  html += `<div class="demorgan-step"><span class="step-num">B2</span> <b>Biến đổi các tích số (AND) sang dạng cổng NOR 2 đầu vào:</b><br>${decompSteps.join('<br>')}</div>`;

  const norSumStr = termNORs.join(' + ');
  if (termNORs.length === 1) {
    html += `<div class="demorgan-step"><span class="step-num">B3</span> <b>Mạch chỉ gồm 1 tích cực tiểu dạng NOR:</b><br><span class="expr">F = ${termNORs[0]}</span></div>`;
  } else {
    const combinedNOR = overbar(overbar(norSumStr));
    html += `<div class="demorgan-step"><span class="step-num">B3</span> <b>Áp dụng định lý De Morgan phủ định kép chuyển Tổng các NOR sang cổng NOR đầu ra:</b><br><span class="expr">F = ${combinedNOR}</span></div>`;
  }

  return html;
};

