const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPolicy() {
  try {
    const { error: policyError } = await supabase.storage
      .from('chat-audio')
      .createPolicy('Public Access', {
        roles: ['anon', 'authenticated'],
        permissions: ['SELECT', 'INSERT', 'UPDATE']
      });
    
    if (policyError && !policyError.message.includes('already exists')) {
      console.error('Error creating policy:', policyError);
    } else {
      console.log('✅ Public access policy configured');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addPolicy();
