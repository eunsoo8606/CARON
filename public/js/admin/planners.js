/**
 * Planner Management JS
 */

// 플래너 삭제 처리
function handlePlannerDelete(btn, id) {
    if (!confirm('정말로 이 플래너를 삭제하시겠습니까?')) return;
    
    fetch(`/console/planners/${id}/delete`, { 
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
}

// 필요한 경우 추가적인 이벤트 리스너 정의
document.addEventListener('DOMContentLoaded', () => {
    console.log('Planner Management Loaded');
});
