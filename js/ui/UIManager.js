// UI管理クラス
export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = new Map();
        this.windows = new Map();
        this.notifications = [];
        this.selectionBox = null;
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initializeWindows();
        console.log('✅ UIManager 初期化完了');
    }

    cacheElements() {
        // リソース表示
        this.elements.set('resource-food', document.getElementById('resource-food'));
        this.elements.set('resource-wood', document.getElementById('resource-wood'));
        this.elements.set('resource-stone', document.getElementById('resource-stone'));
        this.elements.set('resource-iron', document.getElementById('resource-iron'));
        this.elements.set('resource-money', document.getElementById('resource-money'));
        this.elements.set('population', document.getElementById('population'));
        this.elements.set('happiness', document.getElementById('happiness'));
        
        // 時間表示
        this.elements.set('season', document.getElementById('season'));
        this.elements.set('date', document.getElementById('date'));
        this.elements.set('weather', document.getElementById('weather'));
        
        // コントロール
        this.elements.set('btn-pause', document.getElementById('btn-pause'));
        this.elements.set('btn-speed-1', document.getElementById('btn-speed-1'));
        this.elements.set('btn-speed-2', document.getElementById('btn-speed-2'));
        this.elements.set('btn-speed-3', document.getElementById('btn-speed-3'));
        
        // 選択情報パネル
        this.elements.set('selection-info', document.getElementById('selection-info'));
        this.elements.set('selection-title', document.getElementById('selection-title'));
        this.elements.set('selection-content', document.getElementById('selection-content'));
    }

    setupEventListeners() {
        // ツールボタン
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.dataset.tool;
                this.game.toolSystem.selectTool(tool);
            });
        });
        
        // スピードボタン
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(btn.dataset.speed);
                this.game.setGameSpeed(speed);
            });
        });
        
        // 一時停止ボタン
        this.elements.get('btn-pause').addEventListener('click', () => {
            this.game.togglePause();
        });
        
        // ウィンドウの閉じるボタン
        document.querySelectorAll('.window-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const window = e.target.closest('.game-window');
                this.hideWindow(window.id);
            });
        });
        
        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target);
            });
        });
    }

    initializeWindows() {
        // 住民管理ウィンドウ
        this.windows.set('resident', {
            element: document.getElementById('window-resident'),
            isOpen: false
        });
    }

    // リソース表示の更新
    updateResourceDisplay(resources) {
        this.elements.get('resource-food').textContent = Math.floor(resources.food.current);
        this.elements.get('resource-wood').textContent = Math.floor(resources.wood.current);
        this.elements.get('resource-stone').textContent = Math.floor(resources.stone.current);
        this.elements.get('resource-iron').textContent = Math.floor(resources.iron.current);
        this.elements.get('resource-money').textContent = Math.floor(resources.money.current);
    }

    updatePopulation(current, max) {
        this.elements.get('population').textContent = `${current}/${max}`;
    }

    updateHappiness(happiness) {
        this.elements.get('happiness').textContent = `${Math.floor(happiness)}%`;
    }

    updateDate(day) {
        this.elements.get('date').textContent = `${day}日目`;
    }

    updateSeason(season) {
        const seasonNames = {
            SPRING: '春',
            SUMMER: '夏',
            AUTUMN: '秋',
            WINTER: '冬'
        };
        this.elements.get('season').textContent = seasonNames[season] || season;
    }

    updateWeather(weather) {
        const weatherIcons = {
            sunny: '☀️ 晴れ',
            cloudy: '☁️ 曇り',
            rainy: '🌧️ 雨',
            foggy: '🌫️ 霧'
        };
        this.elements.get('weather').textContent = weatherIcons[weather] || weather;
    }

    // ツール選択の更新
    updateToolSelection(tool) {
        // すべてのツールボタンの選択状態を解除
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 選択されたツールをアクティブに
        if (tool) {
            const btn = document.querySelector(`[data-tool="${tool}"]`);
            if (btn) btn.classList.add('active');
        }
    }

    // スピードボタンの更新
    updateSpeedButtons(speed) {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-speed="${speed}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    // 一時停止ボタンの更新
    updatePauseButton(isPaused) {
        const btn = this.elements.get('btn-pause');
        btn.textContent = isPaused ? '▶️' : '⏸️';
    }

    // 選択情報の表示
    showBuildingInfo(building) {
        const panel = this.elements.get('selection-info');
        const title = this.elements.get('selection-title');
        const content = this.elements.get('selection-content');
        
        title.textContent = building.config.name;
        
        let html = `
            <p><strong>状態:</strong> ${building.isComplete ? '稼働中' : '建設中'}</p>
            <p><strong>進捗:</strong> ${Math.floor(building.progress * 100)}%</p>
        `;
        
        if (building.config.production) {
            html += '<p><strong>生産:</strong></p><ul>';
            for (const [resource, amount] of Object.entries(building.config.production)) {
                html += `<li>${resource}: +${amount}/分</li>`;
            }
            html += '</ul>';
        }
        
        if (building.workers) {
            html += `<p><strong>作業者:</strong> ${building.workers.length}/${building.config.requiredWorkers || 0}</p>`;
        }
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
    }

    showResidentInfo(resident) {
        const panel = this.elements.get('selection-info');
        const title = this.elements.get('selection-title');
        const content = this.elements.get('selection-content');
        
        title.textContent = resident.name;
        
        const html = `
            <p><strong>職業:</strong> ${resident.profession.name}</p>
            <p><strong>状態:</strong> ${resident.state}</p>
            <p><strong>健康:</strong> ${Math.floor(resident.needs.health)}%</p>
            <p><strong>空腹:</strong> ${Math.floor(resident.needs.hunger)}%</p>
            <p><strong>エネルギー:</strong> ${Math.floor(resident.needs.energy)}%</p>
            <p><strong>幸福度:</strong> ${Math.floor(resident.needs.happiness)}%</p>
            <button onclick="game.uiManager.showResidentWindow('${resident.id}')">詳細</button>
        `;
        
        content.innerHTML = html;
        panel.classList.remove('hidden');
    }

    hideSelectionInfo() {
        this.elements.get('selection-info').classList.add('hidden');
    }

    // ウィンドウ管理
    showWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.classList.remove('hidden');
            window.isOpen = true;
        }
    }

    hideWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.classList.add('hidden');
            window.isOpen = false;
        }
    }

    toggleWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            if (window.isOpen) {
                this.hideWindow(windowId);
            } else {
                this.showWindow(windowId);
            }
        }
    }

    // 住民ウィンドウを表示
    showResidentWindow(residentId) {
        this.showWindow('resident');
        // 住民の詳細情報を表示
        this.updateResidentWindow(residentId);
    }

    updateResidentWindow(residentId) {
        // TODO: 住民の詳細情報を更新
    }

    // タブ切り替え
    switchTab(tabBtn) {
        const tabName = tabBtn.dataset.tab;
        const container = tabBtn.closest('.game-window');
        
        // タブボタンの状態を更新
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        tabBtn.classList.add('active');
        
        // タブコンテンツの表示を更新
        container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = container.querySelector(`#tab-${tabName}`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // 通知システム
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(50, 255, 50, 0.9)'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // 3秒後に削除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }, 3000);
    }

    showEventNotification(event) {
        this.showNotification(`イベント: ${event.name}`, 'event');
    }

    // 選択ボックス
    showSelectionBox(startX, startY) {
        if (!this.selectionBox) {
            this.selectionBox = document.createElement('div');
            this.selectionBox.className = 'selection-box';
            this.selectionBox.style.cssText = `
                position: fixed;
                border: 2px solid #00ff88;
                background: rgba(0, 255, 136, 0.1);
                pointer-events: none;
                z-index: 100;
            `;
            document.body.appendChild(this.selectionBox);
        }
        
        this.selectionBox.style.left = startX + 'px';
        this.selectionBox.style.top = startY + 'px';
        this.selectionBox.style.width = '0';
        this.selectionBox.style.height = '0';
        this.selectionBox.style.display = 'block';
    }

    updateSelectionBoxCoords(startX, startY, currentX, currentY) {
        if (!this.selectionBox) return;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        this.selectionBox.style.left = left + 'px';
        this.selectionBox.style.top = top + 'px';
        this.selectionBox.style.width = width + 'px';
        this.selectionBox.style.height = height + 'px';
    }

    hideSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.style.display = 'none';
        }
    }
    
    // 選択ボックスの更新（InputHandlerから呼ばれる）
    updateSelectionBox(start, end) {
        const rect = this.game.renderer.domElement.getBoundingClientRect();
        this.updateSelectionBoxCoords(
            start.x + rect.left,
            start.y + rect.top,
            end.x + rect.left,
            end.y + rect.top
        );
    }
    
    clearSelectionBox() {
        this.hideSelectionBox();
    }
    
    // ツール選択の更新
    updateToolSelection(toolId) {
        // すべてのツールボタンの選択状態をクリア
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 選択されたツールボタンをアクティブに
        if (toolId) {
            const activeBtn = document.querySelector(`[data-tool="${toolId}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    }

    // メニュー関連
    toggleBuildMenu() {
        // TODO: 建設メニューの表示/非表示
    }
    
    openBuildMenu() {
        const buildCategory = document.querySelector('[data-category="build"]');
        if (buildCategory) {
            buildCategory.classList.add('expanded');
        }
    }
    
    openResidentPanel() {
        this.showWindow('resident');
    }

    toggleResidentPanel() {
        this.toggleWindow('resident');
    }
    
    // 建物選択
    selectBuilding(building) {
        if (!building) {
            this.hideSelectionInfo();
            return;
        }
        
        this.showBuildingInfo(building);
    }
    
    // 住民選択
    selectResident(resident) {
        if (!resident) {
            this.hideSelectionInfo();
            return;
        }
        
        this.showResidentInfo(resident);
    }

    // 更新処理
    update(deltaTime) {
        // アニメーションなどの更新
    }

    // クリーンアップ
    dispose() {
        this.notifications.forEach(notification => {
            notification.remove();
        });
        
        if (this.selectionBox) {
            this.selectionBox.remove();
        }
    }
}