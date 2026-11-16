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

  it('translates desktop update progress messages', () => {
    setLocale('en-US')
    expect(localizeErrorMessage('正在确认最新版本')).toBe('Checking latest version')
    expect(localizeErrorMessage('正在下载更新文件')).toBe('Downloading update package')

    setLocale('vi-VN')
    expect(localizeErrorMessage('正在确认最新版本')).toBe('Đang xác nhận phiên bản mới nhất')
    expect(localizeErrorMessage('正在下载更新文件')).toBe('Đang tải tệp cập nhật')
  })

  it('translates window shadow error messages', () => {
    setLocale('en-US')
    expect(localizeErrorMessage('设置窗口阴影失败：系统不支持')).toBe('Failed to set window shadow: 系统不支持')

    setLocale('vi-VN')
    expect(localizeErrorMessage('设置窗口阴影失败：系统不支持')).toBe('Đặt bóng đổ cửa sổ thất bại: 系统不支持')
  })

  it('translates update size mismatch and XMNote receiver errors', () => {
    setLocale('en-US')
    expect(localizeErrorMessage('更新文件大小与发行版记录不一致（应为 1024 字节，实际为 512 字节）')).toBe(
      'Update file size does not match release record (expected 1024 bytes, got 512 bytes)',
    )
    expect(localizeErrorMessage('纸间书摘拒绝接收')).toBe('XMNote rejected the request')

    setLocale('vi-VN')
    expect(localizeErrorMessage('更新文件下载不完整（应为 2048 字节，实际为 1000 字节）')).toBe(
      'Tải tệp cập nhật chưa hoàn tất (dự kiến 2048 byte, thực tế 1000 byte)',
    )
    expect(localizeErrorMessage('下载更新失败: 服务器返回 404')).toBe(
      'Tải bản cập nhật thất bại: máy chủ trả về 404',
    )
  })
})
