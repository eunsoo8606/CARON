const { sequelize } = require('../config/database');
const Car = require('../models/Car');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        const cars = await Car.findAll({
            attributes: ['brand'],
            group: ['brand']
        });
        console.log('Brands in DB:');
        cars.forEach(c => console.log(`- ${c.brand}`));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

check();
