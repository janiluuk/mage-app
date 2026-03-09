# Code Review: View Files in `/src/views/`

**Scope:** All view files under `/home/jani/workspace/mage-app/src/views/`  
**Focus:** Bugs, style inconsistencies, bloated logic, dead code.  
**Date:** 2025-02-10

---

## 1. Dashboard.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Missing global component registration** – Template uses `<ProgressSpinner />` and `<Message>` but they are not imported in script. PrimeVue may register them globally; if not, add imports. | style/dead-code | 56, 61 | If not globally registered: `import ProgressSpinner from 'primevue/progressspinner'; import Message from 'primevue/message';` |
| 2 | **Unused variable** – `isDarkTheme` is destructured from `useLayout()` but never used. | dead-code | 8 | Remove from destructuring or use it (e.g. for theme-dependent UI). |

**Summary:** Clean overall. Uses PrimeVue + PrimeFlex consistently. No critical bugs found.

---

## 2. pages/Library.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Undefined `menuOptions`** – Template uses `<Menubar :model="menuOptions">` but `menuOptions` is never defined in script. This will render an empty menubar or cause a runtime warning. | **bug** | 360 | Define `menuOptions` (e.g. `const menuOptions = ref([])` or build an array of menu items). If the Menubar is only a container for the slots, use an empty array and document it. |
| 2 | **Wrong assignment on `total`** – `total` is `ref(null)`. Code does `total.total = store.getters["videojobs/listTotal"]`, which sets a property on the ref wrapper, not on `total.value`. If anything ever reads `total.value` for the count, it will get `null`. | **bug** | 193 | Use `total.value = { total: store.getters["videojobs/listTotal"] }` or replace with a dedicated ref, e.g. `const listTotal = ref(0)` and set `listTotal.value = store.getters["videojobs/listTotal"]`. |
| 3 | **`store` declaration order** – `store` is used inside `destroy` and `download` but declared later (line 87). In `<script setup>` the full script runs once so by the time handlers run, `store` exists; no runtime bug, but readability is better if `store` is declared near the top. | style | 16–49, 87 | Move `const store = useStore();` to the top (e.g. right after other composables). |
| 4 | **Hardcoded magic ID `1171`** – Multiple conditions check `slotProps.data.id == 1171` / `slotProps.data.id != 1171` for image display. This is environment-specific and will behave incorrectly for other users/data. | **bug** | 406, 408, 411 | Remove the special case for ID 1171, or replace with a proper feature (e.g. “no preview” flag or server-driven rule). |
| 5 | **Duplicate `placeholder` on InputText** – `:placeholder="queryFilter.value ? queryFilter.value : 'Search ...'" placeholder="Search"` – two placeholders; the static one is redundant. | style | 373 | Use a single placeholder (e.g. only the dynamic one or only `"Search"`). |
| 6 | **Dead / unused code** – `mapStates()` and `mapGetters()` are defined but never called. `query` ref is declared but never used. | dead-code | 84, 209–227 | Remove `mapStates`, `mapGetters`, and `query` if not needed. |
| 7 | **Ref usage for menu refs** – `menuRefs` is `ref([])` but used as `menuRefs[elementId] = el` and `menuRefs[refitem]`. This sets/reads properties on the ref object, not on `menuRefs.value`. It can work by accident but is fragile. | refactor | 197–205 | Use `menuRefs.value[elementId] = el` and `menuRefs.value[refitem]`, or use a reactive `Map`/object for menu refs. |
| 8 | **Style mix** – Uses PrimeVue + PrimeFlex (e.g. `flex`, `mb-2`) and some custom classes; mostly consistent. | style | - | Prefer PrimeFlex utilities and PrimeVue components project-wide. |

---

## 3. pages/Browser.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Undefined `applyMetadataOverridesWithNormalization`** – Used in computed properties `normalizedFiles`, `tagFiles`, and `videos` (e.g. `.map(applyMetadataOverridesWithNormalization)`). The composable `useBrowserMetadata` only returns `applyMetadataOverrides`. This will throw at runtime when those computeds run. | **bug** | 421, 428, 442 | Define a local helper, e.g. `const applyMetadataOverridesWithNormalization = (v) => applyMetadataOverrides(v)`, or use `applyMetadataOverrides` directly in the three `.map()` calls. |
| 2 | **`startAutoRefresh` / `stopAutoRefresh` not defined** – `useBrowserData` is imported but never called. In `onMounted` the code calls `startAutoRefresh(10000)` and in `onBeforeUnmount` it calls `stopAutoRefresh()`. These functions are undefined in the component, so mounting will throw. | **bug** | 643, 657 | Either (a) call `useBrowserData({ viewMode, viewGroupedByTags, selectedTagId, sortKey, sortDir })` and use its `refreshData`, `startAutoRefresh`, `stopAutoRefresh`, or (b) implement them locally using the existing `refreshData` and `refreshInterval`: e.g. `const startAutoRefresh = (ms) => { ... setInterval(refreshData, ms); }; const stopAutoRefresh = () => { clearInterval(refreshInterval.value); };`. |
| 3 | **`filters.value` in `loadFiles`** – Code uses `filters.value.includeTags` and `filters.value.includeTags[0]`. `filters` comes from `useFilterState` and is a ref; this is correct. No change needed. | - | 596, 606 | - |
| 4 | **Unused import** – `FileService` is imported but not used. | dead-code | 345 | Remove the `FileService` import. |
| 5 | **Unused refs** – `activeRequestIds`, `generateRequestId` are declared for “request cancellation” but never used to tag or cancel requests. `metadataOverrides` is destructured from `useBrowserMetadata` but not used in the template or other logic. | dead-code | 369–370, 392 | Remove or use: either implement request cancellation with `activeRequestIds`/`generateRequestId`, or remove them; same for `metadataOverrides` if not needed. |
| 6 | **`showBatchPresetDialog` set but never wired** – `runContextAction` sets `showBatchPresetDialog.value = true` for action `"batch:apply-preset"`, but no dialog or component is bound to this ref in the template. | **bug** | 771, 817 | Add a batch preset dialog in the template (e.g. `v-model:visible="showBatchPresetDialog"`) or remove the action / ref until the feature is implemented. |

**Summary:** Several critical bugs (undefined functions and missing dialog) will cause runtime errors. Style is consistent (PrimeVue + composables).

---

## 4. pages/Timeline.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Demo / placeholder content** – Uses hardcoded “Ordered”, “Processing”, “Shipped”, “Delivered” and `demo/images/product/` image. Not wired to real app data. | style/refactor | 4–29, 96 | If this is a real page, connect to real timeline data and assets; otherwise mark as demo or move to a demo route. |
| 2 | **Missing import** – Template uses `<Timeline>`, `<Card>`, `<Button>` (PrimeVue). Not imported in script. | style | 39–102 | If not globally registered, add: `import Timeline from 'primevue/timeline'; import Card from 'primevue/card'; import Button from 'primevue/button';` |
| 3 | **Deprecated `::v-deep`** – Style uses `::v-deep(.customized-timeline)`. In Vue 3 prefer `:deep(.customized-timeline)`. | style | 137 | Replace with `:deep(.customized-timeline)`. |

**Summary:** Looks like a demo/template page. No critical logic bugs; fix imports and styling for production use.

---

## 5. pages/Presets.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Empty `onExport`** – `onExport` is implemented as a no-op with a comment “Export handled by ExportDialog”. The parent still passes `@export="onExport"`. | refactor | 204–206 | Either remove the handler and let ExportDialog emit without a no-op, or implement a small callback (e.g. toast or analytics) if needed. |
| 2 | **Options API vs script setup** – This view uses Options API + `setup()` while others (e.g. Dashboard, StoryBrowser) use `<script setup>`. | style | 138–226 | Consider migrating to `<script setup>` for consistency. |
| 3 | **PrimeVue usage** – Consistent use of Toolbar, Button, Card, Dialog, Tag, Chip, ScrollPanel. No bugs found. | - | - | - |

**Summary:** Minor refactor and style consistency; no critical bugs.

---

## 6. pages/AudioVisualization.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **`confirm` never used** – `const confirm = useConfirm();` is declared but the only `confirm.require` is in `generateVideo`. So it is used. No change. | - | 321 | - |
| 2 | **Toast not injected** – `useToast()` is used (e.g. in `onFileSelect`, `runAnalysis`, `exportConfig`). In PrimeVue 3, Toast must be provided via app or parent; ensure `<Toast />` is present in the app or layout. Template has `<ConfirmDialog />` but no `<Toast />`. | **bug** | 261, 276, 354, etc. | Add `<Toast />` to the template (or to a root layout) so that `useToast()` has a target. |
| 3 | **Generate video is TODO** – `generateVideo` shows a confirm then a toast “Generation job queued” but the actual API call is commented as TODO. | refactor | 393–401 | Wire to DeforumControlService or videojobs service when backend is ready; or hide/disable the button until then. |
| 4 | **Live band energies mutation** – In `renderLoop`, `liveBandEnergies.value[b] = ...` is done in a loop. Prefer building a new array and assigning once to avoid excessive reactivity triggers. | refactor | 318–324 | Build a new array (e.g. `const next = [...liveBandEnergies.value]; next[b] = ...; liveBandEnergies.value = next;`) or use a single assignment. |

**Summary:** Add Toast component for `useToast()`; rest is minor.

---

## 7. pages/video/Upload.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Unused / dead data** – `cancel()` references `this.videoShow` and `this.videoFile`, which are not in `data()`. They are never set elsewhere. | **bug** | 196–198 | Remove `this.videoShow` and `this.videoFile` from `cancel()`, or add them to `data()` and use them. |
| 2 | **Batch validation feedback** – When multiple files are validated and some fail, only the last `setErrorNotification(validation.error)` is shown; previous errors are overwritten. | refactor | 254–256 | Show one combined message (e.g. “N files rejected: …”) or collect errors and show all (e.g. first error + “and N others”). |
| 3 | **Inconsistent path for images** – Uses `/public/img/...`. In Vite, `public` is served at root, so `/public/img/...` may be wrong; usually you use `/img/...`. | style | 10–11, 33, etc. | Use `/img/mona.gif` etc. (no `public` in path) or use `import` for assets. |
| 4 | **PrimeVue** – Uses Button, ProgressBar, Tag, Dialog; consistent. | - | - | - |

**Summary:** Fix `cancel()` and asset paths; improve batch error messaging.

---

## 8. FrontPage.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Unused `data`** – `animationVideoSrc` and `effectVideoSrc` are in `data()` but never used in the template. | dead-code | 56–57 | Remove them or use them (e.g. for video previews). |
| 2 | **Relative asset paths** – Uses `../../public/img/...`. From `src/views/`, `../../public` goes to project root `public`; in Vite this is usually referenced as `/img/...`. | style | 8–9, 28–30 | Use `/img/mona.gif` and `/img/mona.jpg` (and ensure files exist in `public/img/`). |
| 3 | **No upload / navigation** – Unlike `pages/video/Upload.vue`, the banner items don’t link or upload; they’re static. May be intentional (landing vs upload page). | style | - | If this is the public landing page, consider linking “Animation” and “Video Effect” to the upload or editor flow. |

**Summary:** Dead data and asset paths; otherwise minimal.

---

## 9. MageAppMain.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Queue warning logic** – `queueWarning` is true when `status.value.queued > 3 || queue.value.processing.length > 0`. So “backlog” is also when something is currently processing, which may be normal. | refactor | 71 | Consider defining “backlog” as only `status.value.queued > N` (e.g. > 3), or rename to “busy or backlog”. |
| 2 | **PrimeVue** – Button, Message; minimal and consistent. | - | - | - |

**Summary:** Minor logic clarification; no critical bugs.

---

## 10. StoryCreator.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **`handleAddFrameBetween` no-op** – `handleAddFrameBetween(index)` only calls `showSaveNotification()` and doesn’t insert a frame. Comment says “Implementation from Deforum.vue”. | refactor | 368–371 | Implement frame insertion at index or remove the handler until implemented. |
| 2 | **Clipboard fallback** – `copyToClipboard` uses `navigator.clipboard.writeText` without a fallback for older browsers or non-HTTPS. | refactor | 448–465 | Add try/catch and fallback (e.g. `document.execCommand('copy')` with a temporary textarea) for older environments. |
| 3 | **PrimeVue and structure** – Uses TabView, Card, Button, Dialog, etc. Structure is clear. | - | - | - |

**Summary:** One stub handler and optional clipboard fallback; no critical bugs.

---

## 11. StoryBrowser.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **`viewStory` and `editStory` identical** – Both do `router.push(\`/stories/${id}/edit\`)`. “View” and “Edit” currently go to the same route. | refactor | 173–177 | Either use a different route/query for view-only (e.g. `/stories/${id}/view`) or rename the button to avoid confusion. |
| 2 | **Paginated response handling** – Comment says “Handle paginated response format” when `response.data` is falsy; then sets `stories.value = response` and `pagination.value = null`, which can break pagination UI. | **bug** | 150–154 | Clarify API contract: if the API returns `{ data, current_page, last_page, ... }`, always read from that shape; if it returns an array, build pagination from another source or set sensible defaults so `pagination` is not null when there are pages. |
| 3 | **PrimeVue** – Consistent Button, Card, Message, ProgressSpinner, Badge, Divider, Paginator. | - | - | - |

**Summary:** Fix view vs edit and pagination handling; otherwise fine.

---

## 12. StoryEditor.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **`markDirty` is empty** – Used on `@blur` of the job description input but doesn’t set any “dirty” state or enable a save button. | refactor | 262–264 | Implement dirty tracking (e.g. ref or computed) and use it to enable “Save” or show an unsaved indicator. |
| 2 | **Add Jobs dialog placeholder** – “Job selection dialog will be implemented here.” Add button just closes the dialog without adding jobs. | refactor | 163–166 | Implement job picker (e.g. list of video jobs with multi-select) and call the API to add selected jobs to the story. |
| 3 | **`useConfirm` usage** – `confirm` is from `useConfirm()`. PrimeVue’s ConfirmDialog requires `<ConfirmDialog />` in the template (present). No bug. | - | - | - |

**Summary:** Implement or remove dirty state and add-jobs dialog.

---

## 13. api/profile/Password.vue

| # | Issue | Severity | Line(s) | Suggested fix |
|---|--------|----------|---------|----------------|
| 1 | **Style inconsistency** – Uses Bootstrap-style classes (`row`, `col-12`, `d-flex`, `ms-auto`, `mb-0`) and custom components (`material-input`, `material-button`) instead of PrimeVue. | style | 4–22 | Align with the rest of the app: use PrimeVue components (e.g. InputText, Password, Button) and PrimeFlex if the project standard is PrimeVue. |
| 2 | **Unhandled validation shape** – `setApiValidation(error.response.data.errors)` assumes a specific error shape. If the API returns a different structure, validation may break. | bug | 62 | Guard with optional chaining and/or normalize: e.g. `const errors = error.response?.data?.errors ?? {}; this.setApiValidation(errors);`. |
| 3 | **No loading state** – Submit doesn’t disable the button or show loading, so the user can double-submit. | refactor | 50–69 | Add a loading ref, set it true/false in `handleChange`, and disable the button (and optionally show a spinner) while submitting. |

**Summary:** Style alignment with PrimeVue, safer error handling, and loading state recommended.

---

## Other view files (not fully listed)

- **admin/** – Prefer a pass for the same checklist (bugs, style, dead code).
- **film-project/** – Same.
- **pages/auth/** – Check error handling and consistency with PrimeVue.
- **uikit/** – Demo/kit components; lower priority unless used in production routes.

---

## Summary table

| File | Bugs | Style | Refactor | Dead code |
|------|------|--------|----------|-----------|
| Dashboard.vue | 0 | 1 | 0 | 1 |
| Library.vue | 3 | 3 | 1 | 2 |
| Browser.vue | 4 | 0 | 0 | 3 |
| Timeline.vue | 0 | 2 | 1 | 0 |
| Presets.vue | 0 | 1 | 1 | 0 |
| AudioVisualization.vue | 1 | 0 | 2 | 0 |
| video/Upload.vue | 1 | 1 | 1 | 0 |
| FrontPage.vue | 0 | 2 | 0 | 1 |
| MageAppMain.vue | 0 | 0 | 1 | 0 |
| StoryCreator.vue | 0 | 0 | 2 | 0 |
| StoryBrowser.vue | 1 | 0 | 1 | 0 |
| StoryEditor.vue | 0 | 0 | 2 | 0 |
| api/profile/Password.vue | 1 | 1 | 1 | 0 |

**Recommended priority**

1. **High:** Library.vue (menuOptions, total, store order, ID 1171), Browser.vue (applyMetadataOverridesWithNormalization, startAutoRefresh/stopAutoRefresh, batch preset dialog).
2. **Medium:** AudioVisualization.vue (Toast), Upload.vue (cancel and paths), StoryBrowser.vue (pagination), Password.vue (errors and loading).
3. **Low:** Style and refactor items (Options API vs script setup, Bootstrap vs PrimeVue, dead code cleanup).
