const fs = require("fs");
const path = require("path");
const { setTimeout } = require("node:timers/promises");
const { Core } = require("../core/index.ts");

module.exports = async ({ src, dest, item }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const suffix = src.substring(src.lastIndexOf(".") + 1);
            const dom = document.createElement("div");
            dom.style.width = "1000px";
            dom.style.height = "1000px";
            document.body.appendChild(dom);
            const core = new Core({
                dom,
                resizeable: false,
                scale: .4,
                calcSizeMode: true,
                devicePixelRatio: window.devicePixelRatio,
                KTX2TranscoderPath: path.join(`${__dirname}/lib/basis/`),
                DRACODecoderPath: path.join(`${__dirname}/lib/draco/`),
                hdrPath: path.join(`${__dirname}/lib/hdr/background.hdr`),
                usdzDependenciesPath: path.join(`${__dirname}/lib/usdz/`),
                rhino3dmLibraryPath: path.join(`${__dirname}/lib/3dm/`)
            });
            let res;
            let usdzFile;
            if(suffix === "usdz" || suffix === "usdc") {
                const usdzBuffer = await fs.promises.readFile(src);
                usdzFile = new File([usdzBuffer.buffer], suffix);
                res = await core.preview.loadFile(src, suffix, usdzFile);
            } else {
                res = await core.preview.loadFile(src, suffix);
            }
            let blob;
            if(suffix === "spline" || suffix === "splinecode") {
                blob = await new Promise(resolve => res.toBlob(resolve));
            } else {
                if(suffix === "ply" || suffix === "stl") {
                    await setTimeout(100);
                }
                const size = core.preview.getSize();
                // 更换新的模型尺寸计算方式后，得到的尺寸比以前小，所以这里乘以3倍放大一些
                let width = Math.abs(Math.ceil(size.width * 3));
                let height = Math.abs(Math.ceil(size.height * 3));
                if(width > 1000 || height > 1000) {
                    const rate = width > 1000 ? 500 / width : height > 1000 ? 500 / height : 1;
                    width = Math.ceil(width * rate);
                    height = Math.ceil(height * rate);
                }
                item.width = width;
                item.height = height;

                const screenshotDom = document.createElement("div");
                screenshotDom.style.width = `${width}px`;
                screenshotDom.style.height = `${height}px`;
                const screenshotCore = new Core({
                    dom: screenshotDom,
                    width,
                    height,
                    screenshotMode: true,
                    devicePixelRatio: window.devicePixelRatio,
                    KTX2TranscoderPath: path.join(`${__dirname}/lib/basis/`),
                    DRACODecoderPath: path.join(`${__dirname}/lib/draco/`),
                    hdrPath: path.join(`${__dirname}/lib/hdr/background.hdr`),
                    usdzDependenciesPath: path.join(`${__dirname}/lib/usdz/`),
                    rhino3dmLibraryPath: path.join(`${__dirname}/lib/3dm/`)
                });
                if(suffix === "usdz" || suffix === "usdc") {
                    await screenshotCore.preview.loadFile(src, suffix, usdzFile);
                } else {
                    await screenshotCore.preview.loadFile(src, suffix);
                }
                await setTimeout(100);
                blob = await screenshotCore.preview.screenshot();
            }
            await fs.promises.writeFile(dest, Buffer.from(await blob.arrayBuffer()));
            resolve(item);
        } catch (err) {
            reject(err);
        }
    });
}
