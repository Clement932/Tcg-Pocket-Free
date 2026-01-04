// --- DONNÉES DE L'AVENTURE ---

const GYMS = [
    { 
        id: 1, name: "ARGENTA", master: "Pierre", icon: "🪨",
        quote: "Mes Pokémon sont durs comme la roche !",
        req: { level: 2, cards: 10 }, // Niveau 2 + 10 cartes totales
        reward: { id: 'badge_roche', text: "Badge Roche (XP +10% à l'ouverture)" }
    },
    { 
        id: 2, name: "AZURIA", master: "Ondine", icon: "💧",
        quote: "L'eau coule doucement mais brise la pierre.",
        req: { level: 5, unique: 30 }, // Niveau 5 + 30 cartes uniques
        reward: { id: 'badge_cascade', text: "Badge Cascade (Shop Refresh -10s)" }
    },
    { 
        id: 3, name: "CARMIN", master: "Major Bob", icon: "⚡",
        quote: "Garde-à-vous ! La foudre va tomber !",
        req: { level: 10, power: 5000 }, // Score de puissance (basé sur la rareté)
        reward: { id: 'badge_foudre', text: "Badge Foudre (Prix Booster -10%)" }
    },
    {
        id: 8, name: "LIGUE POKEMON", master: "Peter", icon: "👑",
        quote: "Seuls les Maîtres peuvent passer.",
        req: { level: 50, godPack: 1 }, // Avoir eu au moins 1 God Pack
        reward: { id: 'badge_maitre', text: "TITRE DE MAÎTRE (Accès zone VIP)" }
    }
];

// --- CHARGEMENT DES DONNÉES PRINCIPALES ---
// On lit les mêmes clés que le script principal
let userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
let myCollection = JSON.parse(localStorage.getItem('tcgCollection')) || [];
let totalGodPacks = parseInt(localStorage.getItem('totalGodPacks')) || 0;
let earnedBadges = JSON.parse(localStorage.getItem('adventureBadges')) || [];

// Calcul de la puissance (Power)
// Formule simple : Nombre de cartes * Multiplicateur (juste pour l'exemple)
let collectionPower = myCollection.length * 10; 

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    document.getElementById('collection-power').innerText = collectionPower;
    renderBadges();
});

function initMap() {
    GYMS.forEach(gym => {
        const el = document.getElementById(`gym-${gym.id}`);
        if(!el) return;

        // Vérifier si le badge précédent est acquis (pour débloquer le suivant)
        // Simplification : Gym 1 toujours ouvert. Gym 2 nécessite Badge 1...
        const prevBadgeId = gym.id === 1 ? null : GYMS.find(g => g.id === gym.id - 1)?.reward.id;
        const isUnlocked = gym.id === 1 || (prevBadgeId && earnedBadges.includes(prevBadgeId));
        
        if(isUnlocked) {
            el.classList.remove('locked');
        } else {
            el.classList.add('locked');
        }

        if(earnedBadges.includes(gym.reward.id)) {
            el.classList.add('completed');
            el.querySelector('.gym-name').innerText += " (Vaincu)";
        }
    });
}

let currentGym = null;

function openGym(id) {
    const el = document.getElementById(`gym-${id}`);
    if(el.classList.contains('locked')) {
        alert("Cette arène est verrouillée ! Battez la précédente d'abord.");
        return;
    }

    currentGym = GYMS.find(g => g.id === id);
    if(!currentGym) return; // Gyms 4,5,6 pas encore définis dans l'array

    document.getElementById('modal-gym-name').innerText = `ARÈNE D'${currentGym.name}`;
    document.getElementById('modal-master-name').innerText = currentGym.master;
    document.getElementById('modal-master-quote').innerText = `"${currentGym.quote}"`;
    document.getElementById('modal-gym-avatar').innerText = currentGym.icon;
    document.getElementById('modal-reward-text').innerText = currentGym.reward.text;
    document.getElementById('challenge-msg').innerText = "";

    // Génération de la liste des prérequis
    const list = document.getElementById('modal-req-list');
    list.innerHTML = '';
    let canFight = true;

    // Check Level
    if(currentGym.req.level) {
        const li = document.createElement('li');
        const ok = userLevel >= currentGym.req.level;
        li.innerHTML = `Niveau Joueur ${currentGym.req.level} ${ok ? '✅' : '❌'}`;
        li.className = ok ? 'ok' : 'nok';
        list.appendChild(li);
        if(!ok) canFight = false;
    }

    // Check Cards count
    if(currentGym.req.cards) {
        const li = document.createElement('li');
        const count = myCollection.length;
        const ok = count >= currentGym.req.cards;
        li.innerHTML = `Posséder ${currentGym.req.cards} cartes (Actuel: ${count}) ${ok ? '✅' : '❌'}`;
        li.className = ok ? 'ok' : 'nok';
        list.appendChild(li);
        if(!ok) canFight = false;
    }
    
    // Check Unique
    if(currentGym.req.unique) {
        const li = document.createElement('li');
        const unique = new Set(myCollection).size;
        const ok = unique >= currentGym.req.unique;
        li.innerHTML = `Posséder ${currentGym.req.unique} cartes uniques (Actuel: ${unique}) ${ok ? '✅' : '❌'}`;
        li.className = ok ? 'ok' : 'nok';
        list.appendChild(li);
        if(!ok) canFight = false;
    }

    // Bouton
    const btn = document.getElementById('btn-challenge');
    if(earnedBadges.includes(currentGym.reward.id)) {
        btn.disabled = true;
        btn.innerText = "DÉJÀ VAINCU";
        btn.style.background = "#10b981";
        btn.style.color = "black";
    } else if(canFight) {
        btn.disabled = false;
        btn.innerText = "DÉFIER LE CHAMPION";
        btn.style.background = "white";
    } else {
        btn.disabled = true;
        btn.innerText = "PRÉREQUIS NON ATTEINTS";
        btn.style.background = "#333";
        btn.style.color = "#555";
    }

    document.getElementById('gym-overlay').classList.remove('hidden');
}

function closeGym() {
    document.getElementById('gym-overlay').classList.add('hidden');
}
// DANS ADVENTURE.JS

function startChallenge() {
    // 1. On prépare les données à envoyer au Colisée
    const params = new URLSearchParams({
        mode: 'gym',                                // Dit au Colisée que c'est un combat d'arène
        master: currentGym.master,                  // Nom du champion (ex: Pierre)
        badgeId: currentGym.reward.id,              // ID du badge à débloquer (ex: badge_roche)
        difficulty: currentGym.id                   // Difficulté (1 = Facile, 8 = Dur)
    });

    // 2. On ouvre le Colisée dans un nouvel onglet avec ces paramètres
    window.open(`colosseum.html?${params.toString()}`, '_blank');
    
    // 3. On ferme la modale d'arène sur la carte
    closeGym();
}

// AJOUTE CECI JUSTE APRÈS LA FONCTION startChallenge (ou à la fin du fichier)
// Cela permet de rafraichir la carte automatiquement quand tu gagnes le badge dans l'autre onglet !
window.addEventListener('storage', (e) => {
    if(e.key === 'adventureBadges') {
        // On recharge la liste des badges
        earnedBadges = JSON.parse(localStorage.getItem('adventureBadges')) || [];
        // On met à jour l'affichage des badges en haut
        renderBadges();
        // On met à jour les cadenas sur la carte
        initMap(); 
        console.log("Badge détecté ! Carte mise à jour.");
    }
});

function renderBadges() {
    const container = document.getElementById('badges-container');
    container.innerHTML = '';
    earnedBadges.forEach(badgeId => {
        const div = document.createElement('div');
        div.className = 'badge-slot earned';
        div.innerText = '🏅';
        div.title = badgeId;
        container.appendChild(div);
    });
}