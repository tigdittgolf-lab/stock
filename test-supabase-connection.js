// Test de connexion Supabase
console.log('Testing Supabase connection...');

async function testSupabase() {
  try {
    const response = await fetch('http://localhost:3005/api/database/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'supabase',
        url: 'https://szgodrjglbpzkrksnroi.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
      })
    });

    const result = await response.json();
    console.log('Supabase test result:', result);

    if (result.success) {
      console.log('✅ Supabase connection successful!');
    } else {
      console.log('❌ Supabase connection failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSupabase();