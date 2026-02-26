/**
 * Scroll Animations & Mouse Tracking for Fenómeno Page
 * Makes all elements animate on scroll and rectangles follow mouse
 */

// ============ SCROLL ANIMATIONS ============

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add animation classes to CSS dynamically
function injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Scroll Animation Base Styles */
        [data-animate] {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate].animate-in {
            opacity: 1;
            transform: translateY(0px);
        }

        /* Staggered animation for child elements */
        [data-animate-stagger] > * {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate-stagger].animate-in > * {
            opacity: 1;
            transform: translateY(0px);
        }

        [data-animate-stagger].animate-in > *:nth-child(1) { transition-delay: 0.1s; }
        [data-animate-stagger].animate-in > *:nth-child(2) { transition-delay: 0.2s; }
        [data-animate-stagger].animate-in > *:nth-child(3) { transition-delay: 0.3s; }
        [data-animate-stagger].animate-in > *:nth-child(4) { transition-delay: 0.4s; }
        [data-animate-stagger].animate-in > *:nth-child(5) { transition-delay: 0.5s; }
        [data-animate-stagger].animate-in > *:nth-child(n+6) { transition-delay: 0.6s; }

        /* Fade in only */
        [data-animate-fade] {
            opacity: 0;
            transition: opacity 0.8s ease-out;
        }

        [data-animate-fade].animate-in {
            opacity: 1;
        }

        /* Scale + fade */
        [data-animate-scale] {
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate-scale].animate-in {
            opacity: 1;
            transform: scale(1);
        }

        /* Rotate + fade */
        [data-animate-rotate] {
            opacity: 0;
            transform: rotate(-5deg);
            transition: opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate-rotate].animate-in {
            opacity: 1;
            transform: rotate(0deg);
        }

        /* Slide from left */
        [data-animate-left] {
            opacity: 0;
            transform: translateX(-50px);
            transition: opacity 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate-left].animate-in {
            opacity: 1;
            transform: translateX(0px);
        }

        /* Slide from right */
        [data-animate-right] {
            opacity: 0;
            transform: translateX(50px);
            transition: opacity 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        [data-animate-right].animate-in {
            opacity: 1;
            transform: translateX(0px);
        }

        /* Mouse tracking rectangles */
        .rectangle-1, .rectangle-2 {
            transition: transform 0.05s ease-out !important;
            will-change: transform;
        }

        /* Overlay animations */
        .overlay-backdrop {
            opacity: 0;
            transition: opacity 0.4s ease-out !important;
            pointer-events: none;
        }

        .overlay-backdrop.active {
            opacity: 1;
            pointer-events: auto;
        }

        .folder-card {
            opacity: 0;
            transform: scale(0.8) translateY(-30px);
            transition: opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                        transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }

        .overlay-backdrop.active .folder-card {
            opacity: 1;
            transform: scale(1) translateY(0px);
        }

        /* Overlay content animations */
        .overlay-backdrop .folder-header,
        .overlay-backdrop .folder-body,
        .overlay-backdrop .folder-images-row,
        .overlay-backdrop .close-btn {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out !important;
        }

        .overlay-backdrop.active .folder-header {
            opacity: 1;
            transform: translateY(0px);
            transition-delay: 0.15s;
        }

        .overlay-backdrop.active .folder-body {
            opacity: 1;
            transform: translateY(0px);
            transition-delay: 0.25s;
        }

        .overlay-backdrop.active .folder-images-row {
            opacity: 1;
            transform: translateY(0px);
            transition-delay: 0.35s;
        }

        .overlay-backdrop.active .close-btn {
            opacity: 1;
            transform: translateY(0px);
            transition-delay: 0.1s;
        }

        /* Animate images inside overlay */
        .folder-img {
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.5s ease-out, transform 0.5s ease-out !important;
        }

        .overlay-backdrop.active .folder-img {
            opacity: 1;
            transform: scale(1);
        }

        .overlay-backdrop.active .folder-img:nth-child(1) { transition-delay: 0.45s; }
        .overlay-backdrop.active .folder-img:nth-child(2) { transition-delay: 0.55s; }
    `;
    document.head.appendChild(style);
}

// Initialize all elements for animation
function initializeAnimations() {
    // Get all elements that should be animated
    const allElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, section, article, .red-gradient-box, .dashed-box, .gray-box, .white-text-box');
    
    allElements.forEach((el, index) => {
        // Skip overlay and certain elements
        if (el.closest('#infoOverlay') || el.closest('.fixed-header-container')) return;
        
        // Skip elements that are too small or invisible
        if (el.offsetHeight === 0 && el.offsetWidth === 0) return;
        
        // Add data attributes for animation if not already set
        if (!el.hasAttribute('data-animate') && 
            !el.hasAttribute('data-animate-fade') && 
            !el.hasAttribute('data-animate-scale') &&
            !el.hasAttribute('data-animate-rotate') &&
            !el.hasAttribute('data-animate-left') &&
            !el.hasAttribute('data-animate-right')) {
            
            // Determine animation type based on element
            const tagName = el.tagName.toLowerCase();
            const classes = el.className;
            
            if (classes.includes('rectangle') || classes.includes('box')) {
                // Boxes get scale animation
                el.setAttribute('data-animate-scale', '');
            } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
                // Headings slide from left
                el.setAttribute('data-animate-left', '');
            } else if (el.textContent.length > 200 || tagName === 'p') {
                // Long text fades in
                el.setAttribute('data-animate-fade', '');
            } else {
                // Everything else gets default animation
                el.setAttribute('data-animate', '');
            }
        }
    });

    // Observe all animated elements
    document.querySelectorAll('[data-animate], [data-animate-fade], [data-animate-scale], [data-animate-rotate], [data-animate-left], [data-animate-right]').forEach(el => {
        observer.observe(el);
    });
}

// ============ MOUSE TRACKING FOR RECTANGLES ============

class MouseTracker {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.intensity = 0.02; // How much rectangles move (0.01 - 0.1)
        
        this.rectangles = document.querySelectorAll('.rectangle-1, .rectangle-2');
        
        if (this.rectangles.length === 0) return;
        
        // Store original positions
        this.originalPositions = new Map();
        this.rectangles.forEach(rect => {
            this.originalPositions.set(rect, {
                x: rect.offsetLeft,
                y: rect.offsetTop
            });
        });
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onMouseMove(event) {
        this.targetX = event.clientX;
        this.targetY = event.clientY;
        
        // Smooth lerp to target
        this.mouseX += (this.targetX - this.mouseX) * 0.1;
        this.mouseY += (this.targetY - this.mouseY) * 0.1;
        
        this.updateRectanglePositions();
    }

    updateRectanglePositions() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate deviation from center
        const deviationX = (this.mouseX - centerX) * this.intensity;
        const deviationY = (this.mouseY - centerY) * this.intensity;
        
        this.rectangles.forEach((rect, index) => {
            // Alternate direction for each rectangle
            const direction = index % 2 === 0 ? 1 : -1;
            
            // Apply transform
            rect.style.transform = `translate(${deviationX * direction}px, ${deviationY * direction}px) rotate(${(deviationX * 0.05)}deg)`;
        });
    }
}

// ============ PARALLAX EFFECT FOR BIG LETTERS ============

class ParallaxEffect {
    constructor() {
        this.letters = document.querySelectorAll('.big-letter');
        if (this.letters.length === 0) return;
        
        this.setupEventListener();
    }

    setupEventListener() {
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onMouseMove(event) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const percentX = (event.clientX - centerX) / centerX; // -1 to 1
        const percentY = (event.clientY - centerY) / centerY; // -1 to 1
        
        this.letters.forEach((letter, index) => {
            const intensity = (index + 1) * 15; // Increase parallax for each letter
            const x = percentX * intensity;
            const y = percentY * intensity;
            
            letter.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
}

// ============ SCROLL PARALLAX ============

class ScrollParallax {
    constructor() {
        this.elements = document.querySelectorAll('[data-parallax]');
        this.setupEventListener();
    }

    setupEventListener() {
        window.addEventListener('scroll', () => this.onScroll());
    }

    onScroll() {
        const scrollY = window.scrollY;
        
        this.elements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
            const offset = scrollY * speed;
            
            el.style.transform = `translateY(${offset}px)`;
        });
    }
}

// ============ INTERACTIVE BOXES - HOVER GLOW EFFECT ============

function addHoverEffects() {
    const boxes = document.querySelectorAll('.red-gradient-box, .dashed-box, .gray-box, .rectangle-1, .rectangle-2');
    
    boxes.forEach(box => {
        // Skip if already has hover event
        if (box.dataset.hasHoverEffect) return;
        box.dataset.hasHoverEffect = 'true';
        
        box.addEventListener('mouseenter', function() {
            this.style.filter = 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))';
            this.style.transition = 'filter 0.3s ease';
        });
        
        box.addEventListener('mouseleave', function() {
            this.style.filter = 'drop-shadow(0 0 0px rgba(0, 0, 0, 0))';
        });
    });
}

// ============ OVERLAY ANIMATIONS ============

class OverlayAnimator {
    constructor() {
        this.overlay = document.getElementById('infoOverlay');
        if (!this.overlay) return;
        
        this.setupOverlayObserver();
    }

    setupOverlayObserver() {
        // Override the openOverlay function to add animation class
        const originalOpenOverlay = window.openOverlay;
        
        window.openOverlay = (title, descriptionHtml, mapUrl, photoUrls) => {
            // Call original function
            originalOpenOverlay(title, descriptionHtml, mapUrl, photoUrls);
            
            // Add active class for animations
            this.overlay.style.display = 'flex';
            // Force reflow to restart animation
            this.overlay.offsetHeight;
            this.overlay.classList.add('active');
        };

        // Override the closeOverlay function
        const originalCloseOverlay = window.closeOverlay;
        
        window.closeOverlay = () => {
            // Remove active class for fade out animation
            this.overlay.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                this.overlay.style.display = 'none';
            }, 400);
        };

        // Also handle closing when clicking the backdrop
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                window.closeOverlay();
            }
        });
    }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    // Inject animation styles
    injectAnimationStyles();
    
    // Wait a moment for DOM to be fully ready
    setTimeout(() => {
        // Initialize scroll animations
        initializeAnimations();
        
        // Initialize mouse tracking
        new MouseTracker();
        
        // Initialize parallax for big letters
        new ParallaxEffect();
        
        // Initialize scroll parallax
        new ScrollParallax();
        
        // Add hover effects
        addHoverEffects();
        
        // Initialize overlay animations
        new OverlayAnimator();
        
        // Re-initialize when page might be resized or elements added
        window.addEventListener('resize', () => {
            initializeAnimations();
        });
    }, 100);
});

// Handle dynamically added elements
const mutationObserver = new MutationObserver(() => {
    setTimeout(() => {
        document.querySelectorAll('[data-animate], [data-animate-fade], [data-animate-scale], [data-animate-rotate], [data-animate-left], [data-animate-right]').forEach(el => {
            if (!el.classList.contains('animate-in')) {
                observer.observe(el);
            }
        });
    }, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
});
