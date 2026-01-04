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

let currentSet = SETS[0];
let dbCards = []; 
let myCollection = JSON.parse(localStorage.getItem('tcgCollection')) || [];
let currentFilter = 'all';
let preparedCards = [];
let isGodPack = false;

// --- SHOP VARIABLES ---
let shopCards = []; // Liste des cartes actuellement dans la boutique
let shopRefreshTimer = null;
const SHOP_REFRESH_TIME = 120; // 2 minutes en secondes
let currentShopTime = SHOP_REFRESH_TIME;

// --- NOUVEAUX COMPTEURS & ARGENT & LEVEL ---
let totalBoosters = parseInt(localStorage.getItem('totalBoosters')) || 0;
let sessionBoosters = 0;
let userMoney = parseInt(localStorage.getItem('userMoney')) || 0;

// Variables de niveau
let userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
let userXP = parseInt(localStorage.getItem('userXP')) || 0;

document.addEventListener('DOMContentLoaded', () => {
    generateSidebar();
    loadSet(currentSet.id);
    updateCounters(); 
    updateMoneyUI();
    updateLevelUI(); 
    startShopTimer(); // Lancer le chrono du shop
    
    document.querySelector('.stage').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
    });
});

// --- GESTION DES SETS ---
function generateSidebar() {
    const container = document.getElementById('set-buttons-container');
    container.innerHTML = '';
    
    SETS.forEach(set => {
        const btn = document.createElement('button');
        btn.className = 'set-btn';
        btn.id = `btn-${set.id}`;
        
        const isLocked = userLevel < set.reqLevel;

        if (isLocked) {
            btn.classList.add('locked');
            btn.innerHTML = `${set.name} <span class="lock-icon">🔒 Lvl ${set.reqLevel}</span>`;
        } else {
            const uniqueCardsInSet = new Set(myCollection.filter(id => id.startsWith(set.apiId)));
            const isCompleted = uniqueCardsInSet.size >= set.count;
            btn.innerHTML = `${set.name} ${isCompleted ? '<span style="color: #10b981; float: right; font-weight: bold;">✓</span>' : ''}`;

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

    // Régénérer le shop quand on change de set
    generateShopCards();
    updateStats();
    document.querySelector('.top-hud').classList.add('visible');
}

// --- GESTION XP DYNAMIQUE ---
// Formule: 1->500, 2->600, 3->700... (Level-1)*100 + 500
function getRequiredXP(level) {
    return 500 + ((level - 1) * 100);
}

function gainXP(amount) {
    userXP += amount;
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

// --- GESTION BOUTIQUE (SHOP) ---
function toggleShop() {
    const shop = document.getElementById('shop-overlay');
    if(shop.classList.contains('hidden')) {
        renderShop();
        shop.classList.remove('hidden');
    } else {
        shop.classList.add('hidden');
    }
}

function startShopTimer() {
    if(shopRefreshTimer) clearInterval(shopRefreshTimer);
    shopRefreshTimer = setInterval(() => {
        currentShopTime--;
        
        // Formattage MM:SS
        const minutes = Math.floor(currentShopTime / 60).toString().padStart(2, '0');
        const seconds = (currentShopTime % 60).toString().padStart(2, '0');
        const timeStr = `${minutes}:${seconds}`;

        document.getElementById('shop-countdown').innerText = timeStr;
        document.getElementById('sidebar-shop-timer').innerText = timeStr;

        if(currentShopTime <= 0) {
            generateShopCards();
            if(!document.getElementById('shop-overlay').classList.contains('hidden')){
                renderShop(); // Refresh visuel si ouvert
            }
        }
    }, 1000);
}

function generateShopCards() {
    currentShopTime = SHOP_REFRESH_TIME;
    shopCards = [];
    
    // Filtre : Uniquement cartes du set actuel que je ne possède PAS
    const missingCards = dbCards.filter(card => !myCollection.includes(card.id));
    
    if(missingCards.length === 0) {
        shopCards = [];
        return;
    }

    // Mélanger et prendre 10
    const shuffled = [...missingCards].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    // Calculer le prix selon la rareté (poids)
    // Plus le poids est bas (rare), plus c'est cher.
    // Poids: 5 (Ultra Rare), 15 (Rare), 40, 80, 100 (Commun)
    shopCards = selected.map(card => {
        let price = 50; // Prix de base
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
        container.innerHTML = '<p style="text-align:center; width:100%; color:#aaa;">Aucune carte disponible ou vous avez complété ce set !</p>';
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
            <button class="btn-buy-card" onclick="buyCard('${item.id}', ${item.price})">
                ACHETER
            </button>
        `;
        
        // Désactiver si pas assez d'argent
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
        saveData();
        updateStats();
        document.getElementById('album-content').innerHTML = '';        
        // Retirer la carte du shop (visuellement et logiquement)
        shopCards = shopCards.filter(c => c.id !== cardId);
        renderShop();
        
        // Petit effet confetti localisé (optionnel, réutilise launchConfetti global)
        launchConfetti();
    }
}

function forceShopRefresh() {
    if(userMoney >= 50) {
        addMoney(-50);
        generateShopCards();
        renderShop();
    } else {
        alert("Pas assez d'argent pour actualiser !");
    }
}

// --- UTILS & CORE ---
function updateCounters() {
    document.getElementById('session-count').innerText = sessionBoosters;
    document.getElementById('total-count').innerText = totalBoosters;
}

function updateMoneyUI() {
    document.getElementById('user-money').innerText = userMoney.toLocaleString();
    const shopMoney = document.getElementById('shop-user-money');
    if(shopMoney) shopMoney.innerText = userMoney.toLocaleString();
}

function addMoney(amount) {
    userMoney += amount;
    localStorage.setItem('userMoney', userMoney);
    updateMoneyUI();
}

function prepareAndPreload() {
    preparedCards = [];
    isGodPack = Math.random() < 0.005; 

    if (isGodPack) {
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

    sessionBoosters++;
    totalBoosters++;
    localStorage.setItem('totalBoosters', totalBoosters);
    updateCounters();
    
    // Gain d'XP à l'ouverture
    gainXP(20);

    prepareAndPreload(); 
    
    const booster = document.querySelector('.booster-container');
    const flash = document.querySelector('.booster-flash');
    
    booster.style.animation = 'none'; 
    booster.classList.add('shaking');
    
    setTimeout(() => {
        booster.classList.remove('shaking');
        flash.classList.add('active');
        
        setTimeout(() => {
            performDraw(); 
        }, 300);

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

        const cardEl = document.createElement('div');
        cardEl.className = 'flip-card';
        cardEl.style.pointerEvents = 'none'; 
        
        if(isRare) cardEl.classList.add('rare-card-base');
        
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

            shopCards = shopCards.filter(c => c.id !== cardData.id);

            // Si l'overlay du shop est visible, on rafraîchit l'affichage immédiatement
            if (!document.getElementById('shop-overlay').classList.contains('hidden')) {
                renderShop();
            }

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

// --- EFFETS VISUELS ---
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
    if (card.classList.contains('flipped')) {
        card.style.transform = 'rotateY(180deg) rotateX(0deg) scale(1)';
    } else {
        card.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
    }
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

// --- NAVIGATION & UI ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    const target = document.getElementById(viewId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

function returnToBooster() {
    switchView('view-booster');
}

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
    }
}

// --- ALBUM, FILTRES & VENTE ---
function toggleAlbum() {
    const album = document.getElementById('album-overlay');
    if(album.classList.contains('hidden')) {
        renderAlbum();
        album.classList.remove('hidden');
    } else {
        album.classList.add('hidden');
    }
}

function filterAlbum(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderAlbum(true); 
}

function renderAlbum(force = false) {
    const container = document.getElementById('album-content');
    if(container.innerHTML !== '' && !force) {
        refreshAlbumStatus();
        return;
    }
    
    container.innerHTML = ''; // On vide pour reconstruire proprement
    // ... reste du code inchangé
    
    container.innerHTML = ''; 

    SETS.forEach(set => {
        const group = document.createElement('div');
        group.className = 'set-group';
        group.dataset.prefix = set.apiId;
        group.dataset.count = set.count;

        const header = document.createElement('button');
        header.className = 'set-header';
        header.innerHTML = `<span>${set.name}</span> <span class="count-badge">...</span>`;
        
        const body = document.createElement('div');
        body.className = 'set-body';
        const grid = document.createElement('div');
        grid.className = 'set-grid';

        let hasVisibleCards = false;

        const setCardsInCollection = myCollection.filter(id => id.startsWith(set.apiId));
        const counts = {};
        setCardsInCollection.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

        for (let i = 1; i <= set.count; i++) {
            const paddedId = i.toString().padStart(3, '0');
            const cardId = `${set.apiId}-${paddedId}`;
            const qty = counts[cardId] || 0;
            const isOwned = qty > 0;

            if (currentFilter === 'owned' && !isOwned) continue;
            if (currentFilter === 'missing' && isOwned) continue;
            hasVisibleCards = true;

            const cardSlot = document.createElement('div');
            cardSlot.className = `album-card ${isOwned ? 'owned' : ''}`;
            cardSlot.dataset.id = cardId;
            cardSlot.dataset.img = `img/${set.apiId}/${i}.png`;
            
            if(isOwned) {
                 const img = document.createElement('img');
                 img.loading = "lazy";
                 img.src = cardSlot.dataset.img;
                 img.classList.add('loaded');
                 cardSlot.appendChild(img);
                 
                 if(qty > 1) {
                     const badge = document.createElement('span');
                     badge.className = 'qty-badge';
                     badge.innerText = `x${qty}`;
                     cardSlot.appendChild(badge);
                 }
                 
                 cardSlot.onclick = () => openZoom(cardSlot.dataset.img);
            } else {
                 cardSlot.innerHTML = `<span class="missing-num">${paddedId}</span>`;
            }
            grid.appendChild(cardSlot);
        }

        if(!hasVisibleCards && currentFilter !== 'all') return; 

        body.appendChild(grid);
        group.appendChild(header);
        group.appendChild(body);
        container.appendChild(group);

        header.onclick = () => {
            const isOpen = body.style.maxHeight;
            document.querySelectorAll('.set-body').forEach(b => b.style.maxHeight = null);
            document.querySelectorAll('.set-header').forEach(h => h.classList.remove('active'));
            if(!isOpen) {
                header.classList.add('active');
                body.style.maxHeight = body.scrollHeight + "px";
            }
        };
    });
    refreshAlbumStatus();
}

function refreshAlbumStatus() {
    document.querySelectorAll('.set-group').forEach(group => {
        const prefix = group.dataset.prefix;
        const total = parseInt(group.dataset.count);
        const uniqueInSet = new Set(myCollection.filter(id => id.startsWith(prefix)));
        group.querySelector('.count-badge').innerText = `${uniqueInSet.size} / ${total}`;
    });
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
            
            const parts = id.split('-');
            const numStr = parts[parts.length - 1];
            const cardNum = parseInt(numStr);
            const setApiId = id.substring(0, id.length - 4);
            const setObj = SETS.find(s => s.apiId === setApiId);
            
            let price = 10; 
            
            if(setObj) {
                if (cardNum > setObj.count * 0.95) price = 500;      
                else if (cardNum > setObj.count * 0.85) price = 200; 
                else if (cardNum > setObj.count * 0.65) price = 50;  
            }

            totalGain += (duplicatesToSell * price);
        }
    });

    if (totalGain === 0) {
        alert("Vous n'avez aucun doublon à vendre pour le moment !");
        return;
    }

    if(confirm(`Voulez-vous vendre tous vos doublons pour ${totalGain} Crédits ?`)) {
        myCollection = newCollection; 
        saveData();
        addMoney(totalGain);
        renderAlbum(true); 
        updateStats();
        alert(`Vente réussie ! Vous avez gagné ${totalGain} Crédits.`);
    }
}


function saveData() { localStorage.setItem('tcgCollection', JSON.stringify(myCollection)); }

function confirmReset() {
    if(confirm("Voulez-vous vraiment tout réinitialiser (Collection, Argent, Niveau) ?")) {
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
        const duration = Math.random() * 3 + 2; 
        p.style.animationDuration = duration + 's';
        const size = Math.random() * 10 + 5;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        container.appendChild(p);
        setTimeout(() => p.remove(), duration * 1000);
    }

}
