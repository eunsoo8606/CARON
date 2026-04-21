-- 플래너 정보 관리 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Planners` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '플래너 고유 식별자 (PK)',
    `admin_id` INT NOT NULL COMMENT '관리자 테이블 외래키 (Admins.id)',
    `name` VARCHAR(100) NOT NULL COMMENT '플래너 성함',
    `position` VARCHAR(50) DEFAULT '플래너' COMMENT '직위 (팀장, 과장 등)',
    `specialty` VARCHAR(100) DEFAULT NULL COMMENT '전문 구분 (법인리스전문, 장기렌트전문 등)',
    `image_id` INT DEFAULT NULL COMMENT '플래너 이미지 번호 (업로드 테이블 FK)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '플래너 등록일',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '정보 수정일',
    PRIMARY KEY (`id`),
    CONSTRAINT `FK_Planners_Admin` FOREIGN KEY (`admin_id`) REFERENCES `Admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='현장 플래너 상세 정보 테이블';
