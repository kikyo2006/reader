<template>
  <section class="editor-panel">
    <header class="editor-head">
      <div class="editor-title">
        <h3>{{ source ? source.bookSourceName : t('source.editor.workspace') }}</h3>
        <p>{{ source ? source.bookSourceUrl : t('source.editor.selectHint') }}</p>
      </div>
      <div class="editor-actions">
        <button class="mini-btn" type="button" @click="$emit('format')">{{ t('source.editor.format') }}</button>
        <button class="mini-btn primary" type="button" @click="$emit('save')">{{ t('source.editor.save') }}</button>
        <button
          v-if="source"
          class="mini-btn"
          type="button"
          :title="t('source.editor.more')"
          @click="$emit('more', $event)"
        >
          {{ t('source.editor.more') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </header>

    <nav class="editor-tabs" :aria-label="t('source.title')">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div v-if="activeTab === 'overview'" class="overview-pane">
      <template v-if="overview && source">
        <div class="overview-grid">
          <div class="overview-card">
            <span>{{ t('source.editor.status') }}</span>
            <strong>{{ source.enabled === false ? t('source.editor.disabled') : t('source.editor.enabled') }}</strong>
          </div>
          <div class="overview-card">
            <span>{{ t('source.editor.group') }}</span>
            <strong>{{ formatGroup(source.bookSourceGroup) }}</strong>
          </div>
          <div class="overview-card">
            <span>{{ t('source.editor.explore') }}</span>
            <strong>{{ source.enabledExplore === false ? t('source.editor.exploreDisabled') : t('source.editor.exploreEnabled') }}</strong>
          </div>
          <div class="overview-card">
            <span>{{ t('source.editor.cookie') }}</span>
            <strong>{{ source.enabledCookieJar ? t('source.editor.cookieIsolated') : t('source.editor.cookieDefault') }}</strong>
          </div>
        </div>

        <div class="rule-section">
          <h4>{{ t('source.editor.ruleCoverage') }}</h4>
          <div class="rule-chips">
            <span :class="{ active: overview.hasSearch }">{{ t('source.ruleTabs.search') }}</span>
            <span :class="{ active: overview.hasExplore }">{{ t('source.ruleTabs.find') }}</span>
            <span :class="{ active: overview.hasBookInfo }">{{ t('source.ruleTabs.detail') }}</span>
            <span :class="{ active: overview.hasToc }">{{ t('source.ruleTabs.directory') }}</span>
            <span :class="{ active: overview.hasContent }">{{ t('source.ruleTabs.content') }}</span>
            <span :class="{ active: overview.hasLogin }">{{ t('source.editor.tabLogin') }}</span>
          </div>
        </div>

        <div class="source-url-block">
          <span>{{ t('source.editor.sourceUrl') }}</span>
          <p>{{ source.bookSourceUrl }}</p>
        </div>
      </template>
      <div v-else class="editor-empty">
        <strong>{{ t('source.editor.emptyTitle') }}</strong>
        <span>{{ t('source.editor.emptyDesc') }}</span>
        <div class="empty-actions">
          <button class="mini-btn primary" type="button" @click="$emit('create')">{{ t('source.editor.newSource') }}</button>
          <button class="mini-btn" type="button" @click="$emit('import-local')">{{ t('source.editor.importLocal') }}</button>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'json'" class="json-pane">
      <textarea
        :value="editorText"
        class="editor-textarea"
        spellcheck="false"
        @input="$emit('update:editorText', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </div>

    <div v-else-if="activeTab === 'visual'" class="visual-pane">
      <SourceRuleEditor
        :source="source"
        :editor-text="editorText"
        @update:editor-text="$emit('update:editorText', $event)"
      />
    </div>

    <div v-else-if="activeTab === 'login'" class="login-pane">
      <div class="login-card">
        <h4>{{ t('source.login.title') }}</h4>
        <p v-if="canLogin">{{ t('source.login.descCanLogin') }}</p>
        <p v-else>{{ t('source.login.descCannotLogin') }}</p>
        <button class="mini-btn primary" type="button" :disabled="!canLogin || loginLoading" @click="$emit('login')">
          {{ loginLoading ? t('source.login.preparing') : t('source.login.openLogin') }}
        </button>
      </div>
    </div>

    <div v-else class="debug-pane">
      <SourceDebugger :source="source" :editor-text="editorText" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BookSource } from '../../types'
import { getBookSourceOverview, normalizeSourceGroupTag } from '../../utils/sourceSelection'
import SourceDebugger from './SourceDebugger.vue'
import SourceRuleEditor from './SourceRuleEditor.vue'
import { t } from '../../i18n'

function formatGroup(group?: string) {
  if (!group?.trim()) return t('bookshelf.groups.ungrouped')
  return normalizeSourceGroupTag(group, t('source.invalidGroupTag'))
}

type TabKey = 'overview' | 'visual' | 'json' | 'login' | 'debug'

const props = defineProps<{
  source: BookSource | null
  editorText: string
  canLogin: boolean
  loginLoading: boolean
  /** 每次 +1 触发面板切到可视化编辑 tab（用于新建书源）。 */
  resetSignal?: number
}>()

defineEmits<{
  'update:editorText': [value: string]
  format: []
  save: []
  login: []
  create: []
  'import-local': []
  /** 点击「更多」: 抛出点击事件以便在光标处弹出操作菜单。 */
  more: [event: MouseEvent]
}>()

const activeTab = ref<TabKey>('overview')
const tabs = computed<{ key: TabKey; label: string }[]>(() => [
  { key: 'overview', label: t('source.editor.tabOverview') },
  { key: 'visual', label: t('source.editor.tabVisual') },
  { key: 'json', label: t('source.editor.tabJson') },
  { key: 'debug', label: t('source.editor.tabDebug') },
  { key: 'login', label: t('source.editor.tabLogin') },
])

const overview = computed(() => getBookSourceOverview(props.source))

// 新建书源（source 为空）时切到可视化编辑 tab，避免停在空态概览让人以为没反应。
watch(
  () => props.resetSignal,
  () => {
    if (!props.source && props.resetSignal) {
      activeTab.value = 'visual'
    }
  },
)
</script>

<style scoped>
.editor-panel {
  min-height: 0;
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
}

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.editor-title {
  min-width: 0;
}

.editor-title h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-title p {
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.editor-actions,
.empty-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.editor-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.tab-btn {
  min-height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.tab-btn.active {
  background: var(--color-primary-soft-bg);
  color: var(--color-primary-soft-text);
}

.overview-pane,
.json-pane,
.login-pane,
.debug-pane,
.visual-pane {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.debug-pane,
.visual-pane {
  padding: 16px;
}

.overview-pane,
.login-pane {
  padding: 16px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.overview-card,
.login-card,
.source-url-block {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
}

.overview-card {
  padding: 12px;
}

.overview-card span,
.source-url-block span {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.overview-card strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
}

.rule-section {
  margin-top: 16px;
}

.rule-section h4,
.login-card h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.rule-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rule-chips span {
  padding: 5px 9px;
  border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.rule-chips span.active {
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

.source-url-block {
  margin-top: 16px;
  padding: 12px;
}

.source-url-block p {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.editor-textarea {
  width: 100%;
  min-height: 100%;
  resize: none;
  border: none;
  outline: none;
  padding: 16px;
  background: #181614;
  color: #f4ede4;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
  /* 输入光标同样别跟着主题走, 这个编辑器是固定深色底。 */
  caret-color: #f4ede4;
}

/* 这个编辑器是固定深色的(不跟随主题), 所以不能用全局 ::selection ——
   全局那套取 --color-text 作文字色, 亮色主题下是深灰 #20252a, 压在深色选区
   上对比度只有 1.06:1, 选中内容等于隐形。这里给编辑器单独的选区配色,
   亮/暗主题下都按其深色底来算。 */
.editor-textarea::selection {
  background: rgba(197, 111, 53, 0.42);
  color: #f4ede4;
}

.editor-empty {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: var(--color-text-tertiary);
}

.editor-empty strong {
  color: var(--color-text-secondary);
}

.login-card {
  padding: 16px;
}

.login-card p {
  margin-bottom: 14px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.mini-btn {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 12px;
  white-space: nowrap;
  transition: all var(--duration-fast);
}

.mini-btn.primary {
  background: var(--color-primary-soft-bg);
  border-color: var(--color-primary-soft-border);
  color: var(--color-primary-soft-text);
}

.mini-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.mini-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.mini-btn.primary:hover:not(:disabled) {
  background: var(--color-primary-soft-bg-hover);
  border-color: var(--color-primary);
}

@media (max-width: 560px) {
  .editor-head {
    flex-direction: column;
  }

  .editor-actions {
    width: 100%;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
