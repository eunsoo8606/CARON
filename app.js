const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const Admin = require('./models/Admin');
const Planner = require('./models/Planner');
const Upload = require('./models/Upload');

const app = express();
const PORT = process.env.PORT || 3000;

// DB 연결
connectDB().then(async () => {
    try {
        // DB 테이블 자동 동기화 (새 컬럼 추가 반영)
        await sequelize.sync();
        
        const Car = require('./models/Car');
        const top10Cars = await Car.findAll({
            where: { is_top10: 1 },
            order: [['created_at', 'DESC']]
        });
        if (top10Cars.length > 10) {
            const excessCars = top10Cars.slice(10);
            const excessIds = excessCars.map(c => c.id);
            await Car.update({ is_top10: 0 }, {
                where: { id: excessIds }
            });
            console.log(`[Top10 Sync] 초과된 ${excessIds.length}개 차량의 TOP 10 태그를 해제했습니다. (대상 ID: ${excessIds.join(', ')})`);
        }

        // 수입차량(is_domestic: 0) 일괄 상담문의전용(is_inquiry_only: 1) 업데이트
        const [importUpdatedCount] = await Car.update({ is_inquiry_only: 1 }, {
            where: { is_domestic: 0, is_inquiry_only: 0 }
        });
        if (importUpdatedCount > 0) {
            console.log(`[Import Cars Sync] 총 ${importUpdatedCount}개의 수입차량을 상담문의전용으로 변경했습니다.`);
        }
    } catch (err) {
        console.error('[Startup Sync] 에러 발생:', err);
    }
});

// 모델 관계 정의
const Car = require('./models/Car');
Car.belongsTo(Upload, { foreignKey: 'thumbnail_id', as: 'Thumbnail' });

// 기본 미들웨어
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 레이아웃 설정
app.use(expressLayouts);
app.set('layout', 'layout/base');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// 전역 변수 설정 미들웨어 (모든 템플릿에서 사용 가능)
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
                
                // 플래너인 경우 프로필 이미지 추가 조회
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
            // 토큰 만료 등 오류 시 무시
        }
    }
    next();
});

// 라우터 연결
const mainRouter = require('./routes/main');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

app.use('/', mainRouter);
app.use('/console', adminRouter);
app.use('/api', apiRouter);

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
