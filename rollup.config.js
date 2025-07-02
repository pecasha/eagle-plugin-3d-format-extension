import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

const isProd = process.title.includes("--prod");

const plugins = [
    typescript(),
    json(),
    resolve(),
    commonjs()
];

if(isProd) {
    plugins.push(terser());
}

export default [
    {
        input: "src/core/index.ts",
        external: [
            "eagle",
            "i18next"
        ],
        output: {
            file: "build/core.js",
            format: "cjs",
            inlineDynamicImports: true,
            globals: {
                eagle: "eagle",
                i18next: "i18next"
            }
        },
        plugins
    }
];
