-- Add plan pricing configuration to system_config
INSERT INTO system_config (key, value, updated_at) VALUES
  ('plus_plan_price_monthly', '9990', NOW()),
  ('plus_plan_price_semester', '8500', NOW()),
  ('plus_plan_price_annual', '7000', NOW()),
  ('pro_plan_price_monthly', '19990', NOW()),
  ('pro_plan_price_semester', '18000', NOW()),
  ('pro_plan_price_annual', '16000', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = EXCLUDED.updated_at;

COMMENT ON TABLE system_config IS 'System-wide configuration key-value pairs including plan limits and pricing';
