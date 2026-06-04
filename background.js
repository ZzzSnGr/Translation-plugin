const DEFAULT_SETTINGS = {
  enabled: true,
  targetLang: 'ZH',
  textColor: '#ffffff',
  apiEndpoint: 'http://localhost:1188',
  token: ''
}

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS })
    }
  })

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })
  }
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-translation') {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || DEFAULT_SETTINGS
      settings.enabled = !settings.enabled
      chrome.storage.local.set({ settings }, () => {
        notifyAllTabs({ type: 'TOGGLE', enabled: settings.enabled })
      })
    })
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_SETTINGS') {
    chrome.storage.local.get(['settings'], (result) => {
      sendResponse(result.settings || DEFAULT_SETTINGS)
    })
    return true
  }

  if (request.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ settings: request.settings }, () => {
      notifyAllTabs({ type: 'SETTINGS_UPDATED', settings: request.settings })
      sendResponse({ success: true })
    })
    return true
  }
})

function notifyAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {})
    }
  })
}