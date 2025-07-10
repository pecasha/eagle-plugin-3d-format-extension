<svelte:head>
    <title>{tAppName}</title>
</svelte:head>
{#if loading}
    <div class="loading"
         transition:fade></div>
{/if}
<div class="menu">
    <header>
        <img src="./logo.png"
             alt={tAppName}>
        <p>{tAppName}</p>
    </header>
</div>
<div class="body {theme}">
    <header>
        <p>{menu[menuIndex]}</p>
        <button class="close"
                on:click={quitPlugin}>
            <CloseOutline/>
        </button>
    </header>
</div>


<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        CloseOutline
    } from "flowbite-svelte-icons";
    import { setTimeout } from "node:timers/promises";

    const THEME_COLOR = {
        light: ["#fff", "#f8f8f9", "#dbdbdc", "#707479", "#2c2f32"],
        lightgray: ["#e3e4e6", "#d9dadd", "#cccdcf", "#6b6f74", "#2c2f32"],
        gray: ["#37383c", "#414246", "#505155", "#a9aaad", "#f8f9fb"],
        dark: ["#18191c", "#242528", "#353639", "#9fa0a3", "#f8f9fb"],
        blue: ["#0d1630", "#19223b", "#2b334a", "#9ca0a9", "#f8f9fb"],
        purple: ["#1c1424", "#28202f", "#39313f", "#a19fa6", "#f8f9fb"]
    }

    let menu: string[] = [];
    let menuIndex = 0;

    let tAppName = "";

    let theme: keyof typeof THEME_COLOR = "light";
    let loading = true;

    onMount(async () => {
        if(eagle.app.theme === "Auto") {
            theme = eagle.app.isDarkColors() ? "gray" : "light";
        } else {
            theme = eagle.app.theme.toLowerCase();
        }
        themeChange();
        eagle.onThemeChanged((value: string) => {
            theme = value.toLowerCase() as keyof typeof THEME_COLOR;
            themeChange();
        });
        await pluginTranslateInitialization();
        tAppName = i18next.t("manifest.app.name");
        menu = [
            i18next.t("page.modules")
        ];
        await eagle.window.setOpacity(1);
        loading = false;
    });

    const pluginTranslateInitialization = async () => {
        if(i18next.t("manifest.app.name")) {
            return true;
        } else {
            await setTimeout(50);
            await pluginTranslateInitialization();
        }
    }

    const quitPlugin = () => {
        window.close();
    }

    const themeChange = () => {
        [
            "--theme-background-color",
            "--theme-main-color",
            "--theme-border-color",
            "--theme-control-color",
            "--theme-font-color",
        ].forEach((property ,i) => {
            document.documentElement.style.setProperty(property, THEME_COLOR[theme][i]);
        });
    }
</script>

<style lang="less">
    @import "../base.module";

    :root {
        --theme-background-color: #fff;
        --theme-main-color: #f8f8f9;
        --theme-border-color: #dbdbdc;
        --theme-control-color: #707479;
        --theme-font-color: #2c2f32;
    }

    :global(*) {
        padding: 0;
        margin: 0;
        border: none;
        outline: 0;
        zoom: 1;
        resize: none;
        -webkit-text-size-adjust: none;
        font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, "-apple-system", sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-touch-callout: none;
        box-sizing: border-box;
        user-select: none;
    }
    :global(html),
    :global(body) {
        width: 100%;
        height: 100%;
    }
    :global(img) {
        display: block;
    }

    :global(#svelte) {
        display: flex;
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background-color: var(--theme-background-color);
        transition: background-color ease .3s;
    }

    .loading {
        z-index: 1000;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--theme-background-color);
    }

    .menu {
        display: flex;
        flex-direction: column;
        width: 160px;
        height: 100%;
        background-color: var(--theme-main-color);
        border-right: 1px solid var(--theme-border-color);
        header {
            .align(v-center);
            position: relative;
            width: 100%;
            height: 40px;
            padding: 10px;
            -webkit-app-region: drag;
            font-weight: bold;
            font-size: 14px;
            transition: border ease .3s;
            > img {
                height: 100%;
                margin-right: 8px;
            }
            > p {
                flex: 1;
                width: 0;
                color: var(--theme-font-color);
                transition: color ease .3s;
            }
        }
    }

    .body {
        display: flex;
        flex: 1;
        width: 0;
        height: 100%;
        header {
            .align(v-center);
            position: relative;
            width: 100%;
            height: 40px;
            padding: 10px 10px 10px 16px;
            border-bottom: 1px solid var(--theme-border-color);
            -webkit-app-region: drag;
            font-weight: bold;
            font-size: 14px;
            transition: border ease .3s;
            > p {
                flex: 1;
                width: 0;
                color: var(--theme-font-color);
                transition: color ease .3s;
            }
            .close {
                .align(center);
                width: 20px;
                height: 100%;
                border-radius: 4px;
                background-color: transparent;
                color: var(--theme-font-color);
                cursor: pointer;
                transition: none ease .3s;
                transition-property: background-color, color;
                -webkit-app-region: no-drag;
                &:hover {
                    background-color: var(--theme-border-color);
                }
                :global(> svg) {
                    width: 16px;
                    height: 16px;
                }
            }
        }
    }
</style>
