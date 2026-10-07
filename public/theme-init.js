// Initialize the theme when React loads the next-themes bootstrap script.
(() => {
  try {
    const config = JSON.parse(new URL(document.currentScript.src).searchParams.get('config'))
    const root = document.documentElement
    let theme = config.forcedTheme

    if (!theme) {
      try {
        theme = localStorage.getItem(config.storageKey)
      } catch {
        // Storage may be unavailable; still apply the default theme.
      }
      theme ||= config.defaultTheme
      if (config.enableSystem && theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    }

    const value = config.value?.[theme] ?? theme
    const attributes = Array.isArray(config.attribute) ? config.attribute : [config.attribute]
    for (const attribute of attributes) {
      if (attribute === 'class') {
        root.classList.remove(...(config.value ? Object.values(config.value) : config.themes))
        if (value) root.classList.add(value)
      } else {
        root.setAttribute(attribute, value)
      }
    }
    if (config.enableColorScheme && ['light', 'dark'].includes(theme)) {
      root.style.colorScheme = theme
    }
  } catch {
    // The provider's effects also apply the theme after hydration.
  }
})()
