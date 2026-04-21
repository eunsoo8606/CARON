const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { connectDB } = require('./config/database');
const { Op } = require('sequelize');
const multer = require('multer');
const Admin = require('./models/Admin');
const Inquiry = require('./models/Inquiry');
const Car = require('./models/Car');
const Planner = require('./models/Planner');
const AccessLog = require('./models/AccessLog');
const Upload = require('./models/Upload');

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

// Middleware to pass current path to all templates
app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: '신차장기렌트·리스 전문 - CARON'
    });
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
app.get('/search', async (req, res) => {
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

// Admin Banners (Preparing)
app.get('/console/banners', (req, res) => {
    res.render('admin/preparing', {
        layout: 'layout/admin_base',
        title: '배너 관리',
        currentPath: '/console/banners'
    });
});

// Admin YouTube (Preparing)
app.get('/console/youtube', (req, res) => {
    res.render('admin/preparing', {
        layout: 'layout/admin_base',
        title: '유튜브 관리',
        currentPath: '/console/youtube'
    });
});

// Admin Inquiries (Preparing)
app.get('/console/inquiries', (req, res) => {
    res.render('admin/preparing', {
        layout: 'layout/admin_base',
        title: '문의 관리',
        currentPath: '/console/inquiries'
    });
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

// Image Serving API (Serving from DB for Vercel Compatibility)
app.get('/api/image/:id', async (req, res) => {
    try {
        const uploadItem = await Upload.findByPk(req.params.id);
        if (!uploadItem || !uploadItem.image_data) return res.status(404).send('Image not found');
        
        const imgBuffer = Buffer.from(uploadItem.image_data, 'base64');
        res.writeHead(200, {
            'Content-Type': uploadItem.mime_type,
            'Content-Length': imgBuffer.length
        });
        res.end(imgBuffer);
    } catch (err) {
        console.error('Image Serving Error:', err);
        res.status(500).send('Error serving image');
    }
});

// Save Vehicle (New or Edit)
app.post('/console/cars/save', authAdmin, upload.single('thumbnail'), async (req, res) => {
    // 디버깅을 위한 로그 추가
    console.log('--- Car Save Request ---');
    console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.filename : 'No file');

    const {
        id, brand, name_ko, name_en, rent_fee, original_price, discount_rate,
        car_type, fuel_type, is_hot, is_fast_ship, is_visible, hashtags,
        description, year, capacity, down_payment, period, mileage
    } = req.body;

    try {
        let thumbnail_id = null;

        // If new file uploaded (Vercel: Save to DB as Base64)
        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            const newUpload = await Upload.create({
                original_name: req.file.originalname,
                saved_name: `v_${Date.now()}_${req.file.originalname}`,
                image_data: base64Data,
                file_path: 'DB_STORED',
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                ref_type: 'car'
            });
            thumbnail_id = newUpload.id;
            console.log('New Thumbnail Saved to DB:', thumbnail_id);
        }

        const carData = {
            brand,
            name_ko,
            name_en,
            rent_fee: parseInt(rent_fee.replace(/,/g, '')) || 0,
            original_price: parseInt(original_price.replace(/,/g, '')) || 0,
            discount_rate: parseFloat(discount_rate) || 0,
            car_type,
            fuel_type,
            is_fast_ship: is_fast_ship === '1' ? 1 : 0,
            is_visible: is_visible === '1' ? 1 : 0,
            is_hot: is_hot === '1' ? 1 : 0,
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

// Logout
app.get('/console/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/console');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
