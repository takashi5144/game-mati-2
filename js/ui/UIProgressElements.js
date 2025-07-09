// UI進捗要素（プログレスバー、ローディング、インジケーター）
export class UIProgressElements {
    constructor() {
        this.progressBars = new Map();
        this.loaders = new Map();
    }
    
    // カスタム進捗バーを作成
    createProgressBar(id, options = {}) {
        const container = document.createElement('div');
        container.className = 'custom-progress-bar';
        container.id = `progress-${id}`;
        
        const label = document.createElement('div');
        label.className = 'progress-label';
        label.textContent = options.label || '';
        
        const barContainer = document.createElement('div');
        barContainer.className = 'progress-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar-fill';
        bar.style.width = '0%';
        
        const text = document.createElement('div');
        text.className = 'progress-text';
        text.textContent = '0%';
        
        barContainer.appendChild(bar);
        container.appendChild(label);
        container.appendChild(barContainer);
        container.appendChild(text);
        
        // スタイルを適用
        this.applyProgressBarStyles(container, options);
        
        const progressBar = {
            container,
            bar,
            text,
            label,
            value: 0,
            options
        };
        
        this.progressBars.set(id, progressBar);
        
        return container;
    }
    
    applyProgressBarStyles(container, options) {
        const style = document.createElement('style');
        style.textContent = `
            .custom-progress-bar {
                width: ${options.width || '300px'};
                padding: 10px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid ${options.borderColor || '#00ff88'};
                border-radius: 8px;
                position: ${options.position || 'relative'};
            }
            
            .progress-label {
                color: #fff;
                font-size: 14px;
                margin-bottom: 5px;
                text-align: center;
            }
            
            .progress-bar-container {
                width: 100%;
                height: ${options.height || '20px'};
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar-fill {
                height: 100%;
                background: ${options.fillColor || 'linear-gradient(90deg, #00ff88, #00ffdd)'};
                border-radius: 10px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .progress-bar-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                );
                animation: progressShine 2s infinite;
            }
            
            @keyframes progressShine {
                0% { left: -100%; }
                100% { left: 100%; }
            }
            
            .progress-text {
                color: #fff;
                font-size: 12px;
                text-align: center;
                margin-top: 5px;
            }
            
            /* 建設進捗バー */
            .construction-progress {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                width: 80px;
                z-index: 100;
            }
            
            .construction-progress .progress-bar-container {
                height: 6px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .construction-progress .progress-bar-fill {
                background: linear-gradient(90deg, #ffd700, #ffed4e);
            }
        `;
        
        if (!document.getElementById('progress-bar-styles')) {
            style.id = 'progress-bar-styles';
            document.head.appendChild(style);
        }
    }
    
    // 進捗バーの値を更新
    updateProgressBar(id, value, animated = true) {
        const progressBar = this.progressBars.get(id);
        if (!progressBar) return;
        
        value = Math.max(0, Math.min(100, value));
        progressBar.value = value;
        
        if (animated) {
            // アニメーション付きで更新
            const duration = 300;
            const startValue = parseFloat(progressBar.bar.style.width) || 0;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = startValue + (value - startValue) * progress;
                
                progressBar.bar.style.width = currentValue + '%';
                progressBar.text.textContent = Math.floor(currentValue) + '%';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        } else {
            progressBar.bar.style.width = value + '%';
            progressBar.text.textContent = value + '%';
        }
        
        // 完了時の効果
        if (value >= 100 && progressBar.options.onComplete) {
            progressBar.options.onComplete();
        }
    }
    
    // ローディングスピナーを作成
    createLoader(id, options = {}) {
        const loader = document.createElement('div');
        loader.className = 'custom-loader';
        loader.id = `loader-${id}`;
        
        const type = options.type || 'spinner';
        
        switch (type) {
            case 'spinner':
                loader.innerHTML = this.createSpinnerHTML(options);
                break;
            case 'dots':
                loader.innerHTML = this.createDotsHTML(options);
                break;
            case 'ring':
                loader.innerHTML = this.createRingHTML(options);
                break;
            case 'cube':
                loader.innerHTML = this.createCubeHTML(options);
                break;
        }
        
        if (options.text) {
            const text = document.createElement('div');
            text.className = 'loader-text';
            text.textContent = options.text;
            loader.appendChild(text);
        }
        
        this.applyLoaderStyles(type, options);
        this.loaders.set(id, { element: loader, type, options });
        
        return loader;
    }
    
    createSpinnerHTML(options) {
        return `
            <div class="spinner-loader">
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
                <div class="spinner-blade"></div>
            </div>
        `;
    }
    
    createDotsHTML(options) {
        return `
            <div class="dots-loader">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
    }
    
    createRingHTML(options) {
        return `
            <div class="ring-loader">
                <div class="ring"></div>
            </div>
        `;
    }
    
    createCubeHTML(options) {
        return `
            <div class="cube-loader">
                <div class="cube-face cube-face-front"></div>
                <div class="cube-face cube-face-back"></div>
                <div class="cube-face cube-face-right"></div>
                <div class="cube-face cube-face-left"></div>
                <div class="cube-face cube-face-top"></div>
                <div class="cube-face cube-face-bottom"></div>
            </div>
        `;
    }
    
    applyLoaderStyles(type, options) {
        const style = document.createElement('style');
        const color = options.color || '#00ff88';
        const size = options.size || '40px';
        
        style.textContent = `
            .custom-loader {
                display: inline-block;
                position: relative;
            }
            
            .loader-text {
                margin-top: 10px;
                text-align: center;
                color: #fff;
                font-size: 14px;
            }
            
            /* スピナーローダー */
            .spinner-loader {
                width: ${size};
                height: ${size};
                position: relative;
                animation: spinnerRotate 1s linear infinite;
            }
            
            .spinner-blade {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 10%;
                height: 30%;
                background: ${color};
                border-radius: 50% / 20%;
                transform-origin: center -150%;
                opacity: 0.8;
            }
            
            .spinner-blade:nth-child(1) { transform: rotate(0deg); opacity: 1; }
            .spinner-blade:nth-child(2) { transform: rotate(45deg); opacity: 0.9; }
            .spinner-blade:nth-child(3) { transform: rotate(90deg); opacity: 0.8; }
            .spinner-blade:nth-child(4) { transform: rotate(135deg); opacity: 0.7; }
            .spinner-blade:nth-child(5) { transform: rotate(180deg); opacity: 0.6; }
            .spinner-blade:nth-child(6) { transform: rotate(225deg); opacity: 0.5; }
            .spinner-blade:nth-child(7) { transform: rotate(270deg); opacity: 0.4; }
            .spinner-blade:nth-child(8) { transform: rotate(315deg); opacity: 0.3; }
            
            @keyframes spinnerRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* ドットローダー */
            .dots-loader {
                display: flex;
                gap: 8px;
            }
            
            .dot {
                width: 12px;
                height: 12px;
                background: ${color};
                border-radius: 50%;
                animation: dotPulse 1.2s ease-in-out infinite;
            }
            
            .dot:nth-child(1) { animation-delay: 0s; }
            .dot:nth-child(2) { animation-delay: 0.2s; }
            .dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes dotPulse {
                0%, 80%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1.2);
                    opacity: 1;
                }
            }
            
            /* リングローダー */
            .ring-loader {
                width: ${size};
                height: ${size};
            }
            
            .ring {
                width: 100%;
                height: 100%;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: ${color};
                border-radius: 50%;
                animation: ringRotate 1s linear infinite;
            }
            
            @keyframes ringRotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* キューブローダー */
            .cube-loader {
                width: ${size};
                height: ${size};
                transform-style: preserve-3d;
                animation: cubeRotate 2s linear infinite;
            }
            
            .cube-face {
                position: absolute;
                width: 100%;
                height: 100%;
                background: ${color};
                opacity: 0.8;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .cube-face-front  { transform: translateZ(calc(${size} / 2)); }
            .cube-face-back   { transform: rotateY(180deg) translateZ(calc(${size} / 2)); }
            .cube-face-right  { transform: rotateY(90deg) translateZ(calc(${size} / 2)); }
            .cube-face-left   { transform: rotateY(-90deg) translateZ(calc(${size} / 2)); }
            .cube-face-top    { transform: rotateX(90deg) translateZ(calc(${size} / 2)); }
            .cube-face-bottom { transform: rotateX(-90deg) translateZ(calc(${size} / 2)); }
            
            @keyframes cubeRotate {
                from { transform: rotateX(0deg) rotateY(0deg); }
                to { transform: rotateX(360deg) rotateY(360deg); }
            }
        `;
        
        if (!document.getElementById(`loader-styles-${type}`)) {
            style.id = `loader-styles-${type}`;
            document.head.appendChild(style);
        }
    }
    
    // ローダーの表示/非表示
    showLoader(id) {
        const loader = this.loaders.get(id);
        if (loader) {
            loader.element.style.display = 'inline-block';
        }
    }
    
    hideLoader(id) {
        const loader = this.loaders.get(id);
        if (loader) {
            loader.element.style.display = 'none';
        }
    }
    
    // 建設進捗バーを作成
    createConstructionProgress(building) {
        const progress = this.createProgressBar(`construction-${building.id}`, {
            width: '80px',
            height: '6px',
            fillColor: 'linear-gradient(90deg, #ffd700, #ffed4e)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            position: 'absolute'
        });
        
        progress.classList.add('construction-progress');
        return progress;
    }
    
    // クリーンアップ
    dispose() {
        this.progressBars.clear();
        this.loaders.clear();
    }
}