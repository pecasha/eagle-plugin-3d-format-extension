import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/kit").Config} */
export default {
    preprocess: vitePreprocess({
        script: true
    }),
    kit: {
        adapter: adapter()
    },
    onwarn: (warning, handler) => {
        if(warning.code.startsWith("a11y-")) {
            return;
        }
        handler(warning);
    }
}
