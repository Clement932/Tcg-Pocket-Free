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

// --- DONNÉES QUESTS & ACHIEVEMENTS ---
const QUESTS_DATA = [
    { id: 'q1', text: "Ouvrir 3 Boosters", target: 3, type: 'open_booster', reward: 50, rewardType: 'money' },
    { id: 'q2', text: "Gagner 100 XP", target: 100, type: 'gain_xp', reward: 20, rewardType: 'money' },
    { id: 'q3', text: "Vendre pour 50 Crédits", target: 50, type: 'sell_amount', reward: 50, rewardType: 'xp' }
];

const ACHIEVEMENTS_DATA = [
    { id: 'a1', text: "Collectionneur Débutant (50 cartes)", target: 50, type: 'collection_size', reward: 500, claimed: false },
    { id: 'a2', text: "Magnat du Pétrole (1000©)", target: 1000, type: 'money_hold', reward: 200, claimed: false },
    { id: 'a3', text: "Chanceux (Premier God Pack)", target: 1, type: 'god_packs', reward: 1000, claimed: false }
];

let questsProgress = JSON.parse(localStorage.getItem('questsProgress')) || { q1: 0, q2: 0, q3: 0, claimed: [] };
let achievementsProgress = JSON.parse(localStorage.getItem('achievementsProgress')) || { a1: false, a2: false, a3: false };

// --- PLAYER STATS (NOUVEAU) ---
let playerStats = JSON.parse(localStorage.getItem('playerStats')) || { clicks: 0, spent: 0, bestRarity: 100 };
let sessionStartTime = Date.now();

// --- SHOWCASE (VITRINE) ---
let showcaseData = JSON.parse(localStorage.getItem('showcaseData')) || [null, null, null, null, null];
let currentShowcaseSlot = -1;

// --- VARIABLES ---
let currentSet = SETS[0];
let dbCards = []; 
let myCollection = JSON.parse(localStorage.getItem('tcgCollection')) || [];
let currentFilter = 'all';
let preparedCards = [];
let isGodPack = false;
let totalGodPacks = parseInt(localStorage.getItem('totalGodPacks')) || 0;

const BOOSTER_PRICE = 10;
let boosterEnergy = parseInt(localStorage.getItem('boosterEnergy')) || 0;
let isSetComplete = false;

// --- SHOP ---
let shopCards = []; 
let shopRefreshTimer = null;
const SHOP_REFRESH_TIME = 120; 
let currentShopTime = SHOP_REFRESH_TIME;

// --- GAMES VARIABLES ---
let lastWheelSpin = parseInt(localStorage.getItem('lastWheelSpin')) || 0;

// --- COMPTEURS & ARGENT ---
let totalBoosters = parseInt(localStorage.getItem('totalBoosters')) || 0;
let sessionBoosters = 0;
let userMoney = parseInt(localStorage.getItem('userMoney')) || 500;
let userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
let userXP = parseInt(localStorage.getItem('userXP')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    generateSidebar();
    loadSet(currentSet.id);
    updateCounters(); 
    updateMoneyUI();
    updateLevelUI(); 
    startShopTimer();
    updateGodPackUI();
    updateEnergyUI();
    updateQuestNotif();
    renderShowcase();
    
    // Zoom 3D Events
    const zoomContainer = document.querySelector('.zoom-3d-container');
    zoomContainer.addEventListener('mousemove', handleZoomTilt);
    zoomContainer.addEventListener('mouseleave', resetZoomTilt);
    
    // Close sidebar on click
    document.querySelector('.stage').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
});

// ------------------------------------------------------------------
// --- LOGIQUE STATS & VITRINE (NOUVEAU)
// ------------------------------------------------------------------

function openStats() {
    const el = document.getElementById('stats-overlay');
    
    // Si la fenêtre est déjà ouverte (pas cachée), on la ferme
    if (!el.classList.contains('hidden')) {
        el.classList.add('hidden');
        return;
    }

    // Sinon, on met à jour les stats et on l'ouvre
    const sessionMins = Math.floor((Date.now() - sessionStartTime) / 60000);
    document.getElementById('stat-time').innerText = sessionMins + "m";
    document.getElementById('stat-spent').innerText = playerStats.spent + " ©";
    document.getElementById('stat-clicks').innerText = playerStats.clicks;
    
    const totalCards = SETS.reduce((acc, set) => acc + set.count, 0);
    const uniqueCollection = new Set(myCollection);
    const rate = totalCards > 0 ? ((uniqueCollection.size / totalCards) * 100).toFixed(1) : 0;
    document.getElementById('stat-rate').innerText = rate + "%";

    let bestText = "Aucune"; // Par défaut si 100
    if(playerStats.bestRarity <= 5) bestText = "ULTRA RARE (God Tier)";
    else if(playerStats.bestRarity <= 15) bestText = "RARE";
    else if(playerStats.bestRarity <= 40) bestText = "PEU COMMUNE";
    else if(playerStats.bestRarity < 100) bestText = "COMMUNE";
    
    document.getElementById('stat-best-card').innerText = bestText;
    
    el.classList.remove('hidden');
}

function renderShowcase() {
    const slots = document.querySelectorAll('.showcase-slot');
    showcaseData.forEach((cardId, index) => {
        const slot = slots[index];
        slot.innerHTML = '';
        if(cardId) {
            // Find card info
            let setPrefix = cardId.split('-').slice(0, -1).join('-');
            // On doit deviner l'URL de l'image si on n'est pas sur le bon set.
            // Simplification: On cherche dans le set actuel ou on reconstruit l'url
            // cardId ex: puissance-genetique-001
            // img path: img/puissance-genetique/1.png
            const parts = cardId.split('-');
            const num = parseInt(parts[parts.length-1]);
            const apiId = parts.slice(0, parts.length-1).join('-');
            
            const img = document.createElement('img');
            img.src = `img/${apiId}/${num}.png`;
            img.onerror = function() { this.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'; };
            slot.appendChild(img);
        } else {
            slot.innerHTML = '<span class="empty-slot">+</span>';
        }
    });
}

function openShowcaseSelect(slotIndex) {
    currentShowcaseSlot = slotIndex;
    const overlay = document.getElementById('showcase-overlay');
    const list = document.getElementById('showcase-list');
    list.innerHTML = '';
    
    if(myCollection.length === 0) {
        list.innerHTML = '<p style="text-align:center; width:100%">Collection vide !</p>';
    } else {
        // Liste des cartes uniques possédées
        const unique = [...new Set(myCollection)];
        
        unique.forEach(cardId => {
            // --- MODIFICATION ICI : On vérifie si la carte est déjà dans la vitrine ---
            // Si l'ID est dans showcaseData, on ne l'affiche pas (sauf si c'est le slot qu'on modifie actuellement)
            if (showcaseData.includes(cardId) && showcaseData[currentShowcaseSlot] !== cardId) {
                return; // On passe à la carte suivante
            }
            // -------------------------------------------------------------------------

            const parts = cardId.split('-');
            const num = parseInt(parts[parts.length-1]);
            const apiId = parts.slice(0, parts.length-1).join('-');
            
            const div = document.createElement('div');
            div.style.width = '100px';
            div.style.cursor = 'pointer';
            
            const img = document.createElement('img');
            img.src = `img/${apiId}/${num}.png`;
            img.style.width = '100%';
            img.style.borderRadius = '6px';
            img.style.transition = '0.2s'; // Petit effet visuel
            
            // Gestion erreur image
            img.onerror = function() { this.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'; };
            
            // Effet au survol
            div.onmouseenter = () => { img.style.transform = "scale(1.05)"; img.style.boxShadow = "0 0 10px var(--gold)"; };
            div.onmouseleave = () => { img.style.transform = "scale(1)"; img.style.boxShadow = "none"; };

            div.appendChild(img);
            div.onclick = () => {
                showcaseData[currentShowcaseSlot] = cardId;
                localStorage.setItem('showcaseData', JSON.stringify(showcaseData));
                renderShowcase();
                closeShowcaseSelect();
            };
            list.appendChild(div);
        });
    }
    
    overlay.classList.remove('hidden');
}

function closeShowcaseSelect() {
    document.getElementById('showcase-overlay').classList.add('hidden');
}


// ------------------------------------------------------------------
// --- LOGIQUE JEUX & QUETES
// ------------------------------------------------------------------

// 1. QUESTS
function toggleQuests() {
    const el = document.getElementById('quest-overlay');
    if(el.classList.contains('hidden')) { 
        renderQuests(); 
        el.classList.remove('hidden'); 
    } else { 
        el.classList.add('hidden'); 
    }
}
function switchQuestTab(tab) {
    document.getElementById('tab-quests').classList.toggle('active', tab === 'daily');
    document.getElementById('tab-achievements').classList.toggle('active', tab === 'achievements');
    renderQuests(tab);
}

function updateQuestProgress(type, amount) {
    let updated = false;
    QUESTS_DATA.forEach(q => {
        if(q.type === type && !questsProgress.claimed.includes(q.id)) {
            if(questsProgress[q.id] < q.target) {
                questsProgress[q.id] += amount;
                if(questsProgress[q.id] > q.target) questsProgress[q.id] = q.target;
                updated = true;
            }
        }
    });
    // Check Achievements
    checkAchievements();
    
    if(updated) {
        localStorage.setItem('questsProgress', JSON.stringify(questsProgress));
        updateQuestNotif();
    }
}

function checkAchievements() {
    let changed = false;
    const uniqueCards = new Set(myCollection).size;
    
    if(!achievementsProgress['a1'] && uniqueCards >= 50) { achievementsProgress['a1'] = true; changed = true; }
    if(!achievementsProgress['a2'] && userMoney >= 1000) { achievementsProgress['a2'] = true; changed = true; }
    if(!achievementsProgress['a3'] && totalGodPacks >= 1) { achievementsProgress['a3'] = true; changed = true; }
    
    if(changed) localStorage.setItem('achievementsProgress', JSON.stringify(achievementsProgress));
}

function renderQuests(tab = 'daily') {
    const container = document.getElementById('quest-content');
    container.innerHTML = '';
    
    const data = tab === 'daily' ? QUESTS_DATA : ACHIEVEMENTS_DATA;
    
    data.forEach(q => {
        const isAch = tab === 'achievements';
        const current = isAch ? (achievementsProgress[q.id] ? q.target : 0) : questsProgress[q.id];
        const isDone = current >= q.target;
        const isClaimed = isAch ? false : questsProgress.claimed.includes(q.id); // Simple logic for ach (auto claim logic omitted for simplicity, treating unlocked as done)
        
        let btnState = '';
        if(isClaimed) btnState = '<button class="btn-claim" disabled>RÉCUPÉRÉ</button>';
        else if(isDone) btnState = `<button class="btn-claim" onclick="claimQuest('${q.id}', '${tab}')">RÉCUPÉRER</button>`;
        else btnState = `<span style="font-size:12px; color:#666;">En cours</span>`;

        if(isAch && isDone) btnState = '<span style="color:#10b981; font-weight:bold;">DÉBLOQUÉ</span>'; 

        const html = `
            <div class="quest-item ${isClaimed ? 'quest-completed' : ''}">
                <div class="quest-info">
                    <h4>${q.text}</h4>
                    <span class="quest-desc">Récompense : ${q.reward} ${q.rewardType === 'money' ? '©' : 'XP'}</span>
                    <div class="quest-progress-bg">
                        <div class="quest-progress-fill" style="width: ${(current/q.target)*100}%"></div>
                    </div>
                </div>
                <div>${btnState}</div>
            </div>
        `;
        container.appendChild(new DOMParser().parseFromString(html, 'text/html').body.firstChild);
    });
}

function claimQuest(qid, type) {
    if(type === 'daily') {
        const q = QUESTS_DATA.find(x => x.id === qid);
        questsProgress.claimed.push(qid);
        if(q.rewardType === 'money') addMoney(q.reward);
        else gainXP(q.reward);
        localStorage.setItem('questsProgress', JSON.stringify(questsProgress));
        renderQuests('daily');
        updateQuestNotif();
    }
}

function updateQuestNotif() {
    const count = QUESTS_DATA.filter(q => questsProgress[q.id] >= q.target && !questsProgress.claimed.includes(q.id)).length;
    const dot = document.getElementById('notif-quests');
    if(count > 0) { dot.classList.remove('hidden'); } else { dot.classList.add('hidden'); }
}

// 2. GAMES HUB
function openGameMenu() {
    const el = document.getElementById('games-overlay');
    if(el.classList.contains('hidden')) { 
        updateWheelTimer();
        el.classList.remove('hidden'); 
    } else { 
        el.classList.add('hidden'); 
    }
}

// ROUE
function updateWheelTimer() {
    const now = Date.now();
    const diff = now - lastWheelSpin;
    const fourHours = 4 * 60 * 60 * 1000;
    const btn = document.getElementById('btn-spin');
    const txt = document.getElementById('wheel-timer');
    
    if(diff >= fourHours) {
        btn.disabled = false;
        btn.innerText = "TOURNER";
        txt.innerText = "Prêt !";
        txt.style.color = "#10b981";
    } else {
        btn.disabled = true;
        const remaining = fourHours - diff;
        const m = Math.floor((remaining / 1000 / 60) % 60);
        const h = Math.floor((remaining / (1000 * 60 * 60)));
        txt.innerText = `Reviens dans ${h}h ${m}m`;
        txt.style.color = "#ef4444";
    }
}

function spinWheel() {
    const wheel = document.getElementById('wheel');
    const rot = Math.floor(Math.random() * 360) + 1440; // min 4 tours
    wheel.style.transform = `rotate(${rot}deg)`;
    localStorage.setItem('lastWheelSpin', Date.now());
    lastWheelSpin = Date.now();
    document.getElementById('btn-spin').disabled = true;

    setTimeout(() => {
        // Simple result logic based on rotation (simplified)
        const rewards = ["XP", "MONEY", "ENERGY", "XP", "MONEY", "JACKPOT"];
        const rand = Math.random();
        if(rand < 0.4) { gainXP(50); alert("Gagné : 50 XP !"); }
        else if(rand < 0.8) { addMoney(50); alert("Gagné : 50 Crédits !"); }
        else { boosterEnergy = 10; updateEnergyUI(); alert("JACKPOT ! Pack Premium Garanti !"); }
        updateWheelTimer();
    }, 4000);
}

// BATAILLE
function startBattle() {
    if(userMoney < 50) { alert("Pas assez d'argent (50© requis)"); return; }
    if(myCollection.length === 0) { alert("Vous n'avez aucune carte !"); return; }
    
    addMoney(-50);
    
    const userCardId = myCollection[Math.floor(Math.random() * myCollection.length)];
    // CPU card from DB (current set to avoid loading issues)
    const cpuCard = dbCards[Math.floor(Math.random() * dbCards.length)];
    // User card details need to be found in current DB or simulated if cross-set
    // Simplification: we try to find user card in current DB, if not found we pick a random one for visual
    let userCardData = dbCards.find(c => c.id === userCardId);
    if(!userCardData) userCardData = dbCards[Math.floor(Math.random() * dbCards.length)]; // Fallback visual
    
    const uSlot = document.getElementById('user-battle-card');
    const cSlot = document.getElementById('cpu-battle-card');
    const res = document.getElementById('battle-result');
    
    document.getElementById('battle-area').classList.remove('hidden');
    uSlot.innerHTML = `<img src="${userCardData.imgUrl}">`;
    cSlot.innerHTML = `<div style="font-size:20px">❓</div>`;
    res.innerText = "Combat...";
    
    setTimeout(() => {
        cSlot.innerHTML = `<img src="${cpuCard.imgUrl}">`;
        
        // Logic: Lower weight = Rarer. Winner has LOWER weight.
        if(userCardData.weight < cpuCard.weight) {
            res.innerText = "VICTOIRE ! +150©";
            res.style.color = "#10b981";
            addMoney(150);
            launchConfetti();
        } else if (userCardData.weight > cpuCard.weight) {
            res.innerText = "DÉFAITE...";
            res.style.color = "#ef4444";
        } else {
            res.innerText = "ÉGALITÉ (+50©)";
            res.style.color = "#fbbf24";
            addMoney(50);
        }
    }, 1000);
}

// WONDER TRADE (VERSION CORRIGÉE)
function startWonderTrade() {
    // 1. On liste tous les doublons disponibles
    const counts = {};
    myCollection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    // On ne garde que les ID des cartes qu'on a en quantité > 1
    const duplicates = Object.keys(counts).filter(id => counts[id] > 1);

    // Si aucun doublon, on bloque
    if(duplicates.length === 0) {
        alert("Vous n'avez aucun doublon à échanger ! Gardez vos cartes uniques.");
        return;
    }

    // 2. On cherche les cartes manquantes (Garanti Nouvelle)
    const missingCards = dbCards.filter(c => !myCollection.includes(c.id));

    // Si la collection est complète
    if(missingCards.length === 0) {
        alert("Félicitations ! Vous avez déjà toutes les cartes de ce set !");
        return;
    }

    if(confirm(`Échanger un de vos ${duplicates.length} doublons contre une carte que vous ne possédez pas ?`)) {
        
        // A. On choisit un doublon au hasard à retirer
        const idToRemove = duplicates[Math.floor(Math.random() * duplicates.length)];
        const indexToRemove = myCollection.indexOf(idToRemove);
        
        // On le retire de la collection (-1)
        if (indexToRemove > -1) myCollection.splice(indexToRemove, 1);
        
        // B. On choisit une carte manquante au hasard
        const newCard = missingCards[Math.floor(Math.random() * missingCards.length)];
        
        // On l'ajoute à la collection (+1)
        myCollection.push(newCard.id);
        
        // C. Sauvegarde et Actualisation
        saveData();
        updateStats();
        
        // IMPORTANT : On force le rechargement de l'album pour afficher la modif
        renderAlbum(true); 

        // D. Feedback visuel
        openZoom(newCard.imgUrl);
        setTimeout(() => {
            alert(`Succès ! Doublon échangé contre une NOUVELLE carte !`);
        }, 500);
    }
}

// 3. ZOOM 3D
function handleZoomTilt(e) {
    const img = document.getElementById('zoom-img');
    const shine = document.querySelector('.zoom-shine');
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cX = rect.width / 2;
    const cY = rect.height / 2;
    
    const rX = ((y - cY) / cY) * -15;
    const rY = ((x - cX) / cX) * 15;
    
    img.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`;
    shine.style.opacity = 0.6;
    shine.style.background = `linear-gradient(${135 + rY}deg, rgba(255,255,255,0.4), transparent 60%)`;
}
function resetZoomTilt() {
    const img = document.getElementById('zoom-img');
    const shine = document.querySelector('.zoom-shine');
    img.style.transform = `rotateX(0) rotateY(0) scale(1)`;
    shine.style.opacity = 0;
}


// ------------------------------------------------------------------
// --- LOGIQUE CORE EXISTANTE
// ------------------------------------------------------------------

function updateGodPackUI() {
    document.getElementById('god-pack-count').innerText = totalGodPacks;
}

function updateEnergyUI() {
    document.getElementById('energy-val').innerText = `${boosterEnergy}/10`;
    document.getElementById('energy-bar').style.width = `${(boosterEnergy / 10) * 100}%`;
    
    if(boosterEnergy >= 10) {
        document.getElementById('energy-bar').style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        document.getElementById('energy-bar').style.boxShadow = '0 0 15px #fbbf24';
    } else {
        document.getElementById('energy-bar').style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        document.getElementById('energy-bar').style.boxShadow = 'none';
    }
}

// Remplacer la fonction generateSidebar dans script.js
function generateSidebar() {
    const container = document.getElementById('set-buttons-container');
    container.innerHTML = '';
    
    SETS.forEach(set => {
        const btn = document.createElement('div'); // On change button en div pour plus de flexibilité
        btn.className = 'set-card-btn'; // Nouvelle classe CSS
        btn.id = `btn-${set.id}`;
        
        const isLocked = userLevel < set.reqLevel;

        // Calcul de la progression pour ce set
        const setCardsInCollection = myCollection.filter(id => id.startsWith(set.apiId));
        const uniqueInSet = new Set(setCardsInCollection).size;
        const percent = Math.floor((uniqueInSet / set.count) * 100);

        if (isLocked) {
            btn.classList.add('locked');
            btn.innerHTML = `
                <div class="set-card-img-wrapper">
                    <img src="${set.img}" class="set-card-img grayscale">
                </div>
                <div class="set-card-info">
                    <span class="set-name">${set.name}</span>
                    <span class="lock-status">🔒 Niv. ${set.reqLevel}</span>
                </div>
            `;
        } else {
            const isCompleted = uniqueInSet >= set.count;
            btn.innerHTML = `
                <div class="set-card-img-wrapper">
                    <img src="${set.img}" class="set-card-img">
                </div>
                <div class="set-card-info">
                    <span class="set-name">${set.name} ${isCompleted ? '⭐' : ''}</span>
                    <div class="mini-progress-track">
                        <div class="mini-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="mini-progress-text">${uniqueInSet}/${set.count} (${percent}%)</span>
                </div>
            `;

            btn.onclick = () => {
                loadSet(set.id);
                // Gestion mobile
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
        let weight = 100; 
        
        if (i > currentSet.count * 0.95) weight = 5;       
        else if (i > currentSet.count * 0.85) weight = 15; 
        else if (i > currentSet.count * 0.65) weight = 40; 
        else if (i > currentSet.count * 0.40) weight = 80; 

        dbCards.push({
            id: `${currentSet.apiId}-${paddedId}`,
            localId: paddedId,
            imgUrl: `img/${currentSet.apiId}/${i}.png`,
            weight: weight
        });
    }

    generateShopCards();
    updateStats();
    document.querySelector('.top-hud').classList.add('visible');
}

function getRequiredXP(level) { return 500 + ((level - 1) * 100); }

function gainXP(amount) {
    userXP += amount;
    // Quest Hook
    updateQuestProgress('gain_xp', amount);
    
    let reqXP = getRequiredXP(userLevel);
    if(userXP >= reqXP) {
        userLevel++;
        userXP = userXP - reqXP; 
        alert(`NIVEAU SUPÉRIEUR ! Vous êtes maintenant niveau ${userLevel} !`);
        localStorage.setItem('userLevel', userLevel);
        generateSidebar();
        const currentBtn = document.getElementById(`btn-${currentSet.id}`);
        if(currentBtn) currentBtn.classList.add('active');
    }
    localStorage.setItem('userXP', userXP);
    updateLevelUI();
}

function updateLevelUI() {
    const reqXP = getRequiredXP(userLevel);
    document.getElementById('user-level').innerText = userLevel;
    const percent = Math.floor((userXP / reqXP) * 100);
    document.getElementById('xp-bar').style.width = `${percent}%`;
    document.getElementById('xp-text').innerText = `${userXP} / ${reqXP} XP`;
}

function toggleShop() {
    const shop = document.getElementById('shop-overlay');
    if(shop.classList.contains('hidden')) { renderShop(); shop.classList.remove('hidden'); } 
    else { shop.classList.add('hidden'); }
}

function startShopTimer() {
    if(shopRefreshTimer) clearInterval(shopRefreshTimer);
    shopRefreshTimer = setInterval(() => {
        currentShopTime--;
        const minutes = Math.floor(currentShopTime / 60).toString().padStart(2, '0');
        const seconds = (currentShopTime % 60).toString().padStart(2, '0');
        document.getElementById('shop-countdown').innerText = `${minutes}:${seconds}`;
        document.getElementById('sidebar-shop-timer').innerText = `${minutes}:${seconds}`;

        if(currentShopTime <= 0) {
            generateShopCards();
            if(!document.getElementById('shop-overlay').classList.contains('hidden')) renderShop();
        }
    }, 1000);
}

function generateShopCards() {
    currentShopTime = SHOP_REFRESH_TIME;
    shopCards = [];
    const missingCards = dbCards.filter(card => !myCollection.includes(card.id));
    
    if(missingCards.length === 0) return;

    const shuffled = [...missingCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    shopCards = selected.map(card => {
        let price = 50; 
        if(card.weight <= 5) price = 2500;
        else if(card.weight <= 15) price = 1000;
        else if(card.weight <= 40) price = 400;
        else if(card.weight <= 80) price = 150;
        return { ...card, price: price };
    });
}

function renderShop() {
    document.getElementById('shop-user-money').innerText = userMoney.toLocaleString();
    const container = document.getElementById('shop-content');
    container.innerHTML = '';

    if(shopCards.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%; color:#aaa;">Aucune carte disponible.</p>';
        return;
    }

    shopCards.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-card-wrapper';
        div.innerHTML = `
            <img src="${item.imgUrl}" class="shop-card-img" loading="lazy">
            <div class="shop-price-tag">
                <span>${item.price}</span> <span style="font-size:12px">©</span>
            </div>
            <button class="btn-buy-card" onclick="buyCard('${item.id}', ${item.price})">ACHETER</button>
        `;
        if(userMoney < item.price) {
            div.querySelector('button').disabled = true;
            div.querySelector('button').innerText = "PAS ASSEZ";
        }
        container.appendChild(div);
    });
}

function buyCard(cardId, price) {
    if(userMoney >= price) {
        addMoney(-price);
        myCollection.push(cardId);
        
        // Stats
        playerStats.spent += price;
        localStorage.setItem('playerStats', JSON.stringify(playerStats));
        
        saveData();
        updateStats();
        document.getElementById('album-content').innerHTML = '';        
        shopCards = shopCards.filter(c => c.id !== cardId);
        renderShop();
        launchConfetti();
    }
}

function forceShopRefresh() {
    if(userMoney >= 50) {
        addMoney(-50);
        generateShopCards();
        renderShop();
    } else {
        alert("Pas assez d'argent !");
    }
}

function updateCounters() {
    document.getElementById('session-count').innerText = sessionBoosters;
    document.getElementById('total-count').innerText = totalBoosters;
}

function updateMoneyUI() {
    document.getElementById('user-money').innerText = userMoney.toLocaleString();
    const shopMoney = document.getElementById('shop-user-money');
    if(shopMoney) shopMoney.innerText = userMoney.toLocaleString();
    checkAchievements();
}

function addMoney(amount) {
    userMoney += amount;
    localStorage.setItem('userMoney', userMoney);
    updateMoneyUI();
}

function prepareAndPreload() {
    preparedCards = [];
    isGodPack = Math.random() < 0.0005; 
    
    let isPremiumPack = false;
    if (boosterEnergy >= 10) {
        isPremiumPack = true;
        boosterEnergy = 0; 
        localStorage.setItem('boosterEnergy', boosterEnergy);
        updateEnergyUI();
    }

    if (isGodPack) {
        totalGodPacks++;
        localStorage.setItem('totalGodPacks', totalGodPacks);
        updateGodPackUI();
        const godTierCards = dbCards.filter(c => c.weight <= 15);
        if (godTierCards.length < 5) {
            isGodPack = false;
            return prepareAndPreload();
        }
        for(let i = 0; i < 5; i++) {
            preparedCards.push(godTierCards[Math.floor(Math.random() * godTierCards.length)]);
        }
    } else {
        const totalWeight = dbCards.reduce((sum, c) => sum + c.weight, 0);
        
        for(let i = 0; i < 5; i++) {
            let randomNum = Math.random() * totalWeight;
            
            if(isSetComplete) randomNum = randomNum * 0.95; 
            if(isPremiumPack && i === 4) randomNum = 0; 

            let selected = dbCards[0];
            for (const card of dbCards) {
                if (randomNum < card.weight) { selected = card; break; }
                randomNum -= card.weight;
            }
            preparedCards.push(selected);
        }
    }
    preparedCards.forEach(card => {
        const img = new Image();
        img.src = card.imgUrl;
    });
}

function startOpeningSequence() {
    if(dbCards.length === 0) return;

    if(userMoney < BOOSTER_PRICE) {
        alert("Pas assez d'argent ! Il vous faut 100 Crédits.");
        return;
    }
    addMoney(-BOOSTER_PRICE);
    
    // Stats update
    playerStats.clicks += 1;
    playerStats.spent += BOOSTER_PRICE;
    localStorage.setItem('playerStats', JSON.stringify(playerStats));
    
    // Quest Hook
    updateQuestProgress('open_booster', 1);

    if(boosterEnergy < 10) {
        boosterEnergy++;
        localStorage.setItem('boosterEnergy', boosterEnergy);
        updateEnergyUI();
    }

    sessionBoosters++;
    totalBoosters++;
    localStorage.setItem('totalBoosters', totalBoosters);
    updateCounters();
    gainXP(20);
    prepareAndPreload(); 
    
    const booster = document.querySelector('.booster-container');
    const flash = document.querySelector('.booster-flash');
    booster.style.animation = 'none'; 
    booster.classList.add('shaking');
    
    setTimeout(() => {
        booster.classList.remove('shaking');
        flash.classList.add('active');
        setTimeout(() => { performDraw(); }, 300);
        setTimeout(() => {
            booster.classList.remove('opened');
            flash.classList.remove('active');
            booster.style.animation = ''; 
        }, 1000);
    }, 600);
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

    preparedCards.forEach((cardData, index) => {
        const isNew = !myCollection.includes(cardData.id);
        const isRare = cardData.weight <= 15; 
        const isUltraRare = cardData.weight <= 5; 

        // Update stats Best Rarity
        if(cardData.weight < playerStats.bestRarity) {
            playerStats.bestRarity = cardData.weight;
            localStorage.setItem('playerStats', JSON.stringify(playerStats));
        }

        const cardEl = document.createElement('div');
        cardEl.className = 'flip-card';
        cardEl.style.pointerEvents = 'none'; 
        
        if(isRare) cardEl.classList.add('rarity-rare');
        if(isUltraRare) cardEl.classList.add('rarity-ur');
        
        let extras = '<div class="holo-overlay"></div>';
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
            cardEl.classList.add('flipped');
            cardEl.style.transform = "scale(0.95) rotateY(180deg)";
            setTimeout(() => {
                if(!cardEl.matches(':hover')) cardEl.style.transform = "scale(1) rotateY(180deg)";
            }, 100);

            myCollection.push(cardData.id);
            saveData();
            updateStats();
            generateSidebar();

            shopCards = shopCards.filter(c => c.id !== cardData.id);
            if (!document.getElementById('shop-overlay').classList.contains('hidden')) renderShop();
            document.getElementById('album-content').innerHTML = '';

            if(isRare) {
                setTimeout(() => {
                    cardEl.querySelector('.back').classList.add('is-rare');
                    launchConfetti();
                }, 400);
            }
        };

        cardEl.addEventListener('mousemove', (e) => handleTilt(e, cardEl));
        cardEl.addEventListener('mouseleave', () => resetTilt(cardEl));
        cardEl.addEventListener('click', flipCard);

        setTimeout(() => {
            flipCard();
            setTimeout(() => { cardEl.style.pointerEvents = 'auto'; }, 600);
            if(index === 0) { 
                setTimeout(() => {
                    btnNext.classList.remove('hidden');
                    btnChange.classList.remove('hidden');
                }, 600);
            }
        }, 600 + (index * 250));
    });
}

function handleTilt(e, card) {
    if (!card.classList.contains('flipped')) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -20; 
    const rotateY = ((x - centerX) / centerX) * 20;
    card.style.transition = 'transform 0.05s ease-out';
    card.style.transform = `rotateY(${180 + rotateY}deg) rotateX(${rotateX}deg) scale(1.1)`;
    const holo = card.querySelector('.holo-overlay');
    if(holo) {
        holo.style.backgroundPosition = `${x/5 + y/5}%`;
        holo.style.opacity = 0.4;
    }
}
function resetTilt(card) {
    card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
    if (card.classList.contains('flipped')) card.style.transform = 'rotateY(180deg) rotateX(0deg) scale(1)';
    else card.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    const holo = card.querySelector('.holo-overlay');
    if(holo) holo.style.opacity = 0;
}
function launchConfetti() {
    const container = document.getElementById('particles-container');
    const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981'];
    for(let i=0; i<30; i++) {
        const p = document.createElement('div');
        p.className = 'confetti';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDuration = (Math.random() * 2 + 1) + 's';
        container.appendChild(p);
        setTimeout(() => p.remove(), 3000);
    }
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.classList.add('hidden'); });
    const target = document.getElementById(viewId);
    target.classList.remove('hidden'); target.classList.add('active');
}
function returnToBooster() { switchView('view-booster'); }

function updateStats() {
    const totalCards = SETS.reduce((acc, set) => acc + set.count, 0);
    const uniqueCollection = new Set(myCollection);
    const totalOwnedUnique = uniqueCollection.size;
    
    const globalPercent = totalCards > 0 ? Math.floor((totalOwnedUnique / totalCards) * 100) : 0;
    
    document.getElementById('collection-count').innerText = `${totalOwnedUnique} / ${totalCards} cartes`;
    document.getElementById('collection-percent').innerText = `${globalPercent}%`;
    document.getElementById('collection-bar').style.width = `${globalPercent}%`;

    if (currentSet) {
        const currentSetUnique = new Set(myCollection.filter(id => id.startsWith(currentSet.apiId)));
        const currentSetOwned = currentSetUnique.size;
        const setPercent = Math.floor((currentSetOwned / currentSet.count) * 100);
        
        document.getElementById('hud-set-count').innerText = `${currentSetOwned}/${currentSet.count}`;
        document.getElementById('hud-set-percent').innerText = `${setPercent}%`;
        document.getElementById('hud-set-bar').style.width = `${setPercent}%`;

        const badge = document.getElementById('set-mastery-badge');
        if(currentSetOwned >= currentSet.count) {
            isSetComplete = true;
            badge.classList.remove('hidden');
        } else {
            isSetComplete = false;
            badge.classList.add('hidden');
        }
    }
    // Update Achievements
    checkAchievements();
}

function toggleAlbum() {
    const album = document.getElementById('album-overlay');
    if(album.classList.contains('hidden')) { renderAlbum(); album.classList.remove('hidden'); }
    else { album.classList.add('hidden'); }
}

function filterAlbum(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderAlbum(true); 
}

function renderAlbum(force = false) {
    const container = document.getElementById('album-content');
    if(container.innerHTML !== '' && !force) return;
    container.innerHTML = ''; 
    
    // RECHERCHE (Mise en minuscule pour ignorer la casse)
    const searchVal = document.getElementById('album-search').value.toLowerCase().trim();

    SETS.forEach(set => {
        const setCardsInCollection = myCollection.filter(id => id.startsWith(set.apiId));
        
        // Filtre "Possédées" : Si on filtre et qu'on a rien, on passe
        if (currentFilter === 'owned' && setCardsInCollection.length === 0) return;

        const group = document.createElement('div');
        group.className = 'set-group';
        
        const header = document.createElement('button');
        header.className = 'set-header';
        header.innerHTML = `<span>${set.name}</span> <span class="count-badge">${new Set(setCardsInCollection).size}/${set.count}</span>`;
        
        const body = document.createElement('div');
        body.className = 'set-body';
        const grid = document.createElement('div');
        grid.className = 'set-grid';

        const counts = {};
        setCardsInCollection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        
        let hasVisibleCards = false;

        for (let i = 1; i <= set.count; i++) {
            const paddedId = i.toString().padStart(3, '0');
            const cardId = `${set.apiId}-${paddedId}`; // ID interne
            const qty = counts[cardId] || 0;
            const isOwned = qty > 0;
            
            // --- LOGIQUE DE RECHERCHE ---
            if(searchVal !== "") {
                // On cherche dans : ID interne, Nom du Set, Numéro (001), ou ID court (pocket-a1)
                const matchId = cardId.includes(searchVal);
                const matchSetName = set.name.toLowerCase().includes(searchVal);
                const matchNum = paddedId.includes(searchVal);
                const matchSetId = set.id.includes(searchVal); // Permet de trouver "a1"
                
                if(!matchId && !matchSetName && !matchNum && !matchSetId) continue;
            }

            // --- FILTRES ---
            if (currentFilter === 'owned' && !isOwned) continue;
            if (currentFilter === 'missing' && isOwned) continue;

            hasVisibleCards = true;

            const cardSlot = document.createElement('div');
            cardSlot.className = `album-card ${isOwned ? 'owned' : ''}`;
            
            if(isOwned) {
                 const img = document.createElement('img');
                 img.loading = "lazy";
                 img.src = `img/${set.apiId}/${i}.png`;
                 img.onerror = function() {
                     this.src = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg';
                 };

                 cardSlot.appendChild(img);
                 
                 if(qty > 1) {
                     const badge = document.createElement('span');
                     badge.className = 'qty-badge';
                     badge.innerText = `x${qty}`;
                     cardSlot.appendChild(badge);
                 }

                 const sellBtn = document.createElement('button');
                 sellBtn.className = 'btn-sell-single';
                 sellBtn.innerText = 'VENDRE';
                 sellBtn.onclick = (e) => {
                    e.stopPropagation();
                    sellSingleCard(cardId);
                 };
                 cardSlot.appendChild(sellBtn);

                 cardSlot.onclick = () => openZoom(img.src);
            } else {
                 cardSlot.innerHTML = `<span class="missing-num">${paddedId}</span>`;
            }
            grid.appendChild(cardSlot);
        }

        // On n'affiche le groupe que s'il y a des cartes qui correspondent à la recherche
        if(hasVisibleCards) {
            body.appendChild(grid);
            group.appendChild(header);
            group.appendChild(body);
            container.appendChild(group);

            header.onclick = () => {
                header.classList.toggle('active');
                if (body.style.maxHeight) body.style.maxHeight = null;
                else body.style.maxHeight = body.scrollHeight + "px";
            };
            
            // Si on fait une recherche, on ouvre automatiquement les dossiers pour voir les résultats
            if(searchVal !== "") {
                header.classList.add('active');
                body.style.maxHeight = body.scrollHeight + "px";
            }
        }
    });
}

function sellSingleCard(cardId) {
    if(confirm("Vendre cet exemplaire pour 10 Crédits ?")) {
        const index = myCollection.indexOf(cardId);
        if (index > -1) {
            myCollection.splice(index, 1);
            addMoney(10); 
            // Quest Hook
            updateQuestProgress('sell_amount', 10);
            
            saveData();
            updateStats();
            renderAlbum(true); 
        }
    }
}

function sellDuplicates() {
    const counts = {};
    myCollection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    let totalGain = 0;
    let newCollection = [];
    Object.keys(counts).forEach(id => {
        const qty = counts[id];
        newCollection.push(id); 
        if (qty > 1) {
            const duplicatesToSell = qty - 1;
            let price = 10; 
            totalGain += (duplicatesToSell * price);
        }
    });

    if (totalGain === 0) { alert("Aucun doublon !"); return; }
    if(confirm(`Vendre tous vos doublons pour ${totalGain} Crédits ?`)) {
        myCollection = newCollection; 
        saveData();
        addMoney(totalGain);
        // Quest Hook
        updateQuestProgress('sell_amount', totalGain);
        
        renderAlbum(true); 
        updateStats();
        alert(`Vendu ! +${totalGain} Crédits.`);
    }
}

function saveData() { localStorage.setItem('tcgCollection', JSON.stringify(myCollection)); }
function confirmReset() {
    if(confirm("Réinitialiser TOUT ?")) {
        localStorage.clear();
        location.reload();
    }
}
function openZoom(url) { 
    document.getElementById('zoom-img').src = url; 
    document.getElementById('zoom-overlay').classList.remove('hidden'); 
}
function closeZoom() { document.getElementById('zoom-overlay').classList.add('hidden'); }
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
function toggleRightSidebar() {
    document.getElementById('right-sidebar').classList.toggle('open');
}

// Dans script.js du jeu principal
const badges = JSON.parse(localStorage.getItem('adventureBadges')) || [];
let currentBoosterPrice = 100;
if(badges.includes('badge_foudre')) {
    currentBoosterPrice = 90; // Bonus appliqué !
}