-- Insert users from users.json
-- This script will clear existing users and insert all users from the JSON file

-- Clear existing users (optional - comment out if you want to keep existing users)
TRUNCATE TABLE users CASCADE;

-- Insert users from users.json
INSERT INTO users (display_name, role, sector, is_active) VALUES
    ('Ana dos Santos', 'Médica Cardiologista', 'Pronto Atendimento', TRUE),
    ('Bruno de Sousa', 'Enfermeiro de Triagem', 'Pronto Atendimento', TRUE),
    ('Carlos Mendes', 'Médico Clínico Geral', 'Internação', TRUE),
    ('Dalva Ferreira', 'Enfermeira Chefe', 'Internação', TRUE),
    ('Eduarda Lima', 'Técnica de Enfermagem', 'Internação', TRUE),
    ('Fernanda Rocha', 'Médica Intensivista', 'UTI', TRUE),
    ('Gabriela Alves', 'Biomédica', 'Laboratório', TRUE),
    ('Hallan Silva', 'Médico Radiologista', 'Radiologia', TRUE),
    ('Isabela Costa', 'Farmacêutica', 'Farmácia Central', TRUE),
    ('João Pedro Martins', 'Diretor Administrativo', 'Finanças', TRUE),
    ('Karina Souza', 'Atendente', 'Recepção', TRUE);

-- Verify the insert
SELECT COUNT(*) as total_users FROM users;
SELECT id, display_name, role, sector FROM users ORDER BY display_name;
