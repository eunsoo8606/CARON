CREATE TABLE `Planners` (
	`id` INT NOT NULL AUTO_INCREMENT COMMENT '플래너 고유 식별자 (PK)',
	`admin_id` INT NOT NULL COMMENT '관리자 테이블 외래키 (Admins.id)',
	`position` VARCHAR(50) NULL DEFAULT '플래너' COMMENT '직위 (팀장, 과장 등)' COLLATE 'utf8mb4_unicode_ci',
	`specialty` VARCHAR(100) NULL DEFAULT NULL COMMENT '전문 구분 (법인리스전문, 장기렌트전문 등)' COLLATE 'utf8mb4_unicode_ci',
	`created_at` DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP) COMMENT '플래너 등록일',
	`updated_at` DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP COMMENT '정보 수정일',
	`satisfaction` VARCHAR(20) NULL DEFAULT NULL COMMENT '만족도 (예: 99.8%)' COLLATE 'utf8mb4_unicode_ci',
	`deliveries` VARCHAR(20) NULL DEFAULT NULL COMMENT '출고 건수 (예: 1,842)' COLLATE 'utf8mb4_unicode_ci',
	`priority` INT NULL DEFAULT '0' COMMENT '노출 우선순위',
	`is_active` TINYINT(1) NULL DEFAULT '1' COMMENT '노출 여부',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `FK_Planners_Admin` (`admin_id`) USING BTREE,
	CONSTRAINT `FK_Planners_Admin` FOREIGN KEY (`admin_id`) REFERENCES `Admins` (`id`) ON UPDATE NO ACTION ON DELETE CASCADE
)
COMMENT='현장 플래너 상세 정보 테이블'
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
AUTO_INCREMENT=2
;
