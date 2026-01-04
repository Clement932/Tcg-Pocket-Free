// --- CONFIGURATION ---
const LEAGUES = ["BRONZE", "ARGENT", "OR", "DIAMANT", "LÉGENDE"];
let currentLeagueIdx = parseInt(localStorage.getItem('arenaLeague')) || 0;

// NOUVEAU : Liste des extensions pour l'adversaire
const ENEMY_SETS = [
    { apiId: 'puissance-genetique', count: 286 },
    { apiId: 'l-ile-fabuleuse', count: 86 },
    { apiId: 'choc-spatio-temporel', count: 207 },
    { apiId: 'lumiere-triomphale', count: 96 },
    { apiId: 'rejouissances-rayonnantes', count: 111 },
    { apiId: 'gardiens-astraux', count: 239 },
    { apiId: 'crise-interdimensionnelle', count: 103 },
    { apiId: 'la-clairiere-d-evoli', count: 107 },
    { apiId: 'sagesse-entre-ciel-et-mer', count: 241 },
    { apiId: 'source-secrète', count: 105 },
    { apiId: 'booster-de-luxe-ex', count: 379 },
    { apiId: 'mega-ascension', count: 331 },
    { apiId: 'embrasement-ecarlate', count: 103 }
];

// --- STATE ---
let myCollection = JSON.parse(localStorage.getItem('tcgCollection')) || [];
let userTeam = [null, null, null];
let enemyTeam = [];
let battleInterval;

// On récupère les stats des cartes depuis le script principal (simulation)
// Comme on est dans un fichier séparé, on doit reconstruire une mini DB ou importer
// Pour simplifier, on reconstruit la logique de stats basée sur l'ID et une "fausse" rareté simulée
function getCardStats(cardId) {
    // Exemple ID: puissance-genetique-005
    const parts = cardId.split('-');
    const num = parseInt(parts[parts.length-1]);
    
    // Simulation de rareté basée sur le numéro (comme dans le script principal)
    // Plus le numéro est élevé dans le set, plus c'est rare (souvent)
    // ICI : On va utiliser un hash simple pour déterminer la puissance
    let seed = cardId.charCodeAt(0) + cardId.charCodeAt(cardId.length-1) + num;
    let rarityTier = 1; // 1 (Common) à 5 (God)
    
    if (num % 10 === 0) rarityTier = 3;
    if (num > 200) rarityTier = 4;
    
    // Stats de base
    let hp = 500 + (rarityTier * 200) + (num * 2);
    let atk = 50 + (rarityTier * 30) + (num / 2);
    
    return {
        id: cardId,
        img: `img/${parts.slice(0, -1).join('-')}/${num}.png`,
        hp: Math.floor(hp),
        maxHp: Math.floor(hp),
        atk: Math.floor(atk),
        name: `M-No.${num}`
    };
}

document.addEventListener('DOMContentLoaded', () => {
    updateLeagueUI();
    loadCollectionPicker();
});

// --- LOBBY LOGIC ---
function updateLeagueUI() {
    document.getElementById('current-league').innerText = LEAGUES[currentLeagueIdx];
}

function loadCollectionPicker() {
    const grid = document.getElementById('picker-grid');
    grid.innerHTML = '';
    
    const uniqueIds = [...new Set(myCollection)];
    
    if(uniqueIds.length === 0) {
        grid.innerHTML = "<p>Collection vide. Ouvrez des boosters !</p>";
        return;
    }

    uniqueIds.slice(0, 100).forEach(id => {
        const div = document.createElement('div');
        div.className = 'picker-card';
        div.id = `pick-${id}`;
        
        const stats = getCardStats(id);
        // AJOUT DE L'ATTRIBUT ONERROR ICI vvv
        div.innerHTML = `<img src="${stats.img}" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'">`;
        
        div.onclick = () => addToTeam(id);
        grid.appendChild(div);
    });
}

let selectedSlotIdx = 0;

function selectSlot(idx) {
    selectedSlotIdx = idx;
    document.querySelectorAll('.team-slot').forEach((el, i) => {
        el.style.borderColor = i === idx ? '#fff' : 'rgba(255,255,255,0.3)';
    });
}

function addToTeam(cardId) {
    // Vérifier si déjà dans l'équipe
    if(userTeam.includes(cardId)) return;
    
    userTeam[selectedSlotIdx] = cardId;
    renderTeamSlots();
    
    // Auto-select next slot
    if(selectedSlotIdx < 2) selectSlot(selectedSlotIdx + 1);
    
    checkReady();
}

function renderTeamSlots() {
    let totalPower = 0;
    userTeam.forEach((id, idx) => {
        const el = document.getElementById(`slot-${idx}`);
        if(id) {
            const stats = getCardStats(id);
            // AJOUT DE L'ATTRIBUT ONERROR ICI vvv
            el.innerHTML = `<img src="${stats.img}" onerror="this.src='https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'">`;
            el.classList.add('filled');
            totalPower += (stats.hp + stats.atk);
        } else {
            el.innerHTML = `<span>+</span>`;
            el.classList.remove('filled');
        }
    });
    document.getElementById('team-power').innerText = totalPower;
}
function checkReady() {
    const btn = document.getElementById('btn-start-fight');
    if(userTeam.every(x => x !== null)) {
        btn.disabled = false;
        btn.classList.remove('disabled');
    }
}

// --- COMBAT LOGIC ---
function startCombat() {
    // Générer équipe ennemie
    enemyTeam = [];
    
    for(let i=0; i<3; i++) {
        // 1. Choisir une extension au hasard
        const randomSet = ENEMY_SETS[Math.floor(Math.random() * ENEMY_SETS.length)];
        
        // 2. Choisir un numéro de carte au hasard dans cette extension
        // (Math.random() * count) + 1 donne un nombre entre 1 et le max du set
        const randomNum = Math.floor(Math.random() * randomSet.count) + 1;
        
        // 3. Créer la carte avec le bon ID (ex: choc-spatio-temporel-42)
        // Le système getCardStats s'occupera de trouver l'image correspondante
        enemyTeam.push(getCardStats(`${randomSet.apiId}-${randomNum}`));
    }
    
    // Convertir équipe joueur en objets stats
    let activeUserTeam = userTeam.map(id => getCardStats(id));
    
    document.getElementById('view-lobby').classList.add('hidden');
    document.getElementById('view-battle').classList.remove('hidden');
    
    runBattleLoop(activeUserTeam, enemyTeam);
}

function runBattleLoop(pTeam, eTeam) {
    let pIdx = 0;
    let eIdx = 0;
    
    updateField(pTeam[pIdx], eTeam[eIdx], pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
    
    const log = document.getElementById('battle-log');
    
    battleInterval = setInterval(() => {
        const pCard = pTeam[pIdx];
        const eCard = eTeam[eIdx];
        
        if(!pCard || !eCard) { // Fin du combat
            clearInterval(battleInterval);
            endBattle(pTeam.length > 0 && pTeam[pIdx].hp > 0);
            return;
        }

        // --- TOUR DU JOUEUR ---
        animateAttack('player');
        setTimeout(() => {
            const dmg = Math.floor(pCard.atk * (0.8 + Math.random() * 0.4));
            eCard.hp -= dmg;
            showDamage('enemy', dmg);
            
            if(eCard.hp <= 0) {
                eCard.hp = 0;
                log.innerText = "L'ennemi est K.O !";
                eIdx++;
                updateField(pCard, eTeam[eIdx], pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
            } else {
                updateField(pCard, eCard, pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
            }
        }, 300);

        // --- TOUR DE L'ENNEMI (Si vivant) ---
        if(eCard.hp > 0) {
            setTimeout(() => {
                animateAttack('enemy');
                setTimeout(() => {
                    const dmg = Math.floor(eCard.atk * (0.8 + Math.random() * 0.4));
                    pCard.hp -= dmg;
                    showDamage('player', dmg);
                    
                    if(pCard.hp <= 0) {
                        pCard.hp = 0;
                        log.innerText = "Votre carte est K.O !";
                        pIdx++;
                        updateField(pTeam[pIdx], eCard, pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
                    } else {
                        updateField(pCard, eCard, pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
                    }
                }, 300);
            }, 1000);
        }

    }, 2500); // Tour toutes les 2.5s
}

function updateField(pActive, eActive, pReserve, eReserve) {
    // Player Active
    const pImg = document.getElementById('player-img');
    const pHp = document.getElementById('player-hp');
    if(pActive) {
        pImg.src = pActive.img;
        const pct = (pActive.hp / pActive.maxHp) * 100;
        pHp.style.width = `${pct}%`;
    } else {
        pImg.style.opacity = 0; // Mort
    }
    
    // Enemy Active
    const eImg = document.getElementById('enemy-img');
    const eHp = document.getElementById('enemy-hp');
    if(eActive) {
        eImg.src = eActive.img;
        const pct = (eActive.hp / eActive.maxHp) * 100;
        eHp.style.width = `${pct}%`;
    } else {
        eImg.style.opacity = 0;
    }
    
    // Reserves
    const pResDiv = document.getElementById('player-reserve');
    pResDiv.innerHTML = pReserve.map(c => `<div class="reserve-card"><img src="${c.img}"></div>`).join('');
    
    const eResDiv = document.getElementById('enemy-reserve');
    eResDiv.innerHTML = eReserve.map(c => `<div class="reserve-card"><img src="${c.img}"></div>`).join('');
}

function animateAttack(who) {
    const el = document.getElementById(who === 'player' ? 'player-fighter' : 'enemy-fighter');
    el.classList.add('attack-anim');
    setTimeout(() => el.classList.remove('attack-anim'), 300);
}

function showDamage(target, amount) {
    const el = document.getElementById(target === 'enemy' ? 'enemy-fighter' : 'player-fighter');
    const txt = document.getElementById(target === 'enemy' ? 'enemy-dmg' : 'player-dmg');
    
    el.classList.add('hit-anim');
    txt.innerText = `-${amount}`;
    txt.classList.remove('pop-damage');
    void txt.offsetWidth; // Trigger reflow
    txt.classList.add('pop-damage');
    
    setTimeout(() => el.classList.remove('hit-anim'), 300);
}

function endBattle(victory) {
    const overlay = document.getElementById('result-overlay');
    const title = document.getElementById('result-title');
    const rewards = document.getElementById('result-rewards');
    
    overlay.classList.remove('hidden');
    
    if(victory) {
        title.innerText = "VICTOIRE !";
        title.style.color = "#10b981";
        
        // REWARDS
        let money = 150 + (currentLeagueIdx * 50);
        let xp = 200;
        
        // Update LocalStorage (Money/XP)
        let currentMoney = parseInt(localStorage.getItem('userMoney')) || 0;
        localStorage.setItem('userMoney', currentMoney + money);
        
        let currentXP = parseInt(localStorage.getItem('userXP')) || 0;
        localStorage.setItem('userXP', currentXP + xp);
        
        rewards.innerHTML = `<p>+${xp} XP</p><p>+${money} Crédits</p>`;
        
        // Rank Up Chance
        if(currentLeagueIdx < LEAGUES.length - 1) {
            currentLeagueIdx++;
            localStorage.setItem('arenaLeague', currentLeagueIdx);
            rewards.innerHTML += `<p style="color:gold; font-weight:bold; margin-top:10px;">PROMOTION : ${LEAGUES[currentLeagueIdx]} !</p>`;
        }
        
    } else {
        title.innerText = "DÉFAITE...";
        title.style.color = "#ef4444";
        rewards.innerHTML = `<p>Entraînez-vous et réessayez.</p>`;
    }
}

function returnToLobby() {
    location.reload(); // Simple reload pour reset l'état
}