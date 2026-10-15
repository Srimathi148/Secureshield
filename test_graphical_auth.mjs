import { createHash, randomBytes } from 'crypto';

// Replicate cryptographic methods from src/utils/crypto.ts for Node testing environment
function generateSalt() {
  return randomBytes(16).toString('hex');
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function hashRecognitionCredential(selectedItemIds, salt) {
  const canonicalSet = [...selectedItemIds].sort().join('::');
  const payload = `REC_${canonicalSet}::SALT_${salt}`;
  return sha256(payload);
}

function hashRecallCredential(sequenceItemIds, salt) {
  const orderedSequence = sequenceItemIds.join('->');
  const payload = `SEQ_${orderedSequence}::SALT_${salt}`;
  return sha256(payload);
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

console.log('=====================================================');
console.log('SecureShield: Automated Graphical Auth Test Suite');
console.log('=====================================================');

// Test 1: Recognition Hashing Canonical Independence
const salt1 = generateSalt();
const originalSet = ['shield_quantum', 'crypto_vault', 'biometric_scan', 'root_terminal'];
const shuffledSet = ['root_terminal', 'biometric_scan', 'shield_quantum', 'crypto_vault'];
const wrongSet = ['quantum_cpu', 'crypto_vault', 'biometric_scan', 'root_terminal'];

const hashRecOriginal = hashRecognitionCredential(originalSet, salt1);
const hashRecShuffled = hashRecognitionCredential(shuffledSet, salt1);
const hashRecWrong = hashRecognitionCredential(wrongSet, salt1);

console.log('\n[Test 1] Recognition-Based Authentication:');
console.log('  Original Set Hash: ', hashRecOriginal);
console.log('  Shuffled Set Hash: ', hashRecShuffled);
if (hashRecOriginal === hashRecShuffled) {
  console.log('  ✓ PASS: Shuffled positions yield identical canonical hash (Order-Independent).');
} else {
  console.error('  ✗ FAIL: Hashes do not match!');
  process.exit(1);
}

if (hashRecOriginal !== hashRecWrong) {
  console.log('  ✓ PASS: Incorrect marker selection produces mismatching hash.');
} else {
  console.error('  ✗ FAIL: Incorrect selection should not match hash!');
  process.exit(1);
}

// Test 2: Recall Hashing Order Sensitivity
const salt2 = generateSalt();
const sequenceOrderA = ['biometric_scan', 'hardware_token', 'satellite_link', 'power_core'];
const sequenceOrderB = ['power_core', 'satellite_link', 'hardware_token', 'biometric_scan']; // reversed
const sequenceOrderC = ['biometric_scan', 'hardware_token', 'satellite_link', 'power_core']; // exact match

const hashRecallA = hashRecallCredential(sequenceOrderA, salt2);
const hashRecallB = hashRecallCredential(sequenceOrderB, salt2);
const hashRecallC = hashRecallCredential(sequenceOrderC, salt2);

console.log('\n[Test 2] Recall-Based Sequential Authentication:');
console.log('  Sequence A (1->2->3->4) Hash: ', hashRecallA);
console.log('  Sequence B (4->3->2->1) Hash: ', hashRecallB);
console.log('  Sequence C (1->2->3->4) Hash: ', hashRecallC);

if (hashRecallA === hashRecallC) {
  console.log('  ✓ PASS: Exact matching sequence reproduces identical credential hash.');
} else {
  console.error('  ✗ FAIL: Matching sequence failed to match!');
  process.exit(1);
}

if (hashRecallA !== hashRecallB) {
  console.log('  ✓ PASS: Reversed/altered sequence produces distinct hash (Order-Enforced).');
} else {
  console.error('  ✗ FAIL: Reversed sequence should not match!');
  process.exit(1);
}

// Test 3: Shuffle Integrity
const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const shuffledPool = shuffleArray(pool);
const poolSorted = [...shuffledPool].sort((a, b) => a - b);
const allPresent = pool.every((v, i) => v === poolSorted[i]);

console.log('\n[Test 3] Grid Randomization (Fisher-Yates Shuffle):');
if (allPresent && shuffledPool.length === pool.length) {
  console.log('  ✓ PASS: All 20 items preserved without loss or duplication upon shuffle.');
} else {
  console.error('  ✗ FAIL: Shuffled items corrupted!');
  process.exit(1);
}

console.log('\n=====================================================');
console.log('ALL GRAPHICAL AUTHENTICATION TESTS PASSED (3/3)');
console.log('=====================================================');
