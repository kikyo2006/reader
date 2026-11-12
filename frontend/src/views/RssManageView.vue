<template>
  <div class="rss-manage-view">
    <header class="page-header">
      <div class="page-heading">
        <button class="icon-button back-button" type="button" :title="t('rss.backToRss')" :aria-label="t('rss.backToRss')" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div class="heading-copy">
          <div class="heading-kicker">RSS</div>
          <div class="heading-title-row">
            <h1>{{ t('rss.subscriptionTitle') }}</h1>
            <span class="summary">{{ t('rss.subscriptionSummary', { total: store.sources.length, enabled: enabledCount }) }}</span>
          </div>
        </div>
      </div>

      <div class="page-actions">
        <button class="icon-button" type="button" :title="t('rss.refreshList')" :aria-label="t('rss.refreshList')" @click="refreshAll">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 11a8 8 0 1 0-2.34 5.66" />
            <path d="M20 4v7h-7" />
          </svg>
        </button>
        <button class="icon-button" type="button" :title="t('rss.exportJson')" :aria-label="t('rss.exportJson')" @click="exportSources">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </button>
        <button class="secondary-button" type="button" @click="openImportDialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21V9" />
            <path d="m7 14 5-5 5 5" />
            <path d="M5 3h14" />
          </svg>
          <span>{{ t('rss.importAction') }}</span>
        </button>
        <button class="primary-button" type="button" @click="createSource">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>{{ t('rss.addSourceAction') }}</span>
        </button>
      </div>
    </header>

    <main class="workspace">
      <aside class="source-sidebar" :class="{ expanded: mobileSourceListExpanded }">
        <div class="sidebar-head">
          <div>
            <div class="sidebar-title">{{ t('rss.subscriptionSources') }}</div>
            <div class="sidebar-caption">
              {{ filterText || filterGroup ? t('rss.filteredCount', { count: filteredSources.length }) : t('rss.searchByNameLinkGroup') }}
            </div>
          </div>
          <button
            v-if="filteredSources.length"
            class="quiet-button select-toggle"
            type="button"
            :aria-pressed="allFilteredSelected"
            @click="toggleFilteredSelection"
          >
            {{ allFilteredSelected ? t('rss.unselectAllShort') : t('rss.selectAllShort') }}
          </button>
        </div>
        <div class="source-filters">
          <label class="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input v-model.trim="filterText" type="search" :placeholder="t('rss.searchSubscriptionPlaceholder')" :aria-label="t('rss.searchSubscriptionPlaceholder')" />
            <button
              v-if="filterText"
              class="search-clear"
              type="button"
              :title="t('rss.clearSearch')"
              :aria-label="t('rss.clearSearch')"
              @click="filterText = ''"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </label>
          <label class="group-select">
            <span class="sr-only">{{ t('rss.filterByGroup') }}</span>
            <select v-model="filterGroup">
              <option value="">{{ t('rss.allGroups') }}</option>
              <option v-for="group in groupList" :key="group" :value="group">{{ group }}</option>
            </select>
          </label>
        </div>

        <div class="source-list">
          <div v-if="!filteredSources.length" class="source-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1" />
            </svg>
            <strong>{{ store.sources.length ? t('rss.noMatchedSources') : t('rss.emptySources') }}</strong>
            <span>{{ store.sources.length ? t('rss.adjustFilterHint') : t('rss.addOrImportHint') }}</span>
          </div>

          <button
            v-for="source in filteredSources"
            :key="source.sourceUrl"
            type="button"
            class="source-row"
            :class="{
              active: editingSource?.sourceUrl === source.sourceUrl,
              selected: selectedSourceUrls.has(source.sourceUrl),
              disabled: source.enabled === false,
            }"
            @click="editSource(source)"
            @contextmenu.prevent="handleSourceContextMenu($event, source)"
          >
            <label class="row-check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedSourceUrls.has(source.sourceUrl)"
                :aria-label="t('rss.selectItemAria', { name: source.sourceName })"
                @change="toggleSourceSelection(source)"
              />
            </label>

            <span class="source-avatar" aria-hidden="true">
              <span>{{ sourceInitial(source) }}</span>
              <img
                v-if="source.sourceIcon"
                :src="source.sourceIcon"
                alt=""
                @error="hideBrokenIcon"
              />
            </span>

            <span class="source-copy">
              <span class="source-name-line">
                <strong>{{ source.sourceName }}</strong>
                <span v-if="source.singleUrl" class="mode-tag">{{ t('rss.singlePageTag') }}</span>
              </span>
              <span class="source-url">{{ source.sourceUrl }}</span>
              <span v-if="source.sourceGroup" class="source-group-line">{{ formatGroups(source.sourceGroup) }}</span>
            </span>

            <span class="source-row-actions">
              <span
                class="switch-control"
                :class="{ on: source.enabled !== false }"
                role="switch"
                :aria-checked="source.enabled !== false"
                :aria-label="source.enabled === false ? t('rss.enableItemAria', { name: source.sourceName }) : t('rss.disableItemAria', { name: source.sourceName })"
                tabindex="0"
                @click.stop="toggleSource(source)"
                @keydown.enter.prevent.stop="toggleSource(source)"
                @keydown.space.prevent.stop="toggleSource(source)"
              >
                <span></span>
              </span>
              <button
                class="row-delete"
                type="button"
                :title="t('rss.deleteItemAria', { name: source.sourceName })"
                :aria-label="t('rss.deleteItemAria', { name: source.sourceName })"
                @click.stop="handleDelete(source)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </span>
          </button>
        </div>

        <button
          v-if="isStackedLayout"
          class="mobile-list-toggle"
          type="button"
          @click="toggleMobileSourceList"
        >
          {{ mobileSourceListExpanded ? t('rss.collapseSourceList') : t('rss.expandSourceList', { count: filteredSources.length }) }}
        </button>

        <div
          v-if="mobileSourceListExpanded"
          class="mobile-list-scrim"
          aria-hidden="true"
          @click="mobileSourceListExpanded = false"
        ></div>

        <div v-if="selectedFilteredSources.length" class="selection-bar">
          <span>{{ t('rss.selectedCountShort', { count: selectedFilteredSources.length }) }}</span>
          <button class="quiet-button" type="button" @click="clearSelection">{{ t('common.clear') }}</button>
          <button class="danger-button" type="button" @click="handleBulkDelete">{{ t('common.delete') }}</button>
        </div>
      </aside>

      <section class="source-editor">
        <header class="editor-head">
          <div class="editor-title-block">
            <div class="editor-kicker">{{ editingSource ? t('rss.editSubscriptionSource') : t('rss.newSubscriptionSource') }}</div>
            <div class="editor-title-line">
              <h2>{{ formState.sourceName || t('rss.unnamedSource') }}</h2>
              <span v-if="editingSource" class="editor-state" :class="{ off: formState.enabled === false }">
                {{ formState.enabled === false ? t('rss.stateDisabled') : t('rss.stateEnabled') }}
              </span>
              <span v-else class="editor-state draft">{{ t('rss.stateDraft') }}</span>
            </div>
            <p>{{ formState.sourceUrl || t('rss.fillUrlToSaveHint') }}</p>
          </div>
          <label class="header-switch">
            <span>{{ t('rss.enableSwitchLabel') }}</span>
            <span class="switch-control" :class="{ on: formState.enabled }" aria-hidden="true">
              <span></span>
            </span>
            <input v-model="formState.enabled" type="checkbox" :aria-label="t('rss.enableSource')" />
          </label>
        </header>

        <nav class="editor-tabs" :aria-label="t('rss.editorCategoriesAria')">
          <button
            v-for="tab in editorTabs"
            :key="tab.key"
            type="button"
            :class="{ active: activeEditorTab === tab.key }"
            @click="activeEditorTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </nav>

        <form id="rss-source-form" class="editor-scroll" @submit.prevent="saveEditor">
          <div v-show="activeEditorTab === 'basic'" class="tab-panel">
            <section class="form-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.basicInfoTitle') }}</h3>
                  <p>{{ t('rss.basicInfoDesc') }}</p>
                </div>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>{{ t('rss.sourceName') }}</span>
                  <input ref="sourceNameInputRef" v-model.trim="formState.sourceName" :placeholder="t('rss.sourceNameExample')" />
                </label>
                <label class="field">
                  <span>{{ t('rss.iconUrl') }}</span>
                  <input v-model.trim="formState.sourceIcon" :placeholder="t('rss.iconUrlOptionalPlaceholder')" />
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.sourceUrl') }}</span>
                  <input v-model.trim="formState.sourceUrl" inputmode="url" placeholder="https://example.com/feed.xml" />
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.group') }}</span>
                  <input v-model.trim="formState.sourceGroup" :placeholder="t('rss.groupPlaceholder')" />
                  <span class="field-hint">{{ t('rss.groupFilterHint') }}</span>
                </label>
                <div v-if="groupList.length" class="group-suggestions full-span">
                  <span>{{ t('rss.existingGroups') }}</span>
                  <div>
                    <button
                      v-for="group in groupList"
                      :key="group"
                      type="button"
                      class="group-chip"
                      :class="{ active: currentEditorGroups.includes(group) }"
                      @click="toggleEditorGroup(group)"
                    >
                      {{ group }}
                    </button>
                  </div>
                </div>
                <label class="field full-span">
                  <span>{{ t('rss.comment') }}</span>
                  <textarea v-model.trim="formState.sourceComment" rows="2" :placeholder="t('rss.optional')"></textarea>
                </label>
              </div>
            </section>

            <section class="form-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.behaviorTitle') }}</h3>
                  <p>{{ t('rss.behaviorDesc') }}</p>
                </div>
              </div>
              <div class="switch-grid">
                <label class="setting-row">
                  <span>
                    <strong>{{ t('rss.singleUrlMode') }}</strong>
                    <small>{{ t('rss.singleUrlDesc') }}</small>
                  </span>
                  <span class="switch-control" :class="{ on: formState.singleUrl }" aria-hidden="true">
                    <span></span>
                  </span>
                  <input v-model="formState.singleUrl" type="checkbox" />
                </label>
                <label class="setting-row">
                  <span>
                    <strong>CookieJar</strong>
                    <small>{{ t('rss.cookieJarDesc') }}</small>
                  </span>
                  <span class="switch-control" :class="{ on: formState.enabledCookieJar }" aria-hidden="true">
                    <span></span>
                  </span>
                  <input v-model="formState.enabledCookieJar" type="checkbox" />
                </label>
                <label class="setting-row">
                  <span>
                    <strong>{{ t('rss.enableJsTitle') }}</strong>
                    <small>{{ t('rss.enableJsDesc') }}</small>
                  </span>
                  <span class="switch-control" :class="{ on: formState.enableJs }" aria-hidden="true">
                    <span></span>
                  </span>
                  <input v-model="formState.enableJs" type="checkbox" />
                </label>
                <label class="setting-row">
                  <span>
                    <strong>{{ t('rss.loadWithBaseUrlTitle') }}</strong>
                    <small>{{ t('rss.loadWithBaseUrlDesc') }}</small>
                  </span>
                  <span class="switch-control" :class="{ on: formState.loadWithBaseUrl }" aria-hidden="true">
                    <span></span>
                  </span>
                  <input v-model="formState.loadWithBaseUrl" type="checkbox" />
                </label>
              </div>
            </section>

            <section class="form-section last-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.displayOrderTitle') }}</h3>
                  <p>{{ t('rss.displayOrderDesc') }}</p>
                </div>
              </div>
              <div class="form-grid three-columns">
                <label class="field">
                  <span>{{ t('rss.sortUrl') }}</span>
                  <input v-model.trim="formState.sortUrl" :placeholder="t('rss.sortUrlPlaceholder')" />
                </label>
                <label class="field">
                  <span>{{ t('rss.customOrder') }}</span>
                  <input v-model.number="formState.customOrder" type="number" placeholder="0" />
                </label>
                <label class="field">
                  <span>{{ t('rss.articleStyle') }}</span>
                  <input v-model.number="formState.articleStyle" type="number" placeholder="0" />
                </label>
              </div>
            </section>
          </div>

          <div v-show="activeEditorTab === 'rules'" class="tab-panel">
            <section class="form-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.listParsingTitle') }}</h3>
                  <p>{{ t('rss.listParsingDesc') }}</p>
                </div>
              </div>
              <div class="form-grid">
                <label class="field full-span">
                  <span>{{ t('rss.ruleArticles') }}</span>
                  <textarea v-model.trim="formState.ruleArticles" rows="2" placeholder="ruleArticles"></textarea>
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.ruleNextPage') }}</span>
                  <input v-model.trim="formState.ruleNextPage" placeholder="ruleNextPage" />
                </label>
                <label class="field">
                  <span>{{ t('rss.ruleTitle') }}</span>
                  <input v-model.trim="formState.ruleTitle" placeholder="ruleTitle" />
                </label>
                <label class="field">
                  <span>{{ t('rss.rulePubDate') }}</span>
                  <input v-model.trim="formState.rulePubDate" placeholder="rulePubDate" />
                </label>
                <label class="field">
                  <span>{{ t('rss.ruleDescription') }}</span>
                  <input v-model.trim="formState.ruleDescription" placeholder="ruleDescription" />
                </label>
                <label class="field">
                  <span>{{ t('rss.ruleImage') }}</span>
                  <input v-model.trim="formState.ruleImage" placeholder="ruleImage" />
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.ruleLink') }}</span>
                  <input v-model.trim="formState.ruleLink" placeholder="ruleLink" />
                </label>
              </div>
            </section>

            <section class="form-section last-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.contentStyleTitle') }}</h3>
                  <p>{{ t('rss.contentStyleDesc') }}</p>
                </div>
              </div>
              <div class="form-grid">
                <label class="field full-span">
                  <span>{{ t('rss.ruleContent') }}</span>
                  <textarea v-model.trim="formState.ruleContent" rows="4" placeholder="ruleContent"></textarea>
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.style') }}</span>
                  <textarea v-model.trim="formState.style" rows="3" :placeholder="t('rss.styleOptionalPlaceholder')"></textarea>
                </label>
              </div>
            </section>
          </div>

          <div v-show="activeEditorTab === 'advanced'" class="tab-panel">
            <section class="form-section">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.requestSettingsTitle') }}</h3>
                  <p>{{ t('rss.requestSettingsDesc') }}</p>
                </div>
              </div>
              <div class="form-grid">
                <label class="field">
                  <span>{{ t('rss.concurrentRate') }}</span>
                  <input v-model.trim="formState.concurrentRate" :placeholder="t('rss.concurrentRatePlaceholder')" />
                </label>
                <label class="field">
                  <span>{{ t('rss.loginUrl') }}</span>
                  <input v-model.trim="formState.loginUrl" :placeholder="t('rss.optional')" />
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.header') }}</span>
                  <textarea v-model.trim="formState.header" rows="4" :placeholder="t('rss.headerPlaceholder')"></textarea>
                </label>
                <label class="field full-span">
                  <span>{{ t('rss.loginCheckJs') }}</span>
                  <textarea v-model.trim="formState.loginCheckJs" rows="3" :placeholder="t('rss.optional')"></textarea>
                </label>
              </div>
            </section>

            <section class="form-section last-section danger-zone">
              <div class="section-heading">
                <div>
                  <h3>{{ t('rss.sourceManageDangerTitle') }}</h3>
                  <p>{{ editingSource ? t('rss.deleteWarningHint') : t('rss.saveToManageHint') }}</p>
                </div>
                <button
                  v-if="editingSource"
                  class="danger-button"
                  type="button"
                  @click="handleDelete(editingSource)"
                >
                  {{ t('rss.deleteThisSource') }}
                </button>
              </div>
            </section>
          </div>
        </form>

        <footer class="editor-footer">
          <div class="footer-status">
            <span v-if="editingSource" class="save-target">{{ editingSource.sourceName }}</span>
            <span v-else class="save-target">{{ t('rss.newSubscriptionSource') }}</span>
            <span class="footer-divider"></span>
            <span>{{ t('rss.currentTabLabel', { label: activeTabLabel }) }}</span>
          </div>
          <div class="footer-actions">
            <button class="secondary-button" type="button" @click="resetEditor">{{ t('common.reset') }}</button>
            <button class="primary-button" type="submit" form="rss-source-form" :disabled="saving">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 4h12l2 2v14H5z" />
                <path d="M8 4v6h8V4M8 20v-6h8v6" />
              </svg>
              <span>{{ saving ? t('common.saving') : t('common.save') }}</span>
            </button>
          </div>
        </footer>
      </section>
    </main>

    <input ref="fileInputRef" type="file" accept=".json,.txt" class="hidden-input" @change="handleFileImport" />

    <div v-if="importDialogOpen" class="dialog-backdrop" @click.self="closeImportDialog">
      <section class="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title">
        <header class="dialog-head">
          <div>
            <h2 id="import-dialog-title">{{ t('rss.importDialogTitle') }}</h2>
            <p>{{ t('rss.importDialogDesc') }}</p>
          </div>
          <button class="icon-button" type="button" :title="t('common.close')" :aria-label="t('common.close')" @click="closeImportDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <button class="import-option" type="button" @click="triggerFileImport">
          <span class="import-option-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 4h6l2 2h8v13H4z" />
              <path d="M12 10v6M9.5 12.5 12 10l2.5 2.5" />
            </svg>
          </span>
          <span>
            <strong>{{ t('rss.localJsonFile') }}</strong>
            <small>{{ t('rss.localJsonSupportHint') }}</small>
          </span>
          <svg class="option-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <div class="dialog-separator"><span>{{ t('rss.orDivider') }}</span></div>

        <form class="remote-import" @submit.prevent="importRemoteJson">
          <label class="field">
            <span>{{ t('rss.remoteJsonLabel') }}</span>
            <input v-model.trim="remoteJsonUrl" inputmode="url" placeholder="https://example.com/rss-sources.json" />
          </label>
          <button class="primary-button" type="submit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span>{{ t('rss.remoteImportAction') }}</span>
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { readRemoteRssSourceFile, readRssSourceFile, saveRssSource } from '../api/rss'
import { useAppStore } from '../stores/app'
import { useRssStore } from '../stores/rss'
import { showContextMenu } from '../composables/useContextMenu'
import type { RssSource } from '../types'
import { getVisibleSelection } from '../utils/sourceSelection'
import { t } from '../i18n'

type EditorTab = 'basic' | 'rules' | 'advanced'

const router = useRouter()
const appStore = useAppStore()
const store = useRssStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const sourceNameInputRef = ref<HTMLInputElement | null>(null)
const remoteJsonUrl = ref('')
const filterText = ref('')
const filterGroup = ref('')
const editingSource = ref<RssSource | null>(null)
const formState = reactive<RssSource>(createEmptySource())
const selectedSourceUrls = ref(new Set<string>())
const activeEditorTab = ref<EditorTab>('basic')
const importDialogOpen = ref(false)
const saving = ref(false)
const mobileSourceListExpanded = ref(false)
const isStackedLayout = ref(false)

const editorTabs = computed<Array<{ key: EditorTab; label: string }>>(() => [
  { key: 'basic', label: t('rss.tabBasic') },
  { key: 'rules', label: t('rss.tabRules') },
  { key: 'advanced', label: t('rss.tabAdvanced') },
])

const activeTabLabel = computed(
  () => editorTabs.value.find((tab) => tab.key === activeEditorTab.value)?.label || t('rss.tabBasic'),
)

const groupList = computed(() => {
  const groups = new Set<string>()
  store.sources.forEach((source) => {
    splitGroups(source.sourceGroup).forEach((group) => groups.add(group))
  })
  return Array.from(groups).sort()
})

const currentEditorGroups = computed(() => splitGroups(formState.sourceGroup))

const filteredSources = computed(() => {
  let list = store.sources
  if (filterText.value) {
    const keyword = filterText.value.toLowerCase()
    list = list.filter((source) =>
      source.sourceName.toLowerCase().includes(keyword)
      || source.sourceUrl.toLowerCase().includes(keyword)
      || source.sourceGroup?.toLowerCase().includes(keyword),
    )
  }
  if (filterGroup.value) {
    list = list.filter((source) => splitGroups(source.sourceGroup).includes(filterGroup.value))
  }
  return list
})

const selectedFilteredSources = computed(() =>
  getVisibleSelection(filteredSources.value, selectedSourceUrls.value, (source) => source.sourceUrl),
)

const allFilteredSelected = computed(
  () => filteredSources.value.length > 0
    && selectedFilteredSources.value.length === filteredSources.value.length,
)

const enabledCount = computed(
  () => store.sources.filter((source) => source.enabled !== false).length,
)

onMounted(async () => {
  window.addEventListener('keydown', handleWindowKeydown)
  window.addEventListener('resize', syncLayoutMode)
  syncLayoutMode()
  // Returning within the SPA can keep an already loaded list in Pinia;
  // refetching here would clear it before the editor gets its first selection.
  if (!store.sources.length) await store.fetchSources()
  selectInitialSource()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  window.removeEventListener('resize', syncLayoutMode)
})

function splitGroups(value?: string) {
  return (value || '')
    .split(/[,;，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatGroups(value: string) {
  return splitGroups(value).join(' · ')
}

function sourceInitial(source: RssSource) {
  return source.sourceName.trim().charAt(0).toUpperCase() || 'R'
}

function hideBrokenIcon(event: Event) {
  ;(event.target as HTMLImageElement).style.display = 'none'
}

function createEmptySource(): RssSource {
  return {
    sourceName: '',
    sourceUrl: '',
    enabled: true,
    enabledCookieJar: true,
    enableJs: true,
    loadWithBaseUrl: true,
    singleUrl: false,
    sourceGroup: '',
    sourceIcon: '',
    customOrder: 0,
    articleStyle: 0,
    lastUpdateTime: 0,
  }
}

function replaceFormState(next: RssSource) {
  Object.assign(formState, createEmptySource(), next)
}

function toggleEditorGroup(group: string) {
  const groups = new Set(currentEditorGroups.value)
  if (groups.has(group)) {
    groups.delete(group)
  } else {
    groups.add(group)
  }
  formState.sourceGroup = Array.from(groups).join(', ')
}

async function refreshAll() {
  await store.fetchSources()
  appStore.showToast(t('rss.sourcesRefreshed'), 'success')
}

function goBack() {
  router.push('/rss')
}

function editSource(source: RssSource) {
  editingSource.value = source
  replaceFormState(source)
  activeEditorTab.value = 'basic'
  if (isStackedLayout.value) mobileSourceListExpanded.value = false
}

/**
 * 管理页每次挂载都会重新拉取源；SPA 内往返时 store 可能已有列表，
 * 因此不能只依赖 `fetchSources()` 之后有没有源，必须在这里统一选中第一项。
 */
function selectInitialSource() {
  if (editingSource.value) {
    const latest = store.sources.find((source) => source.sourceUrl === editingSource.value?.sourceUrl)
    if (latest) {
      editSource(latest)
      return
    }
  }
  if (store.sources.length) {
    editSource(store.sources[0]!)
    return
  }
  createSource()
}

function createSource() {
  editingSource.value = null
  replaceFormState(createEmptySource())
  activeEditorTab.value = 'basic'
  void nextTick(() => sourceNameInputRef.value?.focus())
}

function resetEditor() {
  if (editingSource.value) {
    replaceFormState(editingSource.value)
    return
  }
  replaceFormState(createEmptySource())
}

async function saveEditor() {
  if (saving.value) return
  saving.value = true
  try {
    const parsed = {
      ...createEmptySource(),
      ...formState,
      sourceName: formState.sourceName?.trim() || '',
      sourceUrl: formState.sourceUrl?.trim() || '',
      sourceGroup: formState.sourceGroup?.trim() || '',
      sortUrl: formState.sortUrl?.trim() || '',
      sourceIcon: formState.sourceIcon?.trim() || '',
      sourceComment: formState.sourceComment?.trim() || '',
      header: formState.header?.trim() || '',
      loginUrl: formState.loginUrl?.trim() || '',
      loginCheckJs: formState.loginCheckJs?.trim() || '',
      concurrentRate: formState.concurrentRate?.trim() || '',
      ruleArticles: formState.ruleArticles?.trim() || '',
      ruleNextPage: formState.ruleNextPage?.trim() || '',
      ruleTitle: formState.ruleTitle?.trim() || '',
      rulePubDate: formState.rulePubDate?.trim() || '',
      ruleDescription: formState.ruleDescription?.trim() || '',
      ruleImage: formState.ruleImage?.trim() || '',
      ruleLink: formState.ruleLink?.trim() || '',
      ruleContent: formState.ruleContent?.trim() || '',
      style: formState.style?.trim() || '',
    } as RssSource
    if (!parsed.sourceName) throw new Error(t('rss.nameRequired'))
    if (!parsed.sourceUrl) throw new Error(t('rss.urlRequired'))
    await saveRssSource(parsed)
    await store.fetchSources()
    const latest = store.sources.find((item) => item.sourceUrl === parsed.sourceUrl)
    if (latest) editSource(latest)
    appStore.showToast(t('rss.savedSuccess'), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('common.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}

async function toggleSource(source: RssSource) {
  const next = { ...source, enabled: source.enabled === false }
  try {
    await saveRssSource(next)
    Object.assign(source, next)
    if (editingSource.value?.sourceUrl === source.sourceUrl) {
      editSource(next)
    }
    appStore.showToast(next.enabled ? t('rss.sourceEnabledToast') : t('rss.sourceDisabledToast'), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('common.saveFailed'), 'error')
  }
}

async function handleDelete(source: RssSource) {
  const ok = await appStore.confirmDialog(t('rss.confirmDeleteSource', { name: source.sourceName }), {
    title: t('rss.deleteSourceTitle'),
    danger: true,
  })
  if (!ok) return
  try {
    await store.removeSource(source)
    selectedSourceUrls.value.delete(source.sourceUrl)
    if (editingSource.value?.sourceUrl === source.sourceUrl) {
      if (store.sources.length) {
        editSource(store.sources[0]!)
      } else {
        createSource()
      }
    }
    appStore.showToast(t('rss.deletedSuccess'), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('common.deleteFailed'), 'error')
  }
}

function handleSourceContextMenu(event: MouseEvent, source: RssSource) {
  const enabled = source.enabled !== false
  showContextMenu(event, [
    { label: t('common.edit'), action: () => editSource(source) },
    {
      label: enabled ? t('common.disable') : t('common.enable'),
      action: () => toggleSource(source),
    },
    { divider: true },
    { label: t('common.delete'), danger: true, action: () => handleDelete(source) },
  ], source)
}

async function handleBulkDelete() {
  const targets = selectedFilteredSources.value
  if (!targets.length) {
    appStore.showToast(t('rss.selectSourcesToDelete'), 'warning')
    return
  }
  const ok = await appStore.confirmDialog(t('rss.confirmBulkDelete', { count: targets.length }), {
    title: t('rss.bulkDeleteTitle'),
    danger: true,
  })
  if (!ok) return
  try {
    const targetUrls = new Set(targets.map((source) => source.sourceUrl))
    const deleted = await store.removeSources(targets)
    selectedSourceUrls.value.clear()
    if (editingSource.value && targetUrls.has(editingSource.value.sourceUrl)) {
      if (store.sources.length) {
        editSource(store.sources[0]!)
      } else {
        createSource()
      }
    }
    appStore.showToast(t('rss.bulkDeleteSuccess', { count: deleted || targets.length }), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('rss.bulkDeleteFailed'), 'error')
  }
}

function toggleSourceSelection(source: RssSource) {
  const selected = selectedSourceUrls.value
  if (selected.has(source.sourceUrl)) {
    selected.delete(source.sourceUrl)
  } else {
    selected.add(source.sourceUrl)
  }
}

function toggleFilteredSelection() {
  const selected = selectedSourceUrls.value
  if (allFilteredSelected.value) {
    filteredSources.value.forEach((source) => selected.delete(source.sourceUrl))
    return
  }
  filteredSources.value.forEach((source) => selected.add(source.sourceUrl))
}

function clearSelection() {
  selectedSourceUrls.value.clear()
}

function pruneSelection() {
  const availableUrls = new Set(store.sources.map((source) => source.sourceUrl))
  Array.from(selectedSourceUrls.value).forEach((url) => {
    if (!availableUrls.has(url)) selectedSourceUrls.value.delete(url)
  })
}

function openImportDialog() {
  importDialogOpen.value = true
}

function closeImportDialog() {
  importDialogOpen.value = false
  remoteJsonUrl.value = ''
}

function triggerFileImport() {
  fileInputRef.value?.click()
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const imported = await readRssSourceFile(file)
    if (!imported.length) throw new Error(t('rss.noImportableSources'))
    await store.addSources(imported)
    closeImportDialog()
    appStore.showToast(t('rss.importSuccess', { count: imported.length }), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('common.importFailed'), 'error')
  } finally {
    input.value = ''
  }
}

async function importRemoteJson() {
  if (!remoteJsonUrl.value) {
    appStore.showToast(t('rss.enterRemoteUrlPrompt'), 'warning')
    return
  }
  try {
    const raw = await readRemoteRssSourceFile(remoteJsonUrl.value)
    const parsed = raw.flatMap((item) => {
      try {
        const value = JSON.parse(item)
        return Array.isArray(value) ? value : [value]
      } catch {
        return []
      }
    }) as RssSource[]
    if (!parsed.length) throw new Error(t('rss.invalidRemoteJson'))
    await store.addSources(parsed)
    closeImportDialog()
    appStore.showToast(t('rss.importSuccess', { count: parsed.length }), 'success')
  } catch (error) {
    appStore.showToast((error as Error).message || t('rss.remoteImportFailed'), 'error')
  }
}

function exportSources() {
  const blob = new Blob([JSON.stringify(store.sources, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `reader-rss-sources-${Date.now()}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && importDialogOpen.value) {
    closeImportDialog()
  }
}

function syncLayoutMode() {
  isStackedLayout.value = window.innerWidth <= 860
  if (!isStackedLayout.value) mobileSourceListExpanded.value = false
}

function toggleMobileSourceList() {
  mobileSourceListExpanded.value = !mobileSourceListExpanded.value
}

watch(() => store.sources, pruneSelection)
</script>

<style scoped>
.rss-manage-view {
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 24px 20px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 58px;
  flex: 0 0 auto;
}

.page-heading,
.page-actions,
.heading-title-row,
.editor-title-line,
.footer-actions,
.footer-status {
  display: flex;
  align-items: center;
}

.page-heading {
  gap: 12px;
  min-width: 0;
}

.heading-copy {
  min-width: 0;
}

.heading-kicker,
.editor-kicker {
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.heading-title-row {
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.heading-title-row h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
}

.summary {
  padding-left: 3px;
  color: var(--color-text-tertiary);
  font-size: 11px;
  white-space: nowrap;
}

.page-actions {
  gap: 8px;
  flex-shrink: 0;
}

.icon-button,
.secondary-button,
.primary-button,
.quiet-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.icon-button {
  width: 36px;
  flex: 0 0 36px;
  padding: 0;
}

.secondary-button,
.primary-button {
  padding: 0 13px;
}

.quiet-button,
.danger-button {
  min-height: 28px;
  padding: 0 9px;
  border-color: transparent;
  background: transparent;
  font-size: 12px;
}

.icon-button svg,
.secondary-button svg,
.primary-button svg {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.icon-button:hover,
.secondary-button:hover,
.quiet-button:hover {
  border-color: var(--color-border);
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.primary-button {
  border-color: var(--color-primary-soft-border);
  background: var(--color-primary-soft-bg);
  color: var(--color-primary-soft-text);
}

.primary-button:hover:not(:disabled) {
  border-color: var(--color-primary-border);
  background: var(--color-primary-soft-bg-hover);
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.danger-button {
  color: var(--color-danger);
}

.danger-button:hover {
  background: color-mix(in srgb, var(--color-danger) 9%, transparent);
}

.back-button {
  flex-basis: 38px;
  width: 38px;
  height: 38px;
}

.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 324px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-xs);
}

.source-sidebar {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-bg) 64%, var(--color-bg-elevated));
}

.sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 17px 16px 12px;
}

.sidebar-title {
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
}

.sidebar-caption {
  margin-top: 2px;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.select-toggle {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
}

.source-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 114px;
  gap: 7px;
  padding: 0 12px 12px;
}

.search-field,
.group-select {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.search-field:focus-within,
.group-select:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.search-field > svg {
  width: 15px;
  height: 15px;
  margin-left: 10px;
  color: var(--color-text-tertiary);
  flex: 0 0 auto;
}

.search-field input,
.group-select select {
  width: 100%;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
}

.search-field input {
  padding: 0 30px 0 7px;
}

.group-select select {
  padding: 0 8px;
}

.search-clear {
  position: absolute;
  right: 7px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
}

.search-clear:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.search-clear svg {
  width: 13px;
  height: 13px;
}

.source-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 8px 56px;
  overscroll-behavior: contain;
}

.source-row {
  position: relative;
    width: 100%;
    min-height: 64px;
  display: flex;
  align-items: center;
  gap: 9px;
    padding: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-align: left;
  transition:
    background var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);
}

.source-row + .source-row {
    margin-top: 1px;
}

.source-row:hover {
  background: var(--color-bg-hover);
}

.source-row.active {
  border-color: var(--color-selected-border);
  background: var(--color-selected-bg);
}

.source-row.active::before {
  content: '';
  position: absolute;
  left: -1px;
    top: 12px;
    bottom: 12px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary);
}

.source-row.selected {
  border-color: var(--color-selected-border);
}

.source-row.disabled .source-copy {
  opacity: 0.55;
}

.row-check {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  display: grid;
  place-items: center;
}

.row-check input {
  width: 14px;
  height: 14px;
  margin: 0;
  opacity: 0;
  transition: opacity var(--duration-fast);
}

.source-row:hover .row-check input,
.source-row:focus-within .row-check input,
.source-row.selected .row-check input {
  opacity: 1;
}

.source-avatar {
  position: relative;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-primary-soft-text);
  font-size: 13px;
  font-weight: 700;
}

.source-avatar img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--color-bg-elevated);
}

.source-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.source-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.source-name-line strong {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-tag {
  flex: 0 0 auto;
  padding: 1px 5px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-active);
  color: var(--color-text-tertiary);
  font-size: 9px;
  font-weight: 700;
}

.source-url,
.source-group-line {
  overflow: hidden;
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-group-line {
  color: var(--color-text-secondary);
}

.source-row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}

.switch-control {
  position: relative;
  width: 30px;
  height: 18px;
  flex: 0 0 30px;
  display: inline-block;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-sunken);
  transition:
    background var(--duration-fast),
    border-color var(--duration-fast);
}

.switch-control > span {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
  background: var(--color-text-tertiary);
  transition:
    transform var(--duration-fast),
    background var(--duration-fast);
}

.switch-control.on {
  border-color: var(--color-primary-soft-border);
  background: var(--color-primary-soft-bg);
}

.switch-control.on > span {
  transform: translateX(12px);
  background: var(--color-primary-soft-text);
}

.row-delete {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  opacity: 0;
  transition:
    opacity var(--duration-fast),
    background var(--duration-fast),
    color var(--duration-fast);
}

.source-row:hover .row-delete,
.source-row:focus-within .row-delete,
.source-row.active .row-delete {
  opacity: 1;
}

.row-delete:hover {
  background: color-mix(in srgb, var(--color-danger) 9%, transparent);
  color: var(--color-danger);
}

.row-delete svg {
  width: 14px;
  height: 14px;
}

.source-empty {
  height: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 24px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.source-empty svg {
  width: 28px;
  height: 28px;
  margin-bottom: 5px;
  opacity: 0.7;
}

.source-empty strong {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.source-empty span {
  font-size: 11px;
}

.selection-bar {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 42px;
  padding: 5px 6px 5px 12px;
  border: 1px solid var(--color-selected-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 94%, var(--color-primary) 6%);
  box-shadow: var(--shadow-sm);
  color: var(--color-text-secondary);
  font-size: 11px;
}

.selection-bar > span {
  flex: 1;
}

.mobile-list-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  margin: 0 12px 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.mobile-list-toggle:hover {
  border-color: var(--color-border);
  color: var(--color-text);
}

.source-editor {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  background: var(--color-bg-elevated);
}

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 22px 13px;
}

.editor-title-block {
  min-width: 0;
}

.editor-title-line {
  gap: 9px;
  min-width: 0;
  margin-top: 3px;
}

.editor-title-line h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-state {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-success) 10%, transparent);
  color: var(--color-success);
  font-size: 9px;
  font-weight: 700;
}

.editor-state.off {
  background: var(--color-bg-active);
  color: var(--color-text-tertiary);
}

.editor-state.draft {
  background: var(--color-primary-soft-bg);
  color: var(--color-primary-soft-text);
}

.editor-title-block p {
  overflow: hidden;
  max-width: 720px;
  margin: 5px 0 0;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.header-switch input,
.setting-row > input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.editor-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
  padding: 0 22px;
  border-bottom: 1px solid var(--color-border-light);
}

.editor-tabs button {
  position: relative;
  align-self: stretch;
  padding: 0 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 600;
}

.editor-tabs button::after {
  content: '';
  position: absolute;
  left: 9px;
  right: 9px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: transparent;
}

.editor-tabs button:hover {
  color: var(--color-text-secondary);
}

.editor-tabs button.active {
  color: var(--color-text);
}

.editor-tabs button.active::after {
  background: var(--color-primary);
}

.editor-scroll {
  min-height: 0;
  overflow: auto;
  padding: 0 22px 22px;
  overscroll-behavior: contain;
}

.tab-panel {
  max-width: 980px;
  margin: 0 auto;
}

.form-section {
  padding: 20px 0 22px;
  border-bottom: 1px solid var(--color-border-light);
}

.form-section.last-section {
  border-bottom: 0;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.section-heading h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 700;
}

.section-heading p {
  margin: 3px 0 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 16px;
}

.form-grid.three-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.full-span {
  grid-column: 1 / -1;
}

.field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field > span:first-child,
.group-suggestions > span {
  color: var(--color-text-secondary);
  font-size: 11px;
  font-weight: 600;
}

.field input,
.field textarea,
.remote-import input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 12px;
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast),
    background var(--duration-fast);
}

.field input,
.remote-import input {
  height: 38px;
  padding: 0 11px;
}

.field textarea {
  min-height: 64px;
  padding: 9px 11px;
  line-height: 1.5;
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.remote-import input:focus {
  border-color: var(--color-primary);
  background: var(--color-bg-elevated);
  box-shadow: var(--focus-ring);
}

.field input::placeholder,
.field textarea::placeholder,
.remote-import input::placeholder,
.search-field input::placeholder {
  color: var(--color-text-tertiary);
}

.field-hint {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.group-suggestions {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: -4px;
}

.group-suggestions > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.group-chip {
  min-height: 27px;
  padding: 0 9px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 10px;
}

.group-chip:hover {
  border-color: var(--color-border);
  color: var(--color-text);
}

.group-chip.active {
  border-color: var(--color-selected-border);
  background: var(--color-selected-bg);
  color: var(--color-primary-soft-text);
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-border-light);
}

.setting-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  background: var(--color-bg);
  cursor: pointer;
}

.setting-row > span:first-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-row strong {
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
}

.setting-row small {
  color: var(--color-text-tertiary);
  font-size: 10px;
  line-height: 1.45;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
  padding: 0 22px;
  border-top: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-bg) 68%, var(--color-bg-elevated));
}

.footer-status {
  min-width: 0;
  gap: 8px;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.save-target {
  overflow: hidden;
  max-width: 240px;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-divider {
  width: 1px;
  height: 12px;
  background: var(--color-border);
}

.footer-actions {
  gap: 8px;
}

.danger-zone {
  padding-bottom: 4px;
}

.hidden-input {
  display: none;
}

.dialog-backdrop {
  position: fixed;
  inset: var(--titlebar-height) 0 0;
  z-index: var(--z-overlay);
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 19, 22, 0.46);
  backdrop-filter: blur(3px);
}

.import-dialog {
  width: min(480px, 100%);
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-xl);
}

.dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.dialog-head h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
}

.dialog-head p {
  margin: 4px 0 0;
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.import-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  text-align: left;
}

.import-option:hover {
  border-color: var(--color-primary-border);
  background: var(--color-primary-soft-bg);
}

.import-option-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-primary-soft-text);
}

.import-option-icon svg {
  width: 19px;
  height: 19px;
}

.import-option > span:nth-child(2) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.import-option strong {
  font-size: 12px;
}

.import-option small {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.option-arrow {
  width: 15px;
  height: 15px;
  color: var(--color-text-tertiary);
}

.dialog-separator {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 14px 0;
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.dialog-separator::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border-light);
}

.dialog-separator span {
  position: relative;
  padding: 0 8px;
  background: var(--color-bg-elevated);
}

.remote-import {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 292px minmax(0, 1fr);
  }

  .summary {
    display: none;
  }
}

@media (max-width: 860px) {
  .rss-manage-view {
    padding: 12px;
    gap: 10px;
  }

  .page-header {
    align-items: flex-start;
  }

  .workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(190px, 30%) minmax(0, 1fr);
  }

  .source-sidebar {
    border-right: 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  .source-filters {
    grid-template-columns: minmax(0, 1fr) 128px;
  }

  .source-list {
    padding-bottom: 12px;
  }

  /* On stacked layouts the list is a short fixed overview. Keep rows compact
     so the selected source and at least the next one stay visible. */
  .source-row {
    min-height: 52px;
    padding: 5px 8px;
  }

  .source-row + .source-row {
    margin-top: 0;
  }

  .source-avatar {
    width: 28px;
    height: 28px;
    flex-basis: 28px;
  }

  .source-copy {
    gap: 1px;
  }

  .source-group-line {
    display: none;
  }

  .mobile-list-toggle {
    display: inline-flex;
  }

  .mobile-list-scrim {
    position: fixed;
    inset: calc(var(--titlebar-height) + 0px) 0 calc(76px + var(--safe-area-bottom));
    z-index: calc(var(--z-overlay) + 1);
    background: rgba(16, 19, 22, 0.28);
  }

  .source-sidebar.expanded {
    position: fixed;
    inset: calc(var(--titlebar-height) + 10px) 10px calc(76px + var(--safe-area-bottom));
    z-index: calc(var(--z-overlay) + 2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-elevated);
    box-shadow: var(--shadow-xl);
  }

  .source-sidebar.expanded .source-list {
    padding-bottom: 12px;
  }

  .source-sidebar.expanded .mobile-list-toggle {
    margin-top: 6px;
  }

  .selection-bar {
    position: fixed;
    left: 22px;
    right: 22px;
    bottom: calc(78px + var(--safe-area-bottom));
  }

  .editor-head {
    padding: 14px 16px 11px;
  }

  .editor-tabs,
  .editor-scroll {
    padding-left: 16px;
    padding-right: 16px;
  }

  .editor-footer {
    padding: 0 16px;
  }
}

@media (max-width: 600px) {
  .rss-manage-view {
    padding: 9px;
  }

  .page-header {
    flex-direction: column;
    gap: 10px;
  }

  .page-heading {
    width: 100%;
  }

  .page-actions {
    width: 100%;
  }

  .page-actions .secondary-button,
  .page-actions .primary-button {
    flex: 1;
    min-height: 40px;
  }

  .heading-title-row h1 {
    font-size: 21px;
  }

  .workspace {
    grid-template-rows: minmax(180px, 27%) minmax(0, 1fr);
  }

  .source-filters {
    grid-template-columns: minmax(0, 1fr) 112px;
  }

  .sidebar-head {
    padding-top: 12px;
  }

  .row-delete {
    display: none;
  }

  .editor-head {
    padding-top: 11px;
    padding-bottom: 8px;
  }

  .form-grid,
  .form-grid.three-columns,
  .switch-grid {
    grid-template-columns: 1fr;
  }

  .field.full-span,
  .full-span {
    grid-column: auto;
  }

  .editor-title-block p,
  .footer-status,
  .header-switch > span:first-child {
    display: none;
  }

  .editor-title-line h2 {
    font-size: 17px;
  }

  .editor-footer {
    min-height: 52px;
  }

  .tab-panel {
    padding-bottom: 8px;
  }

  .footer-actions {
    width: 100%;
  }

  .footer-actions .secondary-button,
  .footer-actions .primary-button {
    flex: 1;
  }

  .remote-import {
    grid-template-columns: 1fr;
  }

  .dialog-backdrop {
    padding: 12px;
  }
}
</style>
