import { invoke } from '@tauri-apps/api/core'
import { t } from '../i18n'
import { localizeErrorMessage } from '../i18n/backendErrors'
import type { ApiResponse, DebugTrace } from '../types'

export type DebugStep = 'search' | 'bookInfo' | 'toc' | 'content'

export async function debugSourceStep(params: {
  bookSourceUrl: string
  step: DebugStep
  keyword?: string
  bookUrl?: string
  chapterUrl?: string
}): Promise<DebugTrace> {
  const res = await invoke<ApiResponse<DebugTrace>>('debug_source_step', { req: params })
  if (!res.isSuccess) throw new Error(localizeErrorMessage(res.errorMsg || t('extraErrors.debugFailed')))
  return res.data as DebugTrace
}
