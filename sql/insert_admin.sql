-- 시스템 최고 관리자 계정 생성 (테스트용)
-- 아이디: admin / 비밀번호: 1234
INSERT INTO `Admins` (
    `username`, 
    `password`, 
    `name`, 
    `role`, 
    `created_at`, 
    `updated_at`
) VALUES (
    'admin', 
    '$2b$10$CVMXwEjBZb278LfoHpkAo.x8ckaqTCNQvWm2kB.JAoXLScDFlCYri', -- '1234'의 실제 bcrypt 해시값
    '시스템관리자', 
    '최고관리자', 
    NOW(), 
    NOW()
);
