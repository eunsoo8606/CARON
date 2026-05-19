const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { encrypt } = require('../utils/crypto');
const Car = require('../models/Car');
const Inquiry = require('../models/Inquiry');
const Upload = require('../models/Upload');

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

// 이미지 서빙 API
router.get('/image/:id', async (req, res) => {
    try {
        const uploadItem = await Upload.findByPk(req.params.id);
        if (!uploadItem) return res.status(404).send('Image not found');

        // 브라우저 캐싱 적용 (서버 DB 커넥션 부하 방지 - 1일 유지)
        res.setHeader('Cache-Control', 'public, max-age=86400');

        if (uploadItem.file_path) {
            // 외부 링크(http 또는 https)인 경우 그대로 리다이렉트
            if (uploadItem.file_path.startsWith('http://') || uploadItem.file_path.startsWith('https://')) {
                return res.redirect(uploadItem.file_path);
            }
            
            // 로컬 파일 경로인 경우에만 세그먼트별 안전 인코딩
            const encodedPath = uploadItem.file_path.split('/').map(segment => encodeURIComponent(segment)).join('/');
            return res.redirect(encodedPath);
        }

        return res.status(404).send('Image data not found');
    } catch (err) {
        console.error('Image Serving Error:', err);
        res.status(500).send('Error serving image');
    }
});

module.exports = router;
