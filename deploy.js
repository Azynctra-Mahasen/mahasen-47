
const { execSync } = require('child_process');

try {
  console.log('Deploying whatsapp-webhook function...');
  const result = execSync('npx supabase functions deploy whatsapp-webhook', { encoding: 'utf-8' });
  console.log('Deployment result:', result);
  console.log('Successfully deployed whatsapp-webhook function!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
