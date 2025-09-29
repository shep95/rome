-- Remove password hash for user aureon to allow fresh login setup
DELETE FROM password_security 
WHERE user_id = '59c90544-053a-46de-9df3-94fd3a0d6382';