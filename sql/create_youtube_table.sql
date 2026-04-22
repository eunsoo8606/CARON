-- 유튜브 영상 관리 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Youtubes` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '유튜브 고유 식별자 (PK)',
    `video_id` VARCHAR(50) NOT NULL COMMENT '유튜브 비디오 ID (예: S_iSOfx_ZAs)',
    `title` VARCHAR(255) NOT NULL COMMENT '영상 제목',
    `duration` VARCHAR(20) DEFAULT NULL COMMENT '영상 길이 (예: 12:45)',
    `order_index` INT NOT NULL DEFAULT 0 COMMENT '노출 순서 (낮은 번호 우선)',
    `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '노출 여부 (0:미노출, 1:노출)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메인 페이지 유튜브 영상 관리 테이블';
