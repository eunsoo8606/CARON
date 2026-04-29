document.addEventListener('DOMContentLoaded', () => {
    // Hero Animation
    if (typeof gsap !== 'undefined') {
        gsap.from('.hero-content > *', {
            duration: 1,
            y: 30,
            opacity: 0,
            stagger: 0.2,
            ease: 'power3.out'
        });
    }
});
