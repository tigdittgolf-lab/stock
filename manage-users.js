const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  console.log('\n👥 LISTE DES UTILISATEURS\n');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('Aucun utilisateur trouvé');
    return;
  }

  console.log(`Total: ${users.length} utilisateur(s)\n`);
  
  users.forEach(user => {
    console.log(`┌─────────────────────────────────────────────────────────┐`);
    console.log(`│ ID: ${user.id} | ${user.active ? '✅ Actif' : '❌ Inactif'}`);
    console.log(`│ Username: ${user.username}`);
    console.log(`│ Email: ${user.email}`);
    console.log(`│ Nom: ${user.full_name || 'N/A'}`);
    console.log(`│ Rôle: ${user.role}`);
    console.log(`│ Business Units: ${user.business_units?.length || 0}`);
    if (user.business_units && user.business_units.length > 0) {
      user.business_units.forEach(bu => {
        console.log(`│   - ${bu}`);
      });
    }
    console.log(`│ Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`);
    if (user.last_login) {
      console.log(`│ Dernière connexion: ${new Date(user.last_login).toLocaleString('fr-FR')}`);
    }
    console.log(`└─────────────────────────────────────────────────────────┘\n`);
  });
}

async function listBusinessUnits() {
  console.log('\n🏢 BUSINESS UNITS DISPONIBLES\n');
  
  const { data: bus, error } = await supabase
    .from('business_units')
    .select('*')
    .order('year', { ascending: false })
    .order('bu_code', { ascending: true });

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  if (!bus || bus.length === 0) {
    console.log('Aucune Business Unit trouvée');
    return;
  }

  console.log(`Total: ${bus.length} BU(s)\n`);
  
  bus.forEach(bu => {
    console.log(`${bu.active ? '✅' : '❌'} ${bu.schema_name} - ${bu.nom_entreprise} (${bu.year})`);
  });
  console.log('');
}

async function getUserAccess(username) {
  console.log(`\n🔍 ACCÈS DE L'UTILISATEUR: ${username}\n`);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('❌ Utilisateur non trouvé:', error.message);
    return;
  }

  console.log(`Utilisateur: ${user.full_name || user.username}`);
  console.log(`Rôle: ${user.role}`);
  console.log(`Statut: ${user.active ? '✅ Actif' : '❌ Inactif'}`);
  console.log(`\nBusiness Units autorisées (${user.business_units?.length || 0}):`);
  
  if (user.business_units && user.business_units.length > 0) {
    user.business_units.forEach(bu => {
      console.log(`  ✅ ${bu}`);
    });
  } else {
    console.log('  ⚠️  Aucune BU autorisée');
  }
  console.log('');
}

async function grantBUAccess(username, buSchema) {
  console.log(`\n🔓 DONNER ACCÈS À ${buSchema} pour ${username}\n`);
  
  // Récupérer l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('business_units')
    .eq('username', username)
    .single();

  if (userError) {
    console.error('❌ Utilisateur non trouvé:', userError.message);
    return;
  }

  // Vérifier si l'accès existe déjà
  const currentBUs = user.business_units || [];
  if (currentBUs.includes(buSchema)) {
    console.log(`⚠️  L'utilisateur a déjà accès à ${buSchema}`);
    return;
  }

  // Ajouter la BU
  const newBUs = [...currentBUs, buSchema];
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ business_units: newBUs })
    .eq('username', username);

  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError.message);
    return;
  }

  console.log(`✅ Accès accordé à ${buSchema}`);
  console.log(`Total BU: ${newBUs.length}`);
  console.log('');
}

async function revokeBUAccess(username, buSchema) {
  console.log(`\n🔒 RETIRER ACCÈS À ${buSchema} pour ${username}\n`);
  
  // Récupérer l'utilisateur
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('business_units')
    .eq('username', username)
    .single();

  if (userError) {
    console.error('❌ Utilisateur non trouvé:', userError.message);
    return;
  }

  // Vérifier si l'accès existe
  const currentBUs = user.business_units || [];
  if (!currentBUs.includes(buSchema)) {
    console.log(`⚠️  L'utilisateur n'a pas accès à ${buSchema}`);
    return;
  }

  // Retirer la BU
  const newBUs = currentBUs.filter(bu => bu !== buSchema);
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ business_units: newBUs })
    .eq('username', username);

  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError.message);
    return;
  }

  console.log(`✅ Accès retiré à ${buSchema}`);
  console.log(`Total BU: ${newBUs.length}`);
  console.log('');
}

async function changeRole(username, newRole) {
  console.log(`\n👤 CHANGER LE RÔLE DE ${username} vers ${newRole}\n`);
  
  if (!['admin', 'manager', 'user'].includes(newRole)) {
    console.error('❌ Rôle invalide. Utilisez: admin, manager, ou user');
    return;
  }

  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('username', username);

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log(`✅ Rôle changé vers: ${newRole}`);
  console.log('');
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  👥 GESTION DES UTILISATEURS - SUPABASE                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  switch (command) {
    case 'list':
      await listUsers();
      break;
    
    case 'bus':
      await listBusinessUnits();
      break;
    
    case 'access':
      if (!args[1]) {
        console.log('\n❌ Usage: node manage-users.js access <username>');
        break;
      }
      await getUserAccess(args[1]);
      break;
    
    case 'grant':
      if (!args[1] || !args[2]) {
        console.log('\n❌ Usage: node manage-users.js grant <username> <bu_schema>');
        break;
      }
      await grantBUAccess(args[1], args[2]);
      break;
    
    case 'revoke':
      if (!args[1] || !args[2]) {
        console.log('\n❌ Usage: node manage-users.js revoke <username> <bu_schema>');
        break;
      }
      await revokeBUAccess(args[1], args[2]);
      break;
    
    case 'role':
      if (!args[1] || !args[2]) {
        console.log('\n❌ Usage: node manage-users.js role <username> <admin|manager|user>');
        break;
      }
      await changeRole(args[1], args[2]);
      break;
    
    default:
      console.log('\n📋 COMMANDES DISPONIBLES:\n');
      console.log('  list                          - Lister tous les utilisateurs');
      console.log('  bus                           - Lister toutes les Business Units');
      console.log('  access <username>             - Voir les accès d\'un utilisateur');
      console.log('  grant <username> <bu_schema>  - Donner accès à une BU');
      console.log('  revoke <username> <bu_schema> - Retirer accès à une BU');
      console.log('  role <username> <role>        - Changer le rôle (admin/manager/user)');
      console.log('\n📚 Exemples:\n');
      console.log('  node manage-users.js list');
      console.log('  node manage-users.js access habib');
      console.log('  node manage-users.js grant habib bu01_2025');
      console.log('  node manage-users.js revoke habib bu02_2024');
      console.log('  node manage-users.js role habib admin');
      console.log('');
  }
}

main().catch(console.error);
