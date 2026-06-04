document.addEventListener('DOMContentLoaded', () => {
    const brandItems = document.querySelectorAll('.brand-item');
    const filterSelects = document.querySelectorAll('.filter-group select');
    const searchInput = document.querySelector('.filter-search-input input');
    const searchBtn = document.querySelector('.btn-filter-search');
    const resetBtn = document.querySelector('.btn-filter-reset');
    const sortButtons = document.querySelectorAll('.results-sort button');
    const carGrid = document.querySelector('.car-grid');
    const totalCountSpan = document.querySelector('.results-info span');
    const btnLoadMore = document.getElementById('btnLoadMore');

    // 현재 URL의 쿼리 파라미터 가져오기
    const getParams = () => new URLSearchParams(window.location.search);

    // URL 파라미터 기반으로 UI 상태를 동기화하는 함수
    const syncFiltersFromUrl = () => {
        const params = getParams();

        // 1. 브랜드 버튼 활성화 상태 동기화
        const brandParam = params.get('brand');
        brandItems.forEach(item => {
            const brandSpan = item.querySelector('span');
            if (brandSpan && brandSpan.innerText === brandParam) {
                item.style.background = '#f0f4f8';
                item.style.boxShadow = 'inset 0 0 0 2px var(--primary)';
            } else {
                item.style.background = '';
                item.style.boxShadow = '';
            }
        });

        // 2. 셀렉트 박스 필터 동기화
        const keys = ['car_type', 'price_range', 'fuel_type', 'capacity'];
        filterSelects.forEach((select, index) => {
            const key = keys[index];
            select.value = params.get(key) || '';
        });

        // 3. 검색어 인풋 동기화
        if (searchInput) {
            searchInput.value = params.get('q') || '';
        }

        // 4. 정렬 버튼 활성화 상태 동기화
        const sortParam = params.get('sort') || 'latest';
        sortButtons.forEach(btn => {
            const sortVal = btn.getAttribute('data-sort') || 'latest';
            if (sortVal === sortParam) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // 결과 영역으로 스크롤 이동하는 함수
    const scrollToResults = () => {
        const resultsSection = document.querySelector('.search-results');
        if (resultsSection) {
            const headerHeight = document.querySelector('header')?.offsetHeight || 100;
            const elementPosition = resultsSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    // 비동기 검색 및 결과 렌더링 함수
    const fetchSearchResults = async (params, shouldScroll = false) => {
        // 검색 실행 시 offset은 0부터 조회해야 함
        const searchParams = new URLSearchParams(params);
        searchParams.set('offset', '0');

        // 로딩 스피너 혹은 반투명 효과 처리
        if (carGrid) {
            carGrid.style.opacity = '0.5';
        }

        try {
            const response = await fetch(`/api/cars/search/more?${searchParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                if (carGrid) {
                    if (data.html && data.html.trim()) {
                        carGrid.innerHTML = data.html;
                    } else {
                        // 결과가 없을 때의 Fallback 템플릿
                        carGrid.innerHTML = `
                            <div class="no-results" style="grid-column: 1/-1; padding: 100px 0; text-align: center; color: #888;">
                                <p>검색 조건에 맞는 차량이 없습니다.</p>
                            </div>
                        `;
                    }
                    carGrid.style.opacity = '1';
                }

                // 총 검색 건수 업데이트
                if (totalCountSpan) {
                    totalCountSpan.innerText = data.totalCount !== undefined ? data.totalCount.toLocaleString() : '0';
                }

                // 더보기 버튼 활성화/비활성화 처리
                if (btnLoadMore) {
                    const loadMoreContainer = btnLoadMore.parentElement;
                    if (data.hasMore) {
                        if (loadMoreContainer) loadMoreContainer.style.display = 'block';
                        btnLoadMore.disabled = false;
                    } else {
                        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
                    }
                }

                // 필요 시 결과 영역으로 스크롤
                if (shouldScroll) {
                    scrollToResults();
                }
            } else {
                alert('차량을 불러오는데 실패했습니다.');
                if (carGrid) carGrid.style.opacity = '1';
            }
        } catch (error) {
            console.error('Fetch Search Results Error:', error);
            alert('통신 오류가 발생했습니다.');
            if (carGrid) carGrid.style.opacity = '1';
        }
    };

    // 검색 실행 함수 (History API 갱신 및 비동기 요청 호출)
    const executeSearch = (newParams) => {
        const params = getParams();
        for (const [key, value] of Object.entries(newParams)) {
            if (value) params.set(key, value);
            else params.delete(key);
        }
        
        // 브라우저 주소창 URL만 조용히 갱신 (페이지 리로드 없음)
        history.pushState(null, '', `/car/search?${params.toString()}`);
        
        // UI 요소를 최신 URL 파라미터 상태와 일치시킴
        syncFiltersFromUrl();
        
        // 서버에서 비동기로 검색 데이터를 받아와 바인딩하고 스크롤 실행
        fetchSearchResults(params, true);
    };

    // 1. 브랜드 클릭 이벤트
    brandItems.forEach(item => {
        item.addEventListener('click', () => {
            const brandName = item.querySelector('span').innerText;
            const params = getParams();
            
            // 토글 처리 (이미 선택된 브랜드를 다시 클릭하면 필터 해제)
            if (params.get('brand') === brandName) {
                executeSearch({ brand: '' });
            } else {
                executeSearch({ brand: brandName });
            }
        });
    });

    // 2. 필터 선택 이벤트 (차종, 가격, 연료, 인승 등)
    filterSelects.forEach((select, index) => {
        const keys = ['car_type', 'price_range', 'fuel_type', 'capacity'];
        select.addEventListener('change', () => {
            const key = keys[index];
            executeSearch({ [key]: select.value });
        });
    });

    // 3. 검색어 입력 이벤트
    const handleKeywordSearch = () => {
        executeSearch({ q: searchInput.value });
    };

    searchBtn?.addEventListener('click', handleKeywordSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleKeywordSearch();
    });

    // 4. 정렬 버튼 클릭 이벤트
    sortButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortValue = btn.getAttribute('data-sort');
            executeSearch({ sort: sortValue });
        });
    });

    // 5. 초기화 이벤트
    resetBtn?.addEventListener('click', () => {
        history.pushState(null, '', '/car/search');
        syncFiltersFromUrl();
        fetchSearchResults(getParams());
    });

    // 6. 더보기 버튼 클릭 이벤트 (Ajax 페이징 유지)
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', async () => {
            const currentOffset = document.querySelectorAll('.car-grid .car-card').length;
            const params = getParams();
            params.set('offset', currentOffset);

            const originalText = btnLoadMore.innerHTML;
            btnLoadMore.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i> 불러오는 중...';
            btnLoadMore.disabled = true;

            try {
                const response = await fetch(`/api/cars/search/more?${params.toString()}`);
                const data = await response.json();

                if (data.success) {
                    if (carGrid) {
                        carGrid.insertAdjacentHTML('beforeend', data.html);
                    }

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

    // 7. 브라우저 뒤로가기/앞으로가기 (History Popstate) 연동
    window.addEventListener('popstate', () => {
        syncFiltersFromUrl();
        fetchSearchResults(getParams(), false);
    });

    // 8. 초기 로드 시 필터 동기화 및 필요시 스크롤
    syncFiltersFromUrl();
    if (getParams().toString()) {
        setTimeout(scrollToResults, 150);
    }

    // 9. 차량 카드 클릭 시 문의하기 모달 팝업 연결 (이벤트 위임 적용)
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
                
                inquiryModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
});
