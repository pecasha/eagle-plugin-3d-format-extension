import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import fs from "node:fs";
import { builtinModules } from "node:module";

const builtinModulesWord = builtinModules.join("|");
const builtinModulesRegExp = new RegExp(builtinModulesWord, "g");

export default defineConfig({
    plugins: [
        {
            name: "replace-node-imports",
            load(id) {
                if(id.endsWith("+page.svelte")) {
                    let values = "";
                    return fs.readFileSync(id, "utf-8").replace(/import (.+?) from "node:(.+?)";?/g, (match, p1, p2) => {
                        const name = p1.trim().replace(/[{} ]?/g, "");
                        values += `${name} = require("node:${p2}")${p1.includes("{")?`.${name}`:""};`;
                        return `let ${name}: any;`;
                    }).replace(/onMount\((async)? ?\(\) => {/, match => match + values);
                }
            }
        },
        sveltekit()
    ],
    build: {
        rollupOptions: {
            output: {
                globals: {
                    eagle: "eagle",
                    i18next: "i18next",
                    require: "require"
                }
            },
            external: [
                ...builtinModules
            ],
            plugins: [
                {
                    name: "node-module-import-to-require",
                    renderChunk(code: string) {
                        if(builtinModulesRegExp.test(code)) {
                            return code.replace(new RegExp(`import\\s+(\\S+)\\s+from\\s*["'](${builtinModulesWord})["']`, "g"), 'const $1 = require("$2")');
                        }
                        return null;
                    }
                }
            ]
        }
    },
    server: {
        host: "0.0.0.0"
    }
});
