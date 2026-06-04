const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { encrypt } = require('../utils/crypto');
const Car = require('../models/Car');
const Inquiry = require('../models/Inquiry');
const Upload = require('../models/Upload');
const { getDirectImageUrl } = require('../utils/helpers');

// 실시간 검색 추천 API
router.get('/cars/suggest', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const cars = await Car.findAll({
            where: {
                is_visible: 1,
                [Op.or]: [
                    { name_ko: { [Op.like]: `%${q}%` } },
                    { brand: { [Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['name_ko', 'brand'],
            limit: 20
        });

        const uniqueSuggestions = [];
        const map = new Map();
        for (const item of cars) {
            if (!map.has(item.name_ko)) {
                map.set(item.name_ko, true);
                uniqueSuggestions.push({
                    name_ko: item.name_ko,
                    brand: item.brand
                });
            }
        }
        res.json(uniqueSuggestions.slice(0, 10));
    } catch (err) {
        console.error('Suggestion API Error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// 고객 상담 신청 API
router.post('/inquiry', async (req, res) => {
    const { name, phone, car_model, category, sale_type, succession_type, contact_method } = req.body;
    
    try {
        await Inquiry.create({
            name,
            phone: encrypt(phone),
            car_model,
            category: category || '기본',
            sale_type,
            succession_type,
            contact_method,
            status: '접수'
        });
        res.json({ success: true, message: '상담 신청이 완료되었습니다.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '상담 신청 중 오류가 발생했습니다.' });
    }
});

// 이미지 경로 인메모리 캐시 선언 (강력 새로고침 시 발생하는 폭발적인 이미지 요청의 DB 부하 차단)
const imagePathCache = new Map();

// 이미지 서빙 API
router.get('/image/:id', async (req, res) => {
    const imageId = req.params.id;

    // 캐시 히트 시 DB 조회 없이 즉시 리다이렉트
    if (imagePathCache.has(imageId)) {
        const cachedPath = imagePathCache.get(imageId);
        if (cachedPath) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.redirect(cachedPath);
        }
        return res.status(404).send('Image not found');
    }

    try {
        const uploadItem = await Upload.findByPk(imageId);
        if (!uploadItem) {
            imagePathCache.set(imageId, null); // 404 부정적 캐싱
            return res.status(404).send('Image not found');
        }

        // 브라우저 캐싱 적용 (서버 DB 커넥션 부하 방지 - 1일 유지)
        res.setHeader('Cache-Control', 'public, max-age=86400');

        if (uploadItem.file_path) {
            let targetPath = '';
            // 외부 링크(http 또는 https)인 경우 그대로 리다이렉트
            if (uploadItem.file_path.startsWith('http://') || uploadItem.file_path.startsWith('https://')) {
                targetPath = uploadItem.file_path;
            } else {
                // 로컬 파일 경로인 경우에만 세그먼트별 안전 인코딩
                targetPath = uploadItem.file_path.split('/').map(segment => encodeURIComponent(segment)).join('/');
            }

            if (targetPath) {
                imagePathCache.set(imageId, targetPath); // 캐시에 경로 저장
                return res.redirect(targetPath);
            }
        }

        imagePathCache.set(imageId, null);
        return res.status(404).send('Image data not found');
    } catch (err) {
        console.error('Image Serving Error:', err);
        res.status(500).send('Error serving image');
    }
});

// 차량 더보기 (Ajax Pagination)
const ejs = require('ejs');
const path = require('path');

router.get('/cars/search/more', async (req, res) => {
    const { brand, car_type, fuel_type, capacity, price_range, q, sort, offset } = req.query;
    
    try {
        let whereClause = { is_visible: 1 };

        if (brand) {
            let searchBrand = brand;
            if (brand === '지프') searchBrand = 'Jeep';
            if (brand === '도요타') searchBrand = '토요타';
            whereClause.brand = searchBrand;
        }
        if (car_type) whereClause.car_type = car_type;
        if (fuel_type) whereClause.fuel_type = fuel_type;
        if (capacity) whereClause.capacity = capacity;

        if (price_range) {
            if (price_range === '1') whereClause.original_price = { [Op.lte]: 20000000 };
            else if (price_range === '2') whereClause.original_price = { [Op.between]: [20000000, 40000000] };
            else if (price_range === '3') whereClause.original_price = { [Op.between]: [40000000, 60000000] };
            else if (price_range === '4') whereClause.original_price = { [Op.between]: [60000000, 80000000] };
            else if (price_range === '5') whereClause.original_price = { [Op.gte]: 80000000 };
        }

        if (q) {
            whereClause[Op.or] = [
                { name_ko: { [Op.like]: `%${q}%` } },
                { brand: { [Op.like]: `%${q}%` } }
            ];
        }

        let orderClause = [['created_at', 'DESC']];
        if (sort === 'price_asc') orderClause = [['rent_fee', 'ASC']];
        else if (sort === 'price_desc') orderClause = [['rent_fee', 'DESC']];
        else if (sort === 'top10') orderClause = [['is_top10', 'DESC'], ['created_at', 'DESC']];

        const limit = 12;
        const skip = parseInt(offset) || 0;

        const { count, rows: cars } = await Car.findAndCountAll({
            where: whereClause,
            include: [{ model: Upload, as: 'Thumbnail' }],
            order: orderClause,
            limit: limit,
            offset: skip
        });

        for (let car of cars) {
            const path = car.Thumbnail ? car.Thumbnail.file_path : null;
            car.setDataValue('thumbnail_url', getDirectImageUrl(path));
        }

        const hasMore = count > (skip + limit);

        // 부분 렌더링된 HTML 텍스트 생성
        let html = '';
        for (const car of cars) {
            const cardHtml = await ejs.renderFile(path.join(__dirname, '../views/partials/car_card.ejs'), { car: car });
            html += cardHtml;
        }

        res.json({ success: true, html, hasMore, totalCount: count });
    } catch (err) {
        console.error('Search More API Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
