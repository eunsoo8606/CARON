-- 페이지 방문 및 유입 분석을 위한 로그 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `AccessLogs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '로그 고유 식별자 (PK)',
    `session_id` VARCHAR(100) DEFAULT NULL COMMENT '방문자 세션 식별자 (유니크 방문자 분석용)',
    `page_path` VARCHAR(255) NOT NULL COMMENT '방문한 페이지 경로 (예: /search)',
    `referer` VARCHAR(512) DEFAULT NULL COMMENT '유입 경로 (어떤 페이지/사이트에서 왔는지)',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '방문자 IP 주소',
    `user_agent` VARCHAR(512) DEFAULT NULL COMMENT '방문자 기기 및 브라우저 정보',
    `user_id` INT DEFAULT NULL COMMENT '로그인한 회원일 경우 회원 번호',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '방문 일시',
    PRIMARY KEY (`id`),
    INDEX `idx_page_path` (`page_path`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 페이지 방문 및 마케팅 분석용 로그 테이블';
