-- Create policy for uploading images to memories bucket
CREATE POLICY "Allow authenticated users to upload memories"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memories'
);

-- Create policy for reading memories images
CREATE POLICY "Allow anyone to view memories"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'memories'
);

-- Create policy for updating memories images (if needed)
CREATE POLICY "Allow users to update own memories"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memories'
);

-- Create policy for deleting memories images (if needed)
CREATE POLICY "Allow users to delete own memories"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memories'
);
