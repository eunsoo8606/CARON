-- 메인 페이지 배너 관리 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Banners` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '배너 고유 식별자 (PK)',
    `title` VARCHAR(200) DEFAULT NULL COMMENT '배너 제목 (관리용)',
    `image_id` INT NOT NULL COMMENT '배너 이미지 식별자 (Uploads 테이블 FK)',
    `link_url` VARCHAR(512) DEFAULT NULL COMMENT '클릭 시 이동할 링크 주소',
    `order_index` INT NOT NULL DEFAULT 0 COMMENT '배너 노출 순서 (낮은 번호 우선)',
    `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '배너 노출 여부 (0:미노출, 1:노출)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '배너 등록일',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메인 비주얼 슬라이드 배너 관리 테이블';
