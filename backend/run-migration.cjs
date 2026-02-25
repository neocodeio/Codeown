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

async function migrateBase64Images() {
  console.log('Starting base64 to Supabase Storage migration...');
  
  try {
    // 1. Migrate user avatar_urls
    console.log('Migrating user avatars...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, avatar_url')
      .like('avatar_url', 'data:image/%');
    
    if (usersError) {
      console.error('Error fetching users with base64 avatars:', usersError);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users with base64 avatars`);
    let migratedUsers = 0;
    
    for (const user of users || []) {
      if (user.avatar_url && user.avatar_url.startsWith('data:image/')) {
        try {
          // Extract base64 data
          const base64Data = user.avatar_url.split(',')[1];
          const mimeType = user.avatar_url.split(';')[0].split(':')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate filename
          const fileExt = mimeType.split('/')[1];
          const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            });
          
          if (uploadError) {
            console.error(`Failed to upload avatar for user ${user.id}:`, uploadError);
            continue;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          
          // Update user record
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);
          
          if (updateError) {
            console.error(`Failed to update avatar_url for user ${user.id}:`, updateError);
          } else {
            migratedUsers++;
            console.log(`✅ Migrated avatar for user ${user.id}`);
          }
        } catch (error) {
          console.error(`Error processing avatar for user ${user.id}:`, error);
        }
      }
    }
    
    // 2. Migrate post images
    console.log('Migrating post images...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, images')
      .not('images', 'is', null);
    
    if (postsError) {
      console.error('Error fetching posts with images:', postsError);
      return;
    }
    
    console.log(`Found ${posts?.length || 0} posts with images`);
    let migratedPosts = 0;
    
    for (const post of posts || []) {
      if (post.images && Array.isArray(post.images)) {
        const updatedImages = [];
        let hasBase64 = false;
        
        for (let i = 0; i < post.images.length; i++) {
          const imageUrl = post.images[i];
          
          if (imageUrl && imageUrl.startsWith('data:image/')) {
            hasBase64 = true;
            try {
              // Extract base64 data
              const base64Data = imageUrl.split(',')[1];
              const mimeType = imageUrl.split(';')[0].split(':')[1];
              const buffer = Buffer.from(base64Data, 'base64');
              
              // Generate filename
              const fileExt = mimeType.split('/')[1];
              const fileName = `posts/${post.id}/${i}_${Date.now()}.${fileExt}`;
              
              // Upload to Supabase Storage
              const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, buffer, {
                  contentType: mimeType,
                  upsert: true
                });
              
              if (uploadError) {
                console.error(`Failed to upload image ${i} for post ${post.id}:`, uploadError);
                updatedImages.push(imageUrl); // Keep original on failure
                continue;
              }
              
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);
              
              updatedImages.push(publicUrl);
              console.log(`✅ Migrated image ${i} for post ${post.id}`);
            } catch (error) {
              console.error(`Error processing image ${i} for post ${post.id}:`, error);
              updatedImages.push(imageUrl); // Keep original on failure
            }
          } else {
            updatedImages.push(imageUrl); // Keep non-base64 URLs as-is
          }
        }
        
        // Update post record if any images were migrated
        if (hasBase64 && updatedImages.some((img, idx) => img !== post.images[idx])) {
          const { error: updateError } = await supabase
            .from('posts')
            .update({ images: updatedImages })
            .eq('id', post.id);
          
          if (updateError) {
            console.error(`Failed to update images for post ${post.id}:`, updateError);
          } else {
            migratedPosts++;
            console.log(`✅ Updated images array for post ${post.id}`);
          }
        }
      }
    }
    
    // 3. Migrate project cover images
    console.log('Migrating project cover images...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, cover_image')
      .like('cover_image', 'data:image/%');
    
    if (projectsError) {
      console.error('Error fetching projects with base64 cover images:', projectsError);
      return;
    }
    
    console.log(`Found ${projects?.length || 0} projects with base64 cover images`);
    let migratedProjects = 0;
    
    for (const project of projects || []) {
      if (project.cover_image && project.cover_image.startsWith('data:image/')) {
        try {
          // Extract base64 data
          const base64Data = project.cover_image.split(',')[1];
          const mimeType = project.cover_image.split(';')[0].split(':')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate filename
          const fileExt = mimeType.split('/')[1];
          const fileName = `projects/${project.id}/${Date.now()}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, buffer, {
              contentType: mimeType,
              upsert: true
            });
          
          if (uploadError) {
            console.error(`Failed to upload cover image for project ${project.id}:`, uploadError);
            continue;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          
          // Update project record
          const { error: updateError } = await supabase
            .from('projects')
            .update({ cover_image: publicUrl })
            .eq('id', project.id);
          
          if (updateError) {
            console.error(`Failed to update cover_image for project ${project.id}:`, updateError);
          } else {
            migratedProjects++;
            console.log(`✅ Migrated cover image for project ${project.id}`);
          }
        } catch (error) {
          console.error(`Error processing cover image for project ${project.id}:`, error);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log(`Stats: ${migratedUsers} users, ${migratedPosts} posts, ${migratedProjects} projects migrated`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateBase64Images();
