/**
 * 유튜브 URL에서 비디오 ID를 추출합니다.
 */
function extractYoutubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length == 11) ? match[2] : null;
}

module.exports = {
    extractYoutubeId
};
