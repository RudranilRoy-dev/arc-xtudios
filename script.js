document.addEventListener("DOMContentLoaded", () => {

    /* ═══════════════════════════════
       AUTO GALLERY FROM JSON
    ═══════════════════════════════ */
    async function loadGalleryFromJSON() {
        const res = await fetch("images.json");
        const images = await res.json();

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
    }

    loadGalleryFromJSON();

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
       PORTFOLIO FILTER + LIGHTBOX
    ═══════════════════════════════ */
    let activeFilter = 'all';
    let visibleGalleryItems = [];
    let currentGalleryIndex = 0;

    function updateVisibleGalleryItems() {
        visibleGalleryItems = getGalleryItems().filter(item => {
            return activeFilter === 'all' || item.dataset.c === activeFilter;
        });
    }

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('on'));
            this.classList.add('on');

            activeFilter = this.dataset.f;

            getGalleryItems().forEach(item => {
                const show = activeFilter === 'all' || item.dataset.c === activeFilter;
                item.classList.toggle('hide', !show);
            });

            updateVisibleGalleryItems();
            closeLb();
        });
    });

    function showLightboxImage(index) {
        if (!visibleGalleryItems.length) return;

        currentGalleryIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;
        const activeItem = visibleGalleryItems[currentGalleryIndex];
        const img = activeItem.querySelector('img');

        document.getElementById('lbimg').src = img.src;
        document.getElementById('lbimg').alt = img.alt || 'Gallery image';
    }

    window.openLb = function (el) {
        updateVisibleGalleryItems();

        const index = visibleGalleryItems.indexOf(el);
        currentGalleryIndex = index >= 0 ? index : 0;

        showLightboxImage(currentGalleryIndex);
        document.getElementById('lb').classList.add('open');
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

    const lb = document.getElementById('lb');
    if (lb) {
        lb.addEventListener('click', e => {
            if (e.target === lb) closeLb();
        });
    }

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