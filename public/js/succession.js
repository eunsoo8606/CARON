document.addEventListener('DOMContentLoaded', () => {
    // GSAP Animations
    gsap.from('.page-title', {
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.intro-card', {
        duration: 1.2,
        y: 60,
        opacity: 0,
        ease: 'power4.out',
        delay: 0.2
    });

    gsap.from('.intro-content > *', {
        duration: 0.8,
        x: -30,
        opacity: 0,
        stagger: 0.2,
        ease: 'power2.out',
        delay: 0.5
    });

    gsap.from('.intro-image', {
        duration: 1.5,
        x: 50,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.8
    });

    // Advantages Section Animations
    gsap.from('.section-header-alt', {
        scrollTrigger: {
            trigger: '.succession-advantages',
            start: 'top 80%'
        },
        duration: 1,
        y: 30,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.advantage-card.giver', {
        scrollTrigger: {
            trigger: '.advantages-grid',
            start: 'top 80%'
        },
        duration: 1.2,
        x: -50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.advantage-card.receiver', {
        scrollTrigger: {
            trigger: '.advantages-grid',
            start: 'top 80%'
        },
        duration: 1.2,
        x: 50,
        opacity: 0,
        ease: 'power3.out',
        delay: 0.2
    });

    // Sticky Bar Footer Avoidance (PC Only)
    ScrollTrigger.matchMedia({
        "(min-width: 769px)": function() {
            const stickyBar = document.querySelector('.sticky-inquiry-bar');
            const footer = document.querySelector('footer');
            
            if (stickyBar && footer) {
                ScrollTrigger.create({
                    trigger: footer,
                    start: "top bottom",
                    onUpdate: (self) => {
                        const footerVisibleHeight = Math.max(0, window.innerHeight - footer.getBoundingClientRect().top);
                        if (footerVisibleHeight > 0) {
                            gsap.set(stickyBar, { y: -footerVisibleHeight + 10 });
                        } else {
                            gsap.set(stickyBar, { y: 0 });
                        }
                    }
                });
            }
        }
    });

    // 2. Sticky Bar Form Submission
    const stickyForm = document.querySelector('.sticky-form');
    if (stickyForm) {
        // 엔터키 제출 방지 및 버튼 클릭 제어
        stickyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(stickyForm);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                car_model: formData.get('car_model'),
                category: formData.get('category'),
                sale_type: formData.get('type'), // 서버의 sale_type 필드와 매칭
                contact_method: '전화' // 기본값
            };

            // 유효성 검사 (간단히)
            if (!data.name || !data.phone) {
                alert('성함과 연락처는 필수 입력 사항입니다.');
                return;
            }

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
                    alert('상담 신청이 완료되었습니다! 확인 후 신속히 연락드리겠습니다.');
                    stickyForm.reset();
                } else {
                    alert('오류가 발생했습니다: ' + result.message);
                }
            } catch (err) {
                console.error('Submission Error:', err);
                alert('서버와 통신 중 오류가 발생했습니다.');
            }
        });

        // 제출 버튼 클릭 시 폼 제출 트리거 (버튼이 type="button"일 경우 대비)
        const submitBtn = stickyForm.querySelector('.btn-sticky-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                stickyForm.requestSubmit();
            });
        }
    }
});
