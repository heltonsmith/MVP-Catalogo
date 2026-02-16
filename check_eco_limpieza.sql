SELECT ur.*, c.name as company_name, c.plan as current_plan
FROM upgrade_requests ur
JOIN companies c ON ur.company_id = c.id
WHERE c.name ILIKE '%Eco Limpieza%'
ORDER BY ur.created_at DESC;
