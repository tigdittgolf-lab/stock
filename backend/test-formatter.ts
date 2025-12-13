import { formatNumber, formatAmount, testNumberFormatter } from './src/utils/numberFormatter.js';

// Test des fonctions
testNumberFormatter();

console.log('\nExemples de formatage:');
console.log('1111.64 ->', formatAmount(1111.64));
console.log('285.60 ->', formatAmount(285.60));
console.log('1234567.89 ->', formatAmount(1234567.89));