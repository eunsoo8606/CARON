const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inquiry = sequelize.define('Inquiry', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category: { type: DataTypes.STRING(50), defaultValue: '기본' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    car_model: { type: DataTypes.STRING(200) },
    status: { type: DataTypes.STRING(20), defaultValue: '접수' }
}, {
    tableName: 'Inquiries',
    timestamps: true,
    underscored: true
});

module.exports = Inquiry;
