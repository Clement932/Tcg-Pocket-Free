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

// --- AJOUT POUR LE MODE AVENTURE ---
const urlParams = new URLSearchParams(window.location.search);
const gameMode = urlParams.get('mode'); // Sera 'gym' si on vient de l'aventure
const gymMaster = urlParams.get('master');
const gymBadgeId = urlParams.get('badgeId');
const gymDifficulty = parseInt(urlParams.get('difficulty')) || 1;

document.addEventListener('DOMContentLoaded', () => {
    updateLeagueUI();
    loadCollectionPicker();
    
    // SI C'EST UN COMBAT D'ARÈNE : On modifie l'interface
    if (gameMode === 'gym') {
        // Change le titre
        document.querySelector('.header-left h1').innerHTML = `DÉFI D'ARÈNE : <span class="text-danger">${gymMaster.toUpperCase()}</span>`;
        document.getElementById('current-league').style.display = 'none'; // Cache la ligue
        
        // Change le bouton quitter pour qu'il ferme l'onglet
        const exitBtn = document.querySelector('.btn-exit');
        exitBtn.innerText = "ABANDONNER";
        exitBtn.onclick = () => window.close();
    }
});

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

    // SI C'EST UN COMBAT D'ARÈNE
    if (gameMode === 'gym') {
        // Change le titre
        document.querySelector('.header-left h1').innerHTML = `DÉFI D'ARÈNE : <span class="text-danger">${gymMaster.toUpperCase()}</span>`;
        document.getElementById('current-league').style.display = 'none'; // Cache la ligue
        
        // Change le bouton quitter pour qu'il ferme l'onglet
        const exitBtn = document.querySelector('.btn-exit');
        exitBtn.innerText = "ABANDONNER";
        exitBtn.onclick = () => window.close();
    }
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
    enemyTeam = [];
    
    // CONFIGURATION DE LA DIFFICULTÉ SELON L'ARÈNE
    // Plus le numéro d'arène est haut, plus les cartes sont fortes (poids faible = rare)
    let minRarity = 100; // Cartes communes par défaut
    let maxRarity = 1;   // Cartes God Tier
    
    // Arène 1 (Pierre) : Cartes basiques
    // Arène 8 (Ligue) : Cartes Ultra Rares garanties
    
    for(let i=0; i<3; i++) {
        const randomSet = ENEMY_SETS[Math.floor(Math.random() * ENEMY_SETS.length)];
        let randomNum = Math.floor(Math.random() * randomSet.count) + 1;
        
        // PETITE TRICHE POUR LES CHAMPIONS :
        // Si c'est une arène difficile, on force des numéros élevés (souvent plus rares)
        if(gameMode === 'gym') {
            if(gymDifficulty >= 3) randomNum = Math.floor(Math.random() * (randomSet.count / 2)) + (randomSet.count / 2); // Moitié supérieure
            if(gymDifficulty >= 6) randomNum = Math.floor(Math.random() * 20) + (randomSet.count - 20); // Top 20 cartes du set
        }

        let cardStats = getCardStats(`${randomSet.apiId}-${randomNum}`);

        // BOOST DES STATS POUR LES CHAMPIONS (HP/ATK)
        // Arène 1 = x1.0, Arène 8 = x1.4
        if (gameMode === 'gym') {
            const multiplier = 1 + (gymDifficulty * 0.05); 
            cardStats.hp = Math.floor(cardStats.hp * multiplier);
            cardStats.maxHp = cardStats.hp; // Mettre à jour maxHp aussi
            cardStats.atk = Math.floor(cardStats.atk * multiplier);
        }

        enemyTeam.push(cardStats);
    }
    
    // (Le reste ne change pas)
    let activeUserTeam = userTeam.map(id => getCardStats(id));
    document.getElementById('view-lobby').classList.add('hidden');
    document.getElementById('view-battle').classList.remove('hidden');
    runBattleLoop(activeUserTeam, enemyTeam);
}

function runBattleLoop(pTeam, eTeam) {
    let pIdx = 0;
    let eIdx = 0;
    
    // Mise à jour initiale
    updateField(pTeam[pIdx], eTeam[eIdx], pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
    
    const log = document.getElementById('battle-log');
    
    battleInterval = setInterval(() => {
        // On récupère les combattants ACTUELS (au début du tour)
        // Attention : on utilise les index pIdx/eIdx pour être sûr d'avoir les bons
        const pCard = pTeam[pIdx];
        const eCard = eTeam[eIdx];
        
        // SÉCURITÉ : Si l'un des deux n'existe plus (combat fini), on arrête tout de suite
        if(!pCard || !eCard) {
            clearInterval(battleInterval);
            endBattle(pTeam.length > 0 && pCard && pCard.hp > 0);
            return;
        }

        // --- 1. TOUR DU JOUEUR ---
        animateAttack('player');
        setTimeout(() => {
            // Recalcul de sécurité au cas où le combat soit fini pendant l'anim
            if (!pCard || !eCard) return;

            const dmg = Math.floor(pCard.atk * (0.8 + Math.random() * 0.4));
            eCard.hp -= dmg;
            showDamage('enemy', dmg);
            
            if(eCard.hp <= 0) {
                // --- L'ENNEMI EST K.O ---
                eCard.hp = 0;
                log.innerText = "L'ennemi est K.O !";
                
                const enemyEl = document.getElementById('enemy-fighter');
                
                // 1. Disparition
                enemyEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                enemyEl.style.opacity = "0";
                enemyEl.style.transform = "scale(0.8)";
                
                // 2. Attente puis Changement
                setTimeout(() => {
                    eIdx++; // On passe officiellement à l'ennemi suivant
                    
                    // On met à jour l'affichage avec le NOUVEL index
                    updateField(pTeam[pIdx], eTeam[eIdx], pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
                    
                    // Si un ennemi existe encore, on le fait réapparaître
                    if(eTeam[eIdx]) {
                        enemyEl.style.opacity = "1";
                        enemyEl.style.transform = "scale(1)";
                    } else {
                        // Fin du combat gagné (sera géré au prochain tour de boucle ou fin immédiate)
                        clearInterval(battleInterval);
                        setTimeout(() => endBattle(true), 500);
                    }
                }, 400); // Doit correspondre au temps de transition (0.4s)

            } else {
                // Ennemi vivant : mise à jour simple barre de vie
                updateField(pCard, eCard, pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
            }
        }, 300);

        // --- 2. TOUR DE L'ENNEMI (Seulement s'il n'est pas mort juste avant) ---
        // On met un délai pour que l'attaque ennemie ne parte pas si il vient de mourir
        setTimeout(() => {
            // On revérifie si l'ennemi actuel est vivant (hp > 0) ET si le joueur est toujours là
            // Important : on réutilise eTeam[eIdx] pour vérifier l'état actuel après l'attaque du joueur
            const currentEnemy = eTeam[eIdx];
            const currentPlayer = pTeam[pIdx];

            if(currentEnemy && currentEnemy.hp > 0 && currentPlayer) {
                
                animateAttack('enemy');
                
                setTimeout(() => {
                    const dmg = Math.floor(currentEnemy.atk * (0.8 + Math.random() * 0.4));
                    currentPlayer.hp -= dmg;
                    showDamage('player', dmg);
                    
                    if(currentPlayer.hp <= 0) {
                        // --- VOTRE CARTE EST K.O ---
                        currentPlayer.hp = 0;
                        log.innerText = "Votre carte est K.O !";
                        
                        const playerEl = document.getElementById('player-fighter');

                        // 1. Disparition
                        playerEl.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                        playerEl.style.opacity = "0";
                        playerEl.style.transform = "scale(0.8)";

                        // 2. Attente puis Changement
                        setTimeout(() => {
                            pIdx++; // On passe à votre carte suivante

                            // Mise à jour avec le NOUVEL index
                            updateField(pTeam[pIdx], eTeam[eIdx], pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));

                            if(pTeam[pIdx]) {
                                playerEl.style.opacity = "1";
                                playerEl.style.transform = "scale(1)";
                            } else {
                                // Fin du combat perdu
                                clearInterval(battleInterval);
                                setTimeout(() => endBattle(false), 500);
                            }
                        }, 400);

                    } else {
                        // Joueur vivant : mise à jour simple
                        updateField(currentPlayer, currentEnemy, pTeam.slice(pIdx+1), eTeam.slice(eIdx+1));
                    }
                }, 300);
            }
        }, 1200); // L'attaque ennemie part 1.2s après le début du tour

    }, 2800); // On allonge un peu le tour (2.8s) pour laisser le temps aux animations
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
        
        // --- LOGIQUE SPÉCIALE ARÈNE ---
        if (gameMode === 'gym') {
            // 1. Récupérer les badges actuels
            let currentBadges = JSON.parse(localStorage.getItem('adventureBadges')) || [];
            
            // 2. Ajouter le nouveau si on ne l'a pas déjà
            if (!currentBadges.includes(gymBadgeId)) {
                currentBadges.push(gymBadgeId);
                localStorage.setItem('adventureBadges', JSON.stringify(currentBadges));
                
                rewards.innerHTML = `
                    <p style="font-size: 24px;">🏅 BADGE OBTENU !</p>
                    <p style="color:var(--text-muted)">Le champion ${gymMaster} vous reconnait.</p>
                `;
            } else {
                rewards.innerHTML = `<p>Vous aviez déjà ce badge, mais belle victoire !</p>`;
            }
            
            // Bouton pour fermer la fenêtre et revenir à l'aventure
            const btn = document.querySelector('.result-box button');
            btn.innerText = "RETOURNER À L'AVENTURE";
            btn.onclick = () => window.close();
            
        } else {
            // --- LOGIQUE CLASSIQUE (COLISÉE) ---
            let money = 150 + (currentLeagueIdx * 50);
            let xp = 200;
            localStorage.setItem('userMoney', (parseInt(localStorage.getItem('userMoney'))||0) + money);
            rewards.innerHTML = `<p>+${xp} XP</p><p>+${money} Crédits</p>`;
            
            // Remettre le bouton normal
            const btn = document.querySelector('.result-box button');
            btn.innerText = "CONTINUER";
            btn.onclick = () => returnToLobby();
        }
        
    } else {
        title.innerText = "DÉFAITE...";
        title.style.color = "#ef4444";
        rewards.innerHTML = `<p>Améliorez votre deck et réessayez.</p>`;
        
        if (gameMode === 'gym') {
             const btn = document.querySelector('.result-box button');
             btn.innerText = "FUIR L'ARÈNE";
             btn.onclick = () => window.close();
        }
    }
}

function returnToLobby() {
    location.reload(); // Simple reload pour reset l'état
}