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

async function createAudioBucket() {
  try {
    console.log('Creating "chat-audio" bucket...');
    
    const { data, error } = await supabase.storage.createBucket('chat-audio', {
      public: true,
      allowedMimeTypes: ['audio/*', 'video/*'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "chat-audio" already exists');
      } else {
        console.error('Error creating bucket:', error);
      }
    } else {
      console.log('✅ Bucket "chat-audio" created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createAudioBucket();
