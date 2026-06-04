const { sequelize } = require('../config/database');
const Car = require('../models/Car');
const Upload = require('../models/Upload');

Car.belongsTo(Upload, { foreignKey: 'thumbnail_id', as: 'Thumbnail' });

async function run() {
    try {
        console.log('--- TESTING SORT BY TOP 10 DESC, CREATED_AT DESC ---');
        const cars = await Car.findAll({
            where: { is_visible: 1 },
            include: [{ model: Upload, as: 'Thumbnail' }],
            order: [['is_top10', 'DESC'], ['created_at', 'DESC']],
            limit: 5
        });

        cars.forEach((car, index) => {
            console.log(`[Rank ${index + 1}] ID: ${car.id}, Name: ${car.name_ko}, is_top10: ${car.is_top10}, CreatedAt: ${car.created_at}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
