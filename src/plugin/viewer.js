const Core = require("../core/index.ts");
const fs = require("fs");
const path = require("path");

const urlParams = new URLSearchParams(window.location.search);
const theme = urlParams.get("theme");
const filePath = urlParams.get("path");
const suffix = filePath.substring(filePath.lastIndexOf(".") + 1);

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
        const $loading = document.querySelector(".loading");
        $loading.classList.add(theme);
        renderer.preview.$on("error", async error => {
            errorOutput(`${await renderer.i18n.get(error.type)}: ${error.message}`);
        });
        if(suffix === "usdz" || suffix === "usdc") {
            const usdzBuffer = await fs.promises.readFile(filePath);
            await renderer.preview.loadFile(filePath, suffix, new File([usdzBuffer.buffer], suffix));
        } else {
            await renderer.preview.loadFile(filePath, suffix);
        }
        document.getElementById("renderer").classList.remove("hide");
        $loading.classList.add("hide");
        $loading.addEventListener("transitionend", () => {
            $loading.remove();
        });
    } catch (err) {
        const message = err.message || err || await renderer.i18n.get("error.common.unknown");
        console.error(message);
        errorOutput(message);
        eagle.log.error(`3D 格式扩展插件错误: ${message}`);
        eagle.dialog.showErrorBox(await renderer.i18n.get("error.common.title"), message);
    }
})();
