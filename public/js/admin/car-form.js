/**
 * 차량 등록/수정 폼 스크립트
 */
document.addEventListener('DOMContentLoaded', () => {
    // 금액 포맷팅 함수 (콤마 추가)
    function formatNumber(n) {
        return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // 모든 금액 입력창에 이벤트 연결
    document.querySelectorAll('.format-price').forEach(input => {
        input.addEventListener('input', function(e) {
            const cursor_pos = e.target.selectionStart;
            const old_length = e.target.value.length;
            
            e.target.value = formatNumber(e.target.value);
            
            // 커서 위치 보정 (콤마 추가로 인한 밀림 방지)
            const new_length = e.target.value.length;
            e.target.setSelectionRange(cursor_pos + (new_length - old_length), cursor_pos + (new_length - old_length));
        });
    });

    // 이미지 미리보기 기능
    const thumbnailInput = document.getElementById('thumbnailInput');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', function(e) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const box = document.getElementById('imagePreviewBox');
                box.innerHTML = `<img src="${event.target.result}" class="preview-img">`;
            };
            if(this.files[0]) reader.readAsDataURL(this.files[0]);
        });
    }

    // 노출 상태 토글 텍스트 변경
    const visibleToggle = document.getElementById('visibleToggle');
    const statusText = document.getElementById('statusText');
    if (visibleToggle && statusText) {
        visibleToggle.addEventListener('change', function() {
            statusText.textContent = this.checked ? '노출 중' : '숨김';
        });
    }
});
