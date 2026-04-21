-- 관리자 계정 관리 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Admins` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '관리자 고유 식별자 (PK)',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '관리자 로그인 아이디',
    `password` VARCHAR(255) NOT NULL       COMMENT '관리자 비밀번호 (암호화 해시값 저장용)',
    `name` VARCHAR(100) NOT NULL           COMMENT '관리자 성함',
    `role` VARCHAR(50) NOT NULL DEFAULT '사원' COMMENT '권한 구분 (최고관리자, 사원)',
    `last_login_at` DATETIME DEFAULT NULL  COMMENT '마지막 접속 일시',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '관리자 계정 등록일',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '계정 정보 수정일',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='관리자 및 사원 계정 정보 테이블';
