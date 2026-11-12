import { beforeEach } from 'vitest'
import { setLocale } from '../i18n'

// Keep legacy upstream unit tests running in zh-CN unless a test explicitly switches locale.
beforeEach(() => {
  setLocale('zh-CN')
})
