const { sequelize } = require('../config/database');
const Car = require('../models/Car');
const Upload = require('../models/Upload');
const { getDirectImageUrl } = require('../utils/helpers');

// 관계 선언 (app.js와 동일)
Car.belongsTo(Upload, { foreignKey: 'thumbnail_id', as: 'Thumbnail' });

async function run() {
    try {
        console.log('--- TOP 10 CARS TEST ---');
        const top10Cars = await Car.findAll({
            where: { is_top10: 1, is_visible: 1 },
            include: [{ model: Upload, as: 'Thumbnail' }],
            limit: 3
        });

        top10Cars.forEach(car => {
            const path = car.Thumbnail ? car.Thumbnail.file_path : null;
            const directUrl = getDirectImageUrl(path);
            car.setDataValue('thumbnail_url', directUrl);
            console.log(`Car ID: ${car.id}, Name: ${car.name_ko}`);
            console.log(`Original Thumbnail ID: ${car.thumbnail_id}`);
            console.log(`Thumbnail Path: ${path}`);
            console.log(`Generated Thumbnail URL: ${car.getDataValue('thumbnail_url')}`);
            console.log('-------------------------------');
        });

        console.log('\n--- SEARCH CARS TEST ---');
        const cars = await Car.findAll({
            where: { is_visible: 1 },
            include: [{ model: Upload, as: 'Thumbnail' }],
            limit: 3
        });

        cars.forEach(car => {
            const path = car.Thumbnail ? car.Thumbnail.file_path : null;
            const directUrl = getDirectImageUrl(path);
            car.setDataValue('thumbnail_url', directUrl);
            console.log(`Car ID: ${car.id}, Name: ${car.name_ko}`);
            console.log(`Generated Thumbnail URL: ${car.getDataValue('thumbnail_url')}`);
            console.log('-------------------------------');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
