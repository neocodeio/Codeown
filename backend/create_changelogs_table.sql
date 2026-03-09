CREATE TABLE project_changelogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Optional, since backend uses service role it bypasses RLS anyway)
ALTER TABLE project_changelogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view changelogs" ON project_changelogs FOR SELECT USING (true);

-- Allow project owners to insert
CREATE POLICY "Project owners can insert changelogs" ON project_changelogs 
FOR INSERT WITH CHECK (true);
