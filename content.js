let settings = {
  enabled: true,
  targetLang: 'ZH',
  textColor: '#ffffff',
  apiEndpoint: 'http://localhost:1188',
  token: ''
}

let tooltipEl = null
let translateTimer = null
let pendingRequest = null
let currentRange = null
let rafId = null

const translationCache = new Map()
const MAX_CACHE_SIZE = 200

function createTooltip() {
  if (tooltipEl) return

  tooltipEl = document.createElement('div')
  tooltipEl.id = 'quick-translate-tooltip'
  tooltipEl.style.cssText = `
    all: initial;
    position: fixed;
    z-index: 2147483647;
    color: ${settings.textColor};
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
    max-width: calc(100vw - 40px);
    word-break: break-word;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s ease;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.4);
  `
  document.body.appendChild(tooltipEl)
}

function removeTooltip() {
  stopPositionTracking()
  if (tooltipEl) {
    tooltipEl.remove()
    tooltipEl = null
  }
  currentRange = null
}

function startPositionTracking() {
  if (rafId) return
  function tick() {
    updateTooltipPosition()
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

function stopPositionTracking() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function getCacheKey(text, targetLang) {
  return `${targetLang}:${text}`
}

async function translateDirect(text) {
  const cacheKey = getCacheKey(text, settings.targetLang)
  const cached = translationCache.get(cacheKey)
  if (cached) return cached

  const body = { text, target_lang: settings.targetLang }
  const headers = { 'Content-Type': 'application/json' }
  if (settings.token) {
    headers['Authorization'] = `Bearer ${settings.token}`
  }

  const response = await fetch(`${settings.apiEndpoint}/translate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    throw new Error(`请求失败 (${response.status})`)
  }

  const data = await response.json()
  if (data.code !== 200) {
    throw new Error(data.message || '翻译失败')
  }

  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value
    translationCache.delete(firstKey)
  }

  const result = { translation: data.data, sourceLang: data.source_lang || '' }
  translationCache.set(cacheKey, result)

  return result
}

function updateTooltipPosition() {
  if (!tooltipEl || !currentRange) return

  try {
    const rect = currentRange.getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) return

    tooltipEl.style.left = rect.left + 'px'
    tooltipEl.style.top = (rect.bottom + 6) + 'px'
  } catch (e) {
    hideTooltip()
  }
}

function showTooltip(text, x, y) {
  if (!settings.enabled) return
  if (!text || text.trim().length === 0) return

  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    currentRange = selection.getRangeAt(0).cloneRange()
  }

  createTooltip()
  clearTimeout(translateTimer)

  const trimmedText = text.trim()
  const cacheKey = getCacheKey(trimmedText, settings.targetLang)
  const cached = translationCache.get(cacheKey)

  tooltipEl.style.left = x + 'px'
  tooltipEl.style.top = y + 'px'
  tooltipEl.style.color = settings.textColor

  startPositionTracking()

  if (cached) {
    if (cached.sourceLang === settings.targetLang) {
      hideTooltip()
      return
    }
    tooltipEl.textContent = cached.translation
    tooltipEl.style.opacity = '1'
    return
  }

  pendingRequest = translateDirect(trimmedText)
  const currentRequest = pendingRequest

  tooltipEl.textContent = '翻译中...'
  tooltipEl.style.opacity = '1'

  translateTimer = setTimeout(() => {
    if (tooltipEl && tooltipEl.textContent === '翻译中...') {
      tooltipEl.textContent = '翻译超时'
    }
  }, 8000)

  currentRequest.then((result) => {
    clearTimeout(translateTimer)
    if (pendingRequest !== currentRequest) return
    if (tooltipEl) {
      if (result.sourceLang === settings.targetLang) {
        hideTooltip()
        return
      }
      tooltipEl.textContent = result.translation
    }
  }).catch((error) => {
    clearTimeout(translateTimer)
    if (pendingRequest !== currentRequest) return
    if (tooltipEl) {
      tooltipEl.textContent = error.message || '翻译失败'
    }
  })
}

function hideTooltip() {
  stopPositionTracking()
  if (tooltipEl) {
    tooltipEl.style.opacity = '0'
  }
  pendingRequest = null
  currentRange = null
}

function positionTooltip(selection) {
  if (!selection || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  if (!rect || (rect.width === 0 && rect.height === 0)) return

  return {
    x: rect.left,
    y: rect.bottom + 6
  }
}

function handleMouseUp(event) {
  if (!settings.enabled) return

  const selection = window.getSelection()
  const text = selection ? selection.toString().trim() : ''

  if (!text || text.length === 0) {
    hideTooltip()
    return
  }

  const pos = positionTooltip(selection)
  if (!pos) {
    hideTooltip()
    return
  }

  showTooltip(text, pos.x, pos.y)
}

function handleMouseDown() {
  hideTooltip()
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    hideTooltip()
  }
}

function init() {
  chrome.storage.local.get(['settings'], (result) => {
    if (!chrome.runtime.lastError && result.settings) {
      settings = result.settings
    }
  })

  document.addEventListener('mouseup', handleMouseUp, { passive: true })
  document.addEventListener('mousedown', handleMouseDown, { passive: true })
  document.addEventListener('keydown', handleKeyDown, { passive: true })

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      hideTooltip()
    }
  })
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE') {
    settings.enabled = message.enabled
    if (!settings.enabled) {
      hideTooltip()
      removeTooltip()
    }
  }

  if (message.type === 'SETTINGS_UPDATED') {
    translationCache.clear()
    settings = message.settings
    if (!settings.enabled) {
      hideTooltip()
      removeTooltip()
    }
  }
})

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}