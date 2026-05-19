const { sequelize } = require('../config/database');
const Car = require('../models/Car');

const checkBrands = async () => {
    try {
        await sequelize.authenticate();
        const cars = await Car.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('brand')), 'brand']],
        });
        
        console.log('--- 등록된 브랜드 목록 ---');
        cars.forEach(car => {
            console.log(car.brand);
        });
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
};

checkBrands();
