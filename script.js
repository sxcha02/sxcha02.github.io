// ------------------- Modal de contact -------------------

// Adresse qui recevra les messages
const CONTACT_EMAIL = "s.massot02@gmail.com";

const modal = document.getElementById("contact-modal");
const openBtn = document.getElementById("open-contact-modal");
const closeBtn = document.getElementById("close-contact-modal");
const form = document.getElementById("contact-form");

// Le modal n'existe que sur l'accueil : on ne branche rien sur les autres pages
if (modal) {
    openBtn.addEventListener("click", () => {
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

    // Pas de serveur : on ouvre la messagerie avec le message pré-rempli
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(form);
        const subject = `Contact portfolio – ${data.get("name")}`;
        const body = `${data.get("message")}\n\n${data.get("name")} (${data.get("email")})`;

        window.location.href =
            `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        form.reset();
        modal.close();
    });
}

// ------------------- Footer -------------------

// Année du copyright toujours à jour
document.getElementById("footer-year").textContent = new Date().getFullYear();

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
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target); // l'animation ne se joue qu'une fois
            }
        });
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
);

revealTargets.forEach((el) => revealObserver.observe(el));

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
