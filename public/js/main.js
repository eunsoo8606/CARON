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
    const quickInquiryBtns = document.querySelectorAll('.btn-quick-inquiry');
    const inquiryModal = document.getElementById('inquiryModal');
    const closeInquiryModal = document.getElementById('closeInquiryModal');
    const inquiryModalOverlay = document.querySelector('.modal-overlay');

    if (quickInquiryBtns.length > 0 && inquiryModal) {
        quickInquiryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // 기본 동작 방지
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
    }

    // 9. Refresh Logic
    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });
    // Extra safety refresh for dynamic content
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 1000);
});
