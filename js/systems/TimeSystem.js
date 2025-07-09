// 時間システム
export class TimeSystem {
    constructor(seasonsConfig) {
        this.seasonsConfig = seasonsConfig;
        this.currentTime = 0;
        this.currentDay = 1;
        this.currentSeason = 'SPRING';
        this.seasonIndex = 0;
        this.seasonTimer = 0;
        this.dayDuration = 60; // 1日 = 60秒
        this.listeners = new Map();
        
        // 時間帯
        this.timeOfDay = 'morning';
        this.sunAngle = 0;
    }

    update(deltaTime) {
        this.currentTime += deltaTime;
        this.seasonTimer += deltaTime;

        // 日の更新
        if (this.currentTime >= this.dayDuration) {
            this.currentTime = 0;
            this.currentDay++;
            this.notifyListeners('dayChanged', this.currentDay);
            
            // 日の始まりの処理
            this.onNewDay();
        }

        // 季節の更新
        const currentSeasonConfig = this.seasonsConfig[this.currentSeason];
        if (this.seasonTimer >= currentSeasonConfig.duration) {
            this.seasonTimer = 0;
            this.nextSeason();
        }

        // 時間帯の更新
        this.updateTimeOfDay();
        
        // 太陽の角度を更新
        this.updateSunAngle();
    }

    // 時間帯の更新
    updateTimeOfDay() {
        const dayProgress = this.currentTime / this.dayDuration;
        
        if (dayProgress < 0.25) {
            this.timeOfDay = 'night';
        } else if (dayProgress < 0.3) {
            this.timeOfDay = 'dawn';
        } else if (dayProgress < 0.5) {
            this.timeOfDay = 'morning';
        } else if (dayProgress < 0.7) {
            this.timeOfDay = 'afternoon';
        } else if (dayProgress < 0.75) {
            this.timeOfDay = 'dusk';
        } else {
            this.timeOfDay = 'night';
        }
    }

    // 太陽の角度を更新
    updateSunAngle() {
        const dayProgress = this.currentTime / this.dayDuration;
        this.sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2;
    }

    // 次の季節へ
    nextSeason() {
        const seasons = Object.keys(this.seasonsConfig);
        this.seasonIndex = (this.seasonIndex + 1) % seasons.length;
        this.currentSeason = seasons[this.seasonIndex];
        
        this.notifyListeners('seasonChanged', this.currentSeason);
        
        console.log(`Season changed to ${this.currentSeason}`);
    }

    // 新しい日の処理
    onNewDay() {
        console.log(`Day ${this.currentDay} begins`);
        
        // 天気の決定
        this.determineWeather();
        
        // イベントのチェック
        this.checkDailyEvents();
    }

    // 天気の決定
    determineWeather() {
        const season = this.seasonsConfig[this.currentSeason];
        const rand = Math.random();
        
        let weather = 'sunny';
        if (rand < season.rainChance) {
            weather = 'rainy';
        } else if (this.currentSeason === 'WINTER' && rand < season.snowChance) {
            weather = 'snowy';
        } else if (rand < 0.2) {
            weather = 'cloudy';
        }
        
        this.notifyListeners('weatherChanged', weather);
    }

    // 日次イベントのチェック
    checkDailyEvents() {
        // 週次イベントのチェック（7日ごと）
        if (this.currentDay % 7 === 0) {
            this.notifyListeners('weekPassed', Math.floor(this.currentDay / 7));
        }
        
        // 月次イベントのチェック（30日ごと）
        if (this.currentDay % 30 === 0) {
            this.notifyListeners('monthPassed', Math.floor(this.currentDay / 30));
        }
    }

    // 現在の時間情報を取得
    getTimeInfo() {
        return {
            day: this.currentDay,
            season: this.currentSeason,
            timeOfDay: this.timeOfDay,
            dayProgress: this.currentTime / this.dayDuration,
            seasonProgress: this.seasonTimer / this.seasonsConfig[this.currentSeason].duration
        };
    }

    // 太陽の位置を取得
    getSunPosition() {
        const radius = 100;
        const x = Math.cos(this.sunAngle) * radius;
        const y = Math.sin(this.sunAngle) * radius + 50;
        const z = 50;
        
        return { x, y: Math.max(y, 10), z };
    }

    // 光の強度を取得
    getLightIntensity() {
        const dayProgress = this.currentTime / this.dayDuration;
        
        if (dayProgress < 0.25 || dayProgress > 0.75) {
            // 夜
            return 0.1;
        } else if (dayProgress < 0.3 || dayProgress > 0.7) {
            // 夜明け/夕暮れ
            return 0.5;
        } else {
            // 昼
            return 1.0;
        }
    }

    // 光の色を取得
    getLightColor() {
        switch (this.timeOfDay) {
            case 'dawn':
            case 'dusk':
                return 0xFFAA77; // オレンジ色
            case 'night':
                return 0x4444AA; // 青紫
            default:
                return 0xFFFFFF; // 白
        }
    }

    // 成長速度の修正値を取得
    getGrowthModifier() {
        const season = this.seasonsConfig[this.currentSeason];
        return season.cropGrowthModifier || 1.0;
    }

    // 温度を取得
    getTemperature() {
        const season = this.seasonsConfig[this.currentSeason];
        const baseTemp = (season.temperature.min + season.temperature.max) / 2;
        
        // 時間帯による変動
        const dayProgress = this.currentTime / this.dayDuration;
        const tempVariation = Math.sin(dayProgress * Math.PI * 2) * 5;
        
        return baseTemp + tempVariation;
    }

    // イベントリスナー
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // セーブデータ用
    getSaveData() {
        return {
            currentTime: this.currentTime,
            currentDay: this.currentDay,
            currentSeason: this.currentSeason,
            seasonIndex: this.seasonIndex,
            seasonTimer: this.seasonTimer
        };
    }

    loadSaveData(data) {
        this.currentTime = data.currentTime || 0;
        this.currentDay = data.currentDay || 1;
        this.currentSeason = data.currentSeason || 'SPRING';
        this.seasonIndex = data.seasonIndex || 0;
        this.seasonTimer = data.seasonTimer || 0;
    }
}