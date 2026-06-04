/**
 * 유튜브 URL에서 비디오 ID를 추출합니다.
 */
function extractYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}

/**
 * 파일 경로를 브라우저가 다이렉트로 접근 가능한 URL로 정제합니다.
 * 외부 URL(http/https)은 그대로 리턴하고, 로컬 경로인 경우 세그먼트별로 안전하게 URI 인코딩 처리를 거칩니다.
 */
function getDirectImageUrl(filePath) {
    if (!filePath) return '/images/default_car.png';
    
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }
    
    const normalizedPath = filePath.replace(/\\/g, '/');
    const encodedPath = normalizedPath.split('/').map(segment => {
        if (!segment) return '';
        return encodeURIComponent(segment);
    }).join('/');
    
    let finalPath = encodedPath;
    if (finalPath.startsWith('public/')) {
        finalPath = '/' + finalPath.substring(7);
    } else if (finalPath.startsWith('/public/')) {
        finalPath = finalPath.substring(7);
    }
    
    if (!finalPath.startsWith('/')) {
        finalPath = '/' + finalPath;
    }
    
    return finalPath;
}

module.exports = {
    extractYoutubeId,
    getDirectImageUrl
};

