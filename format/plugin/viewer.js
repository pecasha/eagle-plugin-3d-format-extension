const { Core, machineId } = require("../core/index.ts");
const fs = require("node:fs/promises");
const path = require("node:path");
const { webFrame, ipcRenderer } = require("electron");
const zlib = require("node:zlib");

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const theme = urlParams.get("theme");
const filePath = urlParams.get("path");
const suffix = filePath.substring(filePath.lastIndexOf(".") + 1);

const THEME_COLOR = {
    light: ["#fff", "#f8f8f9", "#dbdbdc", "#707479", "#2c2f32", "#ededef", "#e3e4e5"],
    lightgray: ["#e3e4e6", "#d9dadd", "#cccdcf", "#6b6f74", "#2c2f32", "#d3d4d8", "#cbcccf"],
    gray: ["#37383c", "#414246", "#505155", "#a9aaad", "#f8f9fb", "#47484c", "#505155"],
    dark: ["#18191c", "#242528", "#353639", "#9fa0a3", "#f8f9fb", "#2b2c2f", "#353639"],
    blue: ["#0d1630", "#19223b", "#2b334a", "#9ca0a9", "#f8f9fb", "#212941", "#2b334b"],
    purple: ["#1c1424", "#28202f", "#39313f", "#a19fa6", "#f8f9fb", "#2f2736", "#383140"]
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

    let animationControlTips = true;
    if(localStorage.AnimationControlTips && localStorage.AnimationControlTips === new Date().toLocaleDateString()) {
        animationControlTips = false;
    }

    try {
        [
            "--theme-bg-color",
            "--theme-mn-color",
            "--theme-bd-color",
            "--theme-ct-color",
            "--theme-ft-color",
            "--theme-bt-color",
            "--theme-btf-color"
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

        if(renderer.preview.animations.length <= 0) {
            animationControlTips = false;
        }

        const moduleDir = path.join(__dirname, "modules");
        await fs.mkdir(moduleDir, {
            recursive: true
        });
        const moduleFiles = await fs.readdir(moduleDir);
        const modules = moduleFiles.filter(file => file.endsWith(".module"));
        if(modules.length) {
            const deviceId = await machineId();
            for(const filePath of modules) {
                try {
                    const configFile = await fs.readFile(path.join(moduleDir, filePath + ".conf"), "utf8");
                    const config = JSON.parse(configFile);
                    const key = config.key + deviceId;
                    const file = await fs.readFile(path.join(moduleDir, filePath));
                    const code = zlib.gunzipSync(file).toString().split("").map((char, i) =>
                        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
                    ).join("");
                    const module = await webFrame.executeJavaScript(code);
                    if(module && module.name && module.version && typeof module.install === "function") {
                        module.install(renderer, {
                            id,
                            theme,
                            filePath,
                            suffix
                        });
                        if(module.name === "AnimationControl") {
                            animationControlTips = false;
                        }
                    } else {
                        throw new Error();
                    }
                } catch {
                    errorOutput((await renderer.i18n.get("error.module.loadFail")).replace("%s", filePath));
                }
            }
        }

        if(animationControlTips) {
            const $moduleTips = document.querySelector(".module-tips");
            $moduleTips.querySelector("button.ignore").addEventListener("click", () => {
                $moduleTips.classList.add("hide");
                localStorage.AnimationControlTips = new Date().toLocaleDateString();
            });
            $moduleTips.querySelector("button.cancel").addEventListener("click", () => {
                $moduleTips.classList.add("hide");
            });
            $moduleTips.querySelector("button.ok").addEventListener("click", () => {
                $moduleTips.classList.add("hide");
                ipcRenderer.invoke("create-plugin-window", {
                    plugin: eagle.plugin
                });
            });
            $moduleTips.classList.remove("hide");
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
