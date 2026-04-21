const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Planner = sequelize.define('Planner', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admin_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    position: { type: DataTypes.STRING(50) }
}, {
    tableName: 'Planners',
    timestamps: true,
    underscored: true
});

module.exports = Planner;
