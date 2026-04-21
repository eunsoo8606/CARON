-- 차량 데이터 정보 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Cars` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '차량 고유 식별자 (PK)',
    `brand` VARCHAR(100) NOT NULL COMMENT '브랜드명 (제네시스, 벤츠 등)',
    `name_ko` VARCHAR(200) NOT NULL COMMENT '차량 한글명',
    `name_en` VARCHAR(200) DEFAULT NULL COMMENT '차량 영문명',
    `rent_fee` INT NOT NULL DEFAULT 0 COMMENT '월 렌트료 (원)',
    `original_price` BIGINT DEFAULT 0 COMMENT '차량 원가 (출고가)',
    `discount_rate` DECIMAL(5, 2) DEFAULT 0.00 COMMENT '할인율 (%)',
    `car_type` VARCHAR(50) DEFAULT NULL COMMENT '차종 (세단, SUV, 전기차 등)',
    `fuel_type` VARCHAR(50) DEFAULT NULL COMMENT '연료 (가솔린, 디젤, 하이브리드, 전기 등)',
    `is_fast_ship` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '즉시 출고 가능 여부 (0:불가, 1:가능)',
    `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '차량 노출 상태 (0:미노출, 1:노출)',
    `view_count` INT NOT NULL DEFAULT 0 COMMENT '차량 상세 조회수',
    `description` TEXT DEFAULT NULL COMMENT '차량 상세 설명',
    `hashtags` VARCHAR(500) DEFAULT NULL COMMENT '해쉬태그 (쉼표로 구분)',
    `is_hot` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'HOT 차량 등록 유무 (0:일반, 1:HOT)',
    `thumbnail_id` INT DEFAULT NULL COMMENT '대표 이미지 번호 (Uploads 테이블 FK)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '차량 등록일',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '정보 수정일',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='판매 차량 정보 및 가격 테이블';
