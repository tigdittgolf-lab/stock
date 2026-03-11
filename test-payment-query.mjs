import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

const [result] = await connection.query(`
  SELECT document_id, SUM(amount) as total_paid 
  FROM stock_management.payments 
  WHERE tenant_id = '2009_bu02' AND document_type = 'delivery_note'
  GROUP BY document_id
`);

console.log('Résultat de la requête SUM:');
console.table(result);

await connection.end();
