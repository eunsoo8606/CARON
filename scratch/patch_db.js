const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function patchDatabase() {
    try {
        console.log('--- DB 패치 시작 ---');
        
        // 1. phone 컬럼 존재 여부 확인
        const [results] = await sequelize.query("SHOW COLUMNS FROM Inquiries LIKE 'phone'");
        
        if (results.length === 0) {
            console.log('phone 컬럼이 없습니다. 추가를 시작합니다...');
            await sequelize.query("ALTER TABLE Inquiries ADD COLUMN phone TEXT AFTER name");
            console.log('✅ phone 컬럼 추가 완료!');
        } else {
            console.log('phone 컬럼이 존재합니다. 타입을 TEXT로 강제 변경합니다...');
            await sequelize.query("ALTER TABLE Inquiries MODIFY COLUMN phone TEXT");
            console.log('✅ phone 컬럼 타입 변경 완료!');
        }

        // 2. 다른 누락된 컬럼이 있는지 추가로 확인 (보수적 처리)
        const columnsToAdd = [
            { name: 'sale_type', type: 'VARCHAR(50)' },
            { name: 'succession_type', type: 'VARCHAR(50)' },
            { name: 'contact_method', type: 'VARCHAR(100)' },
            { name: 'memo', type: 'TEXT' }
        ];

        for (const col of columnsToAdd) {
            const [check] = await sequelize.query(`SHOW COLUMNS FROM Inquiries LIKE '${col.name}'`);
            if (check.length === 0) {
                await sequelize.query(`ALTER TABLE Inquiries ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ ${col.name} 컬럼 추가 완료!`);
            }
        }

        console.log('--- DB 패치 완료 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ DB 패치 중 오류 발생:', err);
        process.exit(1);
    }
}

patchDatabase();
