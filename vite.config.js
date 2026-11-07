import { defineConfig } from "vite"

export default defineConfig(({ command }) => {
    return {
        plugins: [],
        base: command === "build" ? "/bfchess/" : "/",
    }
})