-- FUNCIÓN OPCIONAL: Para incrementar login de forma más eficiente
-- (Solo ejecutar si quieres la versión optimizada)

CREATE OR REPLACE FUNCTION increment_user_login(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET 
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;
