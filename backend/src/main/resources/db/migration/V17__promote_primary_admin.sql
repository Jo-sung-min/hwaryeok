UPDATE users
SET role = 'ADMIN',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'wings2530@gmail.com'
  AND role <> 'ADMIN';
