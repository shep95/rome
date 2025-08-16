-- Encrypt file metadata in messages and secure_files tables
-- Add encrypted columns for file metadata in messages table
ALTER TABLE messages 
ADD COLUMN encrypted_file_metadata bytea;

-- Add encrypted columns for file metadata in secure_files table  
ALTER TABLE secure_files
ADD COLUMN encrypted_file_metadata bytea;

-- Keep file_size unencrypted as it's not sensitive and needed for validation
-- The encrypted_file_metadata will contain JSON with filename, file_path, content_type, etc.