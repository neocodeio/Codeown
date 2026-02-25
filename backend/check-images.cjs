const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkImages() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, cover_image')
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample project images:');
    data.forEach(p => {
      console.log(`Project ${p.id}: ${p.title}`);
      console.log(`Cover Image: ${p.cover_image}`);
      console.log('---');
    });
  }
}

checkImages();
