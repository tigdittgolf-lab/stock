/**
 * Script simple pour voir TOUTES les tables dans stock_management
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'stock_management'
  });

  console.log('✅ Connecté à stock_management\n');

  // Méthode 1 : SHOW TABLES
  console.log('Méthode 1 : SHOW TABLES');
  const [tables1] = await connection.query('SHOW TABLES');
  console.log('Résultat:', tables1);
  console.log('Nombre:', tables1.length);
  console.log('');

  // Méthode 2 : Information Schema
  console.log('Méthode 2 : Information Schema');
  const [tables2] = await connection.query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = 'stock_management'
  `);
  console.log('Résultat:', tables2);
  console.log('Nombre:', tables2.length);
  console.log('');

  // Méthode 3 : Essayer de sélectionner depuis payments
  console.log('Méthode 3 : SELECT depuis payments');
  try {
    const [result] = await connection.query('SELECT COUNT(*) as total FROM payments');
    console.log('✅ Table payments existe !');
    console.log('Nombre de lignes:', result[0].total);
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }

  await connection.end();
}

checkTables().catch(console.error);
