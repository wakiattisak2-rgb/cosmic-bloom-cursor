
CREATE POLICY "Public read knowledge covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'knowledge-covers');

CREATE POLICY "Authenticated upload knowledge covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'knowledge-covers');

CREATE POLICY "Authenticated update knowledge covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'knowledge-covers')
  WITH CHECK (bucket_id = 'knowledge-covers');

CREATE POLICY "Authenticated delete knowledge covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'knowledge-covers');
