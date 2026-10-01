let pages = [];
let courses = [];
let activeCourse = "kaikki";
let scrollFrame;

const list = document.querySelector("#page-list");
const search = document.querySelector("#page-search");
const resultCount = document.querySelector(".result-count");
const emptyState = document.querySelector("#empty-state");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const courseLinks = [...document.querySelectorAll("[data-course-filter]")];
const menuButton = document.querySelector(".menu-button");
const menuLabel = menuButton.querySelector(".sr-only");
const mainNav = document.querySelector(".main-nav");
const siteHeader = document.querySelector(".site-header");
const navLinks = [...mainNav.querySelectorAll('a[href^="#"]')];
const anchorLinks = [...document.querySelectorAll('a[href^="#"]')];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function readableFolderName(folderName) {
    const sectionMatch = folderName.match(/^osio_0?(\d+)$/i);

    if (sectionMatch) {
        return `Osio ${Number(sectionMatch[1])}`;
    }

    return folderName
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/^./, (letter) => letter.toLocaleUpperCase("fi"));
}

function matchesSearch(page, query) {
    return `${page.title} ${page.courseName} ${page.source} ${page.relativePath}`
        .toLocaleLowerCase("fi")
        .includes(query);
}

function createTree(coursePages) {
    const root = { folders: new Map(), pages: [] };

    coursePages.forEach((page) => {
        const parts = page.relativePath.split("/");
        parts.pop();
        let node = root;

        parts.forEach((part) => {
            if (!node.folders.has(part)) {
                node.folders.set(part, { folders: new Map(), pages: [] });
            }

            node = node.folders.get(part);
        });

        node.pages.push(page);
    });

    return root;
}

function pageCount(node) {
    return node.pages.length + [...node.folders.values()]
        .reduce((total, child) => total + pageCount(child), 0);
}

function createPageLink(page) {
    const link = document.createElement("a");
    const index = pages.indexOf(page) + 1;
    link.className = "page-item";
    link.href = page.path;

    const number = document.createElement("span");
    number.className = "page-item-index";
    number.textContent = String(index).padStart(2, "0");

    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const location = document.createElement("small");
    title.textContent = page.title;
    location.textContent = `${page.courseName} · ${page.relativePath}`;
    copy.append(title, location);

    const arrow = document.createElement("span");
    arrow.className = "page-item-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";

    link.append(number, copy, arrow);
    return link;
}

function createFolder(node, name, path, query, depth = 0) {
    const details = document.createElement("details");
    details.className = "archive-folder";
    details.dataset.depth = String(depth);
    details.open = query.length > 0;

    const summary = document.createElement("summary");
    const icon = document.createElement("span");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const count = document.createElement("small");
    const arrow = document.createElement("span");

    icon.className = "archive-folder-icon";
    icon.setAttribute("aria-hidden", "true");
    copy.className = "archive-folder-copy";
    title.textContent = readableFolderName(name);
    count.textContent = `${pageCount(node)} HTML-tiedostoa · ${path}`;
    copy.append(title, count);
    arrow.className = "archive-folder-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "+";
    summary.append(icon, copy, arrow);

    const content = document.createElement("div");
    content.className = "archive-folder-content";

    if (node.pages.length > 0) {
        const pageList = document.createElement("div");
        pageList.className = "folder-page-list";
        pageList.append(...node.pages.map(createPageLink));
        content.append(pageList);
    }

    if (node.folders.size > 0) {
        const folderList = document.createElement("div");
        folderList.className = "nested-folder-list";

        [...node.folders.entries()]
            .sort(([first], [second]) => first.localeCompare(second, "fi", { numeric: true }))
            .forEach(([folderName, child]) => {
                folderList.append(createFolder(
                    child,
                    folderName,
                    `${path}/${folderName}`,
                    query,
                    depth + 1
                ));
            });

        content.append(folderList);
    }

    details.append(summary, content);
    return details;
}

function createCourse(course, coursePages, query) {
    const tree = createTree(coursePages);
    const details = document.createElement("details");
    details.className = `archive-course archive-course-${course.id}`;
    details.open = activeCourse !== "kaikki" || query.length > 0;

    const summary = document.createElement("summary");
    const badge = document.createElement("span");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    const description = document.createElement("small");
    const count = document.createElement("span");

    badge.className = "archive-course-badge";
    badge.textContent = course.id === "html" ? "</>" : course.id === "css" ? "#" : "JS";
    copy.className = "archive-course-copy";
    title.textContent = course.name;
    description.textContent = course.description;
    copy.append(title, description);
    count.className = "archive-course-count";
    count.textContent = coursePages.length === 1 ? "1 sivu" : `${coursePages.length} sivua`;
    summary.append(badge, copy, count);

    const content = document.createElement("div");
    content.className = "archive-course-content";

    if (coursePages.length === 0) {
        const message = document.createElement("p");
        message.className = "archive-folder-empty";
        message.textContent = course.available
            ? "Hakua vastaavia harjoitussivuja ei löytynyt."
            : `${course.name}-kansiota tai sen HTML-harjoituksia ei ole vielä lisätty.`;
        content.append(message);
    } else {
        if (tree.pages.length > 0) {
            const rootPages = document.createElement("div");
            rootPages.className = "folder-page-list";
            rootPages.append(...tree.pages.map(createPageLink));
            content.append(rootPages);
        }

        const folderList = document.createElement("div");
        folderList.className = "course-folder-list";

        [...tree.folders.entries()]
            .sort(([first], [second]) => first.localeCompare(second, "fi", { numeric: true }))
            .forEach(([folderName, node]) => {
                folderList.append(createFolder(node, folderName, folderName, query));
            });

        content.append(folderList);
    }

    details.append(summary, content);
    return details;
}

function updateCourseCounts() {
    courses.forEach((course) => {
        const count = document.querySelector(`[data-course-count="${course.id}"]`);
        if (count) count.textContent = course.pageCount;
    });
}

function renderPages() {
    const query = search.value.trim().toLocaleLowerCase("fi");
    const visibleCourses = courses.filter((course) => (
        activeCourse === "kaikki" || course.id === activeCourse
    ));
    const sections = [];
    let visiblePageCount = 0;

    visibleCourses.forEach((course) => {
        const courseNameMatches = `${course.name} ${course.description}`
            .toLocaleLowerCase("fi")
            .includes(query);
        const coursePages = pages.filter((page) => (
            page.course === course.id
            && (!query || courseNameMatches || matchesSearch(page, query))
        ));

        if (query && !courseNameMatches && coursePages.length === 0) return;

        visiblePageCount += coursePages.length;
        sections.push(createCourse(course, coursePages, query));
    });

    list.classList.add("is-folder-view", "is-course-view");
    list.replaceChildren(...sections);
    resultCount.textContent = `${visiblePageCount} HTML-tiedostoa · ${sections.length} kurssia`;
    emptyState.textContent = "Hakua vastaavia kursseja, kansioita tai HTML-tiedostoja ei löytynyt.";
    emptyState.hidden = sections.length !== 0;
}

function selectCourse(courseId) {
    activeCourse = courseId;
    search.value = "";

    filterButtons.forEach((button) => {
        const isActive = button.dataset.course === courseId;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });

    renderPages();
}

async function loadPages() {
    try {
        const response = await fetch("main/pages.json", { cache: "no-store" });

        if (!response.ok) throw new Error("Kurssiarkistoa ei löytynyt.");

        const archive = await response.json();
        courses = Array.isArray(archive.courses) ? archive.courses : [];
        pages = Array.isArray(archive.pages) ? archive.pages.filter((page) => (
            typeof page.title === "string"
            && typeof page.course === "string"
            && typeof page.path === "string"
            && typeof page.relativePath === "string"
            && page.path.toLocaleLowerCase("fi").endsWith(".html")
        )) : [];

        document.querySelector("#page-count").textContent = pages.length;
        updateCourseCounts();
        renderPages();
    } catch (error) {
        resultCount.textContent = "Arkistoa ei voitu ladata";
        emptyState.textContent = "Kurssiarkiston lataaminen epäonnistui.";
        emptyState.hidden = false;
        console.error(error);
    }
}

function closeMenu() {
    menuButton.setAttribute("aria-expanded", "false");
    menuLabel.textContent = "Avaa valikko";
    mainNav.classList.remove("is-open");
}

function setActiveNavigation(hash) {
    navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === hash;
        link.classList.toggle("is-active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function updateActiveNavigation() {
    const sectionIds = ["harjoitukset", "kaikki-sivut", "teknologiat"];
    const readingLine = window.scrollY + siteHeader.offsetHeight + Math.min(180, window.innerHeight * 0.22);
    let activeHash = "#alku";

    sectionIds.forEach((id) => {
        const section = document.querySelector(`#${id}`);
        if (section && section.offsetTop <= readingLine) activeHash = `#${id}`;
    });

    if (window.scrollY < 80) activeHash = "#alku";
    setActiveNavigation(activeHash);
}

filterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
    button.addEventListener("click", () => selectCourse(button.dataset.course));
});

courseLinks.forEach((link) => {
    link.addEventListener("click", () => selectCourse(link.dataset.courseFilter));
});

search.addEventListener("input", renderPages);

menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuLabel.textContent = willOpen ? "Sulje valikko" : "Avaa valikko";
    mainNav.classList.toggle("is-open", willOpen);
});

anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        const hash = link.getAttribute("href");
        const target = document.querySelector(hash);
        if (!target) return;

        event.preventDefault();
        closeMenu();

        if (hash === "#alku") {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
        } else {
            target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }

        window.history.replaceState(null, "", hash);
        setActiveNavigation(hash);
    });
});

document.addEventListener("click", (event) => {
    if (!mainNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector("#kaikki-sivut").scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start"
        });
        window.setTimeout(() => search.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 350);
    }

    if (event.key === "Escape") {
        closeMenu();
        search.blur();
    }
});

window.addEventListener("scroll", () => {
    if (scrollFrame) return;

    scrollFrame = window.requestAnimationFrame(() => {
        updateActiveNavigation();
        scrollFrame = null;
    });
}, { passive: true });

window.addEventListener("resize", updateActiveNavigation);
loadPages();
updateActiveNavigation();
