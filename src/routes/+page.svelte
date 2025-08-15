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
    <ul class="list">
        {#each menu as item, index}
            <li class:active={menuIndex===index}>{item}</li>
        {/each}
    </ul>
</div>
<div class="body {theme}">
    <header>
        <p>{menu[menuIndex]}</p>
        <button class="close"
                on:click={quitPlugin}>
            <CloseOutline/>
        </button>
    </header>
    <div class="content"
         class:loading={apiLoading}>
        <ul class="products">
            {#each list as item}
                <li>
                    <div class="left">
                        <span>ver {item.version}</span>
                        <button on:click={moduleDetail}>{i18next.t(`modules.${item.id}.name`)}</button>
                    </div>
                    <div class="right">
                        {#if moduleKeys[item.id]}
                            <span class="key">{moduleKeys[item.id]}</span>
                        {:else}
                            <div class="btn">
                                <button on:click={purchase}>{i18next.t("page.purchase")}</button>
                                <button>{i18next.t("page.activation")}</button>
                            </div>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</div>
{#if activationInputModal}
    <div class="activation-input {theme}"
         on:click|self={()=>activationInputModal=false}
         transition:fade>
        <div class="activation-input-box">
            <input type="text"
                   placeholder="{i18next.t('page.activationCodeInputPlaceholder')}"
                   bind:value={activationInput}>
            <button>{i18next.t("page.ok")}</button>
        </div>
    </div>
{/if}

<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import {
        CloseOutline,
        CheckCircleSolid,
        CloseCircleSolid
    } from "flowbite-svelte-icons";
    import { setTimeout } from "node:timers/promises";
    import path from "node:path";
    import fs from "node:fs/promises";
    import { machineId } from "node-machine-id";

    enum BUTTON_STATUS {
        DEFAULT,
        LOADING,
        COMPLETE,
        FAIL
    }

    const THEME_COLOR = {
        light: ["#fff", "#f8f8f9", "#dbdbdc", "#707479", "#2c2f32", "#eaeaec", "#dfe0e1", "#fafafb", "#f9f9fa", "#d5d5d5"],
        lightgray: ["#e3e4e6", "#d9dadd", "#cccdcf", "#6b6f74", "#2c2f32", "#d0d1d5", "#c7c9cb", "#e6e6e9", "#e4e5e7", "#c3c4c6"],
        gray: ["#37383c", "#414246", "#505155", "#a9aaad", "#f8f9fb", "#4b4c4f", "#535459", "#3d3e42", "#47484c", "#515256"],
        dark: ["#18191c", "#242528", "#353639", "#9fa0a3", "#f8f9fb", "#2f3033", "#393a3e", "#222326", "#2d2e31", "#393a3c"],
        blue: ["#0d1630", "#19223b", "#2b334a", "#9ca0a9", "#f8f9fb", "#252d45", "#2f384f", "#182038", "#242b42", "#30374c"],
        purple: ["#1c1424", "#28202f", "#39313f", "#a19fa6", "#f8f9fb", "#332b3a", "#3d3644", "#261f2c", "#302a38", "#3c3642"]
    }

    let moduleDir = "";
    let moduleKeys: Record<string, string> = {};
    let moduleConfig: Record<string, any> = {};
    let deviceId = undefined as unknown as string;

    let activateUnable = false;
    let activationInputModal = false;
    let activationInput = "";
    let activationInputConfirmStatus = BUTTON_STATUS.DEFAULT;

    let menu: string[] = [];
    let menuIndex = 0;

    let tAppName = "";

    let theme: keyof typeof THEME_COLOR = "light";
    let loading = true;
    let apiLoading = true;

    let list: any[] = [];

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

        try {
            await Promise.all([
                modulesInit(),
                getList()
            ]);
        } finally {
            apiLoading = false;
        }
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
            "--theme-hover-color",
            "--theme-active-color",
            "--theme-button-color",
            "--theme-button-hover-color",
            "--theme-button-border-color"
        ].forEach((property ,i) => {
            document.documentElement.style.setProperty(property, THEME_COLOR[theme][i]);
        });
    }

    const modulesInit = async () => {
        deviceId ??= await machineId(true);
        if(!deviceId) {
            activateUnable = true;
        }
        moduleDir = path.join(__dirname, "modules");
        await fs.mkdir(moduleDir, {
            recursive: true
        });
        const moduleFiles = await fs.readdir(moduleDir);
        const modules = moduleFiles.filter(file => file.endsWith(".module.conf"));
        if(modules.length) {
            for(const configPath of modules) {
                const configFile = await fs.readFile(path.join(moduleDir, configPath), "utf8");
                const config = JSON.parse(configFile);
                if(config.id) {
                    moduleConfig[config.id] = config;
                    if(config.key) {
                        moduleKeys[config.id] = config.key;
                    }
                }
                const filePath = path.join(moduleDir, configPath.replace(".conf", ""));
                try {
                    await fs.access(filePath);
                } catch {
                    if(config.id && config.key && config.email) {
                        await moduleActive(config.id, config.key, config.email);
                    } else {
                        await fs.unlink(filePath);
                        if(config.id) {
                            delete moduleConfig[config.id];
                            if(config.key) {
                                delete moduleKeys[config.id];
                            }
                        }
                    }
                }
            }
        }
    }

    const moduleActive = async (id: string, key: string, email: string) => {
        const res = await fetch("https://api.eagle.pome.run/app/active", {
            method: "POST",
            body: JSON.stringify({
                deviceId,
                key,
                productId: id,
                email
            })
        });
        if(res.status === 400) {
            const err = await res.json();
            eagle.dialog.showErrorBox(i18next.t("error.common.title"), err.message);
            return;
        }
        if(res.status !== 200) {
            eagle.dialog.showErrorBox(i18next.t("error.common.title"), res.statusText);
            return;
        }
        await fs.writeFile(path.join(moduleDir, `${id}.module`), await res.bytes());
        await fs.writeFile(path.join(moduleDir, `${id}.module.conf`), JSON.stringify({
            id,
            key,
            email
        }), "utf8");
    }

    const getList = async () => {
        const res = await fetch("https://api.eagle.pome.run/product/list?id=688c73720331bfb148e45bb7");
        const json = await res.json();
        list = json.data;
    }

    const moduleDetail = () => {
        eagle.shell.openExternal("https://3d.pecasha.com/modules/animation-control");
    }

    const purchase = () => {
        eagle.shell.openExternal("https://www.creem.io/payment/prod_3zRFIWTTIqhDDU5LVjnRmi");
    }
</script>

<style lang="less">
    @import "../styles/base.module";

    :root {
        --theme-background-color: #fff;
        --theme-main-color: #f8f8f9;
        --theme-border-color: #dbdbdc;
        --theme-control-color: #707479;
        --theme-font-color: #2c2f32;
        --theme-hover-color: #eaeaec;
        --theme-active-color: #dfe0e1;
        --theme-button-color: #fafafb;
        --theme-button-hover-color: #f9f9fa;
        --theme-button-border-color: #d5d5d5;
    }

    :global(*) {
        padding: 0;
        margin: 0;
        border: none;
        outline: 0;
        zoom: 1;
        resize: none;
        list-style-type: none;
        -webkit-text-size-adjust: none;
        font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, "-apple-system", sans-serif;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-touch-callout: none;
        box-sizing: border-box;
        user-select: none;
        interpolate-size: allow-keywords;
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
        .list {
            flex: 1;
            width: 100%;
            height: 0;
            padding: 0 10px;
            > li {
                .align(v-center);
                width: 100%;
                height: 30px;
                padding: 0 10px;
                border-radius: 4px;
                font-size: 12px;
                color: var(--theme-font-color);
                transition: background-color ease .1s;
                &:hover {
                    background-color: var(--theme-hover-color);
                }
                &.active {
                    background-color: var(--theme-active-color);
                }
            }
        }
    }

    .body {
        display: flex;
        flex-direction: column;
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
        .content {
            position: relative;
            flex: 1;
            width: 100%;
            height: 0;
            padding: 10px;
            &.loading {
                &::before {
                    z-index: 5;
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: var(--theme-background-color);
                }
                &::after {
                    .absolute(cm);
                    z-index: 10;
                    content: "";
                    width: 20px;
                    padding: 4px;
                    aspect-ratio: 1;
                    border-radius: 50%;
                    background: #9aa2f9;
                    --_m: conic-gradient(#0000 10%, #000), linear-gradient(#000 0 0) content-box;
                    -webkit-mask: var(--_m);
                    mask: var(--_m);
                    -webkit-mask-composite: source-out;
                    mask-composite: subtract;
                    animation: l3 1s infinite linear;
                }
                @keyframes l3 {
                    to {
                        transform: rotate(1turn);
                    }
                }
            }
            .products {
                width: 100%;
                overflow: hidden;
                border-radius: 6px;
                border: 1px solid var(--theme-border-color);
                > li {
                    .align(v-center);
                    .align(h-space-between);
                    width: 100%;
                    padding: 12px 10px;
                    line-height: 1;
                    color: var(--theme-font-color);
                    &:nth-child(1n) {
                        background-color: var(--theme-main-color);
                    }
                    .left,
                    .right {
                        .align(v-center);
                    }
                    .left {
                        > span {
                            .align(v-center, inline-flex);
                            margin-right: 4px;
                            padding: 2px 4px;
                            line-height: 1;
                            background-color: var(--theme-active-color);
                            border-radius: 2px;
                            font-size: 10px;
                        }
                        > button {
                            background-color: transparent;
                            font-size: 12px;
                            cursor: pointer;
                        }
                    }
                    .right {
                        .btn {
                            .align(v-center);
                            gap: 10px;
                            > button {
                                .align(v-center, inline-flex);
                                padding: 4px 6px;
                                line-height: 1;
                                background-color: var(--theme-button-color);
                                border: 1px solid var(--theme-button-border-color);
                                transition: background-color ease .1s;
                                border-radius: 4px;
                                font-size: 11px;
                                cursor: pointer;
                                color: var(--theme-font-color);
                                &:hover {
                                    background-color: var(--theme-button-hover-color);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .activation-input {
        .align(center);
        z-index: 999;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255,255,255,.2);
        &.light,
        &.lightgray {
            background-color: rgba(0,0,0,.5);
        }
        &-box {
            .align(center);
            width: 400px;
            height: 60px;
            padding: 10px;
            gap: 10px;
            border-radius: 8px;
            background-color: var(--theme-background-color);
            > input,
            > button {
                height: 100%;
                line-height: 1;
                border-radius: 4px;
                background-color: var(--theme-button-color);
                border: 1px solid var(--theme-button-border-color);
                font-size: 12px;
                color: var(--theme-font-color);
            }
            > input {
                .align(v-center);
                flex: 1;
                width: 0;
                padding: 0 8px;
            }
            > button {
                .align(center);
                width: 70px;
            }
        }
    }
</style>
