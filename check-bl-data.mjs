import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: '2009_bu02'
});

const [bls] = await connection.query(`
  SELECT 
    NFact as nbl,
    montant_ht,
    tva,
    montant_ht + tva as montant_ttc_calculated
  FROM bl
  WHERE NFact IN (8701, 8703)
`);

console.log('Données BL dans MySQL:');
console.table(bls);

await connection.end();
