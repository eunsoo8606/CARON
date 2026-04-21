const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccessLog = sequelize.define('AccessLog', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    session_id: { type: DataTypes.STRING(100) },
    page_path: { type: DataTypes.STRING(255), allowNull: false },
    ip_address: { type: DataTypes.STRING(45) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'AccessLogs',
    timestamps: false, // 별도의 updated_at이 필요 없으므로 수동 관리
    underscored: true
});

module.exports = AccessLog;
