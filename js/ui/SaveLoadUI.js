// セーブ/ロードUI
export class SaveLoadUI {
    constructor(uiManager, saveLoadSystem) {
        this.uiManager = uiManager;
        this.saveLoadSystem = saveLoadSystem;
        this.isOpen = false;
        this.mode = 'save'; // 'save' or 'load'
        this.selectedSlot = null;
    }
    
    init() {
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // メインウィンドウ
        const window = document.createElement('div');
        window.id = 'save-load-window';
        window.className = 'game-window save-load-window hidden';
        window.innerHTML = `
            <div class="window-header">
                <h2 id="save-load-title">セーブ</h2>
                <button class="window-close">×</button>
            </div>
            <div class="window-tabs">
                <button class="tab-btn active" data-mode="save">セーブ</button>
                <button class="tab-btn" data-mode="load">ロード</button>
            </div>
            <div class="window-content">
                <div id="save-slots" class="save-slots">
                    <!-- セーブスロットがここに動的に生成される -->
                </div>
                <div class="save-actions">
                    <button id="save-confirm" class="btn btn-primary" disabled>セーブする</button>
                    <button id="load-confirm" class="btn btn-primary hidden" disabled>ロードする</button>
                    <button id="delete-save" class="btn btn-danger" disabled>削除</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(window);
        this.window = window;
        
        // スタイルを追加
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .save-load-window {
                width: 600px;
                max-height: 80vh;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(20, 20, 30, 0.95);
                border: 2px solid #444;
                border-radius: 8px;
                z-index: 1000;
            }
            
            .save-slots {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .save-slot {
                background: rgba(40, 40, 50, 0.8);
                border: 2px solid #555;
                border-radius: 4px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .save-slot:hover {
                background: rgba(50, 50, 60, 0.9);
                border-color: #777;
            }
            
            .save-slot.selected {
                background: rgba(60, 60, 80, 0.9);
                border-color: #00ff88;
            }
            
            .save-slot-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .save-slot-title {
                font-weight: bold;
                font-size: 16px;
                color: #fff;
            }
            
            .save-slot-time {
                font-size: 12px;
                color: #aaa;
            }
            
            .save-slot-info {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                font-size: 14px;
                color: #ccc;
            }
            
            .save-slot-empty {
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            .save-actions {
                display: flex;
                gap: 10px;
                padding: 20px;
                border-top: 1px solid #444;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .btn-primary {
                background: #00ff88;
                color: #000;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #00cc66;
            }
            
            .btn-danger {
                background: #ff4444;
                color: #fff;
            }
            
            .btn-danger:hover:not(:disabled) {
                background: #cc0000;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // 閉じるボタン
        this.window.querySelector('.window-close').addEventListener('click', () => {
            this.close();
        });
        
        // タブ切り替え
        this.window.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });
        
        // アクションボタン
        document.getElementById('save-confirm').addEventListener('click', () => {
            this.confirmSave();
        });
        
        document.getElementById('load-confirm').addEventListener('click', () => {
            this.confirmLoad();
        });
        
        document.getElementById('delete-save').addEventListener('click', () => {
            this.confirmDelete();
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    open(mode = 'save') {
        this.isOpen = true;
        this.mode = mode;
        this.selectedSlot = null;
        this.window.classList.remove('hidden');
        this.switchMode(mode);
        this.refreshSlots();
    }
    
    close() {
        this.isOpen = false;
        this.window.classList.add('hidden');
    }
    
    switchMode(mode) {
        this.mode = mode;
        
        // タブのアクティブ状態を更新
        this.window.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // タイトルを更新
        document.getElementById('save-load-title').textContent = mode === 'save' ? 'セーブ' : 'ロード';
        
        // ボタンの表示/非表示
        document.getElementById('save-confirm').classList.toggle('hidden', mode !== 'save');
        document.getElementById('load-confirm').classList.toggle('hidden', mode !== 'load');
        
        this.refreshSlots();
    }
    
    refreshSlots() {
        const slotsContainer = document.getElementById('save-slots');
        slotsContainer.innerHTML = '';
        
        const slots = this.saveLoadSystem.getSaveSlots();
        
        // クイックセーブとオートセーブを最初に表示
        const specialSlots = slots.filter(slot => 
            slot.name === 'quicksave' || slot.name.startsWith('autosave_')
        );
        const normalSlots = slots.filter(slot => 
            slot.name.startsWith('slot_')
        );
        
        // 特殊スロット
        if (specialSlots.length > 0) {
            const divider = document.createElement('div');
            divider.style.color = '#888';
            divider.style.fontSize = '12px';
            divider.style.marginBottom = '10px';
            divider.textContent = '--- 特殊セーブ ---';
            slotsContainer.appendChild(divider);
            
            specialSlots.forEach(slot => {
                slotsContainer.appendChild(this.createSlotElement(slot));
            });
        }
        
        // 通常スロット
        const divider2 = document.createElement('div');
        divider2.style.color = '#888';
        divider2.style.fontSize = '12px';
        divider2.style.margin = '10px 0';
        divider2.textContent = '--- 通常セーブ ---';
        slotsContainer.appendChild(divider2);
        
        normalSlots.forEach(slot => {
            slotsContainer.appendChild(this.createSlotElement(slot));
        });
    }
    
    createSlotElement(slot) {
        const element = document.createElement('div');
        element.className = 'save-slot';
        element.dataset.slotName = slot.name;
        
        if (slot.data) {
            // セーブデータあり
            const date = new Date(slot.data.timestamp);
            element.innerHTML = `
                <div class="save-slot-header">
                    <div class="save-slot-title">${slot.displayName}</div>
                    <div class="save-slot-time">${this.formatDate(date)}</div>
                </div>
                <div class="save-slot-info">
                    <div>日数: ${slot.data.gameTime}日目</div>
                    <div>季節: ${this.getSeasonName(slot.data.season)}</div>
                    <div>住民: ${slot.data.residents}人</div>
                    <div>建物: ${slot.data.buildings}棟</div>
                </div>
            `;
        } else {
            // 空きスロット
            element.innerHTML = `
                <div class="save-slot-header">
                    <div class="save-slot-title">${slot.displayName}</div>
                </div>
                <div class="save-slot-empty">--- 空きスロット ---</div>
            `;
        }
        
        // クリックイベント
        element.addEventListener('click', () => {
            this.selectSlot(slot.name);
        });
        
        return element;
    }
    
    selectSlot(slotName) {
        this.selectedSlot = slotName;
        
        // 選択状態を更新
        this.window.querySelectorAll('.save-slot').forEach(element => {
            element.classList.toggle('selected', element.dataset.slotName === slotName);
        });
        
        // ボタンの有効/無効を更新
        const hasData = this.saveLoadSystem.getSaveMetadata()[slotName] != null;
        
        if (this.mode === 'save') {
            document.getElementById('save-confirm').disabled = false;
            document.getElementById('delete-save').disabled = !hasData;
        } else {
            document.getElementById('load-confirm').disabled = !hasData;
            document.getElementById('delete-save').disabled = !hasData;
        }
    }
    
    confirmSave() {
        if (!this.selectedSlot) return;
        
        const metadata = this.saveLoadSystem.getSaveMetadata();
        const hasData = metadata[this.selectedSlot] != null;
        
        if (hasData) {
            // 上書き確認
            if (confirm('既存のセーブデータを上書きしますか？')) {
                this.doSave();
            }
        } else {
            this.doSave();
        }
    }
    
    doSave() {
        if (this.saveLoadSystem.save(this.selectedSlot)) {
            this.refreshSlots();
            setTimeout(() => this.close(), 1000);
        }
    }
    
    confirmLoad() {
        if (!this.selectedSlot) return;
        
        if (confirm('現在のゲームデータは失われます。ロードしますか？')) {
            this.doLoad();
        }
    }
    
    doLoad() {
        if (this.saveLoadSystem.load(this.selectedSlot)) {
            this.close();
        }
    }
    
    confirmDelete() {
        if (!this.selectedSlot) return;
        
        if (confirm('このセーブデータを削除しますか？')) {
            this.doDelete();
        }
    }
    
    doDelete() {
        const saveKey = `pixelfarm3d_save_${this.selectedSlot}`;
        localStorage.removeItem(saveKey);
        
        // メタデータも更新
        const metadata = this.saveLoadSystem.getSaveMetadata();
        delete metadata[this.selectedSlot];
        localStorage.setItem('pixelfarm3d_save_metadata', JSON.stringify(metadata));
        
        this.uiManager.showNotification('セーブデータを削除しました', 'success');
        this.refreshSlots();
        this.selectedSlot = null;
        
        // ボタンを無効化
        document.getElementById('save-confirm').disabled = true;
        document.getElementById('load-confirm').disabled = true;
        document.getElementById('delete-save').disabled = true;
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    
    getSeasonName(season) {
        const names = {
            SPRING: '春',
            SUMMER: '夏',
            AUTUMN: '秋',
            WINTER: '冬'
        };
        return names[season] || season;
    }
}