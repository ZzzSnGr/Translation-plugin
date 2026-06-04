const enableToggle = document.getElementById('enableToggle')
const apiEndpoint = document.getElementById('apiEndpoint')
const token = document.getElementById('token')
const targetLang = document.getElementById('targetLang')
const textColor = document.getElementById('textColor')
const colorHex = document.getElementById('colorHex')
const saveBtn = document.getElementById('saveBtn')
const resetBtn = document.getElementById('resetBtn')
const toggleTokenBtn = document.getElementById('toggleTokenBtn')
const toast = document.getElementById('toast')
const statusDot = document.querySelector('#serviceStatus .dot')
const statusLabel = document.getElementById('statusLabel')

const DEFAULTS = {
  enabled: true,
  targetLang: 'ZH',
  textColor: '#ffffff',
  apiEndpoint: 'http://localhost:1188',
  token: ''
}

function showToast(message, isSuccess = true) {
  toast.textContent = message
  toast.className = 'toast ' + (isSuccess ? 'toast-success' : 'toast-error')
  toast.style.display = 'block'
  toast.style.opacity = '1'
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      toast.style.display = 'none'
    }, 300)
  }, 2000)
}

function loadSettings() {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
    if (settings) {
      enableToggle.checked = settings.enabled
      apiEndpoint.value = settings.apiEndpoint || DEFAULTS.apiEndpoint
      token.value = settings.token || ''
      targetLang.value = settings.targetLang
      textColor.value = settings.textColor
      colorHex.textContent = settings.textColor
      checkServiceStatus(settings.apiEndpoint || DEFAULTS.apiEndpoint)
    }
  })
}

async function checkServiceStatus(endpoint) {
  statusDot.className = 'dot'
  statusLabel.textContent = '检测中...'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(endpoint + '/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test', target_lang: 'ZH' }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      statusDot.className = 'dot ok'
      statusLabel.textContent = '已连接'
    } else {
      statusDot.className = 'dot err'
      statusLabel.textContent = '未连接'
    }
  } catch (e) {
    statusDot.className = 'dot err'
    statusLabel.textContent = '未连接'
  }
}

function saveSettings() {
  const settings = {
    enabled: enableToggle.checked,
    targetLang: targetLang.value,
    textColor: textColor.value,
    apiEndpoint: apiEndpoint.value,
    token: token.value.trim()
  }

  chrome.runtime.sendMessage(
    { type: 'SAVE_SETTINGS', settings },
    (response) => {
      if (response && response.success) {
        showToast('设置已保存', true)
        setTimeout(() => window.close(), 1000)
      } else {
        showToast('保存失败', false)
      }
    }
  )
}

textColor.addEventListener('input', () => {
  colorHex.textContent = textColor.value
})

toggleTokenBtn.addEventListener('click', () => {
  if (token.type === 'password') {
    token.type = 'text'
    toggleTokenBtn.textContent = '🙈'
  } else {
    token.type = 'password'
    toggleTokenBtn.textContent = '👁'
  }
})

saveBtn.addEventListener('click', saveSettings)

document.getElementById('welcomeLink').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
})

resetBtn.addEventListener('click', () => {
  enableToggle.checked = DEFAULTS.enabled
  apiEndpoint.value = DEFAULTS.apiEndpoint
  token.value = DEFAULTS.token
  targetLang.value = DEFAULTS.targetLang
  textColor.value = DEFAULTS.textColor
  colorHex.textContent = DEFAULTS.textColor
  showToast('已恢复默认设置')
})

loadSettings()