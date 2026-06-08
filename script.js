// ==========================================================================
// 1. サボりスポットのデータ（マスターデータ）
// ==========================================================================
const satoriSpots = [
    { id: 0, name: "堀田裏の隠れ河川敷デッドスペース", lat: 35.1182, lng: 136.9245, tags: ["🌲 自然・絶景", "🚗 車内から眺める"], desc: "堤防沿いの抜け道にある、車を停めて川面をボーッと眺められる隠れ場。対岸からのカモフラージュ率高め。", hiddenLevel: 4, parkingEasy: 3 },
    { id: 1, name: "大高緑地近くの木陰パーキング", lat: 35.0631, lng: 136.9472, tags: ["🌲 自然・絶景", "🚗 木陰あり"], desc: "23号線からスッと入れるオアシス。生い茂る木々が強い日差しと上司の視線を遮ってくれる。昼寝の聖地。", hiddenLevel: 5, parkingEasy: 4 },
    { id: 2, name: "港明・築地口裏の静かな臨海エリア", lat: 35.0995, lng: 136.8852, tags: ["🌲 自然・絶景", "🌊 海が見える"], desc: "名古屋港の少し裏手。トラックの往来も少なく、波の音を聞きながらクリアな頭で思考整理ができる秘密基地。", hiddenLevel: 4, parkingEasy: 5 },
    { id: 3, name: "金山外れの純喫茶（駐車場激広）", lat: 35.1385, lng: 136.9012, tags: ["☕ ローカル喫茶店", "🚬 喫煙可"], desc: "大通りから一本入った場所にある昭和レトロな喫茶店。妙に駐車場が広く、営業車がよく溶け込んでいる。サボりの定番。", hiddenLevel: 2, parkingEasy: 5 },
    { id: 4, name: "庄内川堤防沿い・西区のサボりポケット", lat: 35.2155, lng: 136.8795, tags: ["🌲 自然・絶景", "🚗 穴場駐車場"], desc: "西区の堤防沿いにある、ちょっとした車溜まりスペース。交通量も少なめで、エアコンを効かせてスマホをいじるのに最適。", hiddenLevel: 3, parkingEasy: 3 },
    { id: 5, name: "名駅西口裏のコインパ密集地帯", lat: 35.1695, lng: 136.8765, tags: ["🌆 都市型サボり", "🚗 隠れ迷宮"], desc: "一方通行が多くて上司の車と絶対に出くわさないワンダーランド。ビル影に隠れて日報を書くならココ。", hiddenLevel: 5, parkingEasy: 2 },
    { id: 6, name: "名塚・秩父通付近の大型店舗裏", lat: 35.1998, lng: 136.8922, tags: ["☕ ローカル喫茶店", "🚬 喫煙可"], desc: "西区の主要幹線から一本入った住宅街のオアシス。一息つきたいときや、次のアポまでの時間調整にベストな隠れ喫茶近く。", hiddenLevel: 3, parkingEasy: 4 }
];

const appState = { currentLat: null, currentLng: null, selectedSpotId: null, userLocationMarker: null, miniUserMarker: null };
const mainMarkers = {};
const miniMarkers = {};

// ==========================================================================
// 2. 地図の初期化（同じオープンストリートマップを使用）
// ==========================================================================
const DEFAULT_COORDS = [35.1325, 136.9085];

// ① メインの大地図
const map = L.map('map', { zoomControl: false }).setView(DEFAULT_COORDS, 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// ② 左下の小窓地図（大地図と同じタイルURLを使用して完全同期！）
const miniMap = L.map('mini-map', { 
    zoomControl: false, 
    attributionControl: false,
    boxZoom: false,
    doubleClickZoom: false,
    dragPan: false, 
    scrollWheelZoom: false,
    touchZoom: false
}).setView(DEFAULT_COORDS, 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);

// 両方の地図にピン（マーカー）を配置
satoriSpots.forEach(spot => {
    // 大地図のピン
    const mainMarker = L.marker([spot.lat, spot.lng]).addTo(map).bindPopup(`<b>${escapeHtml(spot.name)}</b>`);
    mainMarker.on('click', () => focusOnSpot(spot.id));
    mainMarkers[spot.id] = mainMarker;

    // 小窓地図のピン（クリックで文字覚醒 ＆ Googleナビリンク付き！）
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
    const miniPopupContent = `
        <div style="font-family:sans-serif; min-width:140px;">
            <b style="font-size:0.9rem; display:block; margin-bottom:4px;">${escapeHtml(spot.name)}</b>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="popup-navi-link">🚗 ここへナビする</a>
        </div>
    `;
    const miniMarker = L.marker([spot.lat, spot.lng]).addTo(miniMap).bindPopup(miniPopupContent);
    miniMarker.on('click', () => {
        // 小窓が全画面じゃない時は、クリックされたら中央へ誘導
        if (!document.getElementById('mini-map-container').classList.contains('fullscreen')) {
            miniMap.setView([spot.lat, spot.lng], 13);
        }
    });
    miniMarkers[spot.id] = miniMarker;
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }[m]));
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const TO_RAD = Math.PI / 180;
    const dLat = (lat2 - lat1) * TO_RAD;
    const dLng = (lng2 - lng1) * TO_RAD;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*TO_RAD)*Math.cos(lat2*TO_RAD)*Math.sin(dLng/2)**2;
    return 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        const detailDisplay = isSelected ? 'style="display: block;"' : 'style="display: none;"';
        const distanceHtml = spot.distance !== undefined ? `<div style="font-size: 0.8rem; font-weight: bold; color: var(--accent-color); margin-bottom: 4px;">📍 現在地から ${spot.distance.toFixed(1)} km</div>` : '';
        const hiddenStars = "★".repeat(spot.hiddenLevel) + "☆".repeat(5 - spot.hiddenLevel);
        const parkingStars = "★".repeat(spot.parkingEasy) + "☆".repeat(5 - spot.parkingEasy);

        const cardWrapper = document.createElement('div');
        cardWrapper.innerHTML = `
            <div class="spot-card ${activeClass}" style="cursor: pointer;">
                ${distanceHtml}
                <div class="spot-name">${escapeHtml(spot.name)}</div>
                <div class="spot-tags">${spot.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
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
        cardEl.addEventListener('click', e => {
            if (e.target.classList.contains('navi-btn')) {
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
                window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
            } else {
                focusOnSpot(spot.id);
            }
        });
        fragment.appendChild(cardWrapper.firstElementChild);
    });

    listContainer.appendChild(fragment);
}

// 🎯 【新機能】リストをタップした時、大地図だけでなく「小窓地図の中央」へピンを表示！
function focusOnSpot(id) {
    if (appState.selectedSpotId === id) {
        appState.selectedSpotId = null;
        applySort(document.getElementById('sort-selector')?.value || 'user-distance');
        return; 
    }
    appState.selectedSpotId = id;
    const spot = satoriSpots.find(s => s.id === id);
    if (!spot) return;

    map.closePopup();
    miniMap.closePopup();

    // ① 大地図を滑らかに誘導
    map.flyTo([spot.lat + 0.003, spot.lng], 14, { animate: true, duration: 0.4 });
    
    // ② 左下の小窓地図も、ピンが完全に「中央」にくるように大爆走追従！
    miniMap.setView([spot.lat, spot.lng], 13);

    // ピンのポップアップを展開
    if (mainMarkers[id]) mainMarkers[id].openPopup();
    if (miniMarkers[id]) miniMarkers[id].openPopup();

    applySort('selected-distance');
}

function applySort(mode) {
    if (mode === 'user-distance') satoriSpots.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    else if (mode === 'hidden-level') satoriSpots.sort((a, b) => b.hiddenLevel - a.hiddenLevel);
    else if (mode === 'parking-easy') satoriSpots.sort((a, b) => b.parkingEasy - a.parkingEasy);
    renderSpots();
}

// ==========================================================================
// 6. メインコントロール ＆ 拡張ジェスチャー実装
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    document.body.setAttribute('data-theme', 'dark');
    renderSpots();

    const scrollArea = document.querySelector('.scrollable-area');
    const triggerPanel = document.getElementById('trigger-panel');
    const miniMapContainer = document.getElementById('mini-map-container');
    const closeMapBtn = document.getElementById('close-fullscreen-btn');
    const mapSearchInput = document.getElementById('map-search-input');

    // 🔍 【新機能】全画面地図用・超リアルタイムピン検索フィルタリング
    if (mapSearchInput) {
        mapSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            satoriSpots.forEach(spot => {
                const matchName = spot.name.toLowerCase().includes(query);
                const matchDesc = spot.desc.toLowerCase().includes(query);
                const matchTags = spot.tags.some(tag => tag.toLowerCase().includes(query));

                if (query === '' || matchName || matchDesc || matchTags) {
                    // マッチしたらピンを表示
                    if (!miniMap.hasLayer(miniMarkers[spot.id])) miniMarkers[spot.id].addTo(miniMap);
                } else {
                    // マッチしなければピンを非表示
                    if (miniMap.hasLayer(miniMarkers[spot.id])) miniMap.removeLayer(miniMarkers[spot.id]);
                }
            });
        });
    }

    function triggerGpsHardware(onComplete) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    appState.currentLat = pos.coords.latitude;
                    appState.currentLng = pos.coords.longitude;
                    processLocationSuccess(appState.currentLat, appState.currentLng, true);
                    if (onComplete) onComplete();
                },
                (err) => {
                    console.warn("GPS失敗、仮の場所を設定します", err);
                    processLocationSuccess(35.1709, 136.8815, false); // 名古屋駅
                    if (onComplete) onComplete();
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            processLocationSuccess(35.1709, 136.8815, false);
            if (onComplete) onComplete();
        }
    }

    function processLocationSuccess(userLat, userLng, isGpsActive) {
        const circleColor = isGpsActive ? '#2ecc71' : '#e74c3c';
        satoriSpots.forEach(s => s.distance = calculateDistance(userLat, userLng, s.lat, s.lng));
        
        map.setView([userLat + 0.002, userLng], 13);
        miniMap.setView([userLat, userLng], 13);

        if (appState.userLocationMarker) map.removeLayer(appState.userLocationMarker);
        appState.userLocationMarker = L.circle([userLat, userLng], {
            color: circleColor, fillColor: circleColor, fillOpacity: 0.4, radius: 150
        }).addTo(map).bindPopup(isGpsActive ? "<b>現在地</b>" : "<b>仮の現在地（名駅）</b>").openPopup();

        if (appState.miniUserMarker) miniMap.removeLayer(appState.miniUserMarker);
        appState.miniUserMarker = L.circle([userLat, userLng], {
            color: circleColor, fillColor: circleColor, fillOpacity: 0.5, radius: 150
        }).addTo(miniMap);

        const sel = document.getElementById('sort-selector');
        if (sel) sel.value = 'user-distance';
        applySort('user-distance');
    }

    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            gpsBtn.innerText = "⏳ 捕捉中...";
            gpsBtn.disabled = true;
            triggerGpsHardware(() => {
                gpsBtn.innerText = "📍 現在地から探す";
                gpsBtn.disabled = false;
            });
        });
    }

    if (scrollArea && triggerPanel && miniMapContainer) {
        scrollArea.addEventListener('scroll', () => {
            if (miniMapContainer.classList.contains('fullscreen')) return;

            const panelTop = triggerPanel.getBoundingClientRect().top;
            if (panelTop <= 50) {
                miniMapContainer.classList.add('active');
                miniMap.invalidateSize();
            } else {
                miniMapContainer.classList.remove('active');
            }
        });

        // 窓をポチッと叩いて全画面トランスフォーム！
        miniMapContainer.addEventListener('click', (e) => {
            if (e.target.id === 'close-fullscreen-btn' || e.target.closest('.map-search-container') || e.target.closest('.leaflet-popup-pane')) return;
            
            if (!miniMapContainer.classList.contains('fullscreen')) {
                miniMapContainer.classList.add('fullscreen');
                
                // 全画面時はドラッグやズームのロックを解放
                miniMap.dragging.enable();
                miniMap.touchZoom.enable();
                miniMap.doubleClickZoom.enable();
                
                setTimeout(() => { miniMap.invalidateSize(); }, 400);
            }
        });

        // 閉じるボタン
        closeMapBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            miniMapContainer.classList.remove('fullscreen');
            
            // 検索バーをリセット
            if (mapSearchInput) {
                mapSearchInput.value = '';
                satoriSpots.forEach(spot => {
                    if (!miniMap.hasLayer(miniMarkers[spot.id])) miniMarkers[spot.id].addTo(miniMap);
                });
            }
            
            // 小窓モードに戻るので再ロック
            miniMap.dragging.disable();
            miniMap.touchZoom.disable();
            miniMap.doubleClickZoom.disable();
            miniMap.closePopup();
            
            setTimeout(() => { miniMap.invalidateSize(); }, 400);
        });
    }

    // 引っ張り更新のタッチロジック
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const loader = document.getElementById('pull-to-refresh-loader');

    if (scrollArea && loader) {
        scrollArea.addEventListener('touchstart', (e) => {
            if (e.target.closest('#map') || e.target.closest('#mini-map-container')) {
                isPulling = false;
                return;
            }
            if (scrollArea.scrollTop === 0) {
                startY = e.touches[0].pageY;
                isPulling = true;
            }
        }, { passive: true });

        scrollArea.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            currentY = e.touches[0].pageY;
            const pullDistance = currentY - startY;

            if (pullDistance > 50 && scrollArea.scrollTop === 0) {
                loader.classList.add('pulling');
            }
        }, { passive: true });

        scrollArea.addEventListener('touchend', () => {
            if (loader.classList.contains('pulling')) {
                loader.querySelector('.refresh-text').innerText = "⚡ GPSハッキング中...";
                triggerGpsHardware(() => {
                    loader.classList.remove('pulling');
                    setTimeout(() => {
                        loader.querySelector('.refresh-text').innerText = "📍 現在地を再取得中...";
                    }, 300);
                });
            }
            isPulling = false;
        });
    }

    document.getElementById('sort-selector')?.addEventListener('change', e => applySort(e.target.value));
    document.getElementById('theme-selector')?.addEventListener('change', e => document.body.setAttribute('data-theme', e.target.value));
});