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

    // 6. 더보기 버튼 로직 (Ajax Pagination)
    const btnLoadMore = document.getElementById('btnLoadMore');
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', async () => {
            const currentOffset = document.querySelectorAll('.car-card').length;
            const params = getParams();
            params.set('offset', currentOffset);

            // 로딩 상태 UI 변경
            const originalText = btnLoadMore.innerHTML;
            btnLoadMore.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> 불러오는 중...';
            btnLoadMore.disabled = true;

            try {
                const response = await fetch(`/api/cars/search/more?${params.toString()}`);
                const data = await response.json();

                if (data.success) {
                    const carGrid = document.querySelector('.car-grid');
                    // 가져온 HTML 카드를 그리드 하단에 추가
                    carGrid.insertAdjacentHTML('beforeend', data.html);

                    // 더 이상 가져올 데이터가 없으면 버튼 숨김
                    if (!data.hasMore) {
                        btnLoadMore.parentElement.style.display = 'none';
                    }
                } else {
                    alert('차량을 불러오는데 실패했습니다.');
                }
            } catch (error) {
                console.error('Load More Error:', error);
                alert('통신 오류가 발생했습니다.');
            } finally {
                btnLoadMore.innerHTML = originalText;
                btnLoadMore.disabled = false;
            }
        });
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

    // 8. 차량 카드 클릭 시 문의하기 모달 팝업 연결 (이벤트 위임 적용)
    const carGrid = document.querySelector('.car-grid');
    if (carGrid) {
        carGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.car-card');
            if (!card) return;

            const brand = card.getAttribute('data-brand') || '';
            const name = card.getAttribute('data-name') || '';
            const fullName = brand ? `[${brand}] ${name}` : name;

            const inquiryModal = document.getElementById('inquiryModal');
            if (inquiryModal) {
                const carInput = inquiryModal.querySelector('input[name="car_model"]');
                if (carInput) {
                    carInput.value = fullName;
                }
                
                // 모달 표시 및 배경 스크롤 방지
                inquiryModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
});
