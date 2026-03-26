const STORAGE_KEY = 'flip-sow-drafts'

function getDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setDrafts(drafts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch (e) {
    console.error('Failed to save draft:', e)
  }
}

export function saveDraft(name, sowState) {
  const drafts = getDrafts()
  drafts[name] = { data: sowState, savedAt: new Date().toISOString() }
  setDrafts(drafts)
}

export function loadDraft(name) {
  const drafts = getDrafts()
  return drafts[name]?.data || null
}

export function listDrafts() {
  const drafts = getDrafts()
  return Object.entries(drafts).map(([name, { savedAt }]) => ({
    name,
    savedAt,
  }))
}

export function deleteDraft(name) {
  const drafts = getDrafts()
  delete drafts[name]
  setDrafts(drafts)
}
