document.addEventListener("DOMContentLoaded", () => {

    /* ═══════════════════════════════
       HERO SLIDESHOW
    ═══════════════════════════════ */
    let slide = 0;
    const imgs = document.querySelectorAll('.hero-img');
    const dots = document.querySelectorAll('.hdot');

    window.setSlide = function (n) {
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
       NAVIGATION (WITH BACK BUTTON FIX)
    ═══════════════════════════════ */

    let cur = 'home';

    window.go = function (page, addToHistory = true) {
        if (page === cur) return;

        closeLb();

        const prev = document.getElementById('pg-' + cur);
        if (prev) prev.classList.remove('active');

        setTimeout(() => {
            const next = document.getElementById('pg-' + page);
            if (!next) return;
            next.classList.add('active');
            next.scrollTop = 0;
        }, 200);

        document.querySelectorAll('.nav-links a').forEach(a => {
            a.classList.toggle('active', a.dataset.p === page);
        });

        document.getElementById('nav').classList.toggle('on-dark', page === 'home');

        if (addToHistory) {
            history.pushState({ page }, "", "#" + page);
        }

        cur = page;
    };

    window.addEventListener("popstate", (e) => {
        const page = e.state?.page || location.hash.replace("#", "") || "home";
        go(page, false);
    });

    const initialPage = location.hash.replace("#", "") || "home";
    go(initialPage, false);

    document.getElementById('nav').classList.add('on-dark');

    /* ═══════════════════════════════
       CASE STUDY NAVIGATION
    ═══════════════════════════════ */
    window.openCase = async function (projectId) {
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
        document.getElementById('mobMenu').classList.remove('open');
        document.getElementById('ham').classList.remove('active');
    };

    window.addEventListener('orientationchange', () => {
        setTimeout(closeMob, 300);
    });

    /* ═══════════════════════════════
       STAT COUNTERS
    ═══════════════════════════════ */
    setTimeout(() => {

        document.querySelectorAll('.strip-n').forEach(el => {
            const target = +el.dataset.t;
            const format = el.dataset.format;
            let progress = 0;

            function tick() {
                progress += 0.002;
                const ease = 1 - Math.pow(1 - Math.min(progress, 1), 3);
                const value = Math.round(target * ease);

                let display;

                if (format === "k") {
                    display = Math.round(value / 1000) + "K+";
                } else if (target >= 98) {
                    display = value + "%";
                } else {
                    display = value + "+";
                }

                el.textContent = display;

                if (progress < 1) requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        });

    }, 500);

    /* ═══════════════════════════════
   GALLERY + METADATA (UPGRADED)
═══════════════════════════════ */

    const galleryMetadata = {};
    let activeFilter = 'all';
    let visibleGalleryItems = [];
    let currentGalleryIndex = 0;

    async function loadGallery() {
        const res = await fetch("images.json");
        const images = await res.json();

        const gallery = document.querySelector(".gallery");
        if (!gallery) return;

        gallery.innerHTML = "";

        images.forEach(img => {

            const src = `Images/${img.src}`;

            // STORE METADATA
            galleryMetadata[src] = {
                category: formatCategory(img.category),
                title: img.title || "Untitled",
                description: img.description || "Creative production by ARC Xtudios."
            };

            const div = document.createElement("div");
            div.className = "gcell";
            div.dataset.c = img.category;

            div.innerHTML = `
            <img src="${src}" alt="${img.title || ''}" loading="lazy">
        `;

            div.onclick = () => openLightbox(div);

            gallery.appendChild(div);
        });

        updateVisibleItems();
    }

    function formatCategory(c) {
        const map = {
            "weddings-events": "Weddings & Events",
            "portraits": "Portraits",
            "creative": "Creative",
            "commercial": "Commercial",
            "fashion": "Fashion",
            "brand-content": "Brand Content"
        };
        return map[c] || c;
    }

    /* ═══════════════════════════════
       FILTER (SMOOTH)
    ═══════════════════════════════ */

    function initFilters() {
        document.querySelectorAll(".cat-btn").forEach(btn => {

            btn.addEventListener("click", () => {

                document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("on"));
                btn.classList.add("on");

                activeFilter = btn.dataset.f;

                const items = document.querySelectorAll(".gcell");

                items.forEach(el => {
                    el.style.opacity = "0";
                    el.style.transform = "scale(0.95)";
                });

                setTimeout(() => {
                    items.forEach(el => {
                        const show = activeFilter === "all" || el.dataset.c === activeFilter;

                        if (show) {
                            el.classList.remove("hide");
                            requestAnimationFrame(() => {
                                el.style.opacity = "1";
                                el.style.transform = "scale(1)";
                            });
                        } else {
                            el.classList.add("hide");
                        }
                    });

                    updateVisibleItems();
                }, 250);
            });
        });
    }

    function updateVisibleItems() {
        visibleGalleryItems = Array.from(document.querySelectorAll(".gcell"))
            .filter(el => activeFilter === "all" || el.dataset.c === activeFilter);
    }

    /* ═══════════════════════════════
       LIGHTBOX (WITH DESCRIPTION)
    ═══════════════════════════════ */

    function openLightbox(el) {
        updateVisibleItems();

        currentGalleryIndex = visibleGalleryItems.indexOf(el);
        showImage(currentGalleryIndex);

        document.getElementById("lb").classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function showImage(index) {
        currentGalleryIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;

        const el = visibleGalleryItems[currentGalleryIndex];
        const img = el.querySelector("img");
        const src = img.src;

        const lb = document.getElementById("lb");
        const lbImg = document.getElementById("lbimg");

        lbImg.src = src;

        const meta = galleryMetadata[src];

        if (meta) {
            lb.querySelector(".lb-category").textContent = meta.category;
            lb.querySelector(".lb-title").textContent = meta.title;
            lb.querySelector(".lb-description").textContent = meta.description;
        }
    }

    window.closeLb = function () {
        document.getElementById("lb").classList.remove("open");
        document.body.style.overflow = "";
    };

    window.nextLb = function (e) {
        if (e) e.stopPropagation();
        showImage(currentGalleryIndex + 1);
    };

    window.prevLb = function (e) {
        if (e) e.stopPropagation();
        showImage(currentGalleryIndex - 1);
    };

    /* KEYBOARD NAV */
    document.addEventListener("keydown", e => {
        const open = document.getElementById("lb")?.classList.contains("open");
        if (!open) return;

        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowRight") nextLb();
        if (e.key === "ArrowLeft") prevLb();
    });

    /* INIT */
    document.addEventListener("DOMContentLoaded", () => {
        loadGallery();
        setTimeout(initFilters, 300);
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

        inputs.forEach(input => {
            input.classList.remove("error");
            const error = input.parentElement.querySelector(".f-error");
            error.textContent = "";
            error.classList.remove("show");
        });

        if (otherInput) {
            const error = otherInput.parentElement.querySelector(".f-error");
            otherInput.classList.remove("error");
            error.textContent = "";
            error.classList.remove("show");
        }

        function showError(input, message) {
            const error = input.parentElement.querySelector(".f-error");
            input.classList.add("error");
            error.textContent = message;
            error.classList.add("show");

            if (!firstInvalid) firstInvalid = input;
        }

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const type = typeInput.value;
        const date = dateInput.value;
        const message = messageInput.value.trim();

        if (!name) showError(nameInput, "Name is required");

        if (!phone) showError(phoneInput, "Phone is required");
        else if (!/^[0-9]{10}$/.test(phone)) showError(phoneInput, "Enter valid 10-digit number");

        if (!email) showError(emailInput, "Email is required");
        else if (!/^\S+@\S+\.\S+$/.test(email)) showError(emailInput, "Invalid email");

        if (!type) showError(typeInput, "Select a service");
        if (!date) showError(dateInput, "Choose a date");
        if (!message) showError(messageInput, "Message cannot be empty");

        let finalType = type;

        if (type === "Others") {
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

    window.goReview = function (n) { showReview(n); };

    if (reviewSlides.length > 1) {
        setInterval(() => showReview(reviewIndex + 1), 5000);
    }

});