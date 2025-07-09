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
    console.log('🎮 initGame 関数開始');
    const loadingManager = new LoadingManager();
    
    try {
        console.log('🎮 ピクセルファーム・フロンティア 3D v2 初期化開始...');
        
        // Three.jsの確認
        console.log('Three.js チェック:', typeof THREE !== 'undefined' ? 'OK' : 'NG');
        if (typeof THREE === 'undefined') {
            throw new Error('Three.js が読み込まれていません');
        }
        
        loadingManager.setTotal(10);
        loadingManager.updateProgress(1, 'ゲームエンジン');
        
        console.log('GameConfig をインポート中...');
        console.log('GameConfig:', GameConfig);
        
        // ゲームインスタンスの作成
        console.log('Game インスタンスを作成中...');
        window.game = new Game(GameConfig);
        console.log('Game インスタンス作成完了');
        
        loadingManager.updateProgress(2, 'レンダラー');
        console.log('game.init() を呼び出し中...');
        await window.game.init();
        console.log('game.init() 完了');
        
        loadingManager.updateProgress(4, '地形');
        loadingManager.updateProgress(6, 'モデル');
        loadingManager.updateProgress(8, 'UI');
        loadingManager.updateProgress(10, '完了');
        
        // ゲーム開始
        console.log('game.start() を呼び出し中...');
        window.game.start();
        console.log('game.start() 完了');
        
        console.log('✅ ゲーム初期化完了');
        
    } catch (error) {
        console.error('❌ ゲーム初期化エラー:', error);
        console.error('エラースタック:', error.stack);
        
        // ローディング画面にエラーを表示
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `エラー: ${error.message}`;
            loadingText.style.color = '#ff6b6b';
        }
        
        // alert の代わりにコンソールとローディング画面に表示
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '1';
            loadingScreen.style.display = 'flex';
        }
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
    console.error('エラーの詳細:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error
    });
    
    // ローディング画面にエラーを表示
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = `エラー: ${e.message || 'ゲームの初期化に失敗しました'}`;
        loadingText.style.color = '#ff6b6b';
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未処理のPromise拒否:', e.reason);
    
    // ローディング画面にエラーを表示
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = `エラー: ${e.reason?.message || e.reason || 'ゲームの初期化に失敗しました'}`;
        loadingText.style.color = '#ff6b6b';
    }
});