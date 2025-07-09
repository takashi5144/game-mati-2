// チュートリアルシステム
export class TutorialSystem {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.isActive = false;
        this.completedTutorials = new Set();
        
        // チュートリアルステップ
        this.steps = [
            {
                id: 'welcome',
                title: 'ピクセルファーム・フロンティア 3Dへようこそ！',
                description: 'この世界で繁栄する街を築きましょう。まずは基本的な操作を学びます。',
                target: null,
                action: 'none',
                position: 'center',
                highlight: null,
                condition: () => true,
                onComplete: () => {}
            },
            {
                id: 'camera_controls',
                title: 'カメラ操作',
                description: '中マウスボタンでパン、右マウスボタンで回転、ホイールでズームができます。WASDキーでも移動できます。',
                target: null,
                action: 'practice',
                position: 'top-right',
                highlight: null,
                condition: () => true,
                onComplete: () => {
                    this.game.ui.showNotification('カメラ操作をマスターしました！', 'success');
                }
            },
            {
                id: 'resources',
                title: 'リソース管理',
                description: '画面上部にリソースが表示されています。食料、木材、石材などを管理して街を発展させましょう。',
                target: '.resource-panel',
                action: 'observe',
                position: 'top',
                highlight: '.resource-panel',
                condition: () => true,
                onComplete: () => {}
            },
            {
                id: 'first_house',
                title: '最初の家を建てる',
                description: 'Bキーを押して建設メニューを開き、家を選択してください。家は人口上限を増やします。',
                target: '[data-tool="house"]',
                action: 'click',
                position: 'bottom',
                highlight: '.tool-category:first-child',
                condition: () => true,
                onComplete: () => {
                    this.checkBuildingPlacement('house');
                }
            },
            {
                id: 'place_house',
                title: '家を配置する',
                description: '適切な場所をクリックして家を配置してください。緑色の枠が配置可能な場所を示します。',
                target: null,
                action: 'place',
                position: 'center',
                highlight: null,
                condition: () => this.game.toolSystem?.currentTool === 'house',
                onComplete: () => {}
            },
            {
                id: 'assign_builder',
                title: '建築家を割り当てる',
                description: '住民をクリックして選択し、建築家の職業を割り当てて建設を開始させましょう。',
                target: null,
                action: 'assign',
                position: 'center',
                highlight: null,
                condition: () => this.game.buildingSystem?.getBuildingsByType('house').some(b => !b.isComplete),
                onComplete: () => {}
            },
            {
                id: 'first_farm',
                title: '食料生産',
                description: '食料を生産するため畑を建設しましょう。畑は農夫が管理します。',
                target: '[data-tool="farm"]',
                action: 'click',
                position: 'bottom',
                highlight: '[data-tool="farm"]',
                condition: () => this.hasCompletedBuilding('house'),
                onComplete: () => {}
            },
            {
                id: 'farming_basics',
                title: '農業の基本',
                description: '畑を建設したら、農夫を割り当てて作物を植えましょう。季節によって成長速度が変わります。',
                target: null,
                action: 'observe',
                position: 'center',
                highlight: null,
                condition: () => this.hasCompletedBuilding('farm'),
                onComplete: () => {}
            },
            {
                id: 'market_intro',
                title: '市場システム',
                description: 'Mキーを押して市場を開きましょう。ここで資源の売買ができます。',
                target: '#btn-market',
                action: 'click',
                position: 'top',
                highlight: '#btn-market',
                condition: () => this.game.resourceManager?.getResource('food') > 50,
                onComplete: () => {}
            },
            {
                id: 'save_game',
                title: 'ゲームを保存',
                description: 'Ctrl+Sでセーブメニューを開けます。定期的にゲームを保存しましょう。',
                target: '#btn-save',
                action: 'observe',
                position: 'top',
                highlight: '#btn-save',
                condition: () => this.game.timeSystem?.currentDay > 2,
                onComplete: () => {}
            },
            {
                id: 'tutorial_complete',
                title: 'チュートリアル完了！',
                description: 'おめでとうございます！基本的な操作を習得しました。あなたの街を自由に発展させましょう！',
                target: null,
                action: 'complete',
                position: 'center',
                highlight: null,
                condition: () => true,
                onComplete: () => {
                    this.completeTutorial();
                }
            }
        ];
        
        // 進行状況
        this.progress = {
            cameraMoved: false,
            buildingPlaced: false,
            workerAssigned: false,
            farmPlaced: false,
            marketOpened: false,
            gameSaved: false
        };
    }
    
    init() {
        // チュートリアルの開始確認
        const hasPlayedBefore = localStorage.getItem('pixelfarm3d_tutorial_completed');
        
        if (!hasPlayedBefore) {
            setTimeout(() => {
                this.showTutorialPrompt();
            }, 1000);
        }
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        console.log('✅ TutorialSystem 初期化完了');
    }
    
    setupEventListeners() {
        // カメラ移動の検知
        let initialCameraPos = null;
        if (this.game.camera) {
            initialCameraPos = this.game.camera.position.clone();
        }
        
        // 定期的にチェック
        setInterval(() => {
            if (this.isActive && this.game.camera && initialCameraPos) {
                const distance = this.game.camera.position.distanceTo(initialCameraPos);
                if (distance > 5) {
                    this.progress.cameraMoved = true;
                }
            }
        }, 1000);
        
        // 建物配置の検知
        window.addEventListener('buildingPlaced', (e) => {
            if (this.isActive) {
                const buildingType = e.detail.type;
                if (buildingType === 'house') {
                    this.progress.buildingPlaced = true;
                    this.nextStep();
                } else if (buildingType === 'farm') {
                    this.progress.farmPlaced = true;
                    this.nextStep();
                }
            }
        });
        
        // 職業割り当ての検知
        window.addEventListener('professionAssigned', (e) => {
            if (this.isActive && e.detail.profession === 'builder') {
                this.progress.workerAssigned = true;
                this.nextStep();
            }
        });
        
        // 市場オープンの検知
        window.addEventListener('marketOpened', () => {
            if (this.isActive) {
                this.progress.marketOpened = true;
                this.nextStep();
            }
        });
        
        // セーブの検知
        window.addEventListener('gameSaved', () => {
            if (this.isActive) {
                this.progress.gameSaved = true;
                this.nextStep();
            }
        });
    }
    
    showTutorialPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'tutorial-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h2>チュートリアルを開始しますか？</h2>
                <p>ゲームの基本操作を学ぶことができます。</p>
                <div class="prompt-actions">
                    <button id="tutorial-yes" class="btn btn-primary">はい</button>
                    <button id="tutorial-no" class="btn btn-secondary">スキップ</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        document.getElementById('tutorial-yes').addEventListener('click', () => {
            prompt.remove();
            this.startTutorial();
        });
        
        document.getElementById('tutorial-no').addEventListener('click', () => {
            prompt.remove();
            this.skipTutorial();
        });
        
        // スタイルを追加
        this.addTutorialStyles();
    }
    
    addTutorialStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-prompt {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            .prompt-content {
                background: rgba(20, 20, 30, 0.98);
                border: 2px solid #00ff88;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                max-width: 400px;
            }
            
            .prompt-content h2 {
                color: #00ff88;
                margin-bottom: 15px;
            }
            
            .prompt-content p {
                color: #ccc;
                margin-bottom: 20px;
            }
            
            .prompt-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1900;
            }
            
            .tutorial-highlight {
                position: absolute;
                border: 3px solid #00ff88;
                background: rgba(0, 255, 136, 0.1);
                border-radius: 8px;
                animation: pulse 2s infinite;
                pointer-events: none;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .tutorial-tooltip {
                position: fixed;
                background: rgba(20, 20, 30, 0.98);
                border: 2px solid #00ff88;
                border-radius: 8px;
                padding: 20px;
                max-width: 350px;
                box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
                z-index: 1950;
            }
            
            .tutorial-tooltip::after {
                content: '';
                position: absolute;
                width: 0;
                height: 0;
                border-style: solid;
            }
            
            .tutorial-tooltip.top::after {
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 10px 10px 0 10px;
                border-color: #00ff88 transparent transparent transparent;
            }
            
            .tutorial-tooltip.bottom::after {
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 0 10px 10px 10px;
                border-color: transparent transparent #00ff88 transparent;
            }
            
            .tutorial-title {
                font-size: 18px;
                font-weight: bold;
                color: #00ff88;
                margin-bottom: 10px;
            }
            
            .tutorial-description {
                color: #ccc;
                margin-bottom: 15px;
                line-height: 1.5;
            }
            
            .tutorial-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            .tutorial-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .tutorial-btn-primary {
                background: #00ff88;
                color: #000;
            }
            
            .tutorial-btn-primary:hover {
                background: #00cc66;
            }
            
            .tutorial-btn-secondary {
                background: #666;
                color: #fff;
            }
            
            .tutorial-btn-secondary:hover {
                background: #555;
            }
            
            .tutorial-progress {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(20, 20, 30, 0.9);
                border: 1px solid #444;
                border-radius: 20px;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1900;
            }
            
            .tutorial-progress-bar {
                width: 200px;
                height: 8px;
                background: #333;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .tutorial-progress-fill {
                height: 100%;
                background: #00ff88;
                transition: width 0.3s;
            }
            
            .tutorial-progress-text {
                color: #ccc;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    
    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.createTutorialUI();
        this.showStep(0);
        
        // チュートリアル開始を記録
        this.game.ui?.showNotification('チュートリアルを開始しました', 'info');
    }
    
    skipTutorial() {
        this.completeTutorial();
        this.game.ui?.showNotification('チュートリアルをスキップしました', 'info');
    }
    
    createTutorialUI() {
        // オーバーレイ
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        document.body.appendChild(this.overlay);
        
        // ツールチップ
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        document.body.appendChild(this.tooltip);
        
        // プログレスバー
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'tutorial-progress';
        this.progressBar.innerHTML = `
            <span class="tutorial-progress-text">チュートリアル</span>
            <div class="tutorial-progress-bar">
                <div class="tutorial-progress-fill" style="width: 0%"></div>
            </div>
            <span class="tutorial-progress-text">0 / ${this.steps.length}</span>
        `;
        document.body.appendChild(this.progressBar);
    }
    
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }
        
        const step = this.steps[stepIndex];
        this.currentStep = stepIndex;
        
        // 条件チェック
        if (!step.condition()) {
            // 条件を満たしていない場合は次のステップへ
            this.showStep(stepIndex + 1);
            return;
        }
        
        // プログレスバーを更新
        this.updateProgress();
        
        // ハイライトを表示
        if (step.highlight) {
            this.highlightElement(step.highlight);
        } else {
            this.clearHighlight();
        }
        
        // ツールチップを表示
        this.showTooltip(step);
    }
    
    showTooltip(step) {
        this.tooltip.innerHTML = `
            <div class="tutorial-title">${step.title}</div>
            <div class="tutorial-description">${step.description}</div>
            <div class="tutorial-actions">
                ${step.action === 'practice' ? 
                    '<button class="tutorial-btn tutorial-btn-secondary" id="tutorial-skip">スキップ</button>' : 
                    ''}
                ${step.action !== 'none' ? 
                    '<button class="tutorial-btn tutorial-btn-primary" id="tutorial-next">次へ</button>' :
                    '<button class="tutorial-btn tutorial-btn-primary" id="tutorial-next">OK</button>'
                }
            </div>
        `;
        
        // 位置を設定
        this.positionTooltip(step);
        
        // ボタンのイベントリスナーを設定
        setTimeout(() => {
            const nextBtn = document.getElementById('tutorial-next');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextStep());
            }
            
            const skipBtn = document.getElementById('tutorial-skip');
            if (skipBtn) {
                skipBtn.addEventListener('click', () => this.skipStep());
            }
        }, 100);
        
        // アクション特有の処理
        if (step.action === 'practice') {
            this.waitForPractice(step);
        } else if (step.action === 'click') {
            this.waitForClick(step);
        } else if (step.action === 'place') {
            this.waitForPlacement(step);
        }
    }
    
    positionTooltip(step) {
        const tooltip = this.tooltip;
        
        // デフォルトは中央
        let left = window.innerWidth / 2 - 175;
        let top = window.innerHeight / 2 - 100;
        
        if (step.target) {
            const element = document.querySelector(step.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                left = rect.left + rect.width / 2 - 175;
                top = rect.bottom + 20;
                
                // 画面外にはみ出ないように調整
                left = Math.max(10, Math.min(left, window.innerWidth - 360));
                top = Math.max(10, Math.min(top, window.innerHeight - 200));
            }
        }
        
        switch (step.position) {
            case 'top':
                top = 100;
                break;
            case 'top-right':
                left = window.innerWidth - 370;
                top = 100;
                break;
            case 'bottom':
                top = window.innerHeight - 200;
                break;
            case 'center':
                // デフォルトのまま
                break;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.className = 'tutorial-tooltip ' + (top < window.innerHeight / 2 ? 'top' : 'bottom');
    }
    
    highlightElement(selector) {
        this.clearHighlight();
        
        const element = document.querySelector(selector);
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.className = 'tutorial-highlight';
        highlight.style.left = rect.left - 5 + 'px';
        highlight.style.top = rect.top - 5 + 'px';
        highlight.style.width = rect.width + 10 + 'px';
        highlight.style.height = rect.height + 10 + 'px';
        
        this.overlay.appendChild(highlight);
        this.currentHighlight = highlight;
    }
    
    clearHighlight() {
        if (this.currentHighlight) {
            this.currentHighlight.remove();
            this.currentHighlight = null;
        }
    }
    
    waitForPractice(step) {
        // カメラ操作の練習待ち
        const checkInterval = setInterval(() => {
            if (this.progress.cameraMoved) {
                clearInterval(checkInterval);
                step.onComplete();
                this.nextStep();
            }
        }, 500);
        
        this.currentInterval = checkInterval;
    }
    
    waitForClick(step) {
        if (!step.target) return;
        
        const element = document.querySelector(step.target);
        if (!element) return;
        
        // 一時的にポインターイベントを有効化
        const originalPointerEvents = element.style.pointerEvents;
        element.style.pointerEvents = 'auto';
        
        const clickHandler = () => {
            element.style.pointerEvents = originalPointerEvents;
            element.removeEventListener('click', clickHandler);
            step.onComplete();
            this.nextStep();
        };
        
        element.addEventListener('click', clickHandler);
    }
    
    waitForPlacement(step) {
        // 建物配置待ち（イベントリスナーで処理）
    }
    
    nextStep() {
        const currentStep = this.steps[this.currentStep];
        if (currentStep.onComplete) {
            currentStep.onComplete();
        }
        
        this.showStep(this.currentStep + 1);
    }
    
    skipStep() {
        this.nextStep();
    }
    
    updateProgress() {
        const progress = (this.currentStep / this.steps.length) * 100;
        const fill = this.progressBar.querySelector('.tutorial-progress-fill');
        const text = this.progressBar.querySelectorAll('.tutorial-progress-text')[1];
        
        fill.style.width = progress + '%';
        text.textContent = `${this.currentStep + 1} / ${this.steps.length}`;
    }
    
    completeTutorial() {
        this.isActive = false;
        
        // UIをクリーンアップ
        if (this.overlay) this.overlay.remove();
        if (this.tooltip) this.tooltip.remove();
        if (this.progressBar) this.progressBar.remove();
        if (this.currentInterval) clearInterval(this.currentInterval);
        
        // 完了を記録
        localStorage.setItem('pixelfarm3d_tutorial_completed', 'true');
        this.completedTutorials.add('basic');
        
        // 完了メッセージ
        this.game.ui?.showNotification('チュートリアルを完了しました！', 'success');
        
        // 報酬を与える（オプション）
        this.giveTutorialRewards();
    }
    
    giveTutorialRewards() {
        // チュートリアル完了報酬
        this.game.resourceManager?.add({
            wood: 50,
            food: 50,
            money: 200
        });
        
        this.game.ui?.showNotification('チュートリアル報酬を獲得しました！', 'success');
    }
    
    // ヘルパーメソッド
    hasCompletedBuilding(type) {
        return this.game.buildingSystem?.getBuildingsByType(type).some(b => b.isComplete);
    }
    
    checkBuildingPlacement(type) {
        // 建物配置のチェック用
        setTimeout(() => {
            const buildings = this.game.buildingSystem?.getBuildingsByType(type);
            if (buildings && buildings.length > 0) {
                this.nextStep();
            }
        }, 1000);
    }
    
    // 特定のチュートリアルを再生
    playTutorial(tutorialId) {
        // 将来的に複数のチュートリアルに対応
        if (tutorialId === 'basic' && !this.completedTutorials.has('basic')) {
            this.startTutorial();
        }
    }
    
    // クリーンアップ
    dispose() {
        if (this.overlay) this.overlay.remove();
        if (this.tooltip) this.tooltip.remove();
        if (this.progressBar) this.progressBar.remove();
        if (this.currentInterval) clearInterval(this.currentInterval);
    }
}