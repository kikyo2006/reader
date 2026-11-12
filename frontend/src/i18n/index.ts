import { ref, type App } from 'vue'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import viVN from './locales/vi-VN'
import type { SupportedLocale, LocaleOption } from './types'

export * from './types'

const STORAGE_KEY = 'reader-language'

export const AVAILABLE_LOCALES: LocaleOption[] = [
  { value: 'zh-CN', label: '简体中文', nativeName: '中文' },
  { value: 'en-US', label: 'English', nativeName: 'English' },
  { value: 'vi-VN', label: 'Tiếng Việt', nativeName: 'Tiếng Việt' },
]

const messages: Record<SupportedLocale, Record<string, any>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'vi-VN': viVN,
}

function detectInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh-CN' || saved === 'en-US' || saved === 'vi-VN') {
      return saved
    }
  } catch {
    // ignore
  }
  return 'en-US'
}

export const currentLocale = ref<SupportedLocale>(detectInitialLocale())

export function syncTrayLocale(locale: SupportedLocale = currentLocale.value) {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return
  void import('@tauri-apps/api/event')
    .then(({ emit }) => emit('app-locale-changed', locale))
    .catch(() => {
      // Ignore outside Tauri runtime
    })
}

export function setLocale(locale: SupportedLocale) {
  if (locale in messages) {
    currentLocale.value = locale
    try {
      localStorage.setItem(STORAGE_KEY, locale)
      document.documentElement.lang = locale
    } catch {
      // ignore
    }
    syncTrayLocale(locale)
  }
}

function resolveValue(obj: Record<string, any> | undefined, path: string): string | undefined {
  if (!obj) return undefined
  const parts = path.split('.')
  let current: any = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function t(key: string, params?: Record<string, string | number | undefined | null>): string {
  // Read currentLocale.value to establish reactive dependency in Vue computed / templates
  const lang = currentLocale.value

  let text = resolveValue(messages[lang], key)
  if (text === undefined && lang !== 'zh-CN') {
    text = resolveValue(messages['zh-CN'], key)
  }

  if (text === undefined) {
    return key
  }

  if (params) {
    return text.replace(/\{(\w+)\}/g, (_, placeholder) => {
      const val = params[placeholder]
      return val != null ? String(val) : `{${placeholder}}`
    })
  }

  return text
}

export function useI18n() {
  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales: AVAILABLE_LOCALES,
  }
}

export const i18nPlugin = {
  install(app: App) {
    app.config.globalProperties.$t = t
    app.config.globalProperties.$locale = currentLocale
    app.provide('i18n', { t, locale: currentLocale, setLocale, availableLocales: AVAILABLE_LOCALES })
    syncTrayLocale(currentLocale.value)
  },
}
