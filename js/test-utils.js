// テスト用ユーティリティ関数をエクスポート
export function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const logClass = `log-${type}`;
    const logEntry = `<div class="log-entry"><span class="log-time">${time}</span> <span class="${logClass}">${message}</span></div>`;
    
    const logElement = document.getElementById('log');
    if (logElement) {
        logElement.innerHTML += logEntry;
        logElement.scrollTop = logElement.scrollHeight;
    }
    
    console.log(`[${type}] ${message}`);
}

export function updateTest(testId, success, message) {
    const testElement = document.getElementById(testId);
    if (testElement) {
        testElement.className = `test ${success ? 'success' : 'error'}`;
        const resultElement = testElement.querySelector('.result');
        if (resultElement) {
            resultElement.textContent = message;
        }
    }
}