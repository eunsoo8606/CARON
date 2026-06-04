const { sequelize } = require('../config/database');
const Upload = require('../models/Upload');
const { Op } = require('sequelize');

async function run() {
    try {
        const uploads = await Upload.findAll({
            where: {
                file_path: {
                    [Op.notLike]: 'http%'
                }
            },
            limit: 10
        });
        console.log('Non-HTTP Uploads Count:', uploads.length);
        uploads.forEach(u => {
            console.log(`ID: ${u.id}, Path: ${u.file_path}, Name: ${u.saved_name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
