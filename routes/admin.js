const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { Op } = require('sequelize');
const { put } = require('@vercel/blob');
const sharp = require('sharp');
const { sequelize } = require('../config/database');

const Admin = require('../models/Admin');
const Inquiry = require('../models/Inquiry');
const Car = require('../models/Car');
const Planner = require('../models/Planner');
const AccessLog = require('../models/AccessLog');
const Upload = require('../models/Upload');
const Banner = require('../models/Banner');
const Youtube = require('../models/Youtube');

const { authAdmin } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');
const { extractYoutubeId } = require('../utils/helpers');

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 관리자 로그인 페이지
router.get('/', (req, res) => {
    const token = req.cookies.adminToken;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect('/console/dashboard');
        } catch (e) { }
    }
    res.render('admin/login', { layout: false });
});

// 로그인 처리
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ where: { username } });
        if (!admin) return res.send('<script>alert("아이디 또는 비밀번호가 틀렸습니다."); history.back();</script>');

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.send('<script>alert("아이디 또는 비밀번호가 틀렸습니다."); history.back();</script>');

        const token = jwt.sign(
            { id: admin.id, username: admin.username, name: admin.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('adminToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/console/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// 로그아웃
router.get('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.redirect('/console');
});

// 대시보드
router.get('/dashboard', authAdmin, async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

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
            stats: { visitorCount, inquiryCount, carCount, plannerCount }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Dashboard Error');
    }
});

// 배너 관리
router.get('/banners', authAdmin, async (req, res) => {
    try {
        const banners = await Banner.findAll({ order: [['order_index', 'ASC']] });
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

router.get('/banners/new', authAdmin, (req, res) => {
    res.render('admin/banners/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/banners',
        banner: null
    });
});

router.get('/banners/:id', authAdmin, async (req, res) => {
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

router.post('/banners/save', authAdmin, upload.single('thumbnail'), async (req, res) => {
    const { id, title, link_url, order_index, is_visible } = req.body;
    try {
        let image_id = null;
        if (req.file) {
            // WebP 변환
            const webpBuffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
            const fileName = `banners/${Date.now()}.webp`;
            const blob = await put(fileName, webpBuffer, { access: 'public' });
            
            const newUpload = await Upload.create({
                original_name: req.file.originalname,
                saved_name: blob.pathname,
                file_path: blob.url,
                file_size: webpBuffer.length,
                mime_type: 'image/webp',
                ref_type: 'banner'
            });
            image_id = newUpload.id;
        }

        const bannerData = {
            title, link_url,
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
        res.status(500).send('Error saving banner');
    }
});

router.post('/banners/:id/delete', authAdmin, async (req, res) => {
    try {
        await Banner.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// 유튜브 관리
router.get('/youtube', authAdmin, async (req, res) => {
    try {
        const videos = await Youtube.findAll({ order: [['order_index', 'ASC']] });
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

router.get('/youtube/new', authAdmin, (req, res) => {
    res.render('admin/youtube/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/youtube',
        video: null
    });
});

router.get('/youtube/:id', authAdmin, async (req, res) => {
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

router.post('/youtube/save', authAdmin, async (req, res) => {
    const { id, youtube_url, title, duration, order_index, is_visible } = req.body;
    const video_id = extractYoutubeId(youtube_url);
    if (!video_id) return res.send('<script>alert("올바른 유튜브 주소를 입력해주세요."); history.back();</script>');

    try {
        const videoData = {
            video_id, title, duration,
            order_index: parseInt(order_index) || 0,
            is_visible: is_visible === '1' ? 1 : 0
        };
        if (id) await Youtube.update(videoData, { where: { id } });
        else await Youtube.create(videoData);
        res.redirect('/console/youtube');
    } catch (err) {
        res.status(500).send('Error saving video');
    }
});

router.post('/youtube/:id/delete', authAdmin, async (req, res) => {
    try {
        await Youtube.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// 상담 내역 관리
router.get('/inquiries', authAdmin, async (req, res) => {
    try {
        const inquiries = await Inquiry.findAll({ order: [['created_at', 'DESC']] });
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
        res.status(500).send('Server Error');
    }
});

router.post('/inquiries/:id/status', authAdmin, async (req, res) => {
    try {
        await Inquiry.update({ status: req.body.status }, { where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Error updating status');
    }
});

router.post('/inquiries/:id/memo', authAdmin, async (req, res) => {
    try {
        await Inquiry.update({ memo: req.body.memo }, { where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Error saving memo');
    }
});

router.post('/inquiries/:id/delete', authAdmin, async (req, res) => {
    try {
        await Inquiry.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// 차량 관리
router.get('/cars', authAdmin, async (req, res) => {
    try {
        const cars = await Car.findAll({ order: [['created_at', 'DESC']] });
        res.render('admin/cars/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/cars',
            cars
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/cars/new', authAdmin, (req, res) => {
    res.render('admin/cars/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/cars',
        car: null
    });
});

router.get('/cars/:id', authAdmin, async (req, res) => {
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

router.post('/cars/save', authAdmin, upload.single('thumbnail'), async (req, res) => {
    const {
        id, brand, name_ko, name_en, rent_fee, original_price, discount_rate,
        car_type, fuel_type, is_hot, is_fast_ship, is_visible, hashtags,
        description, year, capacity, down_payment, period, mileage, is_top10
    } = req.body;

    try {
        let thumbnail_id = null;
        if (req.file) {
            // WebP 변환
            const webpBuffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
            const fileName = `cars/${Date.now()}.webp`;
            const blob = await put(fileName, webpBuffer, { access: 'public' });

            const newUpload = await Upload.create({
                original_name: req.file.originalname,
                saved_name: blob.pathname,
                file_path: blob.url,
                file_size: webpBuffer.length,
                mime_type: 'image/webp',
                ref_type: 'car'
            });
            thumbnail_id = newUpload.id;
        }

        const carData = {
            brand, name_ko, name_en,
            rent_fee: parseInt(String(rent_fee || '0').replace(/,/g, '')) || 0,
            original_price: parseInt(String(original_price || '0').replace(/,/g, '')) || 0,
            discount_rate: parseFloat(discount_rate) || 0,
            car_type, fuel_type,
            is_fast_ship: is_fast_ship === '1' ? 1 : 0,
            is_visible: is_visible === '1' ? 1 : 0,
            is_hot: is_hot === '1' ? 1 : 0,
            is_top10: is_top10 === '1' ? 1 : 0,
            hashtags: hashtags || '',
            year, capacity, down_payment, period, mileage,
            description: description || ''
        };
        if (thumbnail_id) carData.thumbnail_id = thumbnail_id;

        if (id) await Car.update(carData, { where: { id } });
        else await Car.create(carData);
        res.redirect('/console/cars');
    } catch (err) {
        res.status(500).send('Error saving car');
    }
});

router.post('/cars/:id/delete', authAdmin, async (req, res) => {
    try {
        await Car.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

// 플래너 관리
router.get('/planners', authAdmin, async (req, res) => {
    try {
        const planners = await Planner.findAll({
            include: [{ 
                model: Admin, 
                attributes: ['name', 'role'],
                where: { role: '플래너' },
                required: true 
            }],
            order: [['deliveries', 'DESC'], ['created_at', 'DESC']]
        });

        for (let p of planners) {
            const profileImg = await Upload.findOne({
                where: { ref_type: 'planner', ref_id: p.id },
                order: [['created_at', 'DESC']]
            });
            p.setDataValue('profile_img', profileImg ? `/api/image/${profileImg.id}` : '/images/default_user.png');
            p.setDataValue('name', p.Admin ? p.Admin.name : '이름없음');
        }
        res.render('admin/planners/list', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/planners',
            planners
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/planners/new', authAdmin, (req, res) => {
    res.render('admin/planners/form', {
        layout: 'layout/admin_base',
        adminName: req.admin.name,
        currentPath: '/console/planners',
        planner: null
    });
});

router.get('/planners/edit/:id', authAdmin, async (req, res) => {
    try {
        const planner = await Planner.findByPk(req.params.id, { include: [{ model: Admin }] });
        res.render('admin/planners/form', {
            layout: 'layout/admin_base',
            adminName: req.admin.name,
            currentPath: '/console/planners',
            planner
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.post('/planners/save', authAdmin, upload.single('profile_img'), async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id, username, password, name, position, specialty, satisfaction, deliveries, intro, priority, use_yn } = req.body;
        const currentUseYn = use_yn === 'Y' ? 'Y' : 'N';
        let savedId = id;
        let adminId;

        if (id) {
            const planner = await Planner.findByPk(id);
            if (!planner) throw new Error('플래너를 찾을 수 없습니다.');
            adminId = planner.admin_id;

            const adminUpdateData = { name, use_yn: currentUseYn };
            if (password && password.trim() !== '') adminUpdateData.password = await bcrypt.hash(password, 10);
            if (username) adminUpdateData.username = username;
            await Admin.update(adminUpdateData, { where: { id: adminId }, transaction: t });
            
            await Planner.update({
                position, specialty, satisfaction,
                deliveries: parseInt(String(deliveries || '0').replace(/[^0-9]/g, '')) || 0,
                intro, priority: parseInt(priority) || 0
            }, { where: { id: id }, transaction: t });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newAdmin = await Admin.create({ username, password: hashedPassword, name, role: '플래너', use_yn: currentUseYn }, { transaction: t });
            adminId = newAdmin.id;
            const newPlanner = await Planner.create({ admin_id: adminId, position, specialty, satisfaction, deliveries: parseInt(String(deliveries || '0').replace(/[^0-9]/g, '')) || 0, intro, priority: parseInt(priority) || 0 }, { transaction: t });
            savedId = newPlanner.id;
        }

        if (req.file) {
            // WebP 변환
            const webpBuffer = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
            const fileName = `planners/${Date.now()}.webp`;
            const blob = await put(fileName, webpBuffer, { access: 'public' });
            
            await Upload.create({ 
                original_name: req.file.originalname, 
                saved_name: blob.pathname, 
                file_path: blob.url, 
                file_size: webpBuffer.length, 
                mime_type: 'image/webp', 
                ref_type: 'planner', 
                ref_id: savedId 
            }, { transaction: t });
        }

        await t.commit();
        res.redirect('/console/planners');
    } catch (err) {
        await t.rollback();
        res.status(500).send(`Error saving planner: ${err.message}`);
    }
});

router.post('/planners/:id/delete', authAdmin, async (req, res) => {
    try {
        await Planner.destroy({ where: { id: req.params.id } });
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send('Delete error');
    }
});

module.exports = router;
