// Traductions : t() vient de i18n.js (version de secours si le fichier manque)
const t = window.t || ((key) => key);

// ------------------- Modal de contact -------------------

// Envoi via Web3Forms (service gratuit, pas de serveur nécessaire)
const FORM_ENDPOINT = "https://api.web3forms.com/submit";

const modal = document.getElementById("contact-modal");
const openBtn = document.getElementById("open-contact-modal");
const closeBtn = document.getElementById("close-contact-modal");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");
const backdrop = document.getElementById("contact-backdrop");

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (type) statusEl.classList.add(`is-${type}`);
}

// Le reste du site est rendu inactif (clavier, clic, lecteur d'écran) pendant l'ouverture.
// On cible uniquement nos propres éléments : la fenêtre hCaptcha, ajoutée au <body>, doit rester utilisable.
function pageOutsideModal() {
    const main = modal.closest("main");
    return [
        ...document.querySelectorAll("body > nav, body > footer"),
        ...[...main.children].filter((el) => el !== modal),
    ];
}

// Le modal n'existe que sur l'accueil : on ne branche rien sur les autres pages
if (modal) {
    let inertElements = [];

    // On utilise show() et pas showModal() : showModal() place la fenêtre au-dessus de tout,
    // y compris la fenêtre de vérification hCaptcha, qui se retrouvait cachée derrière.
    // Le fond, le blocage de la page et la touche Échap sont donc gérés ici.
    openBtn.addEventListener("click", () => {
        setStatus("");
        inertElements = pageOutsideModal();
        inertElements.forEach((el) => (el.inert = true));
        backdrop.hidden = false;
        document.body.classList.add("modal-open");
        modal.show();
        form.querySelector("input:not([type=hidden]):not([type=checkbox])").focus();
    });

    modal.addEventListener("close", () => {
        inertElements.forEach((el) => (el.inert = false));
        inertElements = [];
        backdrop.hidden = true;
        document.body.classList.remove("modal-open");
        openBtn.focus();
    });

    closeBtn.addEventListener("click", () => {
        modal.close();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.open) {
            modal.close();
        }
    });

    const PLANE_SVG =
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
        '<path transform="rotate(90 12 12)" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';

    // Le bouton se rétracte en carré, se transforme en avion, puis l'avion roule et décolle.
    // Renvoie une promesse résolue à la fin du vol (tout de suite si les animations sont réduites).
    async function playTakeoff(button) {
        button.classList.add("is-sending");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const { width: w, height: h } = button.getBoundingClientRect();
        const opts = (duration, easing, delay = 0) => ({ duration, easing, delay, fill: "forwards" });

        // 1. le texte s'efface et le bouton se resserre en carré, centré sur lui-même
        button.animate([{ color: "transparent" }], opts(150, "ease-out"));
        await button.animate(
            [{ width: `${w}px`, marginLeft: "0px" }, { width: `${h}px`, marginLeft: `${(w - h) / 2}px` }],
            opts(350, "cubic-bezier(.6,0,.3,1)", 100)
        ).finished;

        // 2. le carré devient un avion (élément fixe, pour pouvoir sortir de la fenêtre)
        const square = button.getBoundingClientRect();
        const plane = document.createElement("div");
        plane.className = "flying-plane";
        plane.innerHTML = PLANE_SVG;
        Object.assign(plane.style, {
            left: `${square.left}px`,
            top: `${square.top}px`,
            width: `${square.width}px`,
            height: `${square.height}px`,
        });
        document.body.appendChild(plane);

        button.animate([{ opacity: 0, transform: "scale(.6)" }], opts(200, "ease-in"));
        await plane.animate(
            [{ opacity: 0, transform: "scale(.4) rotate(-90deg)" }, { opacity: 1, transform: "scale(1) rotate(0)" }],
            opts(300, "cubic-bezier(.3,1.4,.5,1)")
        ).finished;

        // 3. roulage puis décollage vers le haut à droite, jusqu'à sortir de l'écran
        const runway = Math.min(160, window.innerWidth - square.right - 20);
        const climbX = window.innerWidth - square.left + 100;
        const climbY = square.bottom + 100;
        await plane.animate(
            [
                { transform: "translate(0, 0) rotate(0)", easing: "cubic-bezier(.5,0,1,1)" },
                { transform: `translate(${Math.max(runway, 60)}px, 0) rotate(0)`, offset: 0.35, easing: "ease-in-out" },
                { transform: `translate(${Math.max(runway, 60) + 50}px, -8px) rotate(-18deg)`, offset: 0.5, easing: "ease-in" },
                { transform: `translate(${climbX}px, -${climbY}px) rotate(-28deg) scale(.7)` },
            ],
            opts(1300)
        ).finished;

        plane.remove();
    }

    // Après un envoi réussi : la fenêtre s'envole vers le haut (comme l'avion) et le fond s'estompe
    async function closeAfterSend() {
        if (!modal.open) return; // déjà fermée par le visiteur
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const easing = "cubic-bezier(.5,0,.75,0)";
            backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: "ease-in", fill: "forwards" });
            await modal.animate(
                [
                    { opacity: 1, transform: "translateY(0) scale(1)" },
                    { opacity: 1, transform: "translateY(8px) scale(.98)", offset: 0.25 },
                    { opacity: 0, transform: "translateY(-60px) scale(.92)" },
                ],
                { duration: 450, easing }
            ).finished.catch(() => {});
        }
        if (modal.open) modal.close();
        // on masque le fond avant d'annuler son fondu, pour éviter qu'il réapparaisse une image
        backdrop.hidden = true;
        backdrop.getAnimations().forEach((animation) => animation.cancel());
    }

    // Le bouton réapparaît à sa taille normale
    function resetButton(button) {
        button.getAnimations().forEach((animation) => animation.cancel());
        button.classList.remove("is-sending");
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            button.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "scale(1)" }], {
                duration: 300,
                easing: "ease-out",
            });
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector(".contact-submit");

        // hCaptcha : le jeton est placé dans ce champ une fois le captcha validé
        const captcha = form.querySelector('textarea[name="h-captcha-response"]');
        if (captcha && !captcha.value) {
            setStatus(t("contact.captcha"), "error");
            return;
        }

        const data = new FormData(form);
        data.set("subject", `${t("contact.subject")} – ${data.get("name")}`);

        submitBtn.disabled = true;
        setStatus("");
        const takeoff = playTakeoff(submitBtn);

        try {
            const request = fetch(FORM_ENDPOINT, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: data,
            }).then(async (response) => ({ response, result: await response.json() }));

            // on attend la fin du décollage ET la réponse du serveur
            const [{ response, result }] = await Promise.all([request, takeoff]);

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Échec de l'envoi");
            }

            setStatus(t("contact.success"), "success");
            form.reset();
            setTimeout(closeAfterSend, 800);
        } catch (error) {
            setStatus(t("contact.error"), "error");
        } finally {
            // un jeton hCaptcha ne sert qu'une fois : on réinitialise le widget
            if (window.hcaptcha) window.hcaptcha.reset();
            await takeoff.catch(() => {});
            resetButton(submitBtn);
            submitBtn.disabled = false;
        }
    });
}

// ------------------- Footer -------------------

// Année du copyright toujours à jour
document.getElementById("footer-year").textContent = new Date().getFullYear();

// ------------------- Apparition au scroll -------------------

// Introduction : chaque mot est entouré d'un <span class="word"> pour apparaître l'un après l'autre.
// Le prénom (.highlight--scramble) n'est pas découpé : il monte à sa place dans la phrase
// et se décode pendant que les mots suivants apparaissent (un seul mouvement continu).
const introText = document.querySelector(".short-description-content");
let scrambleStartMs = 500; // moment où le prénom apparaît et commence à se décoder

if (introText) {
    const WORD_START = 350;     // laisse le titre commencer à se dévoiler
    const WORD_STEP = 60;       // écart entre deux mots
    const WORD_DURATION = 800;  // durée d'apparition d'un mot (voir .word dans style.css)
    let wordIndex = 0;

    const wrapWords = (node) => {
        [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const fragment = document.createDocumentFragment();

                child.textContent.split(/(\s+)/).forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) {
                        fragment.append(part); // les espaces restent du texte normal
                        return;
                    }
                    const span = document.createElement("span");
                    span.className = "word";
                    span.textContent = part;
                    span.style.setProperty("--word-delay", `${WORD_START + wordIndex++ * WORD_STEP}ms`);
                    fragment.append(span);
                });

                child.replaceWith(fragment);
            } else if (child.nodeType === Node.ELEMENT_NODE && child.matches(".highlight--scramble")) {
                // le prénom prend sa place dans la cascade, comme un mot
                scrambleStartMs = WORD_START + wordIndex++ * WORD_STEP;
                child.style.setProperty("--word-delay", `${scrambleStartMs}ms`);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                wrapWords(child);
            }
        });
    };

    wrapWords(introText);

    // les mots en gras s'allument quand le dernier mot a presque fini d'apparaître
    const introEndMs = WORD_START + (wordIndex - 1) * WORD_STEP + WORD_DURATION * 0.7;
    (introText.closest("section") || introText).style.setProperty("--intro-end", `${introEndMs}ms`);
}

// ------------------- Sections épinglées -------------------

// Chaque section est dans un conteneur .pin plus haut qu'elle : la section reste fixe
// (position: sticky) pendant que le scroll fait apparaître ses éléments un par un.
// Une fois tout affiché (+ un petit temps de lecture), la page reprend son défilement.
// Les distances sont en vh (1 = 1 % de la hauteur de l'écran) : à régler selon le rythme voulu.
const PIN_STEP_VH = 30;       // scroll nécessaire pour chaque élément (citation, carte, idée…)
const PIN_WORD_VH = 6;        // scroll nécessaire pour chaque mot de l'introduction
const PIN_UNDERLINE_VH = 25;  // scroll pendant lequel le souligné de l'introduction se dessine
const PIN_START_VH = 4;       // petite marge avant la première étape, une fois la section en place
const PIN_DWELL_VH = 25;      // temps de lecture une fois tout affiché, avant de repartir

// éléments qui apparaissent l'un après l'autre, dans l'ordre de la page
const PIN_STEPS = "[data-step], .word, .highlight--scramble, .vision-item, .school-card, .project-card";

const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const navBar = document.querySelector("body > nav");

const pins = [...document.querySelectorAll(".pin")].map((pin) => {
    const section = pin.firstElementChild;
    const steps = [...section.querySelectorAll(PIN_STEPS)].map((el) => ({
        el,
        cls: "is-visible",
        weight: el.matches(".word, .highlight--scramble") ? PIN_WORD_VH : PIN_STEP_VH,
    }));

    // introduction : les mots-clés s'allument, puis le souligné se dessine
    const underlines = [...section.querySelectorAll(".highlight--underline")];
    if (section.querySelector(".highlight")) {
        steps.push({ el: section, cls: "is-lit", weight: underlines.length ? PIN_UNDERLINE_VH : 0, lit: true });
    }

    return { pin, section, steps, underlines, underline: null };
});

// avec les animations réduites : pas d'épinglage, tout apparaît d'un coup
function revealAllSteps(section) {
    section.querySelectorAll("[data-step], .word, .highlight--scramble").forEach((el) => el.classList.add("is-visible"));
    if (section.querySelector(".highlight")) section.classList.add("is-lit");
}

// Calcule, pour chaque section, à quel moment du scroll chaque élément apparaît.
// Section plus haute que l'écran : elle défile normalement jusqu'à ce que son bas touche le bas de l'écran,
// puis reste fixe ; chaque élément n'apparaît qu'une fois arrivé à l'écran, et jamais avant le précédent.
function layoutPins() {
    const vh = window.innerHeight / 100;
    const navH = navBar ? navBar.offsetHeight : 0;
    const available = window.innerHeight - navH;

    pins.forEach((p) => {
        const { pin, section, steps } = p;
        pin.classList.toggle("is-pinned", motionOK);
        if (!motionOK) {
            pin.style.height = "";
            section.style.top = "";
            if (section.classList.contains("is-visible")) revealAllSteps(section);
            return;
        }

        section.classList.add("is-measuring");
        const overflow = Math.max(section.offsetHeight - available, 0); // ce qui dépasse de l'écran
        section.classList.remove("is-measuring");

        // section haute : elle se fixe quand son bas atteint le bas de l'écran
        section.style.top = overflow ? `${navH - overflow}px` : "";

        const sectionTop = section.getBoundingClientRect().top;
        let cursor = PIN_START_VH * vh;
        steps.forEach((step) => {
            // scroll nécessaire pour que l'élément arrive aux 85 % de l'écran
            const elTop = step.lit ? 0 : step.el.getBoundingClientRect().top - sectionTop;
            const entersView = Math.min(Math.max(elTop - available * 0.85, 0), overflow);
            step.at = Math.max(cursor, entersView);
            cursor = step.at + step.weight * vh;
            if (step.lit && p.underlines.length) p.underline = { from: step.at, to: cursor };
        });

        const end = cursor + PIN_DWELL_VH * vh;
        pin.style.height = `${Math.max(section.offsetHeight, available + end)}px`;
    });
}

// Avancement du scroll (en px) dans chaque section → étapes allumées (ou éteintes en remontant)
function updatePins() {
    const navH = navBar ? navBar.offsetHeight : 0;

    pins.forEach(({ pin, steps, underlines, underline }) => {
        if (!pin.classList.contains("is-pinned")) return;
        const scrolled = navH - pin.getBoundingClientRect().top;

        steps.forEach(({ el, cls, at }) => el.classList.toggle(cls, scrolled >= at));

        if (underline) {
            const progress = Math.min(Math.max((scrolled - underline.from) / (underline.to - underline.from), 0), 1);
            underlines.forEach((el) => el.style.setProperty("--underline-progress", progress.toFixed(3)));
        }
    });
}

if (pins.length) {
    let pinTicking = false;
    const onPinScroll = () => {
        if (!pinTicking) {
            pinTicking = true;
            requestAnimationFrame(() => {
                updatePins();
                pinTicking = false;
            });
        }
    };

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    window.addEventListener("resize", () => {
        // sur mobile, la barre d'adresse qui apparaît/disparaît change un peu la hauteur : on l'ignore
        if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 120) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        layoutPins();
        updatePins();
    });

    window.addEventListener("scroll", onPinScroll, { passive: true });
    // la police change la hauteur des sections une fois chargée
    if (document.fonts) document.fonts.ready.then(() => { layoutPins(); updatePins(); });

    layoutPins();
    updatePins();
}

// ------------------- Apparition au scroll -------------------

// Ajoutées en JS : si le JS ne charge pas, tout reste visible
const revealTargets = document.querySelectorAll(
    ".short-description, .vision, .vision-item, .schools, .projects, .contact, .school-card, .project-card, .resources-category"
);

revealTargets.forEach((el) => {
    el.classList.add("reveal");

    // cartes : petit décalage entre chacune pour un effet en cascade
    if (el.matches(".school-card, .project-card, .vision-item")) {
        const index = Array.from(el.parentElement.children).indexOf(el);
        el.style.setProperty("--reveal-delay", `${index * 120 + 150}ms`);
    }
});

const revealObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // liste de cartes observée à la place de ses cartes : on révèle les cartes elles-mêmes
            if (entry.target.matches(".schools-list, .projects-list")) {
                if (entry.target.closest(".pin.is-pinned")) return;
                entry.target.querySelectorAll(".school-card, .project-card").forEach((card) => card.classList.add("is-visible"));
                observer.unobserve(entry.target);
                return;
            }
            const target = entry.target;
            const isPinSection = target.matches(".pin > section");
            const pinned = target.closest(".pin.is-pinned");

            // dans une section épinglée, c'est le scroll qui fait apparaître les cartes
            if (pinned && !isPinSection) return;

            target.classList.add("is-visible");
            observer.unobserve(target); // l'animation ne se joue qu'une fois
            if (isPinSection && !pinned) revealAllSteps(target);
        });
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
);

// Les cartes sont entièrement masquées par leur clip-path avant d'apparaître :
// l'observateur ne les « voit » jamais, on observe donc la liste qui les contient.
revealTargets.forEach((el) => {
    revealObserver.observe(el.matches(".school-card, .project-card") ? el.parentElement : el);
});

// ------------------- Textes qui se « décodent » lettre par lettre -------------------

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&@$*+?!<>/";
const randomChar = () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];

// Découpe le texte en lettres ; renvoie la fonction qui lance le décodage.
// firstLock : temps avant que la 1re lettre se fixe ; lockStep : écart entre deux lettres.
function prepareScramble(el, { firstLock = 400, lockStep = 220 } = {}) {
    const FRAME_MS = 50; // vitesse de défilement des caractères
    const text = el.textContent.trim();

    // lecteurs d'écran : ils lisent le texte (caché), pas les lettres animées
    el.textContent = "";
    const srText = document.createElement("span");
    srText.className = "sr-only";
    srText.textContent = text;
    el.appendChild(srText);

    const letters = [...text].map((char) => {
        const span = document.createElement("span");
        span.className = "scramble-letter";
        span.setAttribute("aria-hidden", "true");
        span.textContent = char;
        if (char.trim()) {
            span.classList.add("is-scrambling");
            span.dataset.char = randomChar();
        }
        el.appendChild(span);
        return span;
    }).filter((span) => span.classList.contains("is-scrambling"));

    return () => {
        const start = performance.now();
        const interval = setInterval(() => {
            const elapsed = performance.now() - start;
            let remaining = 0;

            letters.forEach((span, i) => {
                if (!span.classList.contains("is-scrambling")) return;
                if (elapsed >= firstLock + i * lockStep) {
                    span.classList.remove("is-scrambling"); // la vraie lettre apparaît
                } else {
                    span.dataset.char = randomChar();
                    remaining++;
                }
            });

            if (!remaining) clearInterval(interval);
        }, FRAME_MS);
    };
}

// Appelle callback une seule fois, dès que el reçoit la classe .is-visible
function onceVisible(el, callback) {
    let done = false;
    const check = () => {
        if (done || !el.classList.contains("is-visible")) return;
        done = true;
        watcher.disconnect();
        callback();
    };
    const watcher = new MutationObserver(check);
    watcher.observe(el, { attributes: true, attributeFilter: ["class"] });
    check(); // déjà visible si la page s'ouvre plus bas
}

if (!prefersReducedMotion) {
    // Prénom de l'introduction : démarre quand il apparaît
    const scrambleEl = document.querySelector(".highlight--scramble");
    if (scrambleEl) {
        const run = prepareScramble(scrambleEl);
        // sans épinglage, le prénom attend son tour dans la cascade des mots
        onceVisible(scrambleEl, () => setTimeout(run, scrambleEl.closest(".pin.is-pinned") ? 0 : scrambleStartMs));
    }

    // Titres de section (data-scramble) : se décodent pendant qu'ils se dévoilent
    document.querySelectorAll("[data-scramble]").forEach((title) => {
        const run = prepareScramble(title, { firstLock: 250, lockStep: 60 });
        const section = title.closest(".reveal");
        if (section) onceVisible(section, () => setTimeout(run, 200));
        else setTimeout(run, 300); // page 404 : dès le chargement
    });
}

// ------------------- Soulignés qui avancent avec le scroll -------------------

// Le trait commence quand le haut de la section entre en bas de l'écran,
// et il est complet quand ce haut atteint les 2/3 de l'écran (en partant du bas).
const UNDERLINE_END = 1 / 3; // position finale du haut de la section : 1/3 depuis le haut de l'écran

const underlines = document.querySelectorAll(".highlight--underline");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (underlines.length && !reduceMotion) {
    let ticking = false;

    const updateUnderlines = () => {
        const vh = window.innerHeight;
        const start = vh;                 // haut de la section en bas de l'écran → 0 %
        const end = vh * UNDERLINE_END;   // haut de la section aux 2/3 de l'écran → 100 %

        underlines.forEach((el) => {
            if (el.closest(".pin.is-pinned")) return; // piloté par updatePins
            const section = el.closest("section") || el;
            const top = section.getBoundingClientRect().top;
            const progress = Math.min(Math.max((start - top) / (start - end), 0), 1);
            el.style.setProperty("--underline-progress", progress.toFixed(3));
        });

        ticking = false;
    };

    // requestAnimationFrame : un seul calcul par image, même si le scroll envoie beaucoup d'événements
    const onScroll = () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateUnderlines);
        }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateUnderlines();
}

// ------------------- Menu burger (mobile) -------------------

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.getElementById("nav-links");

if (navToggle && navLinks) {
    const setMenu = (open) => {
        navLinks.classList.toggle("is-open", open);
        document.body.classList.toggle("menu-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute("aria-label", t(open ? "nav.close" : "nav.open"));
    };

    navToggle.setAttribute("aria-label", t("nav.open"));

    navToggle.addEventListener("click", () => {
        setMenu(!navLinks.classList.contains("is-open"));
    });

    // un lien cliqué ferme le menu (et le défilement vers la section se fait normalement)
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenu(false));
    });

    // touche Échap
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
            setMenu(false);
            navToggle.focus();
        }
    });

    // si on repasse en grand écran avec le menu ouvert, on le referme
    window.matchMedia("(min-width: 769px)").addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
    });
}

// ------------------- Lien actif de la navbar pendant le scroll -------------------

// Uniquement les liens vers une ancre de la page en cours (#vision, #projects…)
const sectionLinks = document.querySelectorAll('.nav-links a[href^="#"]');

if (sectionLinks.length) {
    // paires [section, lien], dans l'ordre de la page
    const pairs = [...sectionLinks]
        .map((link) => {
            const section = document.querySelector(link.getAttribute("href"));
            // section épinglée : on mesure son conteneur .pin, qui défile normalement
            return [section && (section.closest(".pin") || section), link];
        })
        .filter(([section]) => section);

    let spyTicking = false;

    // section active = la dernière dont le haut a dépassé le milieu de l'écran
    const updateActiveLink = () => {
        const middle = window.innerHeight / 2;
        let active = null;

        pairs.forEach(([section, link]) => {
            if (section.getBoundingClientRect().top <= middle) active = link;
        });

        // tout en bas de la page, la dernière section est active même si elle est courte
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
            active = pairs[pairs.length - 1][1];
        }

        sectionLinks.forEach((link) => link.classList.toggle("is-active", link === active));
        spyTicking = false;
    };

    window.addEventListener("scroll", () => {
        if (!spyTicking) {
            spyTicking = true;
            requestAnimationFrame(updateActiveLink);
        }
    }, { passive: true });

    window.addEventListener("resize", updateActiveLink);
    updateActiveLink();
}

// ------------------- Cercle qui suit le curseur (ordinateur uniquement) -------------------

// Seulement avec une vraie souris : pas sur téléphone / tablette tactile
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

if (finePointer.matches) {
    const cursor = document.createElement("div");
    cursor.className = "cursor-circle";
    cursor.setAttribute("aria-hidden", "true");
    // libellé dans le cercle : « Voir » sur un projet, ↗ sur un lien qui ouvre un autre site
    const cursorLabel = document.createElement("span");
    cursorLabel.className = "cursor-label";
    cursor.appendChild(cursorLabel);
    document.body.appendChild(cursor);

    // éléments sur lesquels le cercle grossit
    const INTERACTIVE = "a, button, label, input, textarea, select, summary, [role='button']";
    // 1 = suit instantanément ; plus petit = plus de retard (effet fluide)
    const EASE = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.18;

    let mouseX = 0, mouseY = 0;  // position réelle de la souris
    let x = 0, y = 0;            // position affichée du cercle
    let running = false;

    const render = () => {
        x += (mouseX - x) * EASE;
        y += (mouseY - y) * EASE;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        // on arrête la boucle quand le cercle a rattrapé la souris (économise la batterie)
        if (Math.abs(mouseX - x) > 0.1 || Math.abs(mouseY - y) > 0.1) {
            requestAnimationFrame(render);
        } else {
            running = false;
        }
    };

    document.addEventListener("mousemove", (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;

        // première apparition : le cercle part directement de la souris
        if (!cursor.classList.contains("is-visible")) {
            x = mouseX;
            y = mouseY;
            cursor.classList.add("is-visible");
        }

        cursor.classList.toggle("is-hovering", !!event.target.closest(INTERACTIVE));

        // data-cursor="clé de traduction" sur un élément : le cercle affiche ce mot
        const labelled = event.target.closest("[data-cursor]");
        const external = event.target.closest('a[target="_blank"]');
        const label = labelled ? t(labelled.dataset.cursor) : external ? "↗" : "";
        if (cursorLabel.textContent !== label) cursorLabel.textContent = label;
        cursor.classList.toggle("has-label", !!label);

        if (!running) {
            running = true;
            requestAnimationFrame(render);
        }
    });

    // la souris quitte la fenêtre : le cercle disparaît
    document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));

    // petit effet de pression au clic
    document.addEventListener("mousedown", () => cursor.classList.add("is-pressed"));
    document.addEventListener("mouseup", () => cursor.classList.remove("is-pressed"));
}

// ------------------- Barre de progression de lecture -------------------

// Trait fin sous la navbar qui se remplit à mesure qu'on descend dans la page
const progressNav = document.querySelector("body > nav");

if (progressNav) {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    progressNav.appendChild(bar);

    let progressTicking = false;
    const updateProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        bar.style.transform = `scaleX(${progress.toFixed(4)})`;
        progressTicking = false;
    };

    window.addEventListener("scroll", () => {
        if (!progressTicking) {
            progressTicking = true;
            requestAnimationFrame(updateProgress);
        }
    }, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
}

// ------------------- Hero : effet de profondeur au scroll -------------------

// Le texte descend plus lentement que la page et s'efface ; l'image remonte doucement
const hero = document.querySelector(".main-hero");

if (hero && !prefersReducedMotion) {
    const heroContent = hero.querySelector(".main-hero-content");
    const heroImage = hero.querySelector(".main-hero-image");
    const heroHint = hero.querySelector(".hero-scroll");
    let heroTicking = false;

    const updateHero = () => {
        const height = hero.offsetHeight;
        const y = Math.min(window.scrollY, height); // inutile de calculer une fois le hero passé
        const fade = Math.max(1 - (y / height) * 1.4, 0);

        heroContent.style.translate = `0 ${(y * 0.35).toFixed(1)}px`;
        heroContent.style.opacity = fade.toFixed(3);
        if (heroImage) heroImage.style.translate = `0 ${(-y * 0.15).toFixed(1)}px`;
        if (heroHint) heroHint.style.opacity = fade.toFixed(3);
        heroTicking = false;
    };

    window.addEventListener("scroll", () => {
        if (!heroTicking) {
            heroTicking = true;
            requestAnimationFrame(updateHero);
        }
    }, { passive: true });
    updateHero();
}

// ------------------- Numéros des projets qui défilent -------------------

// 01, 02, 03… : les chiffres défilent au hasard puis se fixent quand la carte apparaît
document.querySelectorAll(".project-card").forEach((card, index) => {
    const number = String(index + 1).padStart(2, "0");
    card.dataset.num = number;
    if (prefersReducedMotion) return;

    let wasVisible = false;
    let timer = null;

    const roll = () => {
        clearInterval(timer);
        let frame = 0;
        timer = setInterval(() => {
            frame++;
            if (frame >= 14) {
                clearInterval(timer);
                card.dataset.num = number;
                return;
            }
            // les dizaines se fixent un peu avant les unités
            const tens = frame >= 8 ? number[0] : Math.floor(Math.random() * 10);
            card.dataset.num = `${tens}${Math.floor(Math.random() * 10)}`;
        }, 55);
    };

    new MutationObserver(() => {
        const visible = card.classList.contains("is-visible");
        if (visible && !wasVisible) roll(); // à chaque apparition (aussi en remontant puis redescendant)
        wasVisible = visible;
    }).observe(card, { attributes: true, attributeFilter: ["class"] });
});

// ------------------- Aperçu des projets au survol (ordinateur) -------------------

// data-preview="chemin/image.webp" sur une carte : l'image suit la souris pendant le survol.
// Si l'image n'existe pas encore, rien ne s'affiche.
const previewCards = document.querySelectorAll("[data-preview]");

if (previewCards.length && finePointer.matches && !prefersReducedMotion) {
    const preview = document.createElement("div");
    preview.className = "project-preview";
    preview.setAttribute("aria-hidden", "true");
    const previewImg = document.createElement("img");
    previewImg.alt = "";
    preview.appendChild(previewImg);
    document.body.appendChild(preview);

    const PREVIEW_EASE = 0.12;
    const OFFSET = 28; // distance entre la souris et l'image
    let targetX = 0, targetY = 0, px = 0, py = 0;
    let previewRunning = false;
    let previewShown = false;

    const renderPreview = () => {
        px += (targetX - px) * PREVIEW_EASE;
        py += (targetY - py) * PREVIEW_EASE;
        preview.style.transform = `translate3d(${px}px, ${py}px, 0)`;

        if (previewShown || Math.abs(targetX - px) > 0.5 || Math.abs(targetY - py) > 0.5) {
            requestAnimationFrame(renderPreview);
        } else {
            previewRunning = false;
        }
    };

    const placePreview = (event) => {
        const { offsetWidth: w, offsetHeight: h } = preview;
        // à droite de la souris, ou à gauche si l'image sortirait de l'écran
        targetX = event.clientX + OFFSET + w > window.innerWidth ? event.clientX - OFFSET - w : event.clientX + OFFSET;
        targetY = Math.min(Math.max(event.clientY - h / 2, 8), window.innerHeight - h - 8);
    };

    previewCards.forEach((card) => {
        // on vérifie que l'image existe avant de l'utiliser
        const probe = new Image();
        probe.onload = () => (card.dataset.previewReady = "true");
        probe.src = card.dataset.preview;

        card.addEventListener("mouseenter", (event) => {
            if (!card.dataset.previewReady) return;
            previewImg.src = probe.src;
            placePreview(event);
            if (!previewShown) {
                px = targetX;
                py = targetY;
            }
            previewShown = true;
            preview.classList.add("is-visible");
            if (!previewRunning) {
                previewRunning = true;
                requestAnimationFrame(renderPreview);
            }
        });

        card.addEventListener("mousemove", (event) => {
            if (previewShown) placePreview(event);
        });

        card.addEventListener("mouseleave", () => {
            previewShown = false;
            preview.classList.remove("is-visible");
        });
    });
}

// ------------------- Boutons « aimantés » (ordinateur) -------------------

// data-magnetic : l'élément se décale légèrement vers la souris quand elle passe dessus
if (finePointer.matches && !prefersReducedMotion) {
    const STRENGTH = 0.3;

    document.querySelectorAll("[data-magnetic]").forEach((el) => {
        let rect = null;

        el.addEventListener("mouseenter", () => {
            rect = el.getBoundingClientRect(); // mesuré une fois, avant le décalage
        });

        el.addEventListener("mousemove", (event) => {
            if (!rect) rect = el.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            el.style.translate = `${(dx * STRENGTH).toFixed(1)}px ${(dy * STRENGTH).toFixed(1)}px`;
        });

        el.addEventListener("mouseleave", () => {
            rect = null;
            el.style.translate = "";
        });
    });
}

// ------------------- Copier l'adresse email -------------------

const copyButton = document.getElementById("copy-email");

if (copyButton) {
    const copyLabel = copyButton.querySelector(".copy-email-label");
    const originalLabel = copyLabel.textContent;
    let copyTimer = null;

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(copyButton.dataset.email);
            copyLabel.textContent = t("contact.copied");
            copyButton.classList.add("is-copied");
        } catch (error) {
            copyLabel.textContent = t("contact.copyError");
        }

        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => {
            copyLabel.textContent = originalLabel;
            copyButton.classList.remove("is-copied");
        }, 2000);
    });
}

// ------------------- Ressources : recherche et filtres -------------------

const resourcesFilter = document.querySelector(".resources-filter");

if (resourcesFilter) {
    const categories = [...document.querySelectorAll(".resources-category")];
    const chipsBox = resourcesFilter.querySelector(".resources-chips");
    const searchInput = resourcesFilter.querySelector("#resources-search");
    const emptyMessage = resourcesFilter.querySelector(".resources-empty");
    let activeCategory = "all";

    // minuscules, sans accents : « Écran » est trouvé en tapant « ecran »
    const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const applyFilter = () => {
        const query = normalize(searchInput.value);
        let total = 0;

        categories.forEach((category) => {
            const inCategory = activeCategory === "all" || category.dataset.category === activeCategory;
            let count = 0;

            category.querySelectorAll(".resources-list > li").forEach((item) => {
                const match = inCategory && normalize(item.textContent).includes(query);
                item.hidden = !match;
                if (match) count++;
            });

            category.hidden = count === 0;
            total += count;
        });

        emptyMessage.textContent = total ? "" : t("filter.empty");
    };

    const addChip = (label, value) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "resources-chip";
        chip.textContent = label;
        chip.dataset.value = value;
        chip.setAttribute("aria-pressed", String(value === activeCategory));

        chip.addEventListener("click", () => {
            activeCategory = value;
            chipsBox.querySelectorAll(".resources-chip").forEach((other) => {
                other.setAttribute("aria-pressed", String(other.dataset.value === activeCategory));
            });
            applyFilter();
        });

        chipsBox.appendChild(chip);
    };

    addChip(t("filter.all"), "all");
    categories.forEach((category, index) => {
        category.dataset.category = String(index);
        const title = category.querySelector(".section-title");
        // le titre peut être découpé en lettres animées : on prend le texte lu par les lecteurs d'écran
        const name = (title.querySelector(".sr-only") || title).textContent.trim();
        addChip(name, String(index));
    });

    searchInput.addEventListener("input", applyFilter);
    resourcesFilter.hidden = false; // visible seulement si le JS fonctionne
}

// ------------------- Écran de chargement -------------------

// Affiché seulement à la première page de la visite (classe .is-loading posée dans le <head>).
// Le compteur avance pendant le chargement, puis l'écran remonte comme un rideau
// et les animations d'entrée de la page démarrent.
if (document.documentElement.classList.contains("is-loading")) {
    const MIN_DURATION = prefersReducedMotion ? 300 : 1400; // durée minimale, même si tout est déjà chargé
    const MAX_DURATION = 5000;                              // au-delà, on affiche la page quoi qu'il arrive

    const loader = document.createElement("div");
    loader.className = "loader";
    loader.setAttribute("aria-hidden", "true");

    const navLogo = document.querySelector(".nav-logo-svg");
    if (navLogo) {
        const logo = navLogo.cloneNode(true);
        logo.setAttribute("class", "loader-logo");
        loader.appendChild(logo);
    }

    const bar = document.createElement("div");
    bar.className = "loader-bar";
    const counter = document.createElement("p");
    counter.className = "loader-counter";
    counter.textContent = "000";
    loader.append(bar, counter);
    document.body.appendChild(loader);

    const start = performance.now();
    let loaded = document.readyState === "complete";
    let shown = 0; // pourcentage affiché

    window.addEventListener("load", () => (loaded = true), { once: true });

    const finish = () => {
        try {
            sessionStorage.setItem("site-loaded", "1");
        } catch (error) {
            // stockage bloqué : l'écran s'affichera à chaque page, sans gravité
        }

        // la page apparaît et ses animations démarrent pendant que le rideau se lève
        document.documentElement.classList.remove("is-loading");
        if (typeof layoutPins === "function" && pins.length) {
            layoutPins();
            updatePins();
        }
        loader.classList.add("is-done");

        const remove = () => loader.remove();
        loader.addEventListener("transitionend", (event) => {
            if (event.target === loader) remove();
        });
        setTimeout(remove, 1500); // au cas où la transition ne se termine pas
    };

    const tick = () => {
        const elapsed = performance.now() - start;
        const done = (loaded || elapsed > MAX_DURATION) && elapsed >= MIN_DURATION;

        // tant que la page charge, on approche doucement de 90 % ; une fois chargée, on file vers 100 %
        const target = done ? 100 : Math.min(90, (elapsed / MIN_DURATION) * 90);
        shown += (target - shown) * (done ? 0.2 : 0.08);
        if (done && shown > 99.5) shown = 100;

        counter.textContent = String(Math.floor(shown)).padStart(3, "0");
        bar.style.transform = `scaleX(${(shown / 100).toFixed(3)})`;

        if (shown >= 100) {
            setTimeout(finish, 200);
        } else {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
}
