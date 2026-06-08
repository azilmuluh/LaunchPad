/**
 * Generate VAPID Keys for Web Push Notifications
 * Run: node generate-vapid-keys.cjs
 */

const crypto = require('crypto');
const fs = require('fs');

console.log('\n🔐 Generating VAPID Keys for Push Notifications...\n');

// Generate VAPID key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: {
    type: 'spki',
    format: 'der'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'der'
  }
});

// Convert to base64url format (required for VAPID)
const publicKeyBase64 = publicKey.toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

const privateKeyBase64 = privateKey.toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

// Generate CRON_SECRET (random secure token)
const cronSecret = crypto.randomBytes(32).toString('hex');

console.log('✅ Keys Generated Successfully!\n');
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 COPY THESE VALUES TO YOUR .env FILE AND NETLIFY:\n');
console.log('VITE_VAPID_PUBLIC_KEY=' + publicKeyBase64);
console.log('VAPID_PRIVATE_KEY=' + privateKeyBase64);
console.log('CRON_SECRET=' + cronSecret);
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📝 INSTRUCTIONS:\n');
console.log('1. LOCAL DEVELOPMENT (.env file):');
console.log('   - Create/update .env file in project root');
console.log('   - Add all three variables above\n');

console.log('2. NETLIFY ENVIRONMENT VARIABLES:');
console.log('   - Go to: https://app.netlify.com → Your site');
console.log('   - Navigate to: Site settings → Environment variables');
console.log('   - Click "Add a variable" for each one');
console.log('   - Add all three variables (copy values from above)');
console.log('   - Deploy scope: All deploys\n');

console.log('3. UPDATE YOUR LOCAL .env FILE:');
console.log('   - The file .env.vapid has been created with these values');
console.log('   - Copy the contents to your main .env file\n');

console.log('⚠️  SECURITY NOTES:');
console.log('   - ✅ VITE_VAPID_PUBLIC_KEY: Safe to expose (public key)');
console.log('   - 🔒 VAPID_PRIVATE_KEY: KEEP SECRET! Server-side only');
console.log('   - 🔒 CRON_SECRET: KEEP SECRET! Verifies cron job requests');
console.log('   - Make sure .env is in your .gitignore\n');

// Save to .env.vapid file for reference
const envContent = `# Push Notification VAPID Keys (generated: ${new Date().toISOString()})
# Public key - safe to expose to client-side code
VITE_VAPID_PUBLIC_KEY=${publicKeyBase64}

# Private key - KEEP SECRET! Server-side only
VAPID_PRIVATE_KEY=${privateKeyBase64}

# Cron job authentication secret - KEEP SECRET!
CRON_SECRET=${cronSecret}

# Supabase credentials (add your actual values)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
`;

fs.writeFileSync('.env.vapid', envContent);
console.log('💾 Keys saved to .env.vapid file (for your reference)\n');
console.log('🚀 You can now configure Netlify and start testing push notifications!\n');
console.log('📖 WHAT ARE THESE KEYS?\n');
console.log('   VAPID (Voluntary Application Server Identification):');
console.log('   - Industry standard for push notifications (RFC 8292)');
console.log('   - Public/private key pair identifies your application');
console.log('   - Allows browsers to verify push notifications come from you');
console.log('   - Required by modern browsers (Chrome, Firefox, Edge, Safari)\n');
console.log('   CRON_SECRET:');
console.log('   - Protects your cron endpoint from unauthorized access');
console.log('   - Only requests with correct secret can trigger notifications\n');
