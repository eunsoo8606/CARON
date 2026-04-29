document.addEventListener('DOMContentLoaded', () => {
    const brandItems = document.querySelectorAll('.brand-item');
    const filterSelects = document.querySelectorAll('.filter-group select');
    const searchInput = document.querySelector('.filter-search-input input');
    const searchBtn = document.querySelector('.btn-filter-search');
    const resetBtn = document.querySelector('.btn-filter-reset');
    const sortButtons = document.querySelectorAll('.results-sort button');

    // 현재 URL의 쿼리 파라미터 가져오기
    const getParams = () => new URLSearchParams(window.location.search);

    // 검색 실행 함수
    const executeSearch = (newParams) => {
        const params = getParams();
        for (const [key, value] of Object.entries(newParams)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        window.location.href = `/car/search?${params.toString()}`;
    };

    // 1. 브랜드 클릭
    brandItems.forEach(item => {
        item.addEventListener('click', () => {
            const brandName = item.querySelector('span').innerText;
            executeSearch({ brand: brandName });
        });
    });

    // 2. 필터 선택 (차종, 가격, 연료 등)
    filterSelects.forEach((select, index) => {
        // 차종, 가격대, 연료, 인승 순서에 맞춰 쿼리 매핑
        const keys = ['car_type', 'price_range', 'fuel_type', 'capacity'];
        select.addEventListener('change', () => {
            const key = keys[index];
            executeSearch({ [key]: select.value });
        });
    });

    // 3. 검색어 입력
    const handleKeywordSearch = () => {
        executeSearch({ q: searchInput.value });
    };

    searchBtn?.addEventListener('click', handleKeywordSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleKeywordSearch();
    });

    // 4. 정렬 버튼 클릭
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortValue = btn.getAttribute('data-sort');
            executeSearch({ sort: sortValue });
        });
    });

    // 5. 초기화
    resetBtn?.addEventListener('click', () => {
        window.location.href = '/car/search';
    });

    // 5. 현재 필터 상태 UI 반영
    const params = getParams();
    if (params.get('brand')) {
        brandItems.forEach(item => {
            if (item.querySelector('span').innerText === params.get('brand')) {
                item.style.background = '#f0f4f8';
                item.style.boxShadow = 'inset 0 0 0 2px var(--primary)';
            }
        });
    }

    // 6. 무한 스크롤 제어 (데이터가 적을 때는 로더 숨김)
    const sentinel = document.getElementById('scrollSentinel');
    if (sentinel) {
        if (document.querySelectorAll('.car-card').length < 12) {
            sentinel.style.display = 'none';
        }
    }

    // 7. 검색 결과로 자동 스크롤 (쿼리가 있을 때)
    if (params.toString()) {
        const resultsSection = document.querySelector('.search-results');
        if (resultsSection) {
            setTimeout(() => {
                const headerHeight = document.querySelector('header')?.offsetHeight || 100;
                const elementPosition = resultsSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 100); // 페이지 렌더링 후 약간의 지연 후 실행
        }
    }
});
