// ------------------- Modal de contact -------------------

// Envoi via Web3Forms (service gratuit, pas de serveur nécessaire)
const FORM_ENDPOINT = "https://api.web3forms.com/submit";

const modal = document.getElementById("contact-modal");
const openBtn = document.getElementById("open-contact-modal");
const closeBtn = document.getElementById("close-contact-modal");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (type) statusEl.classList.add(`is-${type}`);
}

// Le modal n'existe que sur l'accueil : on ne branche rien sur les autres pages
if (modal) {
    openBtn.addEventListener("click", () => {
        setStatus("");
        modal.showModal();
    });

    closeBtn.addEventListener("click", () => {
        modal.close();
    });

    // Fermer en cliquant à l'extérieur de la fenêtre
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.close();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector(".contact-submit");
        const data = new FormData(form);
        data.set("subject", `Contact portfolio – ${data.get("name")}`);

        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi…";
        setStatus("");

        try {
            const response = await fetch(FORM_ENDPOINT, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: data,
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Échec de l'envoi");
            }

            setStatus("Merci, ton message a bien été envoyé !", "success");
            form.reset();
            setTimeout(() => modal.close(), 2000);
        } catch (error) {
            setStatus("Oups, l'envoi a échoué. Réessaie dans un instant.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Envoyer";
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
