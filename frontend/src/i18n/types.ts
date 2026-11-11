export type SupportedLocale = 'zh-CN' | 'en-US' | 'vi-VN'

export interface LocaleOption {
  value: SupportedLocale
  label: string
  nativeName: string
}

export type NestedTranslation = {
  [key: string]: string | NestedTranslation
}
