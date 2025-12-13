// Utilitaire pour formater les nombres avec espaces pour les milliers
// Format: "999 999 999.99"

export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num) || num === undefined || num === null) {
    return decimals > 0 ? '0.00' : '0';
  }
  
  // Arrondir au nombre de décimales souhaité
  const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  // Convertir en string avec le bon nombre de décimales
  const numStr = rounded.toFixed(decimals);
  
  // Séparer la partie entière et décimale
  const [integerPart, decimalPart] = numStr.split('.');
  
  // Ajouter des espaces tous les 3 chiffres (de droite à gauche)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Reconstituer le nombre
  return `${formattedInteger}.${decimalPart}`;
}

// Fonction spécifique pour les montants en dinars
export function formatAmount(amount: number): string {
  return `${formatNumber(amount, 2)} DA`;
}

// Fonction pour les pourcentages
export function formatPercentage(percentage: number): string {
  return `${formatNumber(percentage, 2)}%`;
}

// Fonction pour les quantités (sans décimales)
export function formatQuantity(quantity: number): string {
  if (isNaN(quantity) || quantity === undefined || quantity === null) {
    return '0';
  }
  
  // Arrondir à l'entier le plus proche
  const rounded = Math.round(quantity);
  
  // Convertir en string et ajouter des espaces pour les milliers
  const numStr = rounded.toString();
  const formattedInteger = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return formattedInteger; // Pas de décimales pour les quantités
}

// Tests de la fonction
export function testNumberFormatter() {
  const tests = [
    { input: 0, expected: '0.00' },
    { input: 1, expected: '1.00' },
    { input: 12, expected: '12.00' },
    { input: 123, expected: '123.00' },
    { input: 1234, expected: '1 234.00' },
    { input: 12345, expected: '12 345.00' },
    { input: 123456, expected: '123 456.00' },
    { input: 1234567, expected: '1 234 567.00' },
    { input: 1234567.89, expected: '1 234 567.89' },
    { input: 1111.64, expected: '1 111.64' },
    { input: 285.60, expected: '285.60' },
    { input: 77.35, expected: '77.35' }
  ];
  
  console.log('Tests de formatage des nombres:');
  tests.forEach(test => {
    const result = formatNumber(test.input);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.input} -> ${result} (attendu: ${test.expected})`);
  });
}