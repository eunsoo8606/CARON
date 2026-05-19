const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { sequelize } = require('../config/database');
const Upload = require('../models/Upload');
const { Op } = require('sequelize');

const runConversion = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB 연결 성공! WebP 변환 작업을 시작합니다...');

        // 로컬에 저장된 이미지(http로 시작하지 않는 것) 중에서 확장자가 png, jpg, jpeg인 것만 검색
        const uploads = await Upload.findAll({
            where: {
                file_path: {
                    [Op.notLike]: 'http%',
                    [Op.regexp]: '\\.(png|jpg|jpeg|PNG|JPG|JPEG)$'
                }
            }
        });

        console.log(`🔍 총 ${uploads.length}개의 변환 대상 이미지를 찾았습니다.`);
        let successCount = 0;
        let failCount = 0;

        for (const upload of uploads) {
            try {
                // file_path는 보통 '/images/...' 형식으로 시작하므로, public 디렉터리와 결합
                const absolutePath = path.join(__dirname, '../public', upload.file_path);
                
                if (!fs.existsSync(absolutePath)) {
                    console.log(`⚠️ 파일을 찾을 수 없습니다 (스킵): ${absolutePath}`);
                    failCount++;
                    continue;
                }

                // 새로운 WebP 경로 생성
                const parsedPath = path.parse(absolutePath);
                const webpFileName = parsedPath.name + '.webp';
                const newAbsolutePath = path.join(parsedPath.dir, webpFileName);

                // sharp를 이용해 WebP 변환 및 저장 (품질 80%)
                await sharp(absolutePath)
                    .webp({ quality: 80 })
                    .toFile(newAbsolutePath);

                // 변환된 파일의 크기 확인
                const newStat = fs.statSync(newAbsolutePath);

                // 기존 파일 삭제 (사용자 요청에 따라 원본 삭제)
                fs.unlinkSync(absolutePath);

                // DB의 file_path 및 기타 메타데이터 업데이트
                // '/images/01.브랜드별.../캐스퍼.png' -> '/images/01.브랜드별.../캐스퍼.webp'
                const oldFilePathParsed = path.parse(upload.file_path);
                const newWebpFilePath = path.posix.join(oldFilePathParsed.dir, webpFileName);

                upload.saved_name = webpFileName;
                upload.file_path = newWebpFilePath;
                upload.file_size = newStat.size;
                upload.mime_type = 'image/webp';
                await upload.save();

                successCount++;
                console.log(`✅ 변환 완료: ${upload.original_name} -> ${webpFileName} (용량 최적화 적용)`);
            } catch (err) {
                console.error(`❌ 변환 실패 (${upload.file_path}):`, err.message);
                failCount++;
            }
        }

        console.log(`🎉 WebP 최적화 작업이 모두 완료되었습니다!`);
        console.log(`📈 성공: ${successCount}건 | ⚠️ 실패(누락 등): ${failCount}건`);
    } catch (error) {
        console.error('❌ 스크립트 실행 에러:', error);
    } finally {
        await sequelize.close();
    }
};

runConversion();
