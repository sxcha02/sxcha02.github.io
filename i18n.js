// ======================================================
// Traductions FR / EN
// ======================================================
// Le français est écrit directement dans le HTML ; l'anglais est ici.
//
// Pour traduire un nouveau texte :
//   1. ajoute data-i18n="ma.cle" sur l'élément HTML ;
//   2. ajoute "ma.cle": "My text" dans EN ci-dessous (le HTML est autorisé).
// Pour un attribut (aria-label, placeholder…) : data-i18n-attr="aria-label:ma.cle".
// Un texte sans traduction reste simplement en français.
//
// Ce fichier est chargé avant script.js : la page est traduite avant d'être animée.

const EN = {
    // ---------- Titres et descriptions des pages ----------
    "meta.home.title": "Sacha — Web & mobile developer",
    "meta.home.description": "Sacha's portfolio, a Web Projects bachelor's student: simple, minimal, user-centred web and mobile interfaces.",
    "meta.resources.title": "Resources — Sacha",
    "meta.resources.description": "The tools, websites and documentation Sacha uses every day for web and mobile development.",
    "meta.404.title": "Page not found — Sacha",

    // ---------- Navigation ----------
    "nav.about": "About",
    "nav.vision": "Vision",
    "nav.parcours": "Background",
    "nav.projects": "Projects",
    "nav.resources": "Resources",
    "nav.contact": "Contact",

    // ---------- Hero ----------
    "hero.title": "Web &amp; mobile developer",
    "hero.description": "Web Projects bachelor's student. I design simple, useful and polished interfaces.",
    "hero.scroll": "Scroll to the introduction",

    // ---------- Introduction ----------
    "intro.title": "Introduction",
    "intro.text": "My name is <strong class=\"highlight highlight--scramble\">Sacha</strong>, I'm a student in a <strong class=\"highlight highlight--underline\">Professional Bachelor's degree in Web Projects</strong>.",

    // ---------- Vision ----------
    "vision.title": "Vision",
    "vision.1.title": "Minimalism",
    "vision.1.text": "Remove until only the essential remains. Every element on screen needs a reason to be there; the rest is just noise.",
    "vision.2.title": "Simplicity",
    "vision.2.text": "Simple doesn't mean easy. It's the result of real work: understanding the problem well enough to offer the clearest solution.",
    "vision.3.title": "User experience",
    "vision.3.text": "A beautiful site nobody understands is a failed site. I design for the people who use it first: readable, accessible, smooth.",

    // ---------- Parcours ----------
    "schools.title": "Background",
    "schools.done": "Completed",
    "schools.current": "In progress",
    "schools.1.degree": "Two-year degree in Electrical Engineering and Industrial Computing",
    "schools.1.text": "A technology-focused programme on designing, analysing and mastering electronic systems and automation.",
    "schools.2.degree": "Professional Bachelor's degree in Web Projects",
    "schools.2.dates": "2026 – present",
    "schools.2.text": "Trains apprentices across the whole lifecycle of web and mobile applications, from UX/UI design to full-stack development and agile project management.",

    // ---------- Projets ----------
    "projects.title": "Projects",
    "projects.podapp.text": "Offline desktop application for a single podiatrist on a single PC, bringing together the calendar, patient records, consultations, prescriptions, the income ledger and sterilisation tracking.",
    "projects.view": "View project →",
    "projects.placeholder.name": "Project name",
    "projects.placeholder.tech": "Technologies used",
    "projects.placeholder.text": "Short project description.",

    // ---------- Contact ----------
    "contact.title": "Contact",
    "contact.text": "A question, a work-study or project opportunity? Write to me.",
    "contact.open": "Contact me",
    "contact.copy": "Copy my email",
    "contact.cv": "Download my CV",
    "contact.close": "Close",
    "contact.name": "Name",
    "contact.send": "Send",

    "footer.rights": "All rights reserved",

    // ---------- Ressources ----------
    "resources.label": "Useful links",
    "resources.text": "The tools, websites and documentation I use every day.",
    "resources.cat.docs": "Documentation",
    "resources.cat.tools": "Tools",
    "resources.cat.inspiration": "Inspiration",
    "resources.cat.colors": "Colours",
    "resources.mdn": "The reference for HTML, CSS and JavaScript.",
    "resources.awwwards": "The most creative websites on the web, awarded every day.",
    "resources.coolors": "Colour palette generator.",
    "resources.placeholder.name": "Link name",
    "resources.placeholder.text": "Short description.",
    "resources.search.label": "Search a resource",
    "resources.search.placeholder": "Search a resource…",
    "resources.filter.label": "Filter by category",

    // ---------- Pages projet ----------
    "project.label": "Project",
    "project.role": "Role",
    "project.year": "Year",
    "project.stack": "Technologies",
    "project.links": "Links",
    "project.github": "View on GitHub ↗",
    "project.context": "Context",
    "project.problem": "Problem",
    "project.solution": "Solution",
    "project.screens": "Screenshots",
    "project.learned": "Takeaways",
    "project.back": "← All projects",
    "project.next": "Next project",
    "project.pager": "Other projects",
    "project.media.missing": "Image coming soon",
    "project.podapp.solution": "A desktop application that works entirely offline and brings together the calendar, patient records, consultations, prescriptions, the income ledger and sterilisation tracking in one place.",
    "project.todo.role": "To be completed",
    "project.todo.link": "Link to be added",
    "project.todo.context": "To be completed: who it's for, in what setting (course, work-study, personal project), with which constraints.",
    "project.todo.problem": "To be completed: the initial need, what wasn't working before.",
    "project.todo.solution": "To be completed: how you solved the problem (technical choices, architecture, key features).",
    "project.todo.learned": "To be completed: what you learned, what you'd do differently, what's next.",

    // ---------- 404 ----------
    "404.label": "Error 404",
    "404.text": "This page has flown away. It doesn't exist, or not anymore.",
    "404.back": "Back to home",
};

// Textes écrits par script.js (messages, libellés dynamiques), dans les deux langues
const UI = {
    fr: {
        "nav.open": "Ouvrir le menu",
        "nav.close": "Fermer le menu",
        "lang.switch": "Switch to English",
        "cursor.view": "Voir",
        "contact.copied": "Copié !",
        "contact.copyError": "Copie impossible",
        "contact.captcha": "Merci de valider le captcha avant d'envoyer.",
        "contact.success": "Merci, ton message a bien été envoyé !",
        "contact.error": "Oups, l'envoi a échoué. Réessaie dans un instant.",
        "contact.subject": "Contact portfolio",
        "filter.all": "Tout",
        "filter.empty": "Aucune ressource ne correspond à ta recherche.",
    },
    en: {
        "nav.open": "Open menu",
        "nav.close": "Close menu",
        "lang.switch": "Passer en français",
        "cursor.view": "View",
        "contact.copied": "Copied!",
        "contact.copyError": "Couldn't copy",
        "contact.captcha": "Please complete the captcha before sending.",
        "contact.success": "Thanks, your message has been sent!",
        "contact.error": "Oops, sending failed. Please try again in a moment.",
        "contact.subject": "Portfolio contact",
        "filter.all": "All",
        "filter.empty": "No resource matches your search.",
    },
};

(function () {
    let stored = null;
    try {
        stored = localStorage.getItem("lang");
    } catch (error) {
        // stockage bloqué (navigation privée…) : on reste en français
    }

    const lang = stored === "en" ? "en" : "fr";
    document.documentElement.lang = lang;

    // utilisé par script.js pour ses propres textes
    window.LANG = lang;
    window.t = (key) => UI[lang][key] ?? UI.fr[key] ?? key;

    if (lang === "en") {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const value = EN[el.dataset.i18n];
            if (value !== undefined) el.innerHTML = value;
        });

        document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
            el.dataset.i18nAttr.split(";").forEach((pair) => {
                const [attr, key] = pair.split(":").map((part) => part.trim());
                if (EN[key] !== undefined) el.setAttribute(attr, EN[key]);
            });
        });

        // captcha du formulaire de contact en anglais
        document.querySelectorAll(".h-captcha").forEach((el) => el.setAttribute("data-lang", "en"));
        const ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale) ogLocale.setAttribute("content", "en_GB");
    }

    // Bouton FR / EN : affiche l'autre langue, la page est rechargée dans la langue choisie
    document.querySelectorAll(".lang-toggle").forEach((button) => {
        const other = lang === "fr" ? "en" : "fr";
        button.textContent = other.toUpperCase();
        button.lang = other;
        button.setAttribute("aria-label", window.t("lang.switch"));

        button.addEventListener("click", () => {
            try {
                localStorage.setItem("lang", other);
            } catch (error) {
                return; // sans stockage, impossible de retenir le choix
            }
            location.reload();
        });
    });
})();
