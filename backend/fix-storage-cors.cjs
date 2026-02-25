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

async function fixStorageCors() {
  try {
    console.log('Fixing Supabase Storage CORS configuration...');
    
    // Update the CORS configuration for the images bucket
    const { data, error } = await supabase.storage
      .from('images')
      .updatePolicy('cors-policy', {
        origins: ['*'], // Allow all origins for now
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        headers: ['*'],
        maxAge: 3600
      });
    
    if (error) {
      console.log('CORS policy update failed (expected for older Supabase versions):', error.message);
      
      // Try alternative approach - create a new CORS policy
      const { error: policyError } = await supabase.storage
        .from('images')
        .createPolicy('cors-policy', {
          roles: ['anon', 'authenticated'],
          permissions: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          headers: ['*'],
          maxAge: 3600
        });
      
      if (policyError && !policyError.message.includes('already exists')) {
        console.error('Failed to create CORS policy:', policyError);
      } else {
        console.log('✅ CORS policy created successfully');
      }
    } else {
      console.log('✅ CORS policy updated successfully');
    }
    
    // Also ensure the bucket is public
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('images');
    
    if (bucketError) {
      console.error('Error checking bucket:', bucketError);
    } else {
      console.log('Bucket info:', bucketData);
      if (!bucketData.public) {
        console.log('⚠️  Bucket is not public. This might cause access issues.');
      }
    }
    
  } catch (error) {
    console.error('Error fixing CORS:', error);
  }
}

fixStorageCors();
