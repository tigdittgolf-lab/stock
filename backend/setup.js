import { setupDatabase } from './src/setupDatabase.js';

async function runSetup() {
  try {
    await setupDatabase();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

runSetup();