const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testImageUrl() {
  try {
    // Test a specific project image
    const imageUrl = 'https://emteiupwfdlpfinbpknl.supabase.co/storage/v1/object/public/images/projects/21/1772031024354.png';
    
    console.log('Testing image URL:', imageUrl);
    
    // Try to get the public URL info
    const { data, error } = await supabase.storage
      .from('images')
      .getPublicUrl('projects/21/1772031024354.png');
    
    if (error) {
      console.error('Error getting public URL:', error);
    } else {
      console.log('Public URL:', data.publicUrl);
    }
    
    // Try to download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('images')
      .download('projects/21/1772031024354.png');
    
    if (downloadError) {
      console.error('Error downloading file:', downloadError);
    } else {
      console.log('File downloaded successfully, size:', fileData.length, 'bytes');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testImageUrl();
