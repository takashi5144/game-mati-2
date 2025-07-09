// メインエントリーポイント
import { GameConfig } from './config/GameConfig.js';
import { Game } from './core/Game.js';

// グローバル変数
window.game = null;

// ローディング管理
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    setTotal(total) {
        this.totalAssets = total;
    }

    updateProgress(loaded, item = '') {
        this.loadedAssets = loaded;
        const progress = (this.loadedAssets / this.totalAssets) * 100;
        this.loadingProgress.style.width = `${progress}%`;
        
        if (item) {
            this.loadingText.textContent = `読み込み中... ${item}`;
        }
        
        if (progress >= 100) {
            this.complete();
        }
    }

    complete() {
        this.loadingText.textContent = 'ゲームを開始しています...';
        setTimeout(() => {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }, 500);
    }
}

// ゲーム初期化
async function initGame() {
    const loadingManager = new LoadingManager();
    
    try {
        console.log('🎮 ピクセルファーム・フロンティア 3D v2 初期化開始...');
        
        // Three.jsの確認
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js が読み込まれていません');
        }
        
        loadingManager.setTotal(10);
        loadingManager.updateProgress(1, 'ゲームエンジン');
        
        // ゲームインスタンスの作成
        window.game = new Game(GameConfig);
        
        loadingManager.updateProgress(2, 'レンダラー');
        await window.game.init();
        
        loadingManager.updateProgress(4, '地形');
        loadingManager.updateProgress(6, 'モデル');
        loadingManager.updateProgress(8, 'UI');
        loadingManager.updateProgress(10, '完了');
        
        // ゲーム開始
        window.game.start();
        
        console.log('✅ ゲーム初期化完了');
        
    } catch (error) {
        console.error('❌ ゲーム初期化エラー:', error);
        alert('ゲームの初期化中にエラーが発生しました: ' + error.message);
    }
}

// DOMContentLoaded イベント
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了');
    initGame();
});

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.onWindowResize();
    }
});

// ページ離脱時の確認
window.addEventListener('beforeunload', (e) => {
    if (window.game && window.game.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '保存されていない変更があります。本当にページを離れますか？';
    }
});

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('グローバルエラー:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未処理のPromise拒否:', e.reason);
});