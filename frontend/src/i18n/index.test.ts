import { describe, it, expect, beforeEach } from 'vitest'
import { t, setLocale, currentLocale, AVAILABLE_LOCALES } from './index'

describe('i18n core', () => {
  beforeEach(() => {
    setLocale('zh-CN')
  })

  it('translates basic keys in zh-CN', () => {
    expect(t('common.confirm')).toBe('确定')
    expect(t('nav.bookshelf')).toBe('书架')
  })

  it('switches to en-US and translates correctly', () => {
    setLocale('en-US')
    expect(currentLocale.value).toBe('en-US')
    expect(t('common.confirm')).toBe('Confirm')
    expect(t('nav.bookshelf')).toBe('Bookshelf')
    expect(t('settings.title')).toBe('Settings')
  })

  it('switches to vi-VN and translates correctly', () => {
    setLocale('vi-VN')
    expect(currentLocale.value).toBe('vi-VN')
    expect(t('common.confirm')).toBe('Xác nhận')
    expect(t('nav.bookshelf')).toBe('Tủ sách')
    expect(t('settings.title')).toBe('Cài đặt')
  })

  it('interpolates parameters correctly', () => {
    setLocale('zh-CN')
    expect(t('common.itemCount', { count: 5 })).toBe('共 5 项')

    setLocale('en-US')
    expect(t('common.itemCount', { count: 5 })).toBe('5 items in total')

    setLocale('vi-VN')
    expect(t('common.itemCount', { count: 5 })).toBe('Tổng cộng 5 mục')
  })

  it('falls back to key if key is completely unknown', () => {
    expect(t('nonexistent.key.here')).toBe('nonexistent.key.here')
  })

  it('exposes available locales list', () => {
    expect(AVAILABLE_LOCALES).toHaveLength(3)
    expect(AVAILABLE_LOCALES.map((l) => l.value)).toEqual(['zh-CN', 'en-US', 'vi-VN'])
  })
})
