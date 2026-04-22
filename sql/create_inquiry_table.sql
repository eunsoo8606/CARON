-- 상담 문의 내역 테이블 생성 스크립트
CREATE TABLE IF NOT EXISTS `Inquiries` (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '문의 고유 번호 (PK)',
    `category` VARCHAR(50) NOT NULL DEFAULT '기본' COMMENT '문의 구분 (기본, 리스승계 등)',
    `sale_type` VARCHAR(50) DEFAULT NULL COMMENT '판매 구분 (판매, 구매 등)',
    `succession_type` VARCHAR(50) DEFAULT NULL COMMENT '승계 구분 (리스, 렌트 등)',
    `name` VARCHAR(100) NOT NULL COMMENT '상담 신청자 성함',
    `phone` TEXT NOT NULL COMMENT '상담 신청자 연락처 (암호화 저장)',
    `car_model` VARCHAR(200) DEFAULT NULL COMMENT '관심 차종 / 모델명',
    `contact_method` VARCHAR(100) DEFAULT NULL COMMENT '견적 안내 방법 (전화, 문자 등)',
    `privacy_agreement` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '개인정보 수집 및 이용 동의 여부 (0:미동의, 1:동의)',
    `planner_id` INT DEFAULT NULL COMMENT '담당 플래너/관리자 식별자',
    `status` VARCHAR(20) NOT NULL DEFAULT '접수' COMMENT '상담 진행 상태 (접수, 상담중, 계약완료, 취소 등)',
    `memo` TEXT DEFAULT NULL COMMENT '관리자 전용 상담 메모',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '문의 신청 일시',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '정보 수정 일시',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='고객 상담 신청 내역 테이블';
