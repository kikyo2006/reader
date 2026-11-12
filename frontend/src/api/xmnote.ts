import { invokeEnvelope } from './invoke'
import { isTauriRuntime } from './transport'
import { t } from '../i18n'
import { localizeErrorMessage } from '../i18n/backendErrors'
import type { XmnoteBookPayload } from '../utils/xmnote'

export interface XmnoteSendResult {
  sent: number
  failed: number
  errors: string[]
}

/**
 * 纸间书摘的接收端在手机局域网上，必须由桌面进程发请求：
 * WebView 直连会受 CORS/混合内容限制，而且无法复用应用已有的代理配置。
 */
export async function sendXmnoteBooks(
  endpoint: string,
  books: XmnoteBookPayload[],
): Promise<XmnoteSendResult> {
  if (!isTauriRuntime()) {
    return sendFromBrowser(endpoint, books)
  }
  return invokeEnvelope<XmnoteSendResult>('send_xmnote_books', { req: { endpoint, books } })
}

async function sendFromBrowser(
  endpoint: string,
  books: XmnoteBookPayload[],
): Promise<XmnoteSendResult> {
  const result: XmnoteSendResult = { sent: 0, failed: 0, errors: [] }
  for (const book of books) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      const body = await response.text()
      let payload: { code?: number; message?: string } = {}
      try {
        payload = JSON.parse(body) as { code?: number; message?: string }
      } catch {
        throw new Error(
          response.ok
            ? t('extraErrors.xmnoteNotJson', { body: body.slice(0, 120) })
            : `HTTP ${response.status}：${body.slice(0, 120)}`,
        )
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}：${payload.message || body.slice(0, 120)}`)
      }
      if (payload.code !== 200) {
        throw new Error(payload.message || t('extraErrors.xmnoteRejected'))
      }
      result.sent += 1
    } catch (error) {
      result.failed += 1
      const msg = (error as Error).message ? localizeErrorMessage((error as Error).message) : t('extraErrors.xmnoteSendFailed')
      result.errors.push(`${book.title}：${msg}`)
    }
  }
  return result
}
