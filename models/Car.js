const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Car = sequelize.define('Car', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    brand: { type: DataTypes.STRING(100), allowNull: false },
    name_ko: { type: DataTypes.STRING(200), allowNull: false },
    name_en: { type: DataTypes.STRING(200) },
    rent_fee: { type: DataTypes.INTEGER, defaultValue: 0 },
    original_price: { type: DataTypes.INTEGER, defaultValue: 0 },
    discount_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    car_type: { type: DataTypes.STRING(50) },
    fuel_type: { type: DataTypes.STRING(50) },
    is_fast_ship: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    is_visible: { type: DataTypes.TINYINT(1), defaultValue: 1 },
    is_hot: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    is_top10: { type: DataTypes.TINYINT(1), defaultValue: 0 },
    thumbnail_id: { type: DataTypes.INTEGER },
    hashtags: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },
    year: { type: DataTypes.STRING(20) },           // 연식 (예: 2025년형)
    capacity: { type: DataTypes.STRING(20) },       // 인승 (예: 6인승)
    down_payment: { type: DataTypes.STRING(20) },   // 선수금 (예: 30%)
    period: { type: DataTypes.STRING(20) },         // 계약기간 (예: 36개월)
    mileage: { type: DataTypes.STRING(20) },        // 주행거리 (예: 연 2만km)
    view_count: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: 'Cars',
    timestamps: true,
    underscored: true
});

module.exports = Car;
