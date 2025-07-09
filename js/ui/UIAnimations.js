// UIアニメーションシステム
export class UIAnimations {
    constructor() {
        this.animations = new Map();
        this.activeAnimations = new Set();
        this.animationId = 0;
    }
    
    init() {
        // CSSアニメーションのスタイルを追加
        this.addAnimationStyles();
        console.log('✅ UIAnimations 初期化完了');
    }
    
    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* パルスアニメーション */
            @keyframes uiPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }
            
            /* バウンスイン */
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.1); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            /* フェードイン */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* スライドイン（上から） */
            @keyframes slideInTop {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            /* スライドイン（下から） */
            @keyframes slideInBottom {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            /* 回転アニメーション */
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* グロー効果 */
            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
                50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.8); }
            }
            
            /* 振動 */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            /* 数値カウントアップ */
            .count-up {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            /* ボタンホバー効果 */
            .animated-button {
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .animated-button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.3s, height 0.3s;
            }
            
            .animated-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            
            .animated-button:hover::before {
                width: 300px;
                height: 300px;
            }
            
            .animated-button:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            /* リソース変更アニメーション */
            .resource-change {
                position: absolute;
                font-size: 1.2rem;
                font-weight: bold;
                pointer-events: none;
                animation: floatUp 1.5s ease-out forwards;
            }
            
            @keyframes floatUp {
                0% {
                    transform: translateY(0);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-50px);
                    opacity: 0;
                }
            }
            
            /* 成功/エラーフラッシュ */
            .flash-success {
                animation: flashSuccess 0.5s ease;
            }
            
            @keyframes flashSuccess {
                0%, 100% { background-color: inherit; }
                50% { background-color: rgba(0, 255, 0, 0.3); }
            }
            
            .flash-error {
                animation: flashError 0.5s ease;
            }
            
            @keyframes flashError {
                0%, 100% { background-color: inherit; }
                50% { background-color: rgba(255, 0, 0, 0.3); }
            }
            
            /* ツールチップアニメーション */
            .tooltip-animated {
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.2s ease;
            }
            
            .tooltip-animated.show {
                opacity: 1;
                transform: scale(1);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 要素にアニメーションを適用
    animate(element, animationName, duration = 1000, options = {}) {
        const id = this.animationId++;
        const animation = {
            id,
            element,
            animationName,
            duration,
            options,
            startTime: Date.now()
        };
        
        this.animations.set(id, animation);
        this.activeAnimations.add(id);
        
        // CSSアニメーションを適用
        element.style.animation = `${animationName} ${duration}ms ${options.easing || 'ease'} ${options.delay || 0}ms`;
        
        // アニメーション終了後のクリーンアップ
        setTimeout(() => {
            this.cleanupAnimation(id);
        }, duration + (options.delay || 0));
        
        return id;
    }
    
    // アニメーションのクリーンアップ
    cleanupAnimation(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.element.style.animation = '';
            this.animations.delete(id);
            this.activeAnimations.delete(id);
            
            // コールバックがあれば実行
            if (animation.options.onComplete) {
                animation.options.onComplete();
            }
        }
    }
    
    // パルスアニメーション
    pulse(element, count = 1) {
        let pulseCount = 0;
        const doPulse = () => {
            if (pulseCount < count) {
                this.animate(element, 'uiPulse', 500, {
                    onComplete: () => {
                        pulseCount++;
                        if (pulseCount < count) {
                            setTimeout(doPulse, 100);
                        }
                    }
                });
            }
        };
        doPulse();
    }
    
    // バウンスイン
    bounceIn(element) {
        return this.animate(element, 'bounceIn', 600);
    }
    
    // フェードイン
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        return this.animate(element, 'fadeIn', duration);
    }
    
    // スライドイン
    slideIn(element, direction = 'top', duration = 400) {
        const animationName = direction === 'top' ? 'slideInTop' : 'slideInBottom';
        return this.animate(element, animationName, duration);
    }
    
    // 回転
    rotate(element, continuous = false) {
        if (continuous) {
            element.style.animation = 'rotate 2s linear infinite';
        } else {
            return this.animate(element, 'rotate', 1000);
        }
    }
    
    // グロー効果
    glow(element, duration = 2000) {
        return this.animate(element, 'glow', duration, { easing: 'ease-in-out' });
    }
    
    // 振動
    shake(element, duration = 500) {
        return this.animate(element, 'shake', duration);
    }
    
    // 数値カウントアップアニメーション
    countUp(element, start, end, duration = 1000) {
        const startTime = Date.now();
        const range = end - start;
        
        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数（ease-out-cubic）
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + range * easeOutCubic);
            
            element.textContent = current.toString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = end.toString();
            }
        };
        
        update();
    }
    
    // リソース変更の表示
    showResourceChange(element, amount, positive = true) {
        const change = document.createElement('div');
        change.className = 'resource-change';
        change.style.color = positive ? '#00ff88' : '#ff6b6b';
        change.textContent = `${positive ? '+' : ''}${amount}`;
        
        // 要素の位置を取得
        const rect = element.getBoundingClientRect();
        change.style.left = rect.left + rect.width / 2 + 'px';
        change.style.top = rect.top + 'px';
        
        document.body.appendChild(change);
        
        // アニメーション終了後に削除
        setTimeout(() => {
            change.remove();
        }, 1500);
    }
    
    // フラッシュ効果
    flash(element, type = 'success') {
        element.classList.add(`flash-${type}`);
        setTimeout(() => {
            element.classList.remove(`flash-${type}`);
        }, 500);
    }
    
    // ボタンアニメーションの有効化
    enableButtonAnimations() {
        document.querySelectorAll('button').forEach(button => {
            if (!button.classList.contains('animated-button')) {
                button.classList.add('animated-button');
            }
        });
    }
    
    // ツールチップアニメーション
    animateTooltip(tooltip, show = true) {
        tooltip.classList.add('tooltip-animated');
        if (show) {
            tooltip.style.display = 'block';
            setTimeout(() => {
                tooltip.classList.add('show');
            }, 10);
        } else {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 200);
        }
    }
    
    // 進捗バーアニメーション
    animateProgress(progressBar, targetValue, duration = 500) {
        const currentValue = parseFloat(progressBar.style.width) || 0;
        const startTime = Date.now();
        
        const update = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const currentWidth = currentValue + (targetValue - currentValue) * easeOutQuad;
            
            progressBar.style.width = currentWidth + '%';
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        
        update();
    }
    
    // チェーンアニメーション
    chain(animations) {
        let index = 0;
        
        const runNext = () => {
            if (index < animations.length) {
                const { element, animation, duration, options = {} } = animations[index];
                options.onComplete = () => {
                    index++;
                    runNext();
                };
                
                if (typeof animation === 'function') {
                    animation.call(this, element);
                } else {
                    this.animate(element, animation, duration, options);
                }
            }
        };
        
        runNext();
    }
    
    // 全アニメーションの停止
    stopAll() {
        this.activeAnimations.forEach(id => {
            const animation = this.animations.get(id);
            if (animation) {
                animation.element.style.animation = '';
            }
        });
        
        this.animations.clear();
        this.activeAnimations.clear();
    }
    
    // クリーンアップ
    dispose() {
        this.stopAll();
    }
}