document.addEventListener("DOMContentLoaded", () => {

    /* ═══════════════════════════════
       GALLERY DATA & METADATA
    ═══════════════════════════════ */

    // Gallery metadata for lightbox info
    const galleryMetadata = {};

    /* ═══════════════════════════════
       AUTO GALLERY FROM JSON
    ═══════════════════════════════ */

    async function loadGalleryFromJSON() {
        try {
            const res = await fetch("images.json");
            const images = await res.json();

            // Store metadata for lightbox
            images.forEach(img => {
                const key = `Images/${img.src}`;
                galleryMetadata[key] = {
                    category: formatCategoryName(img.category),
                    title: img.title || 'Untitled',
                    client: img.client || '',
                    description: img.description || 'Professional photography and visual storytelling.'
                };
            });

            function shuffle(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
            }

            const savedOrder = localStorage.getItem("galleryOrder");

            if (savedOrder) {
                const order = JSON.parse(savedOrder);
                images.sort((a, b) => order.indexOf(a.src) - order.indexOf(b.src));
            } else {
                shuffle(images);
                const order = images.map(img => img.src);
                localStorage.setItem("galleryOrder", JSON.stringify(order));
            }

            const gallery = document.querySelector(".gallery");
            if (!gallery) return;

            gallery.innerHTML = "";

            images.forEach(img => {
                const div = document.createElement("div");
                div.className = "gcell";
                div.setAttribute("data-c", img.category);

                if (img.project) {
                    div.setAttribute("data-project", img.project);
                }

                div.innerHTML = `
                    <img src="Images/${img.src}" loading="lazy" alt="${img.title || ''}">
                    ${img.client ? `
                        <div class="gcell-over">
                            <div class="gcell-project-info">
                                <div class="gcell-client">${img.client}</div>
                                <div class="gcell-title">${img.title}</div>
                            </div>
                        </div>
                    ` : ''}
                `;

                div.onclick = () => {
                    if (img.project) {
                        openCase(img.project);
                    } else {
                        openLb(div);
                    }
                };

                gallery.appendChild(div);
            });

            // Initialize filters after gallery is built
            setTimeout(() => {
                initPortfolioFilters();
            }, 100);

        } catch (error) {
            console.error("Error loading gallery:", error);
        }
    }

    function formatCategoryName(category) {
        const names = {
            'commercial': 'Commercial',
            'fashion': 'Fashion',
            'real-state': 'Real Estate',
            'brand-content': 'Brand Content',
            'weddings-events': 'Weddings & Events',
            'portraits': 'Portraits',
            'creative': 'Creative'
        };
        return names[category] || category;
    }

    function getGalleryItems() {
        return Array.from(document.querySelectorAll('.gcell'));
    }

    /* ═══════════════════════════════
       HERO SLIDESHOW
    ═══════════════════════════════ */

    let slide = 0;
    const imgs = document.querySelectorAll('.hero-img');
    const dots = document.querySelectorAll('.hdot');

    window.setSlide = function (n) {
        if (!imgs.length) return;

        imgs[slide].classList.remove('show');
        dots[slide].classList.remove('on');
        slide = n;
        imgs[slide].classList.add('show');
        dots[slide].classList.add('on');
    };

    if (imgs.length > 0) {
        setInterval(() => {
            setSlide((slide + 1) % imgs.length);
        }, 5000);
    }

    /* ═══════════════════════════════
       NAVIGATION - FIXED FOR MOBILE
    ═══════════════════════════════ */

    let cur = 'home';
    let isTransitioning = false;

    window.go = function (page, addToHistory = true) {
        // Prevent rapid navigation
        if (isTransitioning || page === cur) return;

        isTransitioning = true;
        closeLb();

        const prevPage = document.getElementById('pg-' + cur);
        const nextPage = document.getElementById('pg-' + page);

        if (!nextPage) {
            isTransitioning = false;
            return;
        }

        // Scroll new page to top BEFORE showing
        nextPage.scrollTop = 0;

        // Handle previous page exit
        if (prevPage) {
            prevPage.classList.remove('active');
            prevPage.classList.add('exiting');

            // Clean up after transition
            setTimeout(() => {
                prevPage.classList.remove('exiting');
                prevPage.style.display = 'none';
            }, 400);
        }

        // Show new page
        nextPage.style.display = 'block';

        // Force reflow
        nextPage.offsetHeight;

        // Trigger fade-in
        requestAnimationFrame(() => {
            nextPage.classList.add('active');

            // Re-enable navigation after transition
            setTimeout(() => {
                isTransitioning = false;
            }, 400);
        });

        // Update nav active states
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.dataset.p === page);
        });

        document.getElementById('nav').classList.toggle('on-dark', page === 'home');

        // Update URL
        if (addToHistory) {
            const url = page === 'home' ? '/' : `/#${page}`;
            history.pushState({ page }, '', url);
        }

        cur = page;

        // Close mobile menu
        closeMob();

        // Initialize portfolio when navigating to it
        if (page === 'portfolio') {
            setTimeout(() => {
                updateVisibleGalleryItems();
            }, 300);
        }
    };

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
        const page = e.state?.page || location.hash.replace("#", "") || "home";
        go(page, false);
    });

    // Initialize first page
    const initialPage = location.hash.replace("#", "") || "home";

    // Hide all pages first
    document.querySelectorAll('.pg').forEach(pg => {
        pg.style.display = 'none';
        pg.classList.remove('active');
    });

    // Show initial page without transition
    const startPage = document.getElementById('pg-' + initialPage);
    if (startPage) {
        startPage.style.display = 'block';
        startPage.classList.add('active');
        startPage.style.opacity = '1';
        cur = initialPage;
    }

    document.getElementById('nav')?.classList.add('on-dark');

    /* ═══════════════════════════════
       NAVBAR SCROLL BEHAVIOR
    ═══════════════════════════════ */

    let lastScrollY = 0;
    let ticking = false;

    // Attach scroll listener to active page
    function attachScrollListener() {
        const activePage = document.querySelector('.pg.active');
        if (!activePage) return;

        activePage.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const nav = document.getElementById('nav');
                    const currentScrollY = activePage.scrollTop;

                    if (currentScrollY > 100) {
                        nav.classList.add('show');
                        nav.style.boxShadow = `
                            0 12px 48px rgba(0, 0, 0, 0.6),
                            0 4px 12px rgba(255, 122, 0, 0.15)
                        `;
                    } else {
                        nav.classList.remove('show');
                        nav.style.boxShadow = `
                            0 8px 32px rgba(0, 0, 0, 0.4),
                            0 2px 8px rgba(255, 122, 0, 0.08)
                        `;
                    }

                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    attachScrollListener();

    /* ═══════════════════════════════
       CASE STUDY NAVIGATION
    ═══════════════════════════════ */

    window.openCase = async function (projectId) {
        try {
            const res = await fetch("projects.json");
            const projects = await res.json();
            const project = projects[projectId];

            if (!project) {
                console.error("Project not found:", projectId);
                return;
            }

            document.getElementById('caseClient').textContent = project.client;
            document.getElementById('caseTitle').textContent = project.title;
            document.getElementById('caseClientFull').textContent = project.client;
            document.getElementById('caseService').textContent = project.service;
            document.getElementById('caseYear').textContent = project.year;
            document.getElementById('caseProblem').textContent = project.problem;
            document.getElementById('caseApproach').textContent = project.approach;
            document.getElementById('caseResult').textContent = project.result;

            document.querySelector('.case-hero-bg').style.backgroundImage =
                `url('Images/${project.heroImage}')`;

            const gallery = document.getElementById('caseGallery');
            gallery.innerHTML = project.images.map(img =>
                `<img src="Images/${img}" onclick="openLbFromCase(this)" loading="lazy">`
            ).join('');

            go('case');
        } catch (error) {
            console.error("Error loading case study:", error);
        }
    };

    window.openLbFromCase = function (imgElement) {
        document.getElementById('lbimg').src = imgElement.src;
        document.getElementById('lb').classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    /* ═══════════════════════════════
       MOBILE MENU
    ═══════════════════════════════ */

    window.toggleMenu = function () {
        const menu = document.getElementById('mobMenu');
        const ham = document.getElementById('ham');
        menu.classList.toggle('open');
        ham.classList.toggle('active');
    };

    window.closeMob = function () {
        document.getElementById('mobMenu')?.classList.remove('open');
        document.getElementById('ham')?.classList.remove('active');
    };

    window.addEventListener('orientationchange', () => {
        setTimeout(closeMob, 300);
    });

    
    /* ═══════════════════════════════
       ENHANCED PORTFOLIO FILTERING
    ═══════════════════════════════ */

    let activeFilter = 'all';
    let visibleGalleryItems = [];
    let currentGalleryIndex = 0;

    function updateVisibleGalleryItems() {
        visibleGalleryItems = getGalleryItems().filter(item => {
            return activeFilter === 'all' || item.dataset.c === activeFilter;
        });
    }

    function initPortfolioFilters() {
        const filterBtns = document.querySelectorAll('.cat-btn');

        if (!filterBtns.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                // Update active button
                filterBtns.forEach(b => b.classList.remove('on'));
                this.classList.add('on');

                activeFilter = this.dataset.f;

                // Get all cells
                const cells = getGalleryItems();

                // Fade out all
                cells.forEach(cell => {
                    cell.style.transition = 'opacity 0.3s, transform 0.3s';
                    cell.style.opacity = '0';
                    cell.style.transform = 'scale(0.95)';
                });

                // Filter and fade in
                setTimeout(() => {
                    cells.forEach(cell => {
                        const show = activeFilter === 'all' || cell.dataset.c === activeFilter;

                        if (show) {
                            cell.classList.remove('hide');
                            setTimeout(() => {
                                cell.style.opacity = '1';
                                cell.style.transform = 'scale(1)';
                            }, 50);
                        } else {
                            cell.classList.add('hide');
                        }
                    });

                    updateVisibleGalleryItems();
                }, 300);
            });
        });

        // Initialize visible items
        updateVisibleGalleryItems();
    }

    /* ═══════════════════════════════
       ENHANCED LIGHTBOX WITH INFO
    ═══════════════════════════════ */

    function showLightboxImage(index) {
        if (!visibleGalleryItems.length) return;

        currentGalleryIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;
        const activeItem = visibleGalleryItems[currentGalleryIndex];
        const img = activeItem.querySelector('img');
        const imgSrc = img.src;

        const lb = document.getElementById('lb');
        const lbImg = document.getElementById('lbimg');

        // Fade effect
        lbImg.style.opacity = '0';

        setTimeout(() => {
            lbImg.src = imgSrc;
            lbImg.alt = img.alt || 'Gallery image';
            lbImg.style.opacity = '1';
        }, 100);

        // Update info if elements exist
        const metadata = galleryMetadata[imgSrc];
        if (metadata) {
            const lbCategory = lb.querySelector('.lb-category');
            const lbTitle = lb.querySelector('.lb-title');
            const lbDescription = lb.querySelector('.lb-description');

            if (lbCategory) lbCategory.textContent = metadata.category;
            if (lbTitle) lbTitle.textContent = metadata.title;
            if (lbDescription) lbDescription.textContent = metadata.description;
        }
    }

    window.openLb = function (el) {
        updateVisibleGalleryItems();

        const index = visibleGalleryItems.indexOf(el);
        currentGalleryIndex = index >= 0 ? index : 0;

        showLightboxImage(currentGalleryIndex);

        const lb = document.getElementById('lb');
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closeLb = function () {
        const lb = document.getElementById('lb');
        lb.classList.remove('open');
        document.body.style.overflow = '';
    };

    window.prevLb = function (e) {
        if (e) e.stopPropagation();
        showLightboxImage(currentGalleryIndex - 1);
    };

    window.nextLb = function (e) {
        if (e) e.stopPropagation();
        showLightboxImage(currentGalleryIndex + 1);
    };

    // Close on background click
    const lb = document.getElementById('lb');
    if (lb) {
        lb.addEventListener('click', e => {
            if (e.target === lb) closeLb();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', e => {
        const isOpen = document.getElementById('lb')?.classList.contains('open');
        if (!isOpen) return;

        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') prevLb();
        if (e.key === 'ArrowRight') nextLb();
    });

    /* ═══════════════════════════════
       CONTACT FORM
    ═══════════════════════════════ */

    window.handleForm = function (e) {
        e.preventDefault();

        const btn = e.currentTarget;

        const nameInput = document.querySelector('input[placeholder="Your name or brand"]');
        const phoneInput = document.querySelector('input[type="tel"]');
        const emailInput = document.querySelector('input[type="email"]');
        const typeInput = document.querySelector('.f-select');
        const dateInput = document.querySelector('input[type="date"]');
        const messageInput = document.querySelector('.f-ta');
        const otherInput = document.getElementById("otherShootInput");

        const inputs = [nameInput, phoneInput, emailInput, typeInput, dateInput, messageInput];

        let firstInvalid = null;

        // Clear previous errors
        inputs.forEach(input => {
            if (input) {
                input.classList.remove("error");
                const error = input.parentElement.querySelector(".f-error");
                if (error) {
                    error.textContent = "";
                    error.classList.remove("show");
                }
            }
        });

        if (otherInput) {
            const error = otherInput.parentElement.querySelector(".f-error");
            otherInput.classList.remove("error");
            if (error) {
                error.textContent = "";
                error.classList.remove("show");
            }
        }

        function showError(input, message) {
            if (!input) return;
            const error = input.parentElement.querySelector(".f-error");
            input.classList.add("error");
            if (error) {
                error.textContent = message;
                error.classList.add("show");
            }

            if (!firstInvalid) firstInvalid = input;
        }

        const name = nameInput?.value.trim() || '';
        const phone = phoneInput?.value.trim() || '';
        const email = emailInput?.value.trim() || '';
        const type = typeInput?.value || '';
        const date = dateInput?.value || '';
        const message = messageInput?.value.trim() || '';

        // Validation
        if (!name) showError(nameInput, "Name is required");

        if (!phone) showError(phoneInput, "Phone is required");
        else if (!/^[0-9]{10}$/.test(phone.replace(/\s/g, ''))) showError(phoneInput, "Enter valid 10-digit number");

        if (!email) showError(emailInput, "Email is required");
        else if (!/^\S+@\S+\.\S+$/.test(email)) showError(emailInput, "Invalid email");

        if (!type) showError(typeInput, "Select a service");
        if (!date) showError(dateInput, "Choose a date");
        if (!message) showError(messageInput, "Message cannot be empty");

        let finalType = type;

        if (type === "Others" && otherInput) {
            const otherValue = otherInput.value.trim();
            if (!otherValue) {
                showError(otherInput, "Please specify your project");
            } else {
                finalType = "Other: " + otherValue;
            }
        }

        if (firstInvalid) {
            firstInvalid.focus();
            return;
        }

        // Build WhatsApp message
        const text = `Hello, I want to discuss a project.

Name/Brand: ${name}
Phone: ${phone}
Email: ${email}
Service Needed: ${finalType}
Timeline: ${date}
Project Brief: ${message}`;

        const encodedText = encodeURIComponent(text);
        const whatsappNumber = "919474799731";
        const url = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

        btn.textContent = "✓ Sent";
        btn.style.background = "#2d7a3a";
        btn.style.transform = "scale(0.96)";
        btn.disabled = true;

        setTimeout(() => {
            window.location.href = url;
        }, 1500);
    };

    // Show/hide "Other" input
    const shootSelect = document.getElementById("shootType");
    const otherWrap = document.getElementById("otherShootWrap");

    if (shootSelect && otherWrap) {
        shootSelect.addEventListener("change", () => {
            if (shootSelect.value === "Others") {
                otherWrap.style.display = "block";
            } else {
                otherWrap.style.display = "none";
            }
        });
    }

    /* ═══════════════════════════════
       REVIEW SLIDER
    ═══════════════════════════════ */

    const reviewSlides = document.querySelectorAll('.review-slide');
    const reviewDots = document.querySelectorAll('.rdot');
    let reviewIndex = 0;

    function showReview(n) {
        if (!reviewSlides.length) return;

        reviewSlides[reviewIndex].classList.remove('active');
        if (reviewDots[reviewIndex]) reviewDots[reviewIndex].classList.remove('active');

        reviewIndex = (n + reviewSlides.length) % reviewSlides.length;

        reviewSlides[reviewIndex].classList.add('active');
        if (reviewDots[reviewIndex]) reviewDots[reviewIndex].classList.add('active');
    }

    window.goReview = function (n) {
        showReview(n);
    };

    if (reviewSlides.length > 1) {
        setInterval(() => showReview(reviewIndex + 1), 5000);
    }

    /* ═══════════════════════════════
       FADE-IN ANIMATIONS ON SCROLL
    ═══════════════════════════════ */

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe fade-in elements
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    /* ═══════════════════════════════
       SMOOTH SCROLL FOR FILTER BUTTONS (MOBILE)
    ═══════════════════════════════ */

    if (window.innerWidth <= 768) {
        const portCats = document.querySelector('.port-cats');
        if (portCats) {
            portCats.style.overflowX = 'auto';
            portCats.style.scrollbarWidth = 'thin';
            portCats.style.WebkitOverflowScrolling = 'touch';
        }
    }

    /* ═══════════════════════════════
       INITIALIZE GALLERY
    ═══════════════════════════════ */

    loadGalleryFromJSON();

});

/* ═══════════════════════════════
   PREVENT ACCIDENTAL RELOADS
═══════════════════════════════ */

window.addEventListener('beforeunload', function (e) {
    const scrolled = window.scrollY > 100;
    const formFilled = document.querySelector('.f-input:not([value=""]');

    if (scrolled || formFilled) {
        e.preventDefault();
        e.returnValue = '';
    }
});

/* ═══════════════════════════════
   PERFORMANCE: DEBOUNCE SCROLL
═══════════════════════════════ */

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ═══════════════════════════════
   LAZY LOAD OPTIMIZATION
═══════════════════════════════ */

if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/* ═══════════════════════════════
   CONSOLE SIGNATURE
═══════════════════════════════ */

console.log(
    '%c ARC Xtudios — Creative Production Agency ',
    'background: linear-gradient(135deg, #ff7a00 0%, #ff3d5a 50%, #ff006e 100%); color: #fff; padding: 12px 24px; font-size: 14px; font-weight: bold; border-radius: 4px;'
);

console.log(
    '%c Built for Brands. Open to Stories. ',
    'color: #ff7a00; font-size: 12px; font-style: italic; padding: 8px 0;'
);

console.log(
    '%c Precision in production. Creativity in every frame. ',
    'color: #A8B5C4; font-size: 11px; padding: 4px 0;'
);