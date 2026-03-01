// src/hooks/use-theme.js
import { useEffect, useState } from "react"

export function useTheme() {
    const [theme, setTheme] = useState(
        () => localStorage.getItem("theme") || "system"
    )

    useEffect(() => {
        const root = document.documentElement
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches

        root.classList.remove("light", "dark")

        if (theme === "system") {
            if (systemDark) root.classList.add("dark")
        } else if (theme === "dark") {
            root.classList.add("dark")
        }

        localStorage.setItem("theme", theme)
    }, [theme])

    return { theme, setTheme }
}