const { Sequelize } = require('sequelize');
require('dotenv').config();

// Sequelize 연결 설정
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging: false, // 콘솔에 SQL 로그가 너무 많이 찍히는 것을 방지
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            // MySQL 8 이상에서 시간대 관련 오류 방지
            dateStrings: true,
            typeCast: true
        },
        timezone: '+09:00' // 한국 시간 설정
    }
);

// 연결 테스트 함수
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Database Connected Successfully!');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, connectDB };
