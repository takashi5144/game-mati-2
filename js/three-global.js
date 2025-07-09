// Three.jsのグローバル変数を確保するためのモジュール
// CDNから読み込まれたTHREEオブジェクトをエクスポート

// グローバルスコープからTHREEを取得
const THREE = window.THREE || globalThis.THREE;

if (!THREE) {
    console.error('Three.js が読み込まれていません。index.htmlでThree.jsのCDNリンクを確認してください。');
    throw new Error('Three.js is not loaded');
}

console.log('✅ Three.js グローバル変数を確保しました', THREE.REVISION);

// グローバルTHREEオブジェクトをエクスポート
export { THREE };
export default THREE;