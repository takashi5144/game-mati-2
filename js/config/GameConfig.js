// ゲーム設定ファイル
export const GameConfig = {
    // ゲームの基本設定
    GAME: {
        NAME: 'ピクセルファーム・フロンティア 3D',
        VERSION: '2.0.0',
        FPS: 60,
        SPEED: {
            NORMAL: 1,
            FAST: 2,
            VERY_FAST: 5
        }
    },

    // グラフィックス設定
    GRAPHICS: {
        renderer: {
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            shadowMap: {
                enabled: true,
                type: THREE.PCFSoftShadowMap,
                autoUpdate: true
            }
        },
        camera: {
            fov: 45,
            near: 0.1,
            far: 1000,
            position: { x: 30, y: 30, z: 30 },
            lookAt: { x: 0, y: 0, z: 0 }
        },
        postProcessing: {
            bloom: { enabled: true, strength: 0.5, radius: 0.5, threshold: 0.8 },
            SSAO: { enabled: false, radius: 0.3, intensity: 0.2 },
            depthOfField: { enabled: false, focus: 50, aperture: 0.025, maxblur: 0.01 }
        },
        environment: {
            fog: { enabled: true, near: 50, far: 200, color: 0xf0f4f7 },
            skybox: 'dynamic',
            weatherEffects: ['sunny', 'cloudy', 'rainy', 'foggy']
        }
    },

    // 地形設定
    TERRAIN: {
        SIZE: 100,
        TILE_SIZE: 1,
        HEIGHT_VARIATION: 5,
        BIOMES: {
            PLAINS: { weight: 0.4, color: 0x3a7d44, resources: ['grass', 'flowers'] },
            FOREST: { weight: 0.3, color: 0x2d5a2d, resources: ['wood', 'berries'] },
            HILLS: { weight: 0.2, color: 0x8b7355, resources: ['stone', 'iron'] },
            WATER: { weight: 0.1, color: 0x4a90e2, resources: ['fish', 'water'] }
        }
    },

    // 初期資源
    INITIAL_RESOURCES: {
        food: { current: 100, max: 500 },
        wood: { current: 50, max: 500 },
        stone: { current: 0, max: 500 },
        iron: { current: 0, max: 200 },
        money: { current: 1000, max: 99999 },
        wheat_seed: { current: 20, max: 100 },
        corn_seed: { current: 10, max: 100 },
        wheat: { current: 0, max: 500 },
        corn: { current: 0, max: 500 }
    },

    // 建物設定
    BUILDINGS: {
        HOUSE: {
            id: 'house',
            name: '家',
            category: 'residential',
            cost: { wood: 20, stone: 10, money: 100 },
            buildTime: 30,
            size: { width: 2, height: 2 },
            capacity: 4,
            effects: { maxPopulation: 4 },
            model: {
                type: 'house',
                materials: ['wood', 'stone', 'thatch'],
                animations: ['construction', 'smoke']
            }
        },
        FARM: {
            id: 'farm',
            name: '畑',
            category: 'production',
            cost: { wood: 10 },
            buildTime: 10,
            size: { width: 3, height: 3 },
            production: { food: 2 },
            requiredWorkers: 1,
            seasonalEfficiency: { SPRING: 1.2, SUMMER: 1.0, AUTUMN: 0.8, WINTER: 0 },
            model: {
                type: 'farm',
                stages: 8
            }
        },
        BARN: {
            id: 'barn',
            name: '納屋',
            category: 'storage',
            cost: { wood: 15, money: 50 },
            buildTime: 20,
            size: { width: 3, height: 3 },
            storage: {
                food: 200,
                wood: 200,
                seeds: 100,
                tools: 20
            },
            model: {
                type: 'barn',
                materials: ['wood', 'hay']
            }
        },
        LUMBERMILL: {
            id: 'lumbermill',
            name: '製材所',
            category: 'production',
            cost: { wood: 30, stone: 20, money: 200 },
            buildTime: 45,
            size: { width: 3, height: 3 },
            production: { wood: 3 },
            requiredWorkers: 2,
            requiresNearby: 'forest',
            model: {
                type: 'lumbermill',
                animations: ['sawing']
            }
        },
        MARKET: {
            id: 'market',
            name: '市場',
            category: 'commerce',
            cost: { wood: 40, stone: 30, money: 500 },
            buildTime: 60,
            size: { width: 4, height: 4 },
            effects: {
                distributionRadius: 20,
                happinessBonus: 0.1,
                tradeEfficiency: 1.2
            },
            requiredWorkers: 3,
            model: {
                type: 'market',
                decorations: ['stalls', 'crates']
            }
        },
        BLACKSMITH: {
            id: 'blacksmith',
            name: '鍛冶屋',
            category: 'production',
            cost: { wood: 50, stone: 40, iron: 20, money: 800 },
            buildTime: 90,
            size: { width: 3, height: 3 },
            production: { tools: 0.5 },
            consumption: { iron: 1, wood: 0.5 },
            requiredWorkers: 2,
            model: {
                type: 'blacksmith',
                animations: ['hammering', 'fire']
            }
        },
        BAKERY: {
            id: 'bakery',
            name: 'パン屋',
            category: 'production',
            cost: { wood: 30, stone: 40, money: 600 },
            buildTime: 60,
            size: { width: 3, height: 3 },
            production: { bread: 1 },
            consumption: { flour: 1, wood: 0.2 },
            requiredWorkers: 2,
            model: {
                type: 'bakery',
                animations: ['baking']
            }
        },
        MILL: {
            id: 'mill',
            name: '風車小屋',
            category: 'production',
            cost: { wood: 40, stone: 20, money: 500 },
            buildTime: 75,
            size: { width: 3, height: 4 },
            production: { flour: 1 },
            consumption: { wheat: 2 },
            requiredWorkers: 1,
            model: {
                type: 'mill',
                animations: ['windmill']
            }
        },
        MASON: {
            id: 'mason',
            name: '石工所',
            category: 'production',
            cost: { wood: 20, stone: 50, money: 400 },
            buildTime: 60,
            size: { width: 3, height: 3 },
            production: { stone_blocks: 1 },
            consumption: { stone: 2 },
            requiredWorkers: 2,
            model: {
                type: 'mason',
                animations: ['carving']
            }
        },
        WELL: {
            id: 'well',
            name: '井戸',
            category: 'infrastructure',
            cost: { stone: 30, money: 200 },
            buildTime: 40,
            size: { width: 2, height: 2 },
            effects: {
                waterSupply: 50,
                happinessBonus: 0.05
            },
            model: {
                type: 'well',
                animations: ['water']
            }
        },
        SCHOOL: {
            id: 'school',
            name: '学校',
            category: 'education',
            cost: { wood: 40, stone: 40, money: 800 },
            buildTime: 90,
            size: { width: 4, height: 4 },
            effects: {
                educationBonus: 0.2,
                happinessBonus: 0.1,
                skillGrowthRate: 1.5
            },
            requiredWorkers: 2,
            model: {
                type: 'school',
                animations: ['teaching']
            }
        },
        CHAPEL: {
            id: 'chapel',
            name: '礼拝堂',
            category: 'spiritual',
            cost: { wood: 30, stone: 50, money: 600 },
            buildTime: 80,
            size: { width: 3, height: 4 },
            effects: {
                happinessBonus: 0.15,
                moraleBonus: 0.2,
                eventChanceReduction: 0.1
            },
            requiredWorkers: 1,
            model: {
                type: 'chapel',
                animations: ['bell']
            }
        },
        TAVERN: {
            id: 'tavern',
            name: '酒場',
            category: 'entertainment',
            cost: { wood: 35, stone: 25, money: 500 },
            buildTime: 60,
            size: { width: 3, height: 3 },
            effects: {
                happinessBonus: 0.2,
                socialBonus: 0.15
            },
            consumption: { food: 1, money: 2 },
            requiredWorkers: 2,
            model: {
                type: 'tavern',
                animations: ['serving']
            }
        },
        GUARDHOUSE: {
            id: 'guardhouse',
            name: '衛兵所',
            category: 'defense',
            cost: { wood: 40, stone: 60, iron: 20, money: 700 },
            buildTime: 70,
            size: { width: 3, height: 3 },
            effects: {
                defense: 20,
                crimeReduction: 0.3,
                safetyBonus: 0.1
            },
            requiredWorkers: 3,
            model: {
                type: 'guardhouse',
                animations: ['patrol']
            }
        },
        HERBALIST: {
            id: 'herbalist',
            name: '薬草医',
            category: 'health',
            cost: { wood: 25, stone: 15, money: 400 },
            buildTime: 50,
            size: { width: 2, height: 2 },
            effects: {
                healthBonus: 0.15,
                diseaseResistance: 0.2
            },
            production: { herbs: 0.5 },
            requiredWorkers: 1,
            model: {
                type: 'herbalist',
                animations: ['brewing']
            }
        },
        MINE: {
            id: 'mine',
            name: '鉱山',
            category: 'production',
            cost: { wood: 60, stone: 40, money: 1000 },
            buildTime: 120,
            size: { width: 4, height: 4 },
            production: { stone: 2, iron: 1 },
            requiredWorkers: 4,
            requiresNearby: 'hills',
            model: {
                type: 'mine',
                animations: ['mining']
            }
        },
        TOWNHALL: {
            id: 'townhall',
            name: '町役場',
            category: 'administration',
            cost: { wood: 80, stone: 100, iron: 30, money: 2000 },
            buildTime: 180,
            size: { width: 5, height: 5 },
            effects: {
                maxPopulationBonus: 20,
                taxEfficiency: 1.2,
                administrationBonus: 0.3,
                unlockAdvancedBuildings: true
            },
            requiredWorkers: 4,
            unique: true,
            model: {
                type: 'townhall',
                animations: ['flag']
            }
        },
        WAREHOUSE: {
            id: 'warehouse',
            name: '倉庫',
            category: 'storage',
            cost: { wood: 50, stone: 30, money: 600 },
            buildTime: 60,
            size: { width: 4, height: 4 },
            storage: {
                all: 500
            },
            effects: {
                storageEfficiency: 1.2
            },
            requiredWorkers: 2,
            model: {
                type: 'warehouse',
                animations: ['loading']
            }
        }
    },

    // 作物設定
    CROPS: {
        POTATO: {
            id: 'potato',
            name: 'ジャガイモ',
            stages: ['BARREN', 'TILLED', 'SEEDED', 'WATERED', 'SPROUTED', 'GROWING_EARLY', 'GROWING_MID', 'READY'],
            growthTime: [0, 5, 10, 15, 25, 40, 55, 70],
            waterNeeded: [false, false, true, false, true, true, true, false],
            yield: { min: 3, max: 8 },
            seasons: ['SPRING', 'SUMMER', 'AUTUMN'],
            value: 10
        },
        WHEAT: {
            id: 'wheat',
            name: '小麦',
            stages: ['BARREN', 'TILLED', 'SEEDED', 'SPROUTED', 'TILLERING', 'STEM_EXTENSION', 'HEADING', 'RIPENING', 'READY'],
            growthTime: [0, 5, 10, 20, 35, 50, 65, 80, 100],
            waterNeeded: [false, false, true, true, true, true, false, false, false],
            yield: { min: 5, max: 12 },
            seasons: ['SPRING', 'SUMMER'],
            value: 15
        },
        CORN: {
            id: 'corn',
            name: 'トウモロコシ',
            stages: ['BARREN', 'TILLED', 'SEEDED', 'GERMINATED', 'VEGETATIVE', 'TASSELING', 'SILKING', 'GRAIN_FILLING', 'READY'],
            growthTime: [0, 5, 10, 15, 30, 50, 65, 85, 110],
            waterNeeded: [false, false, true, true, true, true, true, false, false],
            yield: { min: 8, max: 15 },
            seasons: ['SUMMER'],
            value: 20
        }
    },

    // 職業設定
    PROFESSIONS: {
        NONE: {
            id: 'none',
            name: '無職',
            icon: '🧑',
            color: 0x808080,
            moveSpeed: 0.05,
            workSpeed: 0
        },
        FARMER: {
            id: 'farmer',
            name: '農夫',
            icon: '👨‍🌾',
            color: 0x8B4513,
            moveSpeed: 0.05,
            workSpeed: 1.0,
            tasks: ['till', 'seed', 'water', 'harvest'],
            tools: ['hoe', 'wateringCan'],
            efficiency: { base: 1.0, maxExperience: 2.0 }
        },
        BUILDER: {
            id: 'builder',
            name: '建築家',
            icon: '👷',
            color: 0xFFD700,
            moveSpeed: 0.05,
            workSpeed: 1.0,
            tasks: ['construct', 'repair', 'demolish'],
            tools: ['hammer', 'saw'],
            efficiency: { base: 1.0, maxExperience: 1.8 }
        },
        LUMBERJACK: {
            id: 'lumberjack',
            name: '木こり',
            icon: '🪓',
            color: 0x228B22,
            moveSpeed: 0.05,
            workSpeed: 1.0,
            tasks: ['cut_trees', 'plant_trees', 'clear_area'],
            tools: ['axe'],
            efficiency: { base: 1.0, maxExperience: 1.5 }
        },
        FORESTER: {
            id: 'forester',
            name: '森林管理者',
            icon: '🌲',
            color: 0x006400,
            moveSpeed: 0.05,
            workSpeed: 0.8,
            tasks: ['plant_trees', 'selective_cutting', 'clear_undergrowth'],
            tools: ['axe', 'seedbag'],
            efficiency: { base: 1.0, maxExperience: 1.5 }
        },
        MERCHANT: {
            id: 'merchant',
            name: '商人',
            icon: '💰',
            color: 0xFFD700,
            moveSpeed: 0.04,
            workSpeed: 1.0,
            tasks: ['manage_market', 'negotiate_prices', 'organize_caravans'],
            tools: ['ledger', 'scales'],
            efficiency: { base: 1.0, maxExperience: 1.8 }
        },
        BLACKSMITH: {
            id: 'blacksmith',
            name: '鍛冶屋',
            icon: '🔨',
            color: 0x696969,
            moveSpeed: 0.04,
            workSpeed: 0.8,
            tasks: ['forge_tools', 'repair_tools', 'smelt_ore'],
            tools: ['hammer', 'tongs'],
            efficiency: { base: 1.0, maxExperience: 2.0 }
        }
    },

    // 季節設定
    SEASONS: {
        SPRING: {
            name: '春',
            duration: 90,
            temperature: { min: 10, max: 20 },
            rainChance: 0.3,
            cropGrowthModifier: 1.2,
            color: 0x90EE90
        },
        SUMMER: {
            name: '夏',
            duration: 90,
            temperature: { min: 20, max: 35 },
            rainChance: 0.2,
            cropGrowthModifier: 1.0,
            color: 0xFFFF00
        },
        AUTUMN: {
            name: '秋',
            duration: 90,
            temperature: { min: 5, max: 15 },
            rainChance: 0.4,
            cropGrowthModifier: 0.8,
            color: 0xFFA500
        },
        WINTER: {
            name: '冬',
            duration: 90,
            temperature: { min: -10, max: 5 },
            rainChance: 0.1,
            snowChance: 0.6,
            cropGrowthModifier: 0,
            color: 0xFFFFFF
        }
    },

    // イベント設定
    EVENTS: {
        MERCHANT_CARAVAN: {
            id: 'merchant_caravan',
            name: '商人の隊商',
            frequency: 'weekly',
            duration: 2,
            effects: {
                tradeGoods: ['rare_seeds', 'tools', 'luxury_items'],
                priceModifier: 0.9
            }
        },
        BOUNTIFUL_HARVEST: {
            id: 'bountiful_harvest',
            name: '豊作',
            chance: 0.05,
            condition: 'autumn',
            effects: { cropYield: 1.5, happiness: 10 }
        },
        DROUGHT: {
            id: 'drought',
            name: '干ばつ',
            chance: 0.03,
            duration: 5,
            effects: {
                waterConsumption: 2.0,
                cropGrowthSpeed: 0.5,
                happiness: -5
            },
            mitigation: ['well', 'irrigation']
        },
        STORM: {
            id: 'storm',
            name: '嵐',
            chance: 0.02,
            duration: 1,
            effects: {
                buildingDamage: 0.1,
                cropDamage: 0.2,
                happiness: -10
            }
        }
    },

    // 操作設定
    CONTROLS: {
        MOUSE: {
            LEFT_CLICK: 'select',
            LEFT_DRAG: 'area_select',
            MIDDLE_DRAG: 'pan',
            RIGHT_DRAG: 'rotate',
            WHEEL_UP: 'zoom_in',
            WHEEL_DOWN: 'zoom_out',
            SENSITIVITY: {
                pan: 1.0,
                rotate: 0.5,
                zoom: 0.1
            }
        },
        KEYBOARD: {
            // カメラ操作
            'W': 'camera_forward',
            'A': 'camera_left',
            'S': 'camera_backward',
            'D': 'camera_right',
            'Q': 'camera_rotate_left',
            'E': 'camera_rotate_right',
            'R': 'camera_zoom_in',
            'F': 'camera_zoom_out',
            
            // ゲーム速度
            '1': 'speed_normal',
            '2': 'speed_fast',
            '3': 'speed_very_fast',
            'SPACE': 'pause_toggle',
            
            // UI
            'B': 'toggle_build_menu',
            'P': 'toggle_resident_panel',
            'M': 'toggle_map_mode',
            'T': 'toggle_tech_tree',
            
            // ツール
            'H': 'tool_house',
            'F': 'tool_farm',
            'DELETE': 'tool_demolish',
            'ESCAPE': 'cancel'
        }
    },

    // 住民ニーズ
    NEEDS: {
        hunger: { max: 100, decreaseRate: 0.1, critical: 20 },
        energy: { max: 100, decreaseRate: 0.05, critical: 10 },
        happiness: { max: 100, decreaseRate: 0.02, critical: 30 },
        health: { max: 100, decreaseRate: 0.01, critical: 40 }
    },

    // オーディオ設定
    AUDIO: {
        ENABLED: true,
        VOLUME: {
            master: 0.5,
            music: 0.3,
            sfx: 0.6,
            ambient: 0.4
        },
        MUSIC: {
            morning: 'peaceful_morning',
            working: 'busy_day',
            evening: 'calm_evening',
            danger: 'tension'
        }
    }
};