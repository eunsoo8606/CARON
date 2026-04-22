const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(200) },
    image_id: { type: DataTypes.INTEGER, allowNull: false },
    link_url: { type: DataTypes.STRING(512) },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_visible: { type: DataTypes.TINYINT(1), defaultValue: 1 }
}, {
    tableName: 'Banners',
    timestamps: true,
    updatedAt: false, // 스크립트에는 created_at만 있음
    underscored: true
});

module.exports = Banner;
