// UI管理クラス
import { UIAnimations } from './UIAnimations.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = new Map();
        this.windows = new Map();
        this.notifications = [];
        this.selectionBox = null;
        this.animations = new UIAnimations();
        this.lastResourceValues = new Map();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.initializeWindows();
        this.animations.init();
        this.animations.enableButtonAnimations();
        console.log('✅ UIManager 初期化完了');
    }

    cacheElements() {
        // リソース表示
        this.elements.set('resource-food', document.getElementById('resource-food'));
        this.elements.set('resource-wood', document.getElementById('resource-wood'));
        this.elements.set('resource-stone', document.getElementById('resource-stone'));
        this.elements.set('resource-iron', document.getElementById('resource-iron'));
        this.elements.set('resource-money', document.getElementById('resource-money'));
        this.elements.set('resource-wheat', document.getElementById('resource-wheat'));
        this.elements.set('resource-corn', document.getElementById('resource-corn'));
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
        
        // セーブ/ロードボタン
        const btnSave = document.getElementById('btn-save');
        const btnLoad = document.getElementById('btn-load');
        
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                this.game.saveLoadUI.open('save');
            });
        }
        
        if (btnLoad) {
            btnLoad.addEventListener('click', () => {
                this.game.saveLoadUI.open('load');
            });
        }
        
        // 市場ボタン
        const btnMarket = document.getElementById('btn-market');
        if (btnMarket) {
            btnMarket.addEventListener('click', () => {
                this.game.marketUI.toggle();
            });
        }
        
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
    
    // 定期更新
    update(deltaTime) {
        // リソースの更新
        if (this.game.resourceManager) {
            this.updateResourceDisplay(this.game.resourceManager.resources);
        }
        
        // 人口の更新
        if (this.game.residentSystem) {
            this.updatePopulation(
                this.game.residentSystem.getPopulation(),
                this.game.residentSystem.getMaxPopulation()
            );
            
            // 幸福度の更新
            const happiness = this.game.residentSystem.getAverageHappiness();
            this.updateHappiness(happiness);
        }
    }

    // リソース表示の更新
    updateResourceDisplay(resources) {
        // 基本リソース
        const basicResources = ['food', 'wood', 'stone', 'iron', 'money'];
        basicResources.forEach(resource => {
            const element = this.elements.get(`resource-${resource}`);
            if (element && resources.has(resource)) {
                const currentValue = Math.floor(resources.get(resource).current);
                const lastValue = this.lastResourceValues.get(resource) || currentValue;
                
                // 値が変化した場合
                if (currentValue !== lastValue) {
                    // アニメーション付きで更新
                    if (Math.abs(currentValue - lastValue) > 10) {
                        // 大きな変化の場合はカウントアップアニメーション
                        this.animations.countUp(element, lastValue, currentValue, 500);
                    } else {
                        element.textContent = currentValue;
                    }
                    
                    // 変化量を表示
                    const change = currentValue - lastValue;
                    if (change !== 0 && Math.abs(change) < 100) {
                        this.animations.showResourceChange(element, change, change > 0);
                    }
                    
                    // パルスアニメーション
                    if (change > 0) {
                        this.animations.pulse(element, 1);
                    } else if (change < 0) {
                        this.animations.shake(element, 300);
                    }
                    
                    this.lastResourceValues.set(resource, currentValue);
                } else {
                    element.textContent = currentValue;
                }
            }
        });
        
        // 動的に追加されたリソースも表示
        // 小麦とコーンは専用の表示場所があるかチェック
        const cropResources = ['wheat', 'corn'];
        cropResources.forEach(resource => {
            const element = document.getElementById(`resource-${resource}`);
            if (element && resources.has(resource)) {
                const currentValue = Math.floor(resources.get(resource).current);
                const lastValue = this.lastResourceValues.get(resource) || currentValue;
                
                if (currentValue !== lastValue) {
                    element.textContent = currentValue;
                    
                    const change = currentValue - lastValue;
                    if (change !== 0 && Math.abs(change) < 100) {
                        this.animations.showResourceChange(element, change, change > 0);
                    }
                    
                    this.lastResourceValues.set(resource, currentValue);
                }
            }
        });
    }

    updatePopulation(current, max) {
        this.elements.get('population').textContent = `${current}/${max}`;
    }

    updateHappiness(baseHappiness) {
        // 建物ボーナスを計算
        let totalBonus = 0;
        if (this.game.happinessBonuses) {
            for (const bonus of this.game.happinessBonuses.values()) {
                totalBonus += bonus;
            }
        }
        
        // 最終的な幸福度を計算（最大100%）
        const finalHappiness = Math.min(100, baseHappiness * (1 + totalBonus));
        this.elements.get('happiness').textContent = `${Math.floor(finalHappiness)}%`;
        
        // 幸福度が低い場合は警告色に変更
        const element = this.elements.get('happiness');
        if (finalHappiness < 50) {
            element.style.color = '#ff6b6b';
        } else if (finalHappiness < 70) {
            element.style.color = '#ffd93d';
        } else {
            element.style.color = '#51cf66';
        }
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
            <p><strong>状態:</strong> ${building.isComplete ? (building.isDestroyed ? '破壊' : '稼働中') : '建設中'}</p>
            <p><strong>進捗:</strong> ${Math.floor(building.progress * 100)}%</p>
        `;
        
        // 健康状態を表示
        if (building.health !== undefined && building.health < 1) {
            const healthPercentage = Math.floor(building.health * 100);
            const healthColor = healthPercentage > 50 ? '#51cf66' : (healthPercentage > 25 ? '#ffd93d' : '#ff6b6b');
            html += `<p><strong>健康状態:</strong> <span style="color: ${healthColor}">${healthPercentage}%</span></p>`;
        }
        
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
            // アニメーション付きで表示
            this.animations.bounceIn(window.element);
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
    showNotification(message, type = 'info', icon = '') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // 背景色の設定
        let backgroundColor;
        switch (type) {
            case 'error': backgroundColor = 'rgba(255, 50, 50, 0.9)'; break;
            case 'danger': backgroundColor = 'rgba(200, 50, 50, 0.9)'; break;
            case 'success': backgroundColor = 'rgba(50, 255, 50, 0.9)'; break;
            case 'warning': backgroundColor = 'rgba(255, 200, 50, 0.9)'; break;
            default: backgroundColor = 'rgba(50, 150, 255, 0.9)';
        }
        
        notification.innerHTML = `${icon ? icon + ' ' : ''}${message}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${backgroundColor};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            font-size: 16px;
            font-weight: bold;
        `;
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // アニメーション付きで表示
        this.animations.slideIn(notification, 'top', 300);
        
        // 危険な通知は振動させる
        if (type === 'danger' || type === 'error') {
            setTimeout(() => {
                this.animations.shake(notification, 300);
            }, 300);
        }
        
        // 3秒後に削除（災害通知は長めに表示）
        const duration = type === 'danger' ? 5000 : 3000;
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }, duration);
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