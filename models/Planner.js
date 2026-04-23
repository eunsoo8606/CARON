const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Planner = sequelize.define('Planner', {
    admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING,
        defaultValue: '플래너'
    },
    specialty: {
        type: DataTypes.STRING,
        comment: '전문 분야'
    },
    intro: {
        type: DataTypes.TEXT,
        comment: '자기소개'
    },
    satisfaction: {
        type: DataTypes.STRING
    },
    deliveries: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'Planners',
    underscored: true
});

// 관계 정의
const Admin = require('./Admin');
Planner.belongsTo(Admin, { foreignKey: 'admin_id' });

module.exports = Planner;
