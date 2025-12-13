// Utilitaire pour convertir les nombres en lettres (français)
// Conforme à la réglementation algérienne/française

const units = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'
];

const tens = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'
];

const scales = [
  '', 'mille', 'million', 'milliard', 'billion'
];

function convertHundreds(num: number): string {
  let result = '';
  
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  
  if (hundred > 0) {
    if (hundred === 1) {
      result += 'cent';
    } else {
      result += units[hundred] + ' cent';
    }
    if (hundred > 1 && remainder === 0) {
      result += 's';
    }
  }
  
  if (remainder > 0) {
    if (result) result += ' ';
    
    if (remainder < 20) {
      result += units[remainder];
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      
      if (ten === 7 || ten === 9) {
        // Soixante-dix, quatre-vingt-dix
        result += tens[ten - 1];
        if (ten === 7) {
          result += '-' + units[10 + unit];
        } else {
          result += '-' + units[10 + unit];
        }
      } else if (ten === 8) {
        // Quatre-vingt
        result += tens[ten];
        if (unit === 0) {
          result += 's';
        } else {
          result += '-' + units[unit];
        }
      } else {
        result += tens[ten];
        if (unit > 0) {
          if (unit === 1 && (ten === 2 || ten === 3 || ten === 4 || ten === 5 || ten === 6)) {
            result += ' et un';
          } else {
            result += '-' + units[unit];
          }
        }
      }
    }
  }
  
  return result;
}

function convertThousands(num: number, scaleIndex: number): string {
  if (num === 0) return '';
  
  const hundreds = convertHundreds(num);
  const scale = scales[scaleIndex];
  
  if (scaleIndex === 0) {
    return hundreds;
  }
  
  if (scaleIndex === 1) { // mille
    if (num === 1) {
      return 'mille';
    } else {
      return hundreds + ' ' + scale;
    }
  } else { // million, milliard, etc.
    let result = hundreds + ' ' + scale;
    if (num > 1) {
      result += 's';
    }
    return result;
  }
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'zéro';
  
  // Séparer la partie entière et décimale
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let result = '';
  
  // Convertir la partie entière
  if (integerPart === 0) {
    result = 'zéro';
  } else {
    const groups = [];
    let temp = integerPart;
    
    while (temp > 0) {
      groups.push(temp % 1000);
      temp = Math.floor(temp / 1000);
    }
    
    const parts = [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i];
      if (group > 0) {
        parts.push(convertThousands(group, i));
      }
    }
    
    result = parts.join(' ');
  }
  
  // Ajouter "dinars"
  if (integerPart <= 1) {
    result += ' dinar';
  } else {
    result += ' dinars';
  }
  
  // Ajouter la partie décimale (centimes)
  if (decimalPart > 0) {
    result += ' et ';
    if (decimalPart === 1) {
      result += 'un centime';
    } else {
      result += convertHundreds(decimalPart) + ' centimes';
    }
  }
  
  // Capitaliser la première lettre
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// Fonction spécifique pour les documents officiels
export function amountInWords(amount: number): string {
  const words = numberToWords(amount);
  return `Arrêté la présente ${getDocumentType()} à la somme de : ${words}`;
}

function getDocumentType(): string {
  // Cette fonction peut être adaptée selon le contexte
  return 'facture'; // Par défaut, peut être modifié selon le document
}

// Fonction pour formater le montant avec devise
export function formatAmountWithCurrency(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} DA`;
}

// Tests unitaires (pour vérification)
export function testNumberToWords() {
  const tests = [
    { input: 0, expected: 'Zéro dinar' },
    { input: 1, expected: 'Un dinar' },
    { input: 21, expected: 'Vingt et un dinars' },
    { input: 80, expected: 'Quatre-vingts dinars' },
    { input: 81, expected: 'Quatre-vingt-un dinars' },
    { input: 100, expected: 'Cent dinars' },
    { input: 200, expected: 'Deux cents dinars' },
    { input: 201, expected: 'Deux cent un dinars' },
    { input: 1000, expected: 'Mille dinars' },
    { input: 2000, expected: 'Deux mille dinars' },
    { input: 1000000, expected: 'Un million dinars' },
    { input: 1234.56, expected: 'Mille deux cent trente-quatre dinars et cinquante-six centimes' }
  ];
  
  console.log('Tests de conversion nombre en lettres:');
  tests.forEach(test => {
    const result = numberToWords(test.input);
    console.log(`${test.input} -> ${result} (attendu: ${test.expected})`);
  });
}