document.addEventListener('DOMContentLoaded', () => {
    // 1. Swiper Initialize (Slick-like configuration)
    const heroSwiper = new Swiper('.hero-swiper', {
        loop: true,
        speed: 1000,
        parallax: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        keyboard: {
            enabled: true,
        },
    });

    // 2. Vehicle Swiper (Horizontal, Responsive slidesPerView)
    const vehicleSwiper = new Swiper('.vehicle-swiper', {
        slidesPerView: 1.2,
        centeredSlides: true,
        spaceBetween: 15,
        loop: true,
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        speed: 800,
        breakpoints: {
            768: {
                slidesPerView: 2.2,
                spaceBetween: 30
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30
            }
        }
    });

    // 3. GSAP Scroll Animations
    gsap.registerPlugin(ScrollTrigger);

    // Section Fade-In for Swiper Container
    const vehicleSwiperElem = document.querySelector('.vehicle-swiper');
    if (vehicleSwiperElem) {
        gsap.from(vehicleSwiperElem, {
            scrollTrigger: {
                trigger: vehicleSwiperElem,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 1,
            ease: 'power3.out'
        });
    }

    const sectionHeader = document.querySelector('.section-header');
    if (sectionHeader) {
        gsap.from(sectionHeader, {
            scrollTrigger: {
                trigger: sectionHeader,
                start: 'top 90%'
            },
            opacity: 0,
            x: -30,
            duration: 0.8,
            ease: 'power2.out'
        });
    }

    // Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. YouTube Player & Playlist Logic
    const playlistItems = document.querySelectorAll('.playlist-item');
    const mainPlayerArea = document.getElementById('mainPlayer');

    playlistItems.forEach(item => {
        item.addEventListener('click', function() {
            const videoId = this.getAttribute('data-video-id');
            const videoTitle = this.querySelector('.item-title').innerText;

            // Update Active State
            playlistItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Update Main Player Area (Reset to Thumbnail state)
            mainPlayerArea.innerHTML = `
                <div class="main-video-card" data-video-id="${videoId}">
                    <div class="video-thumb" style="background-image: url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')">
                        <div class="play-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                    </div>
                    <div class="main-video-info">
                        <h4 class="main-video-title">${videoTitle}</h4>
                    </div>
                </div>
            `;
            initMainPlayButton();
        });
    });

    function initMainPlayButton() {
        const mainCard = document.querySelector('.main-video-card');
        if (mainCard) {
            mainCard.addEventListener('click', function() {
                const videoId = this.getAttribute('data-video-id');
                this.innerHTML = `
                    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen></iframe>
                `;
            });
        }
    }

    // 초기 로드 시 메인 영상 재생 버튼 활성화
    initMainPlayButton();

    // 5. Elite Planner Sequential Highlight Animation
    const plannerCards = document.querySelectorAll('.planner-card');
    let currentPlannerIndex = 0;
    let plannerInterval;

    function highlightNextPlanner() {
        plannerCards.forEach(card => card.classList.remove('active'));
        plannerCards[currentPlannerIndex].classList.add('active');
        currentPlannerIndex = (currentPlannerIndex + 1) % plannerCards.length;
    }

    if (plannerCards.length > 0) {
        // Initial highlight
        highlightNextPlanner();
        // Set Interval for sequential zoom
        plannerInterval = setInterval(highlightNextPlanner, 3000);

        // Pause on Hover
        plannerCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                clearInterval(plannerInterval);
                plannerCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
            card.addEventListener('mouseleave', () => {
                plannerInterval = setInterval(highlightNextPlanner, 3000);
            });
        });

        // Disabled Scroll Stagger temporarily for reliability
        gsap.set('.planner-card', { opacity: 1, y: 0 });
    }

    // 6. Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    const mobileNav = document.getElementById('mobileNav');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    }

    if (closeMenuBtn && mobileNav) {
        closeMenuBtn.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            document.body.style.overflow = ''; // Restore scroll
        });
    }

    // Close on overlay click
    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // 8. Quick Inquiry Modal Action
    const quickInquiryBtns = document.querySelectorAll('.btn-quick-inquiry, .btn-planner-inquiry');
    const inquiryModal = document.getElementById('inquiryModal');
    const closeInquiryModal = document.getElementById('closeInquiryModal');
    const inquiryModalOverlay = document.querySelector('.modal-overlay');

    if (quickInquiryBtns.length > 0 && inquiryModal) {
        const modalPlannerProfile = document.getElementById('modalPlannerProfile');
        const modalPlannerImg = document.getElementById('modalPlannerImg');
        const modalPlannerName = document.getElementById('modalPlannerName');

        quickInquiryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 데스크탑 전용 사이드바 버튼이나 스티키 바 버튼은 모달을 띄우지 않음 (화면 너비로 체크)
                if (window.innerWidth > 768 && btn.classList.contains('btn-sticky-submit')) {
                    return; // 데스크탑 스티키 바는 폼 제출 로직이 따로 있으므로 무시
                }
                
                e.preventDefault();

                // 플래너 상담 버튼인 경우 프로필 노출
                if (btn.classList.contains('btn-planner-inquiry')) {
                    const imgUrl = btn.getAttribute('data-planner-img');
                    const plannerName = btn.getAttribute('data-planner-name');
                    
                    modalPlannerImg.src = imgUrl;
                    modalPlannerName.innerText = plannerName;
                    modalPlannerProfile.style.display = 'flex';
                } else {
                    // 일반 문의 버튼인 경우 프로필 숨김
                    modalPlannerProfile.style.display = 'none';
                    modalPlannerName.innerText = '';
                }

                inquiryModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    }

    if (closeInquiryModal && inquiryModal) {
        closeInquiryModal.addEventListener('click', () => {
            inquiryModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (inquiryModal) {
        inquiryModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                inquiryModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Close modal on overlay click
    if (inquiryModal) {
        inquiryModal.addEventListener('click', (e) => {
            if (e.target === inquiryModal) {
                inquiryModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // --- 상담 신청 폼 제출 로직 추가 ---
        const modalForm = inquiryModal.querySelector('.modal-form');
        if (modalForm) {
            modalForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // 페이지 새로고침 방지

                const modalPlannerName = document.getElementById('modalPlannerName').innerText;
                const data = {
                    name: modalForm.querySelector('input[name="name"]').value,
                    phone: modalForm.querySelector('input[name="phone"]').value,
                    car_model: modalForm.querySelector('input[name="car_model"]').value,
                    category: '기본',
                    sale_type: '-',
                    contact_method: '전화',
                    memo: modalPlannerName ? `[전담플래너: ${modalPlannerName}]` : ''
                };

                try {
                    const response = await fetch('/api/inquiry', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('상담 신청이 완료되었습니다! 확인 후 연락드리겠습니다.');
                        modalForm.reset();
                        inquiryModal.classList.remove('active');
                        document.body.style.overflow = '';
                    } else {
                        alert('오류가 발생했습니다: ' + result.message);
                    }
                } catch (err) {
                    console.error('Submission Error:', err);
                    alert('서버와 통신 중 오류가 발생했습니다.');
                }
            });
        }
    }

    // 9. Sidebar Form Submission (Desktop)
    const sidebarForm = document.querySelector('.sidebar-form');
    if (sidebarForm) {
        sidebarForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = sidebarForm.querySelector('input[placeholder="성함*"]');
            const carInput = sidebarForm.querySelector('input[placeholder="차종"]');
            const phoneInput = sidebarForm.querySelector('input[placeholder="연락처* ex) 01012341234"]');
            const methodInput = sidebarForm.querySelector('input[name="method"]:checked');

            const data = {
                name: nameInput.value,
                phone: phoneInput.value,
                car_model: carInput.value,
                contact_method: methodInput ? methodInput.value : '전화',
                category: '기본'
            };

            if (!data.name || !data.phone) {
                alert('성함과 연락처는 필수 입력 사항입니다.');
                return;
            }

            try {
                const response = await fetch('/api/inquiry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (result.success) {
                    alert('상담 신청이 완료되었습니다!');
                    sidebarForm.reset();
                } else {
                    alert('오류 발생: ' + result.message);
                }
            } catch (err) {
                console.error('Sidebar Submit Error:', err);
                alert('서버와 통신 중 오류가 발생했습니다.');
            }
        });
    }

    // 10. Refresh Logic
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });
    // Extra safety refresh for dynamic content
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 1000);
});
