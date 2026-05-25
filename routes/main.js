const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Banner = require('../models/Banner');
const Youtube = require('../models/Youtube');
const Planner = require('../models/Planner');
const Admin = require('../models/Admin');
const Upload = require('../models/Upload');
const Car = require('../models/Car');

// 메인 페이지
router.get('/', async (req, res) => {
    try {
        const banners = await Banner.findAll({
            where: { is_visible: 1 },
            order: [['order_index', 'ASC']]
        });
        const youtubeVideos = await Youtube.findAll({
            where: { is_visible: 1 },
            order: [['order_index', 'ASC']]
        });
        const planners = await Planner.findAll({
            include: [{
                model: Admin,
                attributes: ['name', 'use_yn', 'role'],
                where: { 
                    use_yn: 'Y',
                    role: '플래너'
                }
            }],
            order: [['deliveries', 'DESC'], ['created_at', 'DESC']]
        });

        for (let p of planners) {
            const profileImg = await Upload.findOne({
                where: { ref_type: 'planner', ref_id: p.id },
                order: [['created_at', 'DESC']]
            });
            p.setDataValue('profile_img', profileImg ? `/api/image/${profileImg.id}` : '/images/default_user.webp');
            p.setDataValue('name', p.Admin ? p.Admin.name : '이름없음');
        }
        // 인기 TOP 10 차량 조회
        const top10Cars = await Car.findAll({
            where: { is_top10: 1, is_visible: 1 },
            order: [['created_at', 'DESC']],
            limit: 10
        });

        // 오늘의 핫딜 차량 조회
        const hotCars = await Car.findAll({
            where: { is_hot: 1, is_visible: 1 },
            order: [['updated_at', 'DESC']],
            limit: 4
        });

        // 제휴사 로고 조회
        const fs = require('fs');
        const path = require('path');
        const affiliateDir = path.join(__dirname, '../public/images/affiliate');
        let affiliates = [];
        try {
            if (fs.existsSync(affiliateDir)) {
                affiliates = fs.readdirSync(affiliateDir)
                    .filter(file => file.endsWith('.webp'))
                    .map(file => `/images/affiliate/${file}`);
            }
        } catch (e) {
            console.error('Affiliate Dir Read Error:', e);
        }

        res.render('index', {
            title: '신차장기렌트·리스 전문 - CARON',
            description: '신차 장기렌트, 오토리스, 리스/렌트 승계 전문 플랫폼 CARON. 최적의 모빌리티 솔루션을 제안합니다.',
            banners,
            youtubeVideos,
            planners,
            top10Cars,
            hotCars,
            affiliates
        });
    } catch (err) {
        console.error('Main Page Load Error:', err);
        res.render('index', {
            title: '신차장기렌트·리스 전문 - CARON',
            description: '신차 장기렌트, 오토리스 전문 CARON입니다.',
            banners: [],
            youtubeVideos: [],
            planners: [],
            top10Cars: [],
            hotCars: [],
            affiliates: []
        });
    }
});

// 회사소개
router.get('/about', (req, res) => {
    res.render('about', {
        title: '회사소개 - CARON',
        description: '자동차 금융의 새로운 기준을 만드는 CARON의 브랜드 스토리와 비전을 소개합니다.'
    });
});

// 리스/렌트 승계
router.get('/succession', (req, res) => {
    res.render('succession', {
        title: '리스/렌트 승계 안내 - CARON',
        description: '복잡한 리스 및 장기렌트 승계를 빠르고 안전하게 도와드리는 CARON 승계 서비스입니다.',
        hideSidebar: true
    });
});

// 차량검색
router.get('/car/search', async (req, res) => {
    const { brand, car_type, fuel_type, capacity, price_range, q } = req.query;

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

        const { sort } = req.query;
        let orderClause = [['created_at', 'DESC']];

        if (sort === 'price_asc') orderClause = [['rent_fee', 'ASC']];
        else if (sort === 'price_desc') orderClause = [['rent_fee', 'DESC']];

        const limit = 12;
        const { count, rows: cars } = await Car.findAndCountAll({
            where: whereClause,
            order: orderClause,
            limit: limit
        });

        const hasMore = count > limit;

        res.render('search', {
            title: '차량검색 - CARON',
            description: '원하시는 브랜드와 차종, 가격대에 맞는 최적의 신차 장기렌트/리스 견적을 실시간으로 확인하세요.',
            cars,
            totalCount: count,
            hasMore,
            query: req.query
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// RSS 피드 생성
router.get('/rss', async (req, res) => {
    try {
        const latestCars = await Car.findAll({
            where: { is_visible: 1 },
            order: [['created_at', 'DESC']],
            limit: 20
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>CARON - 신차 장기렌트·리스 최신 매물</title>
    <link>${baseUrl}</link>
    <description>신차 장기렌트, 오토리스 전문 플랫폼 CARON의 최신 차량 매물 정보입니다.</description>
    <language>ko-kr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml" />
`;

        latestCars.forEach(car => {
            const carUrl = `${baseUrl}/car/search?q=${encodeURIComponent(car.name_ko)}`;
            rssXml += `
    <item>
        <title>[${car.brand}] ${car.name_ko} - 월 ${car.rent_fee.toLocaleString()}원</title>
        <link>${carUrl}</link>
        <guid>${carUrl}&amp;id=${car.id}</guid>
        <description><![CDATA[
            <p>브랜드: ${car.brand}</p>
            <p>모델명: ${car.name_ko}</p>
            <p>월 렌트료: ${car.rent_fee.toLocaleString()}원</p>
            <p>차종: ${car.car_type} | 연료: ${car.fuel_type}</p>
        ]]></description>
        <pubDate>${new Date(car.created_at).toUTCString()}</pubDate>
    </item>`;
        });

        rssXml += `
</channel>
</rss>`;

        res.set('Content-Type', 'application/rss+xml');
        res.send(rssXml);
    } catch (err) {
        console.error('RSS Generation Error:', err);
        res.status(500).send('Error generating RSS feed');
    }
});

// 동적 Sitemap.xml 생성
router.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://caron-opal.vercel.app';
        
        // 정적 페이지 리스트
        const staticPages = [
            '',
            '/about',
            '/succession',
            '/car/search'
        ];

        // 노출 중인 차량 목록 조회 (최근 수정된 날짜 순)
        const cars = await Car.findAll({
            where: { is_visible: 1 },
            attributes: ['name_ko', 'updated_at'],
            order: [['updated_at', 'DESC']]
        });

        // XML 특수기호 이스케이프 헬퍼 함수
        const escapeXml = (unsafe) => {
            return unsafe.replace(/[<>&'"]/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };

        // 첫 줄 공백 방지를 위해 문자열을 붙여서 시작
        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // 1. 정적 기본 페이지 등록
        staticPages.forEach(page => {
            const priority = page === '' ? '1.0' : '0.8';
            xml += `
  <url>
    <loc>${escapeXml(baseUrl + page)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>
  </url>`;
        });

        // 2. 동적 차량 정보 검색 페이지 등록
        cars.forEach(car => {
            const carUrl = `${baseUrl}/car/search?q=${encodeURIComponent(car.name_ko)}`;
            const lastMod = car.updated_at ? new Date(car.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `
  <url>
    <loc>${escapeXml(carUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        xml += '\n</urlset>';

        res.set('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error('Sitemap Generation Error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

module.exports = router;
