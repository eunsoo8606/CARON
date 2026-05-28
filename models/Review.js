const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    car_name: { type: DataTypes.STRING(100), allowNull: false },
    car_image_id: { type: DataTypes.INTEGER },
    author_name: { type: DataTypes.STRING(50), allowNull: false },
    author_region: { type: DataTypes.STRING(50) },
    author_detail: { type: DataTypes.STRING(100) },
    review_text: { type: DataTypes.TEXT, allowNull: false },
    rating: { type: DataTypes.TINYINT, defaultValue: 5 },
    is_visible: { type: DataTypes.TINYINT(1), defaultValue: 1 },
    order_index: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: 'Reviews',
    timestamps: true,
    underscored: true
});

module.exports = Review;
