const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const Admin = require('../models/Admin');

const updatePassword = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB 연결 성공! 관리자 비밀번호 변경을 시작합니다...');

        // 새 비밀번호 해싱
        const newPassword = 'caron1234!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 첫 번째 관리자 계정 찾기 (보통 시스템 관리자)
        const admin = await Admin.findOne();

        if (!admin) {
            console.log('❌ 관리자 계정을 찾을 수 없습니다.');
            return;
        }

        // 비밀번호 업데이트
        admin.password = hashedPassword;
        await admin.save();

        console.log(`🎉 관리자 계정 [${admin.username}]의 비밀번호가 성공적으로 변경되었습니다!`);
    } catch (error) {
        console.error('❌ 스크립트 실행 에러:', error);
    } finally {
        await sequelize.close();
    }
};

updatePassword();
