const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Youtube = sequelize.define('Youtube', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    video_id: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    duration: { type: DataTypes.STRING(20) },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_visible: { type: DataTypes.TINYINT(1), defaultValue: 1 }
}, {
    tableName: 'Youtubes',
    timestamps: true,
    updatedAt: false,
    underscored: true
});

module.exports = Youtube;
