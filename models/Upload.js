const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Upload = sequelize.define('Upload', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    saved_name: { type: DataTypes.STRING(255), allowNull: false },
    file_path: { type: DataTypes.STRING(512), allowNull: true },
    image_data: { type: DataTypes.TEXT('long') }, // Vercel 환경용 Base64 데이터 저장
    file_size: { type: DataTypes.INTEGER, allowNull: false },
    mime_type: { type: DataTypes.STRING(100) },
    ref_type: { type: DataTypes.STRING(50) },
    ref_id: { type: DataTypes.INTEGER }
}, {
    tableName: 'Uploads',
    timestamps: true,
    updatedAt: false, // 업로드는 수정이 거의 없으므로 createdAt만 사용
    underscored: true
});

module.exports = Upload;
