import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputFile = resolve(projectRoot, "main", "pages.json");
const ignoredDirectories = new Set([".git", ".github", "main", "node_modules"]);
const ignoredHtmlFiles = new Set([
    "HTML-26/pinja-harjoitukset/index.html"
]);
const courseDefinitions = [
    {
        id: "html",
        name: "HTML-26",
        path: "HTML-26",
        description: "HTML-rakenteet, semantiikka, lomakkeet ja multimediasisällöt."
    },
    {
        id: "css",
        name: "CSS-26",
        path: "CSS-26",
        description: "Tyylit, asettelut, responsiivisuus ja visuaaliset harjoitukset."
    },
    {
        id: "javascript",
        name: "JavaScript-26",
        path: "JavaScript-26",
        description: "Vuorovaikutus, ohjelmointilogiikka ja dynaamiset sivut."
    }
];

async function findHtmlFiles(directory) {
    let entries;

    try {
        entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
    }

    const files = [];

    for (const entry of entries) {
        const absolutePath = resolve(directory, entry.name);

        if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
            files.push(...await findHtmlFiles(absolutePath));
        }

        if (entry.isFile() && extname(entry.name).toLocaleLowerCase("fi") === ".html") {
            files.push(absolutePath);
        }
    }

    return files;
}

function decodeTitle(value) {
    return value
        .replace(/<[^>]*>/g, "")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&quot;", "\"")
        .replaceAll("&#39;", "'")
        .replace(/\s+/g, " ")
        .trim();
}

function fallbackTitle(filePath) {
    const parts = filePath.split("/");
    const fileName = parts.at(-1).replace(/\.html$/i, "");
    const sourceName = fileName === "index" ? parts.at(-2) : fileName;

    return sourceName
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/^./, (letter) => letter.toLocaleUpperCase("fi"));
}

function sourceFor(relativePath) {
    const topDirectory = relativePath.split("/")[0];
    const names = {
        "tunti-harjoitukset": "Tunti harjoitukset",
        "pinja-harjoitukset": "Pinja-harjoitukset",
        "CSS-freecodecamp": "FreeCodeCamp",
        projektit: "Projektit"
    };

    return names[topDirectory] || topDirectory
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/^./, (letter) => letter.toLocaleUpperCase("fi"));
}

const pages = [];
const courses = [];

for (const definition of courseDefinitions) {
    const courseRoot = resolve(projectRoot, definition.path);
    const htmlFiles = await findHtmlFiles(courseRoot);
    let pageCount = 0;

    for (const absolutePath of htmlFiles) {
        const filePath = relative(projectRoot, absolutePath).split(sep).join("/");

        if (ignoredHtmlFiles.has(filePath)) continue;

        const relativePath = relative(courseRoot, absolutePath).split(sep).join("/");
        const html = await readFile(absolutePath, "utf8");
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const title = decodeTitle(titleMatch?.[1] || headingMatch?.[1] || fallbackTitle(relativePath));

        pages.push({
            title,
            course: definition.id,
            courseName: definition.name,
            source: sourceFor(relativePath),
            path: filePath,
            relativePath,
            folder: dirname(filePath).split(sep).join("/")
        });
        pageCount += 1;
    }

    courses.push({
        ...definition,
        available: htmlFiles.length > 0,
        pageCount
    });
}

pages.sort((first, second) => (
    courseDefinitions.findIndex((course) => course.id === first.course)
    - courseDefinitions.findIndex((course) => course.id === second.course)
    || first.relativePath.localeCompare(second.relativePath, "fi", { numeric: true })
));

await writeFile(outputFile, `${JSON.stringify({ courses, pages }, null, 4)}\n`, "utf8");
console.log(`Kurssiarkistoon lisättiin ${pages.length} HTML-sivua ${courses.length} kurssista.`);
