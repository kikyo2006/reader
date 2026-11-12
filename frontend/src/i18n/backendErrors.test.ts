import { afterEach, describe, expect, it } from 'vitest'
import { currentLocale, setLocale } from './index'
import { localizeErrorMessage, stripAppErrorPrefix } from './backendErrors'

describe('backendErrors localization', () => {
  const originalLocale = currentLocale.value

  afterEach(() => {
    setLocale(originalLocale)
  })

  it('strips AppError prefixes while keeping non-empty details and preserving bare prefixes', () => {
    expect(stripAppErrorPrefix('bad request: 语音请求失败 (429 Too Many Requests): server busy: queue full'))
      .toBe('语音请求失败 (429 Too Many Requests): server busy: queue full')
    expect(stripAppErrorPrefix('not found: 未找到朗读引擎')).toBe('未找到朗读引擎')
    expect(stripAppErrorPrefix('bad request: ')).toBe('bad request:')
  })

  it('localizes speech error toasts in English and Vietnamese', () => {
    const raw = 'bad request: 语音请求失败 (429 Too Many Requests): server busy: queue full'
    const skipped = `已跳过朗读失败的片段：${raw}`

    setLocale('zh-CN')
    expect(localizeErrorMessage(raw)).toBe('语音请求失败 (429 Too Many Requests): server busy: queue full')

    setLocale('en-US')
    expect(localizeErrorMessage(raw)).toBe('Speech request failed (429 Too Many Requests): server busy: queue full')
    expect(localizeErrorMessage(skipped)).toBe(
      'Skipped failed TTS segment: Speech request failed (429 Too Many Requests): server busy: queue full',
    )

    setLocale('vi-VN')
    expect(localizeErrorMessage(raw)).toBe('Yêu cầu giọng nói thất bại (429 Too Many Requests): server busy: queue full')
    expect(localizeErrorMessage(skipped)).toBe(
      'Đã bỏ qua đoạn đọc bị lỗi: Yêu cầu giọng nói thất bại (429 Too Many Requests): server busy: queue full',
    )
  })
})
