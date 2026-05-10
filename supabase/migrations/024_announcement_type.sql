-- Agregar tipo 'announcement' al enum alert_type para mensajes globales del super admin
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'announcement';
