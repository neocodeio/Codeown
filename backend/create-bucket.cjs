const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase environment variables are missing!');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createImagesBucket() {
  try {
    console.log('Creating "images" bucket...');
    
    const { data, error } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "images" already exists');
      } else {
        console.error('Error creating bucket:', error);
        return;
      }
    } else {
      console.log('✅ Bucket "images" created successfully');
    }
    
    // Set up public access policy
    const { error: policyError } = await supabase.storage
      .from('images')
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

createImagesBucket();
