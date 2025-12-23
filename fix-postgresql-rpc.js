// Script pour corriger la fonction PostgreSQL RPC
const fs = require('fs');

const filePath = 'backend/src/services/databaseService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer la fonction executePostgreSQLRPC
const oldFunction = `  private async executePostgreSQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour PostgreSQL, essayer d'abord les fonctions RPC, sinon convertir en SQL
    try {
      const paramList = Object.entries(params).map(([key, value]) => \`\${key} => \${Object.keys(params).indexOf(key) + 1}\`).join(', ');
      const sql = \`SELECT * FROM \${functionName}(\${paramList})\`;
      const values = Object.values(params);
      
      return await this.executePostgreSQLQuery(sql, values);
    } catch (error) {
      // Si la fonction RPC n'existe pas, convertir en SQL direct
      return this.convertRPCToSQL('postgresql', functionName, params);
    }
  }`;

const newFunction = `  private async executePostgreSQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour PostgreSQL local, utiliser directement les requêtes SQL 
    // (les fonctions RPC n'existent que dans Supabase)
    console.log(\`🐘 PostgreSQL: Converting RPC \${functionName} to direct SQL\`);
    return this.convertRPCToSQL('postgresql', functionName, params);
  }`;

// Chercher et remplacer
if (content.includes('executePostgreSQLRPC')) {
  // Utiliser une regex pour trouver la fonction complète
  const regex = /private async executePostgreSQLRPC\([\s\S]*?\n  \}/;
  const match = content.match(regex);
  
  if (match) {
    console.log('✅ Fonction trouvée, remplacement...');
    content = content.replace(regex, newFunction.trim());
    fs.writeFileSync(filePath, content);
    console.log('✅ Correction appliquée avec succès !');
  } else {
    console.log('❌ Fonction non trouvée avec regex');
  }
} else {
  console.log('❌ executePostgreSQLRPC non trouvé dans le fichier');
}