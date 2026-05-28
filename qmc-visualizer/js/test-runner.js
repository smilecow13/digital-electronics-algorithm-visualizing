// Test runner tạm — chạy bằng Node.js để kiểm tra algorithm.js
// Sử dụng: node test-runner.js

const fs = require('fs');
const path = require('path');

// Đọc algorithm.js và wrap trong function để expose các hàm
const code = fs.readFileSync(path.join(__dirname, 'algorithm.js'), 'utf8');
const wrappedCode = code + '\nreturn { quineMcCluskey, countOnes, toBinary, calcNumVars };';
const moduleFactory = new Function(wrappedCode);
const { quineMcCluskey, countOnes, toBinary, calcNumVars } = moduleFactory();

// ---- Hàm tiện ích test ----
const printResult = (label, result) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('='.repeat(60));

  console.log(`Số biến: ${result.numVars}`);
  console.log(`Số vòng merge: ${result.rounds.length}`);

  console.log('\n--- Rounds ---');
  result.rounds.forEach((round, idx) => {
    console.log(`  Vòng ${idx}:`);
    for (const [groupKey, imps] of Object.entries(round.groups)) {
      console.log(`    Nhóm ${groupKey} bit:`);
      for (const imp of imps) {
        const mark = imp.usedInMerge ? ' ✓ (merged)' : ' ★ (PI)';
        console.log(`      ${imp.pattern}  minterms=[${imp.minterms}]${mark}`);
      }
    }
  });

  console.log('\n--- Prime Implicants ---');
  for (const pi of result.primeImplicants) {
    console.log(`  ${pi.pattern}  minterms=[${pi.minterms}]`);
  }

  console.log('\n--- PI Chart ---');
  for (const [pattern, covered] of Object.entries(result.chart)) {
    console.log(`  ${pattern} → covers minterms: {${[...covered].join(', ')}}`);
  }

  console.log('\n--- Essential PIs ---');
  for (const epi of result.essentialPIs) {
    console.log(`  ${epi.pattern}  minterms=[${epi.minterms}]`);
  }

  console.log('\n--- Selected PIs ---');
  for (const spi of result.selectedPIs) {
    console.log(`  ${spi.pattern}  minterms=[${spi.minterms}]`);
  }

  console.log(`\n>>> Biểu thức: F = ${result.expression}`);
};

// ---- Test 1: có đủ Essential PI ----
const result1 = quineMcCluskey([0, 1, 2, 5, 6, 7], []);
printResult('Test 1: minterms=[0,1,2,5,6,7], dontCares=[]', result1);

// ---- Test 2: tất cả 16 minterms (4 biến) → F = 1 ----
const result2 = quineMcCluskey(
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  []
);
printResult('Test 2: minterms=[0..15], dontCares=[]', result2);

// ---- Test 3: có Don't Care ----
const result3 = quineMcCluskey([1, 3, 7, 11, 15], [0, 2, 5]);
printResult('Test 3: minterms=[1,3,7,11,15], dontCares=[0,2,5]', result3);

// ---- Kiểm tra assertions ----
console.log('\n' + '='.repeat(60));
console.log('  ASSERTIONS');
console.log('='.repeat(60));

// Test 2: phải ra expression = '1'
console.log(
  `Test 2 expression = '1': ${result2.expression === '1' ? '✅ PASS' : '❌ FAIL (got: ' + result2.expression + ')'}`
);

// Test 3: don't care [0,2,5] không được xuất hiện trong chart columns
const chartMinterms3 = new Set();
for (const covered of Object.values(result3.chart)) {
  for (const m of covered) chartMinterms3.add(m);
}
const hasDontCareInChart = [0, 2, 5].some((d) => chartMinterms3.has(d));
console.log(
  `Test 3 chart không chứa don't care: ${!hasDontCareInChart ? '✅ PASS' : '❌ FAIL'}`
);

// Test 1: expression phải có 2-3 terms
const termCount1 = result1.expression.split('+').length;
console.log(
  `Test 1 expression có ${termCount1} terms (expected 2-3): ${termCount1 >= 2 && termCount1 <= 3 ? '✅ PASS' : '❌ FAIL'}`
);
