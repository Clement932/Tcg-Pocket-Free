// --- CONFIGURATION ---
const SETS = [
    { id: 'pocket-a1', name: "A1 - Puissance Génétique", apiId: 'puissance-genetique', count: 286, img: 'Booster Pack1.webp', reqLevel: 1 },
    { id: 'pocket-a1a', name: "A1a - Île Fabuleuse", apiId: 'l-ile-fabuleuse', count: 86, img: 'Booster Pack2.webp', reqLevel: 2 },
    { id: 'pocket-a2', name: "A2 - Choc Spatio-Temporel", apiId: 'choc-spatio-temporel', count: 207, img: 'Booster Pack3.webp', reqLevel: 5 },
    { id: 'pocket-a2a', name: "A2a - Lumière Triomphale", apiId: 'lumiere-triomphale', count: 96, img: 'Booster Pack4.webp', reqLevel: 8 },
    { id: 'pocket-a2b', name: "A2b - Réjouissances Rayonnantes", apiId: 'rejouissances-rayonnantes', count: 111, img: 'Booster Pack5.webp', reqLevel: 10 },
    { id: 'pocket-a3', name: "A3 - Gardiens Astraux", apiId: 'gardiens-astraux', count: 239, img: 'Booster Pack6.webp', reqLevel: 12 },
    { id: 'pocket-a3a', name: "A3a - Crise Interdimensionnelle", apiId: 'crise-interdimensionnelle', count: 103, img: 'Booster Pack7.webp', reqLevel: 15 },
    { id: 'pocket-a3b', name: "A3b - La Clairière d'Évoli", apiId: 'la-clairiere-d-evoli', count: 107, img: 'Booster Pack8.webp', reqLevel: 18 },
    { id: 'pocket-a4', name: "A4 - Sagesse entre Ciel et Mer", apiId: 'sagesse-entre-ciel-et-mer', count: 241, img: 'Booster Pack9.webp', reqLevel: 20 },
    { id: 'pocket-a4a', name: "A4a - Source Secrète", apiId: 'source-secrète', count: 105, img: 'Booster Pack10.webp', reqLevel: 22 },
    { id: 'pocket-a4b', name: "A4b - Booster de Luxe ex", apiId: 'booster-de-luxe-ex', count: 379, img: 'Booster Pack11.webp', reqLevel: 25 },
    { id: 'pocket-b1', name: "B1 - Méga-Ascension", apiId: 'mega-ascension', count: 331, img: 'Booster Pack12.webp', reqLevel: 28 },
    { id: 'pocket-b1a', name: "B1a - Embrasement Écarlate", apiId: 'embrasement-ecarlate', count: 103, img: 'Booster Pack13.webp', reqLevel: 30 },
    { id: 'pocket-promo-a', name: "PROMO - A", apiId: 'promo-a', count: 117, img: 'Booster Pack14.webp', reqLevel: 35 },
    { id: 'pocket-promo-b', name: "PROMO - B", apiId: 'promo-b', count: 24, img: 'Booster Pack15.webp', reqLevel: 40 },
];

const RARITIES = {
    COMMON: { id: 'C', weight: 100, price: 10, color: '#64748b' },
    RARE: { id: 'R', weight: 40, price: 50, color: '#3b82f6' },
    ULTRA_RARE: { id: 'UR', weight: 15, price: 250, color: '#a855f7' },
    SECRET: { id: 'SAR', weight: 5, price: 1000, color: '#fbbf24' }
};

const RANKS = [
    { name: "Novice", val: 0 },
    { name: "Collectionneur", val: 5000 },
    { name: "Expert", val: 20000 },
    { name: "Maître", val: 100000 },
    { name: "Légende", val: 500000 }
];

const AUDIO = {
    open: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    flip: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
    rare: new Audio('https://assets.mixkit.co/active_storage/sfx/95/95-preview.mp3'),
    sell: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    playSound: (key) => {
        const sound = AUDIO[key];
        if(sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio autoplay blocked", e));
        }
    }
};

const ACHIEVEMENTS = [
    { id: 'first_open', name: "Premier Pas", icon: "📦", desc: "Ouvrir votre premier booster", reward: 50, condition: (s) => s.totalBoosters >= 1 },
    { id: 'collector_10', name: "Débutant", icon: "🃏", desc: "Avoir 10 cartes uniques", reward: 100, condition: (s) => s.uniqueCards >= 10 },
    { id: 'collector_100', name: "Passionné", icon: "📚", desc: "Avoir 100 cartes uniques", reward: 500, condition: (s) => s.uniqueCards >= 100 },
    { id: 'money_1000', name: "Entrepreneur", icon: "💰", desc: "Posséder 1000 Crédits", reward: 200, condition: (s) => s.money >= 1000 },
    { id: 'level_5', name: "Niveau 5", icon: "⭐", desc: "Atteindre le niveau 5", reward: 300, condition: (s) => s.level >= 5 },
    { id: 'god_pack', name: "Béni des Dieux", icon: "⚡", desc: "Trouver un GOD PACK", reward: 1000, condition: (s) => s.godPacks >= 1 },
    { id: 'secret_hunter', name: "Chasseur de Trésor", icon: "💎", desc: "Trouver une carte Secrète (SAR)", reward: 1500, condition: (s) => s.secretsFound >= 1 },
    { id: 'shop_spender', name: "Client Fidèle", icon: "🛒", desc: "Dépenser 500 Crédits au total", reward: 250, condition: (s) => s.spentMoney >= 500 }
];

// --- STATE ---
let currentSet = SETS[0];
let dbCards = []; 
let myCollection = JSON.parse(localStorage.getItem('tcgCollection')) || [];
let unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements')) || [];
let gameStats = JSON.parse(localStorage.getItem('gameStats')) || {
    totalBoosters: 0,
    money: 500, // Bonus de départ
    level: 1,
    xp: 0,
    godPacks: 0,
    secretsFound: 0,
    spentMoney: 0
};


let activeMissions = JSON.parse(localStorage.getItem('activeMissions')) || [];
let lastDailyReset = localStorage.getItem('lastDailyReset');

let currentFilter = 'all';
let preparedCards = [];
let isGodPack = false;
let shopCards = []; 
let shopRefreshTimer = null;
const SHOP_REFRESH_TIME = 120;
let sessionBoosters = 0;
let isOpening = false;

document.addEventListener('DOMContentLoaded', () => {
    checkDailyReset();
    generateSidebar();
    loadSet(currentSet.id);
    updateCounters(); 
    updateMoneyUI();
    updateLevelUI(); 
    loadShopFromStorage();
    startShopTimer();
    updateGodPackUI();
    checkAchievements();
    renderMissions();
    
    document.querySelector('.stage').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
});

// --- CORE LOGIC ---
function saveData() {
    localStorage.setItem('tcgCollection', JSON.stringify(myCollection));
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('gameStats', JSON.stringify(gameStats));
    localStorage.setItem('activeMissions', JSON.stringify(activeMissions));
    // Synchro sidebar si nécessaire
    updateLevelUI();
    updateCounters();
}

// --- MISSIONS JOURNALIÈRES ---
function checkDailyReset() {
    const today = new Date().toDateString();
    if(lastDailyReset !== today) {
        // Modèles de missions
        const templates = [
            { type: 'OPEN_BOOSTER', label: "Ouvrir 3 Boosters", target: 3, reward: 150 },
            { type: 'EARN_MONEY', label: "Gagner 200 Crédits", target: 200, reward: 50 },
            { type: 'CRAFT', label: "Faire 1 Fusion", target: 1, reward: 100 },
            { type: 'FIND_RARE', label: "Trouver 2 Rares", target: 2, reward: 120 }
        ];
        
        // Sélectionner 3 missions aléatoires
        const shuffled = templates.sort(() => 0.5 - Math.random()).slice(0, 3);
        activeMissions = shuffled.map(t => ({...t, progress: 0, claimed: false}));
        
        localStorage.setItem('lastDailyReset', today);
        saveData();
        showNotification("Nouvelle Journée", "Les missions sont réinitialisées !");
    }
}

function checkMission(type, amount) {
    let changed = false;
    activeMissions.forEach(m => {
        if(m.type === type && !m.claimed && m.progress < m.target) {
            m.progress += amount;
            if(m.progress >= m.target) {
                m.progress = m.target;
                m.claimed = true;
                addMoney(m.reward);
                showNotification("Mission Complétée !", `+${m.reward}©`);
            }
            changed = true;
        }
    });
    if(changed) {
        saveData();
        renderMissions();
    }
}

function renderMissions() {
    const div = document.getElementById('mini-missions-list');
    if(!activeMissions.length) {
        div.innerHTML = '<div class="mission-item">Aucune mission</div>';
        return;
    }
    div.innerHTML = activeMissions.map(m => `
        <div class="mission-item ${m.claimed ? 'done' : ''}">
            <span>${m.label}</span>
            <span>${m.progress}/${m.target}</span>
        </div>
    `).join('');
}


// --- ECONOMY & OPENING ---
function startOpeningSequence() {
    if(dbCards.length === 0) return;
    if(isOpening) return;
    
    // VERIFICATION DU SOLDE
    if(gameStats.money < 100) {
        alert("Fonds insuffisants ! Il vous faut 100©.");
        return;
    }

    addMoney(-100);
    checkMission('OPEN_BOOSTER', 1);

    isOpening = true;
    AUDIO.playSound('open');

    sessionBoosters++;
    gameStats.totalBoosters++;
    updateCounters();
    saveData();
    gainXP(15);

    prepareAndPreload(); 
    
    const booster = document.querySelector('.booster-container');
    const flash = document.querySelector('.booster-flash');
    
    booster.style.animation = 'none'; 
    booster.classList.add('shaking');
    
    setTimeout(() => {
        booster.classList.remove('shaking');
        flash.classList.add('active');
        
        setTimeout(() => performDraw(), 300);

        setTimeout(() => {
            booster.classList.remove('opened');
            flash.classList.remove('active');
            booster.style.animation = ''; 
        }, 1000);
    }, 600);
}

function prepareAndPreload() {
    preparedCards = [];
    isGodPack = Math.random() < 0.005; // 0.5% chance
    
    if (isGodPack) {
        gameStats.godPacks++;
        updateGodPackUI();
        const godTierCards = dbCards.filter(c => c.weight <= 15);
        const pool = godTierCards.length >= 5 ? godTierCards : dbCards;
        for(let i = 0; i < 5; i++) preparedCards.push(pool[Math.floor(Math.random() * pool.length)]);
    } else {
        const totalWeight = dbCards.reduce((sum, c) => sum + c.weight, 0);
        for(let i = 0; i < 5; i++) {
            let randomNum = Math.random() * totalWeight;
            let selected = dbCards[0];
            // Garantie : La dernière carte a plus de chance d'être rare
            if(i === 4) {
               // Petite logique custom pour le slot "Rare garanti" (au moins Rare)
               const betterPool = dbCards.filter(c => c.weight <= 40);
               const w2 = betterPool.reduce((a,b)=>a+b.weight,0);
               let r2 = Math.random() * w2;
               for(const c of betterPool) {
                   if(r2 < c.weight) { selected = c; break; }
                   r2 -= c.weight;
               }
            } else {
                for (const card of dbCards) {
                    if (randomNum < card.weight) { selected = card; break; }
                    randomNum -= card.weight;
                }
            }
            preparedCards.push(selected);
        }
    }
    preparedCards.forEach(card => { (new Image()).src = card.imgUrl; });
}

function performDraw() {
    switchView('view-opening');
    
    const btnNext = document.getElementById('btn-next');
    const btnChange = document.getElementById('btn-change');
    btnNext.classList.add('hidden');
    btnChange.classList.add('hidden');

    const container = document.getElementById('cards-grid');
    container.innerHTML = '';

    if (isGodPack) launchGodConfetti();

    let flippedCount = 0;

    preparedCards.forEach((cardData, index) => {
        const isNew = !myCollection.includes(cardData.id);
        const rarity = Object.values(RARITIES).find(r => cardData.weight === r.weight) || RARITIES.COMMON;

        const cardEl = document.createElement('div');
        cardEl.className = 'flip-card';
        cardEl.style.setProperty('--rarity-color', rarity.color);
        
        let extras = '<div class="holo-overlay"></div><div class="rarity-dot" style="background:'+rarity.color+'"></div>';
        if(isNew) extras += '<div class="new-badge">NEW!</div>';

        cardEl.innerHTML = `
            <div class="face front"></div>
            <div class="face back">
                <img class="card-img" src="${cardData.imgUrl}" alt="Pokemon"> ${extras}
            </div>
        `;
        container.appendChild(cardEl);

        const flipCard = () => {
            if(cardEl.classList.contains('flipped')) return;
            
            AUDIO.playSound('flip');
            cardEl.classList.add('flipped');
            cardEl.style.transform = "scale(0.95) rotateY(180deg)";
            setTimeout(() => {
                if(!cardEl.matches(':hover')) cardEl.style.transform = "scale(1) rotateY(180deg)";
            }, 100);

            myCollection.push(cardData.id);
            if(rarity.weight <= 5) gameStats.secretsFound++;
            
            // Check Mission RARE
            if(rarity.weight <= 40) checkMission('FIND_RARE', 1);

            saveData();
            updateStats();
            checkAchievements();

            const inShopIndex = shopCards.findIndex(c => c.id === cardData.id);
            if(inShopIndex > -1) {
                shopCards.splice(inShopIndex, 1);
                localStorage.setItem('currentShop', JSON.stringify(shopCards));
            }

            if(rarity.weight <= 15) {
                AUDIO.playSound('rare');
                launchConfetti();
            }
            
            flippedCount++;
            if(flippedCount === 5) {
                isOpening = false;
                setTimeout(() => {
                    btnNext.classList.remove('hidden');
                    btnChange.classList.remove('hidden');
                }, 500);
            }
        };

        cardEl.addEventListener('mousemove', (e) => handleTilt(e, cardEl));
        cardEl.addEventListener('mouseleave', () => resetTilt(cardEl));
        cardEl.addEventListener('click', flipCard);

        setTimeout(() => flipCard(), 800 + (index * 400));
    });
}

function resetForNewPack() {
    startOpeningSequence();
}

// --- CRAFTING (LABO) ---
function craftCards() {
    // Il faut 5 cartes communes pour 1 rare
    // On cherche les ID des cartes communes dans la collection
    // Note: on utilise dbCards du set actif pour vérifier la rareté, 
    // ou on scanne la collection. Pour simplifier, on filtre sur la collection actuelle
    // en assumant que l'ID contient la ref.
    // Mieux: on regarde quelles cartes on a en double ou simple qui sont communes.
    
    // Stratégie simple : On prend 5 communes au hasard dans la collection et on les supprime.
    // Pour être safe, on ne prend que les DOUBLONS d'abord, puis les singles si nécessaire ?
    // Non, le prompt dit "brûler 5 communes".
    
    // Retrouver les communes possédées
    // Comme on n'a que l'ID dans myCollection, on doit savoir si c'est commun.
    // On va charger la rareté via l'ID (on parse le numéro et on déduit, ou on check dbCards si chargé)
    // Ici on utilise une astuce : le weight est lié à l'ID dans la génération.
    
    let commonsOwned = [];
    myCollection.forEach((id, index) => {
        // On essaye de trouver la carte dans le set global ou on déduit
        // Ici on va faire simple : si on est sur le set actif, on check dbCards
        // Sinon on suppose que c'est commun si ID est bas (pas fiable à 100% mais ok pour proto)
        // LE MIEUX : Recalculer la rareté à la volée comme dans loadSet
        
        // Pour faire propre, on va filtrer uniquement les cartes du SET ACTIF pour le craft
        // ou accepter tout. Restons sur le Set Actif pour utiliser dbCards.
        const cardObj = dbCards.find(c => c.id === id);
        if(cardObj && cardObj.weight === 100) {
            commonsOwned.push(id);
        }
    });

    if(commonsOwned.length < 5) {
        document.getElementById('craft-msg').innerText = "Pas assez de cartes COMMUNES dans ce set (il en faut 5).";
        return;
    }

    // On retire 5 cartes
    for(let i=0; i<5; i++) {
        const idToRemove = commonsOwned[i];
        const idx = myCollection.indexOf(idToRemove);
        if(idx > -1) myCollection.splice(idx, 1);
    }

    // On ajoute 1 Rare (ou mieux)
    const rares = dbCards.filter(c => c.weight <= 40); // Rare, Ultra or Secret
    const reward = rares[Math.floor(Math.random() * rares.length)];
    
    myCollection.push(reward.id);
    
    checkMission('CRAFT', 1);
    saveData();
    updateStats();
    AUDIO.playSound('rare');
    showNotification("Fusion Réussie !", "Vous avez obtenu : " + reward.id);
    document.getElementById('craft-msg').innerText = "Fusion réussie ! 1 carte rare générée.";
    
    // Petit FX
    launchConfetti();
}

function toggleCraft() {
    const el = document.getElementById('craft-overlay');
    el.classList.toggle('hidden');
    document.getElementById('craft-msg').innerText = "";
}

// --- PROFIL & SAUVEGARDE ---
function toggleProfile() {
    const el = document.getElementById('profile-overlay');
    if(el.classList.contains('hidden')) {
        // Calcul score
        const unique = new Set(myCollection).size;
        const score = (unique * 10) + (gameStats.totalBoosters * 5) + (gameStats.godPacks * 500);
        document.getElementById('profile-value').innerText = score.toLocaleString() + " pts";
        document.getElementById('profile-opened').innerText = gameStats.totalBoosters;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function exportSave() {
    const data = {
        col: myCollection,
        stats: gameStats,
        ach: unlockedAchievements,
        mis: activeMissions
    };
    // Encodage Base64 simple
    const str = btoa(JSON.stringify(data));
    const area = document.getElementById('save-data-area');
    area.value = str;
    area.select();
    try {
        navigator.clipboard.writeText(str);
        showNotification("Copié !", "Sauvegarde dans le presse-papier");
    } catch(e) {
        showNotification("Succès", "Copiez le texte manuellement");
    }
}

function importSave() {
    const str = document.getElementById('save-data-area').value.trim();
    if(!str) return alert("Collez un code d'abord !");
    try {
        const data = JSON.parse(atob(str));
        if(data.col && data.stats) {
            myCollection = data.col;
            gameStats = data.stats;
            unlockedAchievements = data.ach || [];
            activeMissions = data.mis || [];
            saveData();
            location.reload();
        } else {
            alert("Sauvegarde invalide.");
        }
    } catch(e) {
        alert("Erreur de lecture du code.");
    }
}

// --- BOUTIQUE ---
function loadShopFromStorage() {
    const savedShop = localStorage.getItem('currentShop');
    const savedTime = localStorage.getItem('shopTargetTime');
    if (savedShop && savedTime) {
        const remaining = parseInt(savedTime) - Date.now();
        if (remaining > 0) {
            shopCards = JSON.parse(savedShop);
            return;
        }
    }
    generateShopCards();
}

function generateShopCards() {
    const now = Date.now();
    localStorage.setItem('shopTargetTime', now + (SHOP_REFRESH_TIME * 1000));
    shopCards = [];
    const missingCards = dbCards.filter(card => !myCollection.includes(card.id));
    if(missingCards.length > 0) {
        const shuffled = [...missingCards].sort(() => 0.5 - Math.random());
        shopCards = shuffled.slice(0, 10).map(c => ({ ...c, price: c.price }));
    }
    localStorage.setItem('currentShop', JSON.stringify(shopCards));
}

function startShopTimer() {
    if(shopRefreshTimer) clearInterval(shopRefreshTimer);
    shopRefreshTimer = setInterval(() => {
        const remaining = Math.floor((parseInt(localStorage.getItem('shopTargetTime') || 0) - Date.now()) / 1000);
        if(remaining <= 0) {
            generateShopCards();
        } else {
            const m = Math.floor(remaining / 60).toString().padStart(2, '0');
            const s = (remaining % 60).toString().padStart(2, '0');
            const str = `${m}:${s}`;
            document.getElementById('shop-countdown').innerText = str;
            document.getElementById('sidebar-shop-timer').innerText = str;
        }
    }, 1000);
}

function renderShop() {
    document.getElementById('shop-user-money').innerText = gameStats.money.toLocaleString();
    const container = document.getElementById('shop-content');
    container.innerHTML = '';
    if(shopCards.length === 0) {
        container.innerHTML = '<p style="color:#aaa;grid-column:1/-1;text-align:center">Boutique vide !</p>';
        return;
    }
    shopCards.forEach(item => {
        const rarity = Object.values(RARITIES).find(r => item.weight === r.weight) || RARITIES.COMMON;
        const div = document.createElement('div');
        div.className = 'shop-card-wrapper';
        div.style.borderBottom = `2px solid ${rarity.color}`;
        div.innerHTML = `
            <img src="${item.imgUrl}" class="shop-card-img" loading="lazy">
            <div class="shop-price-tag" style="color:${rarity.color}">
                <span>${item.price}</span> <span style="font-size:12px">©</span>
            </div>
            <button class="btn-buy-card" onclick="buyCard('${item.id}', ${item.price})" style="background:${rarity.color}; color:white;">
                ACHETER
            </button>
        `;
        const btn = div.querySelector('button');
        if(gameStats.money < item.price) {
            btn.disabled = true;
            btn.innerText = "MANQUE " + (item.price - gameStats.money);
            btn.style.background = "#333";
        }
        container.appendChild(div);
    });
}

function buyCard(cardId, price) {
    if(gameStats.money >= price) {
        AUDIO.playSound('sell');
        addMoney(-price);
        gameStats.spentMoney += price;
        myCollection.push(cardId);
        
        shopCards = shopCards.filter(c => c.id !== cardId);
        localStorage.setItem('currentShop', JSON.stringify(shopCards));
        
        saveData();
        updateStats();
        renderShop();
        document.getElementById('album-content').innerHTML = ''; 
        launchConfetti();
        checkAchievements();
    }
}

function forceShopRefresh() {
    if(gameStats.money >= 50) {
        addMoney(-50);
        generateShopCards();
        renderShop();
    } else {
        alert("Pas assez d'argent !");
    }
}

// --- GESTION SETS & UTILS ---
function generateSidebar() {
    const container = document.getElementById('set-buttons-container');
    container.innerHTML = '';
    SETS.forEach(set => {
        const btn = document.createElement('button');
        btn.className = 'set-btn';
        btn.id = `btn-${set.id}`;
        if (currentSet && set.id === currentSet.id) btn.classList.add('active');
        const isLocked = gameStats.level < set.reqLevel;

        if (isLocked) {
            btn.classList.add('locked');
            btn.innerHTML = `${set.name} <span class="lock-icon">🔒 Lvl ${set.reqLevel}</span>`;
        } else {
            const uniqueCardsInSet = new Set(myCollection.filter(id => id.startsWith(set.apiId)));
            const isCompleted = uniqueCardsInSet.size >= set.count;
            btn.innerHTML = `${set.name} ${isCompleted ? '<span style="color:#10b981;float:right">✓</span>' : ''}`;
            btn.onclick = () => {
                loadSet(set.id);
                if(window.innerWidth < 768) toggleSidebar();
            };
        }
        container.appendChild(btn);
    });
}

function loadSet(setId) {
    document.querySelectorAll('.set-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`btn-${setId}`);
    if(btn) btn.classList.add('active');
    
    currentSet = SETS.find(s => s.id === setId);
    document.getElementById('booster-set-title').innerText = currentSet.name;
    document.getElementById('hud-set-title').innerText = currentSet.name;
    
    const imgBooster = document.getElementById('booster-img');
    imgBooster.src = currentSet.img;
    imgBooster.onerror = () => { imgBooster.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'; };
    
    dbCards = [];
    for (let i = 1; i <= currentSet.count; i++) {
        const paddedId = i.toString().padStart(3, '0'); 
        let rarityConfig = RARITIES.COMMON;
        const progress = i / currentSet.count;
        if (progress > 0.98) rarityConfig = RARITIES.SECRET;
        else if (progress > 0.90) rarityConfig = RARITIES.ULTRA_RARE;
        else if (progress > 0.75) rarityConfig = RARITIES.RARE;

        dbCards.push({
            id: `${currentSet.apiId}-${paddedId}`,
            localId: paddedId,
            imgUrl: `img/${currentSet.apiId}/${i}.png`,
            ...rarityConfig
        });
    }

    if(shopCards.length === 0) generateShopCards();
    updateStats();
    document.querySelector('.top-hud').classList.add('visible');
}

function getRequiredXP(level) { return 500 + ((level - 1) * 100); }

function gainXP(amount) {
    gameStats.xp += amount;
    showNotification("XP Gagné", `+${amount} XP`);
    let reqXP = getRequiredXP(gameStats.level);
    if(gameStats.xp >= reqXP) {
        gameStats.level++;
        gameStats.xp -= reqXP;
        showNotification("NIVEAU SUPÉRIEUR !", `Niveau ${gameStats.level} atteint !`);
        alert(`NIVEAU SUPÉRIEUR ! Vous êtes niveau ${gameStats.level} !`);
        generateSidebar();
    }
    saveData();
    updateLevelUI();
}

function updateLevelUI() {
    const reqXP = getRequiredXP(gameStats.level);
    document.getElementById('user-level').innerText = gameStats.level;
    document.getElementById('xp-bar').style.width = `${Math.floor((gameStats.xp / reqXP) * 100)}%`;
    document.getElementById('xp-text').innerText = `${gameStats.xp} / ${reqXP} XP`;

    // Calcul Rang
    const unique = new Set(myCollection).size;
    const score = (unique * 10) + (gameStats.totalBoosters * 5); 
    const rank = RANKS.slice().reverse().find(r => score >= r.val) || RANKS[0];
    document.getElementById('collection-rank').innerText = rank.name;
}

function updateCounters() {
    document.getElementById('session-count').innerText = sessionBoosters;
    document.getElementById('total-count').innerText = gameStats.totalBoosters;
}

function updateGodPackUI() {
    document.getElementById('god-pack-count').innerText = gameStats.godPacks;
}

function updateMoneyUI() {
    const s = gameStats.money.toLocaleString();
    document.getElementById('user-money').innerText = s;
    const shopM = document.getElementById('shop-user-money');
    if(shopM) shopM.innerText = s;
}

function addMoney(amount) {
    gameStats.money += amount;
    if(amount > 0) checkMission('EARN_MONEY', amount);
    saveData();
    updateMoneyUI();
}

function checkAchievements() {
    const uniqueCards = new Set(myCollection).size;
    const currentStats = { ...gameStats, uniqueCards: uniqueCards };
    let hasNew = false;
    ACHIEVEMENTS.forEach(ach => {
        if(!unlockedAchievements.includes(ach.id)) {
            if(ach.condition(currentStats)) {
                unlockedAchievements.push(ach.id);
                showNotification(`Succès : ${ach.name}`, `+${ach.reward} Crédits`, true);
                addMoney(ach.reward);
                hasNew = true;
            }
        }
    });
    document.getElementById('achievements-badge').innerText = `${unlockedAchievements.length}/${ACHIEVEMENTS.length}`;
    if(hasNew) saveData();
}

function showNotification(title, message, isAchievement = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${isAchievement ? 'achievement' : ''}`;
    toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-desc">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.4s ease-in reverse forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// --- FX & NAV ---
function handleTilt(e, card) {
    if (!card.classList.contains('flipped')) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateY(${180 + x / 10}deg) rotateX(${-y / 10}deg) scale(1.05)`;
}
function resetTilt(card) {
    if (card.classList.contains('flipped')) card.style.transform = 'rotateY(180deg) rotateX(0deg) scale(1)';
}
function launchConfetti() {
    const container = document.getElementById('particles-container');
    const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981'];
    for(let i=0; i<40; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDuration = (Math.random() * 2 + 1) + 's';
        container.appendChild(p);
        setTimeout(() => p.remove(), 3000);
    }
}
function launchGodConfetti() {
    const container = document.getElementById('particles-container');
    for(let i=0; i<150; i++) {
        const p = document.createElement('div');
        p.className = 'god-confetti';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (Math.random() * 3 + 2) + 's';
        container.appendChild(p);
        setTimeout(() => p.remove(), 5000);
    }
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function switchView(id) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
}
function returnToBooster() { switchView('view-booster'); }
function openZoom(url) { 
    document.getElementById('zoom-img').src = url; 
    document.getElementById('zoom-overlay').classList.remove('hidden'); 
}
function closeZoom() { document.getElementById('zoom-overlay').classList.add('hidden'); }
function confirmReset() {
    if(confirm("Tout effacer ? Cette action est irréversible.")) {
        localStorage.clear();
        location.reload();
    }
}
function toggleAlbum() {
    const el = document.getElementById('album-overlay');
    if(el.classList.contains('hidden')) { renderAlbum(); el.classList.remove('hidden'); }
    else el.classList.add('hidden');
}
function toggleShop() { document.getElementById('shop-overlay').classList.toggle('hidden'); }

// --- ALBUM RENDER REVISITÉ (Par set + Vente Unitaire) ---
function filterAlbum(type) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderAlbum(true); 
}

function renderAlbum(force = false) {
    const container = document.getElementById('album-content');
    if(container.innerHTML !== '' && !force) return;
    container.innerHTML = ''; 

    SETS.forEach(set => {
        const setCards = myCollection.filter(id => id.startsWith(set.apiId));
        if(currentFilter === 'owned' && setCards.length === 0) return;

        const counts = {};
        setCards.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

        let gridHTML = '';
        let visibleCount = 0;

        for (let i = 1; i <= set.count; i++) {
            const paddedId = i.toString().padStart(3, '0');
            const cardId = `${set.apiId}-${paddedId}`;
            const qty = counts[cardId] || 0;
            const isOwned = qty > 0;

            if (currentFilter === 'owned' && !isOwned) continue;
            if (currentFilter === 'missing' && isOwned) continue;

            visibleCount++;
            
            // Calcul rareté approximatif pour bordure
            const progress = i / set.count;
            let borderColor = 'transparent';
            let price = 10;
            if(progress > 0.98) { borderColor = RARITIES.SECRET.color; price = 1000; }
            else if(progress > 0.90) { borderColor = RARITIES.ULTRA_RARE.color; price = 250; }
            else if(progress > 0.75) { borderColor = RARITIES.RARE.color; price = 50; }

            const imgHTML = isOwned 
                ? `<img src="img/${set.apiId}/${i}.png" loading="lazy" class="loaded">`
                : `<span class="missing-num">${paddedId}</span>`;
            
            const badge = qty > 1 ? `<span class="qty-badge">x${qty}</span>` : '';
            const style = isOwned ? `border: 1px solid ${borderColor}` : '';
            
            // Bouton de vente unitaire
            const sellBtn = isOwned ? `<div class="card-actions"><button class="btn-sell-single" onclick="sellSingleCard('${cardId}', ${price}, event)">VENDRE ${price}©</button></div>` : '';

            gridHTML += `
                <div class="album-card ${isOwned ? 'owned' : ''}" style="${style}" 
                     onclick="${isOwned ? `openZoom('img/${set.apiId}/${i}.png')` : ''}">
                    ${imgHTML}${badge}${sellBtn}
                </div>`;
        }

        if(visibleCount > 0) {
            const group = document.createElement('div');
            group.className = 'set-group';
            group.innerHTML = `
                <button class="set-header">
                    <span>${set.name}</span> 
                    <span class="count-badge">${new Set(setCards).size} / ${set.count}</span>
                </button>
                <div class="set-body"><div class="set-grid">${gridHTML}</div></div>
            `;
            group.querySelector('.set-header').onclick = function() {
                this.classList.toggle('active');
                const body = this.nextElementSibling;
                body.style.maxHeight = body.style.maxHeight ? null : body.scrollHeight + "px";
            };
            container.appendChild(group);
        }
    });
}

function sellDuplicates() {
    const counts = {};
    myCollection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    let totalGain = 0;
    let newCollection = [];
    let soldCount = 0;

    Object.keys(counts).forEach(id => {
        const qty = counts[id];
        newCollection.push(id); 
        if (qty > 1) {
            const duplicates = qty - 1;
            // Estime prix
            const parts = id.split('-');
            const num = parseInt(parts[parts.length-1]);
            const setId = id.substring(0, id.length - 4);
            const setObj = SETS.find(s => s.apiId === setId);
            let price = 10;
            if(setObj) {
                const ratio = num / setObj.count;
                if(ratio > 0.98) price = 1000;
                else if(ratio > 0.90) price = 250;
                else if(ratio > 0.75) price = 50;
            }
            totalGain += (duplicates * price);
            soldCount += duplicates;
        }
    });

    if (soldCount === 0) { alert("Aucun doublon."); return; }
    if(confirm(`Vendre ${soldCount} cartes pour ${totalGain} Crédits ?`)) {
        AUDIO.playSound('sell');
        myCollection = newCollection;
        addMoney(totalGain);
        saveData();
        renderAlbum(true);
        updateStats();
        checkAchievements();
    }
}

function sellSingleCard(id, price, event) {
    event.stopPropagation(); // Empêcher le zoom
    if(confirm(`Vendre cette carte pour ${price}© ?`)) {
        const index = myCollection.indexOf(id);
        if(index > -1) {
            myCollection.splice(index, 1);
            addMoney(price);
            AUDIO.playSound('sell');
            saveData();
            updateStats();
            // Re-render sans fermer
            renderAlbum(true);
        }
    }
}

function updateStats() {
    const unique = new Set(myCollection).size;
    const total = SETS.reduce((a,b) => a + b.count, 0);
    const p = Math.floor((unique/total)*100);
    document.getElementById('collection-count').innerText = `${unique} / ${total} cartes`;
    document.getElementById('collection-percent').innerText = `${p}%`;
    document.getElementById('collection-bar').style.width = `${p}%`;
    
    if(currentSet) {
        const sUnique = new Set(myCollection.filter(id => id.startsWith(currentSet.apiId))).size;
        const sP = Math.floor((sUnique/currentSet.count)*100);
        document.getElementById('hud-set-count').innerText = `${sUnique}/${currentSet.count}`;
        document.getElementById('hud-set-percent').innerText = `${sP}%`;
        document.getElementById('hud-set-bar').style.width = `${sP}%`;
    }
}
function toggleAchievements() {
    const el = document.getElementById('achievements-overlay');
    if(el.classList.contains('hidden')) {
        renderAchievements(); // On va créer cette mini fonction aussi
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

function renderAchievements() {
    const container = document.getElementById('achievements-content');
    container.innerHTML = '';
    
    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        const div = document.createElement('div');
        div.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
        div.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-info">
                <h3>${ach.name}</h3>
                <p>${ach.desc}</p>
                ${isUnlocked ? '<div class="achievement-reward">DÉBLOQUÉ</div>' : `<div class="achievement-reward">Récompense : ${ach.reward}©</div>`}
            </div>
        `;
        container.appendChild(div);
    });
}