-- 최고관리자(admin)와 연결된 플래너 상세 정보 등록
-- Admins 테이블의 id가 1번이라고 가정합니다.
INSERT INTO `Planners` (
    `admin_id`, 
    `name`, 
    `position`, 
    `specialty`, 
    `created_at`, 
    `updated_at`
) VALUES (
    1, 
    '시스템관리자', 
    '총괄팀장', 
    '신차리스/장기렌트 전차종 전문', 
    NOW(), 
    NOW()
);
