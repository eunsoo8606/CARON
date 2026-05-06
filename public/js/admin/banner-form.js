/**
 * 배너 등록/수정 폼 스크립트
 */
document.addEventListener('DOMContentLoaded', () => {
    const setupPreview = (input, previewBox) => {
        if (!input || !previewBox) return;

        input.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const placeholder = previewBox.querySelector('.upload-placeholder');
                if (placeholder) placeholder.style.display = 'none';

                let img = previewBox.querySelector('.preview-img');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'preview-img';
                    img.style.objectFit = 'cover';
                    previewBox.prepend(img);
                }
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    setupPreview(document.getElementById('imageInput'), document.getElementById('imagePreviewBox'));
    setupPreview(document.getElementById('mobileImageInput'), document.getElementById('mobilePreviewBox'));

    // 노출 상태 토글 텍스트 변경
    const visibleToggle = document.getElementById('visibleToggle');
    const statusText = document.getElementById('statusText');
    if (visibleToggle && statusText) {
        visibleToggle.addEventListener('change', function() {
            statusText.textContent = this.checked ? '노출 중' : '숨김';
        });
    }
});
