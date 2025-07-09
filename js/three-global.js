// Three.jsのグローバル変数を確保するためのモジュール
// CDNから読み込まれたTHREEオブジェクトをエクスポート

if (typeof THREE === 'undefined') {
    console.error('Three.js が読み込まれていません。index.htmlでThree.jsのCDNリンクを確認してください。');
    throw new Error('Three.js is not loaded');
}

// グローバルTHREEオブジェクトをエクスポート
export default window.THREE;
export const THREE = window.THREE;

console.log('✅ Three.js グローバル変数を確保しました', THREE.REVISION);