const { Core } = require("../core/index.ts");
const fs = require("node:fs/promises");
const path = require("node:path");

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const theme = urlParams.get("theme");
const filePath = urlParams.get("path");
const suffix = filePath.substring(filePath.lastIndexOf(".") + 1);

const THEME_COLOR = {
    light: ["#f8f8f9", "#dfdfe0", "#888a95", "#2c2f32"],
    lightgray: ["#dddee1", "#c7c7ca", "#6e8086", "#2c2f32"],
    gray: ["#3b3c40", "#515255", "#94969c", "#f8f9fb"],
    dark: ["#1f2023", "#363739", "#767b8a", "#f8f9fb"],
    blue: ["#151d36", "#2c344b", "#40475d", "#f8f9fb"],
    purple: ["#231b2b", "#393240", "#7a748e", "#f8f9fb"]
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
        document.documentElement.style.setProperty("--theme-bg-color", THEME_COLOR[theme][0]);
        document.documentElement.style.setProperty("--theme-bd-color", THEME_COLOR[theme][1]);
        document.documentElement.style.setProperty("--theme-ct-color", THEME_COLOR[theme][2]);
        document.documentElement.style.setProperty("--theme-ft-color", THEME_COLOR[theme][3]);
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
