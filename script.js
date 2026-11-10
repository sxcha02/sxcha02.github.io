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
            setStatus("Merci de valider le captcha avant d'envoyer.", "error");
            return;
        }

        const data = new FormData(form);
        data.set("subject", `Contact portfolio – ${data.get("name")}`);

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

            setStatus("Merci, ton message a bien été envoyé !", "success");
            form.reset();
            setTimeout(closeAfterSend, 800);
        } catch (error) {
            setStatus("Oups, l'envoi a échoué. Réessaie dans un instant.", "error");
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
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target); // l'animation ne se joue qu'une fois
            }
        });
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
);

revealTargets.forEach((el) => revealObserver.observe(el));

// ------------------- Prénom qui se « décode » lettre par lettre -------------------

const scrambleEl = document.querySelector(".highlight--scramble");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (scrambleEl && !prefersReducedMotion) {
    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&@$*+?!<>/";
    const FRAME_MS = 50;        // vitesse de défilement des caractères
    const START_DELAY = scrambleStartMs; // en même temps que le prénom monte dans la phrase
    const FIRST_LOCK = 400;     // temps avant que la 1re lettre se fixe
    const LOCK_STEP = 220;      // écart entre chaque lettre fixée

    const word = scrambleEl.textContent;
    const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

    // lecteurs d'écran : ils lisent le prénom (texte caché), pas les lettres animées
    scrambleEl.textContent = "";
    const srText = document.createElement("span");
    srText.className = "sr-only";
    srText.textContent = word;
    scrambleEl.appendChild(srText);

    const letters = [...word].map((char) => {
        const span = document.createElement("span");
        span.className = "scramble-letter is-scrambling";
        span.setAttribute("aria-hidden", "true");
        span.textContent = char;
        span.dataset.char = randomChar();
        scrambleEl.appendChild(span);
        return span;
    });

    const runScramble = () => {
        const start = performance.now();

        const interval = setInterval(() => {
            const elapsed = performance.now() - start;
            let remaining = 0;

            letters.forEach((span, i) => {
                if (!span.classList.contains("is-scrambling")) return;

                if (elapsed >= FIRST_LOCK + i * LOCK_STEP) {
                    span.classList.remove("is-scrambling"); // la vraie lettre apparaît
                } else {
                    span.dataset.char = randomChar();
                    remaining++;
                }
            });

            if (!remaining) clearInterval(interval);
        }, FRAME_MS);
    };

    // démarre quand l'introduction arrive à l'écran
    const scrambleObserver = new IntersectionObserver((entries, observer) => {
        if (entries[0].isIntersecting) {
            observer.disconnect();
            setTimeout(runScramble, START_DELAY);
        }
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    scrambleObserver.observe(scrambleEl.closest("section") || scrambleEl);
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
        navToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };

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
        .map((link) => [document.querySelector(link.getAttribute("href")), link])
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
