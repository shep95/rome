-- Fix password hash format for user aureon
-- The current hash is missing the salt component
UPDATE password_security 
SET password_hash = 'argon2:04815b6e8ab0ea740e4dc20b88dddb9d182c018aec32825d99a187202499567b:36cd4494c1dc9f3d80cef1a0517cf96544bdbc224d85c7341ddfa82fa40a6f12'
WHERE user_id = '59c90544-053a-46de-9df3-94fd3a0d6382';