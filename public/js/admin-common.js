/**
 * 관리자 공통 스크립트
 */

// 차량 삭제 처리
window.handleCarDelete = function(btn, id) {
    if (!confirm('정말로 이 차량을 삭제하시겠습니까?')) return;
    
    fetch(`/console/cars/${id}/delete`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if(res.ok) {
            alert('삭제되었습니다.');
            location.reload();
        } else {
            alert('삭제 실패');
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('오류가 발생했습니다.');
    });
};
