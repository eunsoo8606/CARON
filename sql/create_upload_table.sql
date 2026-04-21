-- 파일 업로드 관리 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Uploads` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '업로드 고유 식별자 (PK)',
    `original_name` VARCHAR(255) NOT NULL COMMENT '사용자가 업로드한 원본 파일명',
    `saved_name` VARCHAR(255) NOT NULL COMMENT '서버에 저장된 고유 파일명',
    `file_path` VARCHAR(512) NOT NULL COMMENT '파일이 저장된 경로',
    `file_size` INT NOT NULL COMMENT '파일 크기 (Byte)',
    `mime_type` VARCHAR(100) DEFAULT NULL COMMENT '파일 형식 (image/jpeg, application/pdf 등)',
    `ref_type` VARCHAR(50) DEFAULT NULL COMMENT '참조 유형 (planner, board, car, popup 등)',
    `ref_id` INT DEFAULT NULL COMMENT '참조 대상의 고유 식별자 (예: 플래너 ID, 게시글 번호)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '파일 업로드 일시',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='파일 업로드 내역 및 메타데이터 테이블';
