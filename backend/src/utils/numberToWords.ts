/**
 * Convert numbers to French words
 * Example: 1500 -> "mille cinq cents"
 */

const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  
  let result = '';
  
  // Hundreds
  const hundreds = Math.floor(num / 100);
  if (hundreds > 0) {
    if (hundreds === 1) {
      result += 'cent';
    } else {
      result += units[hundreds] + ' cent';
    }
    if (num % 100 === 0 && hundreds > 1) {
      result += 's'; // "cents" when plural and no remainder
    }
  }
  
  const remainder = num % 100;
  
  if (remainder === 0) {
    return result.trim();
  }
  
  if (result) result += ' ';
  
  // Tens and units
  if (remainder < 10) {
    result += units[remainder];
  } else if (remainder < 20) {
    result += teens[remainder - 10];
  } else {
    const tensDigit = Math.floor(remainder / 10);
    const unitsDigit = remainder % 10;
    
    if (tensDigit === 7 || tensDigit === 9) {
      // Special cases: 70-79 (soixante-dix) and 90-99 (quatre-vingt-dix)
      if (tensDigit === 7) {
        if (unitsDigit === 0) {
          result += 'soixante-dix';
        } else if (unitsDigit === 1) {
          result += 'soixante et onze';
        } else {
          result += 'soixante-' + teens[unitsDigit - 10];
        }
      } else { // 9
        if (unitsDigit === 0) {
          result += 'quatre-vingt-dix';
        } else if (unitsDigit === 1) {
          result += 'quatre-vingt-onze';
        } else {
          result += 'quatre-vingt-' + teens[unitsDigit - 10];
        }
      }
    } else {
      result += tens[tensDigit];
      if (tensDigit === 8 && unitsDigit === 0) {
        result += 's'; // "quatre-vingts" when exactly 80
      }
      if (unitsDigit > 0) {
        if (unitsDigit === 1 && tensDigit !== 8) {
          result += ' et ' + units[unitsDigit];
        } else {
          result += '-' + units[unitsDigit];
        }
      }
    }
  }
  
  return result.trim();
}

export function numberToWordsFr(num: number): string {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToWordsFr(-num);
  
  let result = '';
  
  // Billions
  const billions = Math.floor(num / 1000000000);
  if (billions > 0) {
    if (billions === 1) {
      result += 'un milliard';
    } else {
      result += convertLessThanThousand(billions) + ' milliards';
    }
    num %= 1000000000;
  }
  
  // Millions
  const millions = Math.floor(num / 1000000);
  if (millions > 0) {
    if (result) result += ' ';
    if (millions === 1) {
      result += 'un million';
    } else {
      result += convertLessThanThousand(millions) + ' millions';
    }
    num %= 1000000;
  }
  
  // Thousands
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    if (result) result += ' ';
    if (thousands === 1) {
      result += 'mille';
    } else {
      result += convertLessThanThousand(thousands) + ' mille';
    }
    num %= 1000;
  }
  
  // Remainder
  if (num > 0) {
    if (result) result += ' ';
    result += convertLessThanThousand(num);
  }
  
  return result.trim();
}

/**
 * Convert amount to French words with currency
 * Example: 1500.50 -> "mille cinq cents dinars et cinquante centimes"
 */
export function amountToWordsFr(amount: number, currency: string = 'dinars', subunit: string = 'centimes'): string {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let result = numberToWordsFr(integerPart) + ' ' + currency;
  
  if (decimalPart > 0) {
    result += ' et ' + numberToWordsFr(decimalPart) + ' ' + subunit;
  }
  
  return result;
}
