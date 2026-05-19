const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const Car = require('../models/Car');
const Upload = require('../models/Upload');

// 베이스 디렉터리 설정
const baseImgDir = path.join(__dirname, '../public/images/01.브랜드별 자동차_이미지');

// 문자열에서 앞의 숫자와 마침표, 불필요한 공백 제거 (예: "01. 현대" -> "현대", "01. G70" -> "G70")
const cleanName = (name) => {
    return name.replace(/^[\d\.]+\s*/, '').trim();
};

// 차량 메타데이터 자동 추론 (간이 매핑)
const getCarMetadata = (brand, name_ko) => {
    const data = {
        name_en: name_ko,
        car_type: '세단',
        fuel_type: '가솔린',
        original_price: 40000000,
        rent_fee: 500000,
        hashtags: '',
        capacity: '5인승',
        year: '2025년형',
        down_payment: '30%',
        period: '48개월',
        mileage: '연 2만km',
        is_fast_ship: Math.random() > 0.5 ? 1 : 0,
        is_hot: Math.random() > 0.8 ? 1 : 0,
        is_top10: Math.random() > 0.8 ? 1 : 0,
    };

    // 1. 차종 추론
    const nameLower = name_ko.toLowerCase();
    if (nameLower.includes('suv') || nameLower.includes('투싼') || nameLower.includes('싼타페') || nameLower.includes('펠리세이드') || nameLower.includes('팰리세이드') || nameLower.includes('스포티지') || nameLower.includes('쏘렌토') || nameLower.includes('모하비') || nameLower.includes('코나') || nameLower.includes('gv') || nameLower.match(/x[1-7]/) || nameLower.includes('gl')) {
        data.car_type = 'SUV';
    } else if (nameLower.includes('캐스퍼') || nameLower.includes('모닝') || nameLower.includes('레이') || nameLower.includes('스파크')) {
        data.car_type = '경차';
    } else if (nameLower.includes('카니발') || nameLower.includes('스타리아')) {
        data.car_type = 'RV';
        data.capacity = '9인승';
    } else if (nameLower.includes('포터') || nameLower.includes('봉고')) {
        data.car_type = '트럭';
        data.capacity = '3인승';
    }

    // 2. 연료 추론
    if (nameLower.includes('하이브리드') || nameLower.includes('hev')) {
        data.fuel_type = '하이브리드';
    } else if (nameLower.includes('일렉트릭') || nameLower.includes('ev') || nameLower.includes('아이오닉') || nameLower.includes('eq') || nameLower.includes('i4') || nameLower.includes('i5') || nameLower.includes('i7') || nameLower.includes('ix') || nameLower.includes('테슬라') || nameLower.includes('폴스타')) {
        data.fuel_type = '전기';
    } else if (nameLower.includes('디젤')) {
        data.fuel_type = '디젤';
    }

    // 3. 가격대 추론 (대략적인 규칙)
    if (brand.includes('제네시스') || brand.includes('벤츠') || brand.includes('BMW') || brand.includes('아우디') || brand.includes('포르쉐')) {
        data.original_price = Math.floor(Math.random() * 50 + 70) * 1000000; // 7000만 ~ 1억 2천만
        if (data.car_type === 'SUV') data.original_price += 10000000;
        data.rent_fee = Math.floor(data.original_price / 100000) * 1100 + 300000; 
    } else if (data.car_type === '경차') {
        data.original_price = Math.floor(Math.random() * 5 + 15) * 1000000; // 1500만 ~ 2000만
        data.rent_fee = 250000;
    } else if (data.car_type === 'SUV') {
        data.original_price = Math.floor(Math.random() * 15 + 35) * 1000000; // 3500만 ~ 5000만
        data.rent_fee = Math.floor(data.original_price / 100000) * 1000 + 150000;
    } else {
        data.original_price = Math.floor(Math.random() * 10 + 30) * 1000000; // 3000만 ~ 4000만
        data.rent_fee = Math.floor(data.original_price / 100000) * 1000 + 100000;
    }

    // 할인율 지정
    data.discount_rate = Math.floor(Math.random() * 10) + 2;

    // 해시태그 생성
    const tags = [];
    if (data.is_fast_ship) tags.push('즉시출고');
    tags.push(data.fuel_type);
    tags.push(data.car_type);
    if (data.is_hot) tags.push('인기차종');
    data.hashtags = tags.join(', ');

    return data;
};

// 디렉터리 스캔 및 DB 저장 메인 함수
const runMigration = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB 연결 성공! 마이그레이션 시작...');

        // 기존 데이터 지우기
        await Car.destroy({ truncate: true, cascade: true });
        // Upload 테이블에서 차량 이미지 관련 레코드 지우기
        await Upload.destroy({ where: { ref_type: 'car' } });
        console.log('✅ 기존 데이터 초기화 완료');

        let totalCars = 0;

        // 국산차량, 수입차량 순회
        const originDirs = fs.readdirSync(baseImgDir);
        for (const origin of originDirs) {
            const originPath = path.join(baseImgDir, origin);
            if (!fs.statSync(originPath).isDirectory()) continue;

            // 브랜드 폴더 순회
            const brandDirs = fs.readdirSync(originPath);
            for (const brandFolder of brandDirs) {
                const brandPath = path.join(originPath, brandFolder);
                if (!fs.statSync(brandPath).isDirectory()) continue;
                
                const brandName = cleanName(brandFolder);

                // 모델(또는 이미지) 순회
                const modelItems = fs.readdirSync(brandPath);
                for (const item of modelItems) {
                    const itemPath = path.join(brandPath, item);
                    const isDir = fs.statSync(itemPath).isDirectory();
                    
                    let modelNameKo = '';
                    let imageFilePath = '';
                    
                    if (isDir) {
                        // 모델이 폴더인 경우 (예: 현대, 제네시스 등)
                        modelNameKo = cleanName(item);
                        const imgFiles = fs.readdirSync(itemPath).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i));
                        if (imgFiles.length > 0) {
                            // 첫 번째 이미지를 대표로 사용
                            imageFilePath = path.join(itemPath, imgFiles[0]);
                        }
                    } else {
                        // 모델이 파일인 경우 (예: BMW 등)
                        if (!item.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;
                        modelNameKo = cleanName(path.parse(item).name);
                        imageFilePath = itemPath;
                    }

                    if (!imageFilePath) {
                        console.log(`⚠️ 이미지 찾을 수 없음 스킵: ${brandName} - ${modelNameKo}`);
                        continue;
                    }

                    // public 이후의 경로 추출 (DB에 저장할 웹 경로)
                    const publicPathIdx = imageFilePath.indexOf('public');
                    let webPath = imageFilePath.substring(publicPathIdx + 'public'.length).replace(/\\/g, '/');

                    const fileStat = fs.statSync(imageFilePath);
                    const mimeType = 'image/' + path.extname(imageFilePath).substring(1).toLowerCase();

                    // 메타데이터 추론
                    const metadata = getCarMetadata(brandName, modelNameKo);

                    // 트랜잭션 처리
                    await sequelize.transaction(async (t) => {
                        // 1. Uploads 레코드 생성
                        const upload = await Upload.create({
                            original_name: path.basename(imageFilePath),
                            saved_name: path.basename(imageFilePath),
                            file_path: webPath,
                            file_size: fileStat.size,
                            mime_type: mimeType,
                            ref_type: 'car'
                        }, { transaction: t });

                        // 2. Cars 레코드 생성
                        const car = await Car.create({
                            brand: brandName,
                            name_ko: modelNameKo,
                            name_en: metadata.name_en,
                            rent_fee: metadata.rent_fee,
                            original_price: metadata.original_price,
                            discount_rate: metadata.discount_rate,
                            car_type: metadata.car_type,
                            fuel_type: metadata.fuel_type,
                            is_fast_ship: metadata.is_fast_ship,
                            is_visible: 1,
                            is_hot: metadata.is_hot,
                            is_top10: metadata.is_top10,
                            thumbnail_id: upload.id,
                            hashtags: metadata.hashtags,
                            year: metadata.year,
                            capacity: metadata.capacity,
                            down_payment: metadata.down_payment,
                            period: metadata.period,
                            mileage: metadata.mileage,
                            description: `${brandName} ${modelNameKo} 최고의 혜택으로 만나보세요.`
                        }, { transaction: t });

                        // 3. Uploads 참조 ID 업데이트
                        upload.ref_id = car.id;
                        await upload.save({ transaction: t });
                        
                        totalCars++;
                        console.log(`✅ 등록 완료: [${brandName}] ${modelNameKo}`);
                    });
                }
            }
        }
        
        console.log(`🎉 마이그레이션 완료! 총 ${totalCars}대의 차량이 성공적으로 등록되었습니다.`);
    } catch (error) {
        console.error('❌ 마이그레이션 에러:', error);
    } finally {
        await sequelize.close();
    }
};

runMigration();
