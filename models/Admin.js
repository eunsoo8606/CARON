const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(50),
        defaultValue: '사원'
    },
    last_login_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'Admins',
    timestamps: true, // created_at, updated_at 자동 관리
    underscored: true // created_at 형태로 저장됨
});

module.exports = Admin;
