const { Core } = require("../core/index.ts");
const fs = require("node:fs/promises");
const path = require("node:path");

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const theme = urlParams.get("theme");
const filePath = urlParams.get("path");
const suffix = filePath.substring(filePath.lastIndexOf(".") + 1);

const THEME_COLOR = {
    light: ["#fff", "#f8f8f9", "#dbdbdc", "#707479", "#2c2f32"],
    lightgray: ["#e3e4e6", "#d9dadd", "#cccdcf", "#6b6f74", "#2c2f32"],
    gray: ["#37383c", "#414246", "#505155", "#a9aaad", "#f8f9fb"],
    dark: ["#18191c", "#242528", "#353639", "#9fa0a3", "#f8f9fb"],
    blue: ["#0d1630", "#19223b", "#2b334a", "#9ca0a9", "#f8f9fb"],
    purple: ["#1c1424", "#28202f", "#39313f", "#a19fa6", "#f8f9fb"]
}

const renderer = new Core({
    dom: document.querySelector("#renderer"),
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    KTX2TranscoderPath: path.join(`${__dirname}/lib/basis/`),
    DRACODecoderPath: path.join(`${__dirname}/lib/draco/`),
    hdrPath: path.join(`${__dirname}/lib/hdr/background.hdr`),
    usdzDependenciesPath: path.join(`${__dirname}/lib/usdz/`),
    rhino3dmLibraryPath: path.join(`${__dirname}/lib/3dm/`)
});
(async function() {
    const $error = document.querySelector(".error-output > p");
    function errorOutput(message) {
        $error.innerHTML = $error.innerHTML += `${message}<br>`;
        $error.parentElement.style.display = "block";
    }
    try {
        [
            "--theme-bg-color",
            "--theme-mn-color",
            "--theme-bd-color",
            "--theme-ct-color",
            "--theme-ft-color",
        ].forEach((property ,i) => {
            document.documentElement.style.setProperty(property, THEME_COLOR[theme][i]);
        });
        const $loading = document.querySelector(".loading");
        $loading.classList.add(theme);
        renderer.preview.$on("error", async error => {
            errorOutput(`${await renderer.i18n.get(error.type)}: ${error.message}`);
        });
        if(suffix === "usdz" || suffix === "usdc") {
            const usdzBuffer = await fs.readFile(filePath);
            await renderer.preview.loadFile(filePath, suffix, new File([usdzBuffer.buffer], suffix));
        } else {
            await renderer.preview.loadFile(filePath, suffix);
        }
        document.getElementById("renderer").classList.remove("hide");

        const moduleDir = path.join(__dirname, "modules");
        await fs.mkdir(moduleDir, {
            recursive: true
        });
        const modules = await fs.readdir(moduleDir);
        for(const file of modules.filter(file => file.endsWith(".module"))) {
            const module = require(path.join(moduleDir, file));
            if(module && module.name && module.version && typeof module.install === "function") {
                module.install(renderer, {
                    id,
                    theme,
                    filePath,
                    suffix
                });
            }
        }

        $loading.classList.add("hide");
        $loading.addEventListener("transitionend", () => {
            $loading.remove();
            eagle.window.focus();
            window.focus();
        });
    } catch (err) {
        const message = err.message || err || await renderer.i18n.get("error.common.unknown");
        console.error(message);
        errorOutput(message);
        eagle.log.error(`3D 格式扩展插件错误: ${message}`);
        eagle.dialog.showErrorBox(await renderer.i18n.get("error.common.title"), message);
    }
})();
