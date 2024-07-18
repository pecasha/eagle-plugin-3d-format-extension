import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

const isProd = process.title.includes("--prod");

const plugins = [
    typescript({
        cacheRoot: "./node_modules/.cache/rollup-plugin-typescript2"
    }),
    resolve(),
    commonjs()
];

if(isProd) {
    plugins.push(terser());
}

export default [
    {
        input: "src/core/index.ts",
        external: ["eagle", "i18next"],
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
