// 天候UIコンポーネント
export class WeatherUI {
    constructor(uiManager, weatherSystem) {
        this.uiManager = uiManager;
        this.weatherSystem = weatherSystem;
        this.weatherDisplay = null;
        this.weatherEffectsEnabled = true;
    }
    
    init() {
        this.createWeatherDisplay();
        this.createWeatherSettings();
    }
    
    createWeatherDisplay() {
        // 天候表示を追加
        const weatherPanel = document.createElement('div');
        weatherPanel.id = 'weather-panel';
        weatherPanel.className = 'weather-panel';
        weatherPanel.innerHTML = `
            <div class="weather-icon" id="weather-icon">☀️</div>
            <div class="weather-info">
                <div class="weather-name" id="weather-name">晴れ</div>
                <div class="weather-details" id="weather-details">
                    <span class="wind-speed">風速: <span id="wind-speed">0.5</span>m/s</span>
                </div>
            </div>
        `;
        
        // スタイルを追加
        const style = document.createElement('style');
        style.textContent = `
            .weather-panel {
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(20, 20, 30, 0.8);
                border: 2px solid #444;
                border-radius: 8px;
                padding: 15px;
                min-width: 200px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                z-index: 100;
            }
            
            .weather-icon {
                font-size: 48px;
                text-align: center;
                margin-bottom: 10px;
            }
            
            .weather-info {
                text-align: center;
            }
            
            .weather-name {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
            }
            
            .weather-details {
                font-size: 12px;
                color: #ccc;
            }
            
            .wind-speed {
                display: inline-block;
                margin: 0 5px;
            }
            
            .weather-settings {
                position: fixed;
                bottom: 100px;
                right: 20px;
                background: rgba(20, 20, 30, 0.8);
                border: 2px solid #444;
                border-radius: 8px;
                padding: 10px;
                z-index: 100;
            }
            
            .weather-toggle {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                font-size: 14px;
            }
            
            .toggle-switch {
                width: 40px;
                height: 20px;
                background: #444;
                border-radius: 10px;
                position: relative;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .toggle-switch.active {
                background: #00ff88;
            }
            
            .toggle-switch::after {
                content: '';
                position: absolute;
                width: 16px;
                height: 16px;
                background: #fff;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: left 0.3s;
            }
            
            .toggle-switch.active::after {
                left: 22px;
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(weatherPanel);
        this.weatherDisplay = weatherPanel;
    }
    
    createWeatherSettings() {
        // 天候エフェクトの切り替え設定
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'weather-settings';
        settingsPanel.innerHTML = `
            <div class="weather-toggle">
                <span>天候エフェクト</span>
                <div class="toggle-switch active" id="weather-effects-toggle"></div>
            </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // トグルイベント
        const toggle = document.getElementById('weather-effects-toggle');
        toggle.addEventListener('click', () => {
            this.weatherEffectsEnabled = !this.weatherEffectsEnabled;
            toggle.classList.toggle('active');
            this.toggleWeatherEffects();
        });
    }
    
    toggleWeatherEffects() {
        if (this.weatherEffectsEnabled) {
            // エフェクトを有効化
            if (this.weatherSystem.rainParticles) {
                this.weatherSystem.rainParticles.visible = this.weatherSystem.weatherTypes[this.weatherSystem.currentWeather].rainIntensity > 0;
            }
            if (this.weatherSystem.snowParticles) {
                this.weatherSystem.snowParticles.visible = this.weatherSystem.weatherTypes[this.weatherSystem.currentWeather].snowIntensity > 0;
            }
            this.weatherSystem.cloudMeshes.forEach(cloud => {
                cloud.visible = true;
            });
        } else {
            // エフェクトを無効化
            if (this.weatherSystem.rainParticles) {
                this.weatherSystem.rainParticles.visible = false;
            }
            if (this.weatherSystem.snowParticles) {
                this.weatherSystem.snowParticles.visible = false;
            }
            this.weatherSystem.cloudMeshes.forEach(cloud => {
                cloud.visible = false;
            });
        }
    }
    
    update() {
        const weatherInfo = this.weatherSystem.getCurrentWeatherInfo();
        
        // アイコンと名前を更新
        document.getElementById('weather-icon').textContent = weatherInfo.icon;
        document.getElementById('weather-name').textContent = weatherInfo.name;
        
        // 風速を更新
        document.getElementById('wind-speed').textContent = weatherInfo.windSpeed.toFixed(1);
        
        // 雨や雪の情報を表示
        let details = `<span class="wind-speed">風速: ${weatherInfo.windSpeed.toFixed(1)}m/s</span>`;
        
        if (weatherInfo.rainIntensity > 0) {
            details += `<span class="rain-intensity">雨量: ${(weatherInfo.rainIntensity * 100).toFixed(0)}%</span>`;
        }
        
        if (weatherInfo.snowIntensity > 0) {
            details += `<span class="snow-intensity">雪量: ${(weatherInfo.snowIntensity * 100).toFixed(0)}%</span>`;
        }
        
        document.getElementById('weather-details').innerHTML = details;
    }
    
    // 天候変更の通知
    notifyWeatherChange(weather) {
        const config = this.weatherSystem.weatherTypes[weather];
        this.uiManager.showNotification(`天候が${config.name}に変わりました`, 'info');
    }
}