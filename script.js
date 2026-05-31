// ==========================================================================
// 1. サボりスポットのデータ（マスターデータ）
// ==========================================================================
const satoriSpots = [
    {
        id: 0,
        name: "堀田裏の隠れ河川敷デッドスペース",
        lat: 35.1182,
        lng: 136.9245,
        tags: ["🌲 自然・絶景", "🚗 車内から眺める"],
        desc: "堤防沿いの抜け道にある、車を停めて川面をボーッと眺められる隠れ場。対岸からのカモフラージュ率高め。",
        hiddenLevel: 4,
        parkingEasy: 3
    },
    {
        id: 1,
        name: "大高緑地近くの木陰パーキング",
        lat: 35.0631,
        lng: 136.9472,
        tags: ["🌲 自然・絶景", "🚗 木陰あり"],
        desc: "23号線からスッと入れるオアシス。生い茂る木々が強い日差しと上司の視線を遮ってくれる。昼寝の聖地。",
        hiddenLevel: 5,
        parkingEasy: 4
    },
    {
        id: 2,
        name: "港明・築地口裏の静かな臨海エリア",
        lat: 35.0995,
        lng: 136.8852,
        tags: ["🌲 自然・絶景", "🌊 海が見える"],
        desc: "名古屋港の少し裏手。トラックの往来も少なく、波の音を聞きながらクリアな頭で思考整理ができる秘密基地。",
        hiddenLevel: 4,
        parkingEasy: 5
    },
    {
        id: 3,
        name: "金山外れの純喫茶（駐車場激広）",
        lat: 35.1385,
        lng: 136.9012,
        tags: ["☕ ローカル喫茶店", "🚬 喫煙可"],
        desc: "大通りから一本入った場所にある昭和レトロな喫茶店。妙に駐車場が広く、営業車がよく溶け込んでいる。サボりの定番。",
        hiddenLevel: 2,
        parkingEasy: 5
    },
    {
        id: 4,
        name: "庄内川堤防沿い・西区のサボりポケット",
        lat: 35.2155,
        lng: 136.8795,
        tags: ["🌲 自然・絶景", "🚗 穴場駐車場"],
        desc: "西区の堤防沿いにある、ちょっとした車溜まりスペース。交通量も少なめで、エアコンを効かせてスマホをいじるのに最適。",
        hiddenLevel: 3,
        parkingEasy: 3
    },
    {
        id: 5,
        name: "名駅西口裏のコインパ密集地帯",
        lat: 35.1695,
        lng: 136.8765,
        tags: ["🌆 都市型サボり", "🚗 隠れ迷宮"],
        desc: "一方通行が多くて上司の車と絶対に出くわさないワンダーランド。ビル影に隠れて日報を書くならココ。",
        hiddenLevel: 5,
        parkingEasy: 2
    },
    {
        id: 6,
        name: "名塚・秩父通付近の大型店舗裏",
        lat: 35.1998,
        lng: 136.8922,
        tags: ["☕ ローカル喫茶店", "🚬 喫煙可"],
        desc: "西区の主要幹線から一本入った住宅街のオアシス。一息つきたいときや、次のアポまでの時間調整にベストな隠れ喫茶近く。",
        hiddenLevel: 3,
        parkingEasy: 4
    }
];

// アプリケーションの状態管理
const appState = {
    currentLat: null,
    currentLng: null,
    selectedSpotId: null,
    userLocationMarker: null
};

const markers = {};

// ==========================================================================
// 2. 地図の初期化
// ==========================================================================
const DEFAULT_COORDS = [35.1325, 136.9085];
const map = L.map('map').setView(DEFAULT_COORDS, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

satoriSpots.forEach(spot => {
    const marker = L.marker([spot.lat, spot.lng])
        .addTo(map)
        .bindPopup(`<b>${escapeHtml(spot.name)}</b><br>${escapeHtml(spot.desc)}`);
    
    marker.on('click', () => focusOnSpot(spot.id));
    markers[spot.id] = marker;
});

// ==========================================================================
// 3. ユーティリティ関数
// ==========================================================================
// 🎯【ここを修正！】文法エラーのタイポを完全に修正して安全にエスケープできるようにしたぜ！
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = { 
            '&': '&amp;', 
            '<': '&lt;', 
            '>': '&gt;', 
            '"': '&quot;', 
            "'": '&#39;' 
        };
        return escapeMap[match];
    });
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const TO_RAD = Math.PI / 180;
    const R = 6371;
    const dLat = (lat2 - lat1) * TO_RAD;
    const dLng = (lng2 - lng1) * TO_RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * TO_RAD) * Math.cos(lat2 * TO_RAD) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==========================================================================
// 4. UI描画ロジック
// ==========================================================================
function renderSpots() {
    const listContainer = document.getElementById('spot-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    satoriSpots.forEach(spot => {
        const isSelected = spot.id === appState.selectedSpotId;
        const activeClass = isSelected ? 'active-card' : '';
        const detailDisplay = isSelected ? 'style="display: block;"' : '';
        
        const tagsHtml = spot.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
        const distanceHtml = spot.distance !== undefined  
            ? `<div style="font-size: 0.8rem; font-weight: bold; color: var(--accent-color); margin-bottom: 4px;">📍 現在地から ${spot.distance.toFixed(1)} km</div>` 
            : '';

        const hiddenStars = "★".repeat(spot.hiddenLevel) + "☆".repeat(5 - spot.hiddenLevel);
        const parkingStars = "★".repeat(spot.parkingEasy) + "☆".repeat(5 - spot.parkingEasy);

        const cardWrapper = document.createElement('div');
        cardWrapper.innerHTML = `
            <div class="spot-card ${activeClass}" style="cursor: pointer;">
                ${distanceHtml}
                <div class="spot-name">${escapeHtml(spot.name)}</div>
                <div class="spot-tags">${tagsHtml}</div>
                <div class="spot-status-row">
                    <div>🕶️ 隠蔽: <span style="color: #f39c12;">${hiddenStars}</span></div>
                    <div>🚗 駐車: <span style="color: #3498db;">${parkingStars}</span></div>
                </div>
                <div class="spot-detail-content" ${detailDisplay}>
                    <div class="spot-desc">${escapeHtml(spot.desc)}</div>
                    <button class="navi-btn">🚗 ここへナビする</button>
                </div>
            </div>
        `;

        const cardEl = cardWrapper.querySelector('.spot-card');
        cardEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('navi-btn')) {
                startNavigation(spot.lat, spot.lng);
            } else {
                focusOnSpot(spot.id);
            }
        });

        fragment.appendChild(cardWrapper.firstElementChild);
    });

    listContainer.appendChild(fragment);
}

// ==========================================================================
// 5. アプリケーションアクション
// ==========================================================================
function focusOnSpot(id) {
    if (appState.selectedSpotId === id) {
        appState.selectedSpotId = null;
        const sortSelector = document.getElementById('sort-selector');
        const currentMode = sortSelector ? sortSelector.value : 'user-distance';
        applySort(currentMode);
        return; 
    }

    appState.selectedSpotId = id;
    const spot = satoriSpots.find(s => s.id === id);
    if (!spot) return;

    map.closePopup();
    
    // 吹き出しはみ出し防止用のカメラオフセット
    const offsetLat = spot.lat + 0.00355; 
    map.flyTo([offsetLat, spot.lng], 15, { animate: true, duration: 0.4, easeLinearity: 0.1 });

    if (markers[id]) {
        markers[id].openPopup();
    }

    const sortSelector = document.getElementById('sort-selector');
    if (sortSelector) sortSelector.value = 'selected-distance';
    applySort('selected-distance');
}

function applySort(mode) {
    if (mode === 'user-distance') {
        satoriSpots.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } 
    else if (mode === 'selected-distance' && appState.selectedSpotId !== null) {
        const baseSpot = satoriSpots.find(s => s.id === appState.selectedSpotId);
        if (baseSpot) {
            satoriSpots.forEach(s => {
                s.tempDistance = calculateDistance(baseSpot.lat, baseSpot.lng, s.lat, s.lng);
            });
            satoriSpots.sort((a, b) => a.tempDistance - b.tempDistance);
        }
    } 
    else if (mode === 'hidden-level') {
        satoriSpots.sort((a, b) => b.hiddenLevel - a.hiddenLevel);
    } 
    else if (mode === 'parking-easy') {
        satoriSpots.sort((a, b) => b.parkingEasy - a.parkingEasy);
    }

    renderSpots();
    const listContainer = document.getElementById('spot-list');
    if (listContainer) listContainer.scrollTop = 0;
}

function startNavigation(lat, lng) {
    const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapUrl, '_blank', 'noopener,noreferrer');
}

// ==========================================================================
// 6. イベントリスナーの一元管理
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.body.setAttribute('data-theme', 'dark');
    renderSpots();

    // 🌟 1.5秒後にスプラッシュ起動画面を消す
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
    }, 1500);

    // 📍「現在地から探す」ボタン
    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            gpsBtn.innerText = "⏳ 現在地を捕捉中...";
            gpsBtn.disabled = true;
            
            map.closePopup();
            appState.selectedSpotId = null;

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        appState.currentLat = position.coords.latitude;
                        appState.currentLng = position.coords.longitude;
                        processLocationSuccess(appState.currentLat, appState.currentLng, true);
                    },
                    (error) => {
                        console.warn("GPS取得失敗。仮の場所を設定します:", error);
                        processLocationSuccess(35.1709, 136.8815, false); // 名古屋駅
                    },
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            } else {
                processLocationSuccess(35.1709, 136.8815, false);
            }
        });
    }

    function processLocationSuccess(userLat, userLng, isGpsActive) {
        const circleColor = isGpsActive ? '#2ecc71' : '#e74c3c';
        const popupText = isGpsActive 
            ? "<b>現在地（あなた）</b>" 
            : "<b>仮の現在地（名古屋駅）</b><br><span style='font-size:0.7rem; color:#e74c3c;'>※本物のGPSを使うには、GitHub Pages等のhttps環境でテストしてね！</span>";

        satoriSpots.forEach(spot => {
            spot.distance = calculateDistance(userLat, userLng, spot.lat, spot.lng);
        });

        const offsetUserLat = userLat + 0.00355; 
        map.setView([offsetUserLat, userLng], 13);

        if (appState.userLocationMarker) {
            map.removeLayer(appState.userLocationMarker);
        }

        appState.userLocationMarker = L.circle([userLat, userLng], {
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.4,
            radius: 150
        }).addTo(map).bindPopup(popupText).openPopup();

        const sortSelector = document.getElementById('sort-selector');
        if (sortSelector) sortSelector.value = 'user-distance';
        applySort('user-distance');

        if (gpsBtn) {
            gpsBtn.innerText = "📍 現在地から探す";
            gpsBtn.disabled = false;
        }
    }

    const sortSelector = document.getElementById('sort-selector');
    if (sortSelector) {
        sortSelector.addEventListener('change', (e) => applySort(e.target.value));
    }

    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            document.body.setAttribute('data-theme', e.target.value);
        });
    }
});