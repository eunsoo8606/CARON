const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
require('dotenv').config();

// Sequelize 연결 설정
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        dialectModule: mysql2, // Vercel 환경에서 mysql2 로드 오류 해결을 위한 핵심 설정
        logging: false, // 콘솔에 SQL 로그가 너무 많이 찍히는 것을 방지
        pool: {
            max: 1, // 서버리스 컨테이너당 요청이 순차적으로 들어오므로 max는 1이면 충분함
            min: 0,
            acquire: 20000,
            idle: 1000, // 1초 동안 유휴 상태면 커넥션 즉시 반환
            evict: 1000 // 1초 주기로 유휴 커넥션 감시 및 해제
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
