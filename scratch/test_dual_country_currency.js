import assert from 'assert';
import { state, REGIONS } from '../js/state.js';

console.log('🧪 Starting Dual-Country (India/UAE) & Currency Rate Tests (1 AED = 26.5 INR)...\n');

// 1. Initial Default Region
const initialRegion = state.getRegion();
console.log(`1. Initial Region: ${initialRegion.flag} ${initialRegion.name} (${initialRegion.currency})`);
assert.strictEqual(initialRegion.code, 'IN');
assert.strictEqual(initialRegion.currency, 'INR');

// Test INR formatting
const testInrPrice = 53000;
const formattedInr = state.formatPrice(testInrPrice);
console.log(`   Price ₹53,000 in INR: "${formattedInr}"`);
assert.strictEqual(formattedInr, '₹53,000');

// 2. Set UAE Region directly (Rate: 26.5)
console.log('\n2. Setting UAE region with rate 26.5...');
const uaeRegion = state.setRegion('AE', '501234567');
console.log(`   Active Region: ${uaeRegion.flag} ${uaeRegion.name} (${uaeRegion.currency}) - Rate: ${uaeRegion.exchangeRate}`);
assert.strictEqual(uaeRegion.code, 'AE');
assert.strictEqual(uaeRegion.currency, 'AED');
assert.strictEqual(uaeRegion.exchangeRate, 26.5);

const formattedAed = state.formatPrice(testInrPrice);
const expectedAedVal = Math.round(53000 / 26.5); // 53000 / 26.5 = 2000
console.log(`   Price ₹53,000 in AED: "${formattedAed}" (Expected: AED ${expectedAedVal})`);
assert.strictEqual(formattedAed, `AED ${expectedAedVal.toLocaleString('en-AE')}`);
assert.strictEqual(expectedAedVal, 2000);

// Test 100,000 INR -> 100000 / 26.5 = 3774 AED
const formatted100k = state.formatPrice(100000);
const expected100kAed = Math.round(100000 / 26.5);
console.log(`   Price ₹100,000 in AED: "${formatted100k}" (Expected: AED ${expected100kAed})`);
assert.strictEqual(formatted100k, `AED ${expected100kAed.toLocaleString('en-AE')}`);

// 3. Auto-Detect from Indian Phone Number
console.log('\n3. Testing Auto-Detection from Indian Phone Number (+91 9876543210)...');
const detectedIn = state.setRegionFromPhone('+91 9876543210');
console.log(`   Detected Region: ${detectedIn.flag} ${detectedIn.name} (${detectedIn.currency})`);
assert.strictEqual(detectedIn.code, 'IN');
assert.strictEqual(detectedIn.currency, 'INR');
assert.strictEqual(state.formatPrice(53000), '₹53,000');

// 4. Auto-Detect from UAE Phone Number
console.log('\n4. Testing Auto-Detection from UAE Phone Number (+971 50 123 4567)...');
const detectedAe = state.setRegionFromPhone('+971 50 123 4567');
console.log(`   Detected Region: ${detectedAe.flag} ${detectedAe.name} (${detectedAe.currency})`);
assert.strictEqual(detectedAe.code, 'AE');
assert.strictEqual(detectedAe.currency, 'AED');
assert.strictEqual(state.formatPrice(53000), 'AED 2,000');

// Reset to IN
state.setRegion('IN');
console.log('\n✅ ALL DUAL-COUNTRY & 26.5 EXCHANGE RATE TESTS PASSED! 🚀');
