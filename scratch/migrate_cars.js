const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        
        // 1. is_domestic 컬럼 추가
        console.log('Adding is_domestic column to Cars table...');
        await sequelize.query(
            'ALTER TABLE Cars ADD COLUMN is_domestic TINYINT(1) NOT NULL DEFAULT 1 AFTER brand',
            { type: QueryTypes.RAW }
        );
        console.log('Column added successfully.');

        // 2. 수입 브랜드들의 is_domestic 값을 0으로 업데이트
        console.log('Updating is_domestic flag for imported cars...');
        const domesticBrands = ['현대', '제네시스', '기아', '르노코리아', '쉐보레', 'KGM'];
        await sequelize.query(
            'UPDATE Cars SET is_domestic = 0 WHERE brand NOT IN (:domesticBrands)',
            {
                replacements: { domesticBrands },
                type: QueryTypes.RAW
            }
        );
        console.log('Existing records migrated successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sequelize.close();
        console.log('Database connection closed.');
    }
}

migrate();
