const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { sequelize, connectDB } = require('./config/database');
const { Op } = require('sequelize');
const multer = require('multer');
const Admin = require('./models/Admin');
const Inquiry = require('./models/Inquiry');
const Car = require('./models/Car');
const Planner = require('./models/Planner');
const AccessLog = require('./models/AccessLog');
const Upload = require('./models/Upload');
const Banner = require('./models/Banner');
const Youtube = require('./models/Youtube');
const { put } = require('@vercel/blob');
const crypto = require('crypto');

// Encryption Settings
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'landinglab_caron_secret_key_2024'; // 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Helper to extract YouTube Video ID
function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Multer Memory Storage Configuration (For Vercel Compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Auth Middleware
const authAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) return res.redirect('/console');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.clearCookie('adminToken');
        return res.redirect('/console');
    }
};

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Layout Setup
app.use(expressLayouts);
app.set('layout', 'layout/base');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware to pass current path and admin info to all templates
app.use(async (req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.admin = null;

    const token = req.cookies.adminToken;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const admin = await Admin.findByPk(decoded.id);
            if (admin) {
                const adminData = admin.get({ plain: true });
                
                // 만약 플래너라면 프로필 이미지 조회
                const planner = await Planner.findOne({ where: { admin_id: admin.id } });
                if (planner) {
                    const profileImg = await Upload.findOne({
                        where: { ref_type: 'planner', ref_id: planner.id },
                        order: [['created_at', 'DESC']]
                    });
                    adminData.profile_img = profileImg ? `/api/image/${profileImg.id}` : '/images/default_user.png';
                } else {
                    adminData.profile_img = '/images/default_user.png';
                }
                
                res.locals.admin = adminData;
            }
        } catch (err) {
            // 토큰이 유효하지 않으면 무시
        }
    }
    next();
});

// Routes
app.get('/', async (req, res) => {
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
                attributes: ['name', 'use_yn'],
                where: { use_yn: 'Y' }
            }],
            order: [['deliveries', 'DESC'], ['created_at', 'DESC']]
        });

        // 각 플래너의 관리자 프로필 이미지를 별도로 조회 (또는 관계 설정 필요)
        for (let p of planners) {
            const profileImg = await Upload.findOne({
                where: { ref_type: 'planner', ref_id: p.id },
                order: [['created_at', 'DESC']]
            });
            p.setDataValue('profile_img', profileImg ? `/api/image/${profileImg.id}` : '/images/default_user.png');
            // Admin의 이름을 Planner의 이름으로 설정 (뷰 호환성 유지)
            p.setDataValue('name', p.Admin ? p.Admin.name : '이름없음');
        }
        res.render('index', {
            title: '신차장기렌트·리스 전문 - CARON',
            banners,
            youtubeVideos,
            planners
        });
    } catch (err) {
        console.error('Main Page Load Error:', err);
        res.render('index', {
            title: '신차장기렌트·리스 전문 - CARON',
            banners: [],
            youtubeVideos: [],
            planners: []
        });
    }
});

// Company Intro
app.get('/about', (req, res) => {
    res.render('about', {
        title: '회사소개'
    });
});

// Lease Succession
app.get('/succession', (req, res) => {
    res.render('succession', {
        title: '리스/렌트 승계',
        hideSidebar: true
    });
});

// Vehicle Search
app.get('/car/search', async (req, res) => {
    const { brand, car_type, fuel_type, capacity, price_range, q } = req.query;
    const { Op } = require('sequelize');

    try {
        let whereClause = { is_visible: 1 };

        if (brand) whereClause.brand = brand;
        if (car_type) whereClause.car_type = car_type;
        if (fuel_type) whereClause.fuel_type = fuel_type;
        if (capacity) whereClause.capacity = capacity;

        // 가격대 필터 처리 (출고가 기준)
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

        // 정렬 로직 처리
        const { sort } = req.query;
        let orderClause = [['created_at', 'DESC']]; // 기본 최신순

        if (sort === 'price_asc') orderClause = [['rent_fee', 'ASC']];
        else if (sort === 'price_desc') orderClause = [['rent_fee', 'DESC']];

        const cars = await Car.findAll({
            where: whereClause,
            order: orderClause
        });

        res.render('search', {
            title: '차량검색',
            cars,
            query: req.query
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 실시간 검색 추천 API
app.get('/api/cars/suggest', async (req, res) => {
    const { q } = req.query;
    console.log('--- Suggest API Request ---');
    console.log('Query:', q);

    if (!q) return res.json([]);

    const { Op } = require('sequelize');
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
            limit: 20 // 일단 넉넉히 가져온 후 자바스크립트에서 중복 제거
        });

        // 차량명(name_ko) 기준으로 중복 제거
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

        console.log('Suggestions found:', uniqueSuggestions.length);
        res.json(uniqueSuggestions.slice(0, 10)); // 최종 10개만 전달
    } catch (err) {
        console.error('Suggestion API Error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Admin Console Routes
app.get('/console', (req, res) => {
    // 이미 로그인되어 있다면 대시보드로 리다이렉트
    const token = req.cookies.adminToken;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/console/dashboard');
        } catch (e) { }
    }
    res.render('admin/login', { layout: false });
});

// Admin Banners
app.get('/console/banners', authAdmin, async (req, res) => {
    try {
        const banners = await Banner.findAll({
            order: [['order_index', 'ASC']]
        });
        res.render('admin/banners/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/banners',
            banners
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.get('/console/banners/new', authAdmin, (req, res) => {
    res.render('admin/banners/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/banners',
        banner: null
    });
});

app.get('/console/banners/:id', authAdmin, async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        res.render('admin/banners/form', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/banners',
            banner
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/console/banners/save', authAdmin, upload.single('thumbnail'), async (req, res) => {
    const { id, title, link_url, order_index, is_visible } = req.body;
    try {
        let image_id = null;
        
        if (req.file) {
            const blob = await put(`banners/${Date.now()}_${req.file.originalname}`, req.file.buffer, {
                access: 'public',
            });
            const newUpload = await Upload.create({
                original_name: req.file.originalname,
                saved_name: blob.pathname,
                file_path: blob.url,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                ref_type: 'banner'
            });
            image_id = newUpload.id;
        }

        const bannerData = {
            title,
            link_url,
            order_index: parseInt(order_index) || 0,
            is_visible: is_visible === '1' ? 1 : 0
        };

        if (image_id) bannerData.image_id = image_id;

        if (id) {
            await Banner.update(bannerData, { where: { id } });
        } else {
            if (!image_id) return res.send('<script>alert("이미지는 필수입니다."); history.back();</script>');
            await Banner.create(bannerData);
        }
        res.redirect('/console/banners');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving banner');
    }
});

app.post('/console/banners/:id/delete', authAdmin, async (req, res) => {
    try {
        await Banner.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// Admin YouTube
app.get('/console/youtube', authAdmin, async (req, res) => {
    try {
        const videos = await Youtube.findAll({
            order: [['order_index', 'ASC']]
        });
        res.render('admin/youtube/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/youtube',
            videos
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.get('/console/youtube/new', authAdmin, (req, res) => {
    res.render('admin/youtube/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/youtube',
        video: null
    });
});

app.get('/console/youtube/:id', authAdmin, async (req, res) => {
    try {
        const video = await Youtube.findByPk(req.params.id);
        res.render('admin/youtube/form', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/youtube',
            video
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

app.post('/console/youtube/save', authAdmin, async (req, res) => {
    const { id, youtube_url, title, duration, order_index, is_visible } = req.body;
    
    const video_id = extractYoutubeId(youtube_url);
    if (!video_id) return res.send('<script>alert("올바른 유튜브 주소를 입력해주세요."); history.back();</script>');

    try {
        const videoData = {
            video_id,
            title,
            duration,
            order_index: parseInt(order_index) || 0,
            is_visible: is_visible === '1' ? 1 : 0
        };

        if (id) {
            await Youtube.update(videoData, { where: { id } });
        } else {
            await Youtube.create(videoData);
        }
        res.redirect('/console/youtube');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving video');
    }
});

app.post('/console/youtube/:id/delete', authAdmin, async (req, res) => {
    try {
        await Youtube.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// Admin Inquiries
app.get('/console/inquiries', authAdmin, async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({
            order: [['created_at', 'DESC']]
        });
        
        // 연락처 복호화 처리
        const decryptedInquiries = inquiries.map(item => {
            const data = item.toJSON();
            data.phone = decrypt(data.phone);
            return data;
        });

        res.render('admin/inquiries/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/inquiries',
            inquiries: decryptedInquiries
        });
    } catch (err) {
        console.error('--- [Inquiry List Error] ---');
        console.error(err);
        res.status(500).send(`Server Error: ${err.message}`);
    }
});

app.post('/console/inquiries/:id/status', authAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        await Inquiry.update({ status }, { where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Error updating status');
    }
});

app.post('/console/inquiries/:id/memo', authAdmin, async (req, res) => {
    const { memo } = req.body;
    try {
        await Inquiry.update({ memo }, { where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Error saving memo');
    }
});

app.post('/console/inquiries/:id/delete', authAdmin, async (req, res) => {
    try {
        await Inquiry.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// Public Inquiry API (Customer Submission)
app.post('/api/inquiry', async (req, res) => {
    const { name, phone, car_model, category, sale_type, succession_type, contact_method } = req.body;
    
    try {
        await Inquiry.create({
            name,
            phone: encrypt(phone), // 연락처 암호화 저장
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

app.post('/console/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await Admin.findOne({ where: { username } });
        if (!admin) return res.send('<script>alert("아이디 또는 비밀번호가 틀렸습니다."); history.back();</script>');

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.send('<script>alert("아이디 또는 비밀번호가 틀렸습니다."); history.back();</script>');

        // Create JWT
        const token = jwt.sign(
            { id: admin.id, username: admin.username, name: admin.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Set Cookie
        res.cookie('adminToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.redirect('/console/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.get('/console/dashboard', authAdmin, async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 4대 지표 실시간 집계 (병렬 처리로 성능 최적화)
        const [visitorCount, inquiryCount, carCount, plannerCount] = await Promise.all([
            AccessLog.count({ where: { created_at: { [Op.gte]: todayStart } } }),
            Inquiry.count(),
            Car.count(),
            Planner.count()
        ]);

        res.render('admin/dashboard', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/dashboard',
            stats: {
                visitorCount,
                inquiryCount,
                carCount,
                plannerCount
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dashboard Error');
    }
});

// Vehicle Management List
app.get('/console/cars', authAdmin, async (req, res) => {
    try {
        const cars = await Car.findAll({
            order: [['created_at', 'DESC']]
        });
        res.render('admin/cars/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/cars',
            cars
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Vehicle Create/Edit (Forms to be implemented next)
app.get('/console/cars/new', authAdmin, (req, res) => {
    res.render('admin/cars/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/cars',
        car: null
    });
});

app.get('/console/cars/:id', authAdmin, async (req, res) => {
    try {
        const car = await Car.findByPk(req.params.id);
        res.render('admin/cars/form', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/cars',
            car
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Image Serving API (Serving from Blob URL if exists, else DB)
app.get('/api/image/:id', async (req, res) => {
    try {
        const uploadItem = await Upload.findByPk(req.params.id);
        if (!uploadItem) return res.status(404).send('Image not found');

        // If it's a Vercel Blob URL, redirect to it for better performance
        if (uploadItem.file_path && uploadItem.file_path.startsWith('http')) {
            return res.redirect(uploadItem.file_path);
        }

        // Fallback: If no Blob URL, show placeholder or error
        return res.status(404).send('Image data not found');
    } catch (err) {
        console.error('Image Serving Error:', err);
        res.status(500).send('Error serving image');
    }
});

// Save Vehicle (New or Edit)
app.post('/console/cars/save', authAdmin, upload.single('thumbnail'), async (req, res) => {
    console.log('--- Car Save Request ---');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : 'No file');

    const {
        id, brand, name_ko, name_en, rent_fee, original_price, discount_rate,
        car_type, fuel_type, is_hot, is_fast_ship, is_visible, hashtags,
        description, year, capacity, down_payment, period, mileage, is_top10
    } = req.body;

    try {
        let thumbnail_id = null;

        // If new file uploaded (Vercel: Save to Vercel Blob)
        if (req.file) {
            console.log('Uploading to Vercel Blob...');
            const blob = await put(`cars/${Date.now()}_${req.file.originalname}`, req.file.buffer, {
                access: 'public',
            });
            console.log('Blob Upload Success:', blob.url);

            const newUpload = await Upload.create({
                original_name: req.file.originalname,
                saved_name: blob.pathname,
                file_path: blob.url,
                image_data: null, // No longer storing Base64 for new uploads
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                ref_type: 'car'
            });
            thumbnail_id = newUpload.id;
            console.log('New Thumbnail Metadata Saved to DB:', thumbnail_id);
        }

        const carData = {
            brand,
            name_ko,
            name_en,
            rent_fee: parseInt(String(rent_fee || '0').replace(/,/g, '')) || 0,
            original_price: parseInt(String(original_price || '0').replace(/,/g, '')) || 0,
            discount_rate: parseFloat(discount_rate) || 0,
            car_type,
            fuel_type,
            is_fast_ship: is_fast_ship === '1' ? 1 : 0,
            is_visible: is_visible === '1' ? 1 : 0,
            is_hot: is_hot === '1' ? 1 : 0,
            is_top10: is_top10 === '1' ? 1 : 0,
            hashtags: hashtags || '',
            year,
            capacity,
            down_payment,
            period,
            mileage,
            description: description || ''
        };

        if (thumbnail_id) {
            carData.thumbnail_id = thumbnail_id;
        }

        if (id) {
            console.log('Updating Car ID:', id);
            await Car.update(carData, { where: { id } });
        } else {
            console.log('Creating New Car');
            await Car.create(carData);
        }

        res.redirect('/console/cars');
    } catch (err) {
        console.error('Save Error:', err);
        res.status(500).send('Error saving car');
    }
});

// Delete Vehicle
app.post('/console/cars/:id/delete', authAdmin, async (req, res) => {
    try {
        await Car.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// Planner Management List
app.get('/console/planners', authAdmin, async (req, res) => {
    try {
        const planners = await Planner.findAll({
            include: [{ model: Admin, attributes: ['name'] }],
            order: [['priority', 'DESC'], ['created_at', 'DESC']]
        });

        for (let p of planners) {
            const profileImg = await Upload.findOne({
                where: { ref_type: 'planner', ref_id: p.id },
                order: [['created_at', 'DESC']]
            });
            p.setDataValue('profile_img', profileImg ? `/api/image/${profileImg.id}` : '/images/default_user.png');
            // Admin의 이름을 Planner의 이름으로 설정 (뷰 호환성 유지)
            p.setDataValue('name', p.Admin ? p.Admin.name : '이름없음');
        }
        res.render('admin/planners/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/planners',
            planners
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Planner Create/Edit Forms
app.get('/console/planners/new', authAdmin, (req, res) => {
    res.render('admin/planners/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/planners',
        planner: null
    });
});

app.get('/console/planners/edit/:id', authAdmin, async (req, res) => {
    try {
        const planner = await Planner.findByPk(req.params.id, {
            include: [{ model: Admin }]
        });
        res.render('admin/planners/form', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/planners',
            planner
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Save/Update Planner
app.post('/console/planners/save', authAdmin, upload.single('profile_img'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        console.log('--- Planner/Admin Integrated Save ---');
        const { id, username, password, name, position, specialty, satisfaction, deliveries, intro, priority, use_yn } = req.body;
        const currentUseYn = use_yn === 'Y' ? 'Y' : 'N';
        
        let adminId;
        if (id) {
            // 수정 모드
            const planner = await Planner.findByPk(id);
            adminId = planner.admin_id;

            const adminUpdateData = { name, use_yn: currentUseYn };
            if (password && password.trim() !== '') {
                adminUpdateData.password = await bcrypt.hash(password, 10);
            }
            // username은 보통 변경하지 않으나 필요시 추가 가능
            if (username) adminUpdateData.username = username;

            await Admin.update(adminUpdateData, { where: { id: adminId }, transaction: t });
            
            const plannerUpdateData = {
                position,
                specialty,
                satisfaction,
                deliveries: parseInt(String(deliveries || '0').replace(/[^0-9]/g, '')) || 0,
                intro,
                priority: parseInt(priority) || 0
            };
            await Planner.update(plannerUpdateData, { where: { id: id }, transaction: t });
        } else {
            // 신규 등록 모드
            if (!username || !password || !name) {
                throw new Error('아이디, 비밀번호, 이름은 필수입니다.');
            }

            // 1. Admin 계정 생성
            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = await Admin.create({
                username,
                password: hashedPassword,
                name,
                role: '플래너',
                use_yn: currentUseYn
            }, { transaction: t });
            
            adminId = newAdmin.id;

            // 2. Planner 상세 정보 생성
            const newPlanner = await Planner.create({
                admin_id: adminId,
                position,
                specialty,
                satisfaction,
                deliveries: parseInt(String(deliveries || '0').replace(/[^0-9]/g, '')) || 0,
                intro,
                priority: parseInt(priority) || 0
            }, { transaction: t });
            
            id = newPlanner.id; // 이미지 업로드를 위해 ID 할당
        }

        // 이미지 업로드 처리 (트랜잭션 커밋 후에 해도 되지만 안전하게 포함)
        if (req.file) {
            const blob = await put(`planners/${Date.now()}_${req.file.originalname}`, req.file.buffer, {
                access: 'public',
            });
            await Upload.create({
                original_name: req.file.originalname,
                saved_name: blob.pathname,
                file_path: blob.url,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                ref_type: 'planner',
                ref_id: id || planner.id
            }, { transaction: t });
        }

        await t.commit();
        res.redirect('/console/planners');
    } catch (err) {
        await t.rollback();
        console.error('Planner Save Error:', err);
        res.status(500).send(`Error saving planner: ${err.message}`);
    }
});

// Delete Planner
app.post('/console/planners/:id/delete', authAdmin, async (req, res) => {
    try {
        await Planner.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// Logout
app.get('/console/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/console');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
