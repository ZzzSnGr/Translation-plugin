const endpoint = 'http://localhost:1188'

async function checkStatus() {
  const dot = document.getElementById('statusDot')
  const text = document.getElementById('statusText')
  const msg = document.getElementById('statusMsg')
  const ok = document.getElementById('stepsOk')
  const err = document.getElementById('stepsErr')

  dot.className = 'dot dot-checking'
  text.textContent = '正在检测翻译服务...'
  msg.textContent = ''
  ok.classList.add('hidden')
  err.classList.add('hidden')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(endpoint + '/', {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      dot.className = 'dot dot-ok'
      text.textContent = '翻译服务已连接'
      msg.textContent = 'DeepLX 运行正常，可以开始翻译'
      ok.classList.remove('hidden')
    } else {
      showError()
    }
  } catch (e) {
    showError()
  }
}

function showError() {
  const dot = document.getElementById('statusDot')
  const text = document.getElementById('statusText')
  const msg = document.getElementById('statusMsg')
  const err = document.getElementById('stepsErr')

  dot.className = 'dot dot-err'
  text.textContent = '翻译服务未连接'
  msg.textContent = '请确认已运行 LaunchDeepLX.vbs'
  err.classList.remove('hidden')
}

document.getElementById('retryBtn').addEventListener('click', checkStatus)
document.getElementById('closeBtnOk').addEventListener('click', () => window.close())
document.getElementById('closeBtnErr').addEventListener('click', () => window.close())

checkStatus()