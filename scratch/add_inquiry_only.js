const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        
        console.log('Adding is_inquiry_only column to Cars table...');
        await sequelize.query(
            'ALTER TABLE Cars ADD COLUMN is_inquiry_only TINYINT(1) NOT NULL DEFAULT 0 AFTER is_top10',
            { type: QueryTypes.RAW }
        );
        console.log('Column added successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sequelize.close();
        console.log('Database connection closed.');
    }
}

migrate();
