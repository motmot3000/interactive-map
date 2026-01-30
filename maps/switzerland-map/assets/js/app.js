
// ==================== VARIABLES D'ÉTAT ====================
let randCanton = null;
let answer = null;
let quizLaunched = false;
let score = 0;
let totalAttempts = 0;
let consecutiveScore = 0;

// ==================== SÉLECTEURS DOM ====================
const nomElement = document.getElementById("nom");
const congrats = document.getElementById("congrats");
const loser = document.getElementById("loser");
const btnQuiz = document.getElementById("btn-quiz");
const leQuiz = document.getElementById("le-quiz");
const questionElement = document.getElementById("question");
const trueAnswerElement = document.getElementById("true-answer");
const mapSection = document.querySelector(".map-section");
const infoLabel = document.querySelector(".text-selection");
const consecutiveScoreElement = document.getElementById("consecutive-score");

// Sélecteurs pour les informations du canton
const fullNameElement = document.getElementById("full-name");
const capitalElement = document.getElementById("capital");
const populationElement = document.getElementById("population");
const areaElement = document.getElementById("area");
const languagesElement = document.getElementById("languages");
const flagElement = document.getElementById("flag");

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
});

function initializeApp() {
    // Masquer les messages de résultat au démarrage
    congrats.classList.remove("active");
    loser.classList.remove("active");
    leQuiz.classList.remove("active");

    // Ajouter les event listeners à tous les cantons
    Object.keys(cantonMap).forEach(cantonId => {
        const cantonElement = document.getElementById(cantonId);
        if (cantonElement) {
            cantonElement.addEventListener("click", function() {
                handleCantonClick(cantonId);
            });
            cantonElement.style.cursor = "pointer";
        }
    });

    // Bouton de lancement du quiz
    btnQuiz.addEventListener("click", launchQuiz);
}

// ==================== GESTION DES CLICS ====================
function handleCantonClick(cantonId) {
    const cantonName = cantonMap[cantonId];
    
    // Extraire le code du canton (AG, BE, etc.)
    const cantonCode = cantonId.replace("CH-", "");
    
    // Si le quiz n'est PAS lancé (2ème clic après une tentative), réinitialiser
    if (!quizLaunched) {
        resetVisualState();
    }
    
    // Afficher le nom du canton
    displayCanton(cantonName);
    
    // Afficher les informations du canton
    displayCantonInfo(cantonCode);
    
    answer = cantonName;

    // Vérifier si la réponse est correcte si le quiz est lancé
    if (quizLaunched) {
        totalAttempts++;
        checkAnswer(cantonName);
    }
}

function displayCantonInfo(cantonCode) {
    const data = cantonData[cantonCode];
    
    if (data) {
        fullNameElement.textContent = data.fullName;
        capitalElement.textContent = data.chefLieu;
        populationElement.textContent = data.population;
        areaElement.textContent = data.area;
        languagesElement.textContent = data.languages;
        flagElement.src = data.flag;
        flagElement.alt = `Drapeau de ${data.fullName}`;
    }
}

function displayCanton(name) {
    nomElement.textContent = name;
    nomElement.style.animation = "none";
    setTimeout(() => {
        nomElement.style.animation = "slideIn 0.3s ease";
    }, 10);
}

// ==================== SYSTÈME DE QUIZ ====================
function launchQuiz() {
    quizLaunched = true;
    randCanton = cantons[Math.floor(Math.random() * cantons.length)];
    
    // Réinitialiser l'apparence pour la nouvelle question
    resetVisualState();
    
    questionElement.textContent = randCanton;
    
    // Afficher le conteneur du quiz
    leQuiz.classList.add("active");
    
    // Masquer les anciens messages
    congrats.classList.remove("active");
    loser.classList.remove("active");

    // Animation du bouton
    btnQuiz.style.transform = "scale(0.98)";
    setTimeout(() => {
        btnQuiz.style.transform = "scale(1)";
    }, 100);
}

function checkAnswer(userAnswer) {
    const isCorrect = userAnswer === randCanton;

    if (isCorrect) {
        showSuccess();
        score++;
        consecutiveScore++;
        updateConsecutiveScore();
    } else {
        showError(userAnswer);
        consecutiveScore = 0;
        updateConsecutiveScore();
    }
    
    // Désactiver le quiz après cette tentative
    quizLaunched = false;

    // Masquer les messages après 2 secondes
    setTimeout(() => {
        congrats.classList.remove("active");
        loser.classList.remove("active");
    }, 2000);
}

function showSuccess() {
    congrats.classList.add("active");
    loser.classList.remove("active");
    
    // Masquer le quiz
    leQuiz.classList.remove("active");
    
    // 🎮 ANIMATION +1 JEU VIDÉO
    triggerPlusOneAnimation();
    
    // Animation de la map-section en vert
    mapSection.classList.remove("error-flash");
    mapSection.classList.add("success-flash");
    
    // Changer le message et le style
    if (infoLabel) {
        infoLabel.textContent = "✅ Bravo! Tu as trouvé :";
        infoLabel.classList.remove("error-text");
        infoLabel.classList.add("success-text");
    }
    
    nomElement.classList.remove("error-badge");
    nomElement.classList.add("success-badge");
    
    // Retirer seulement les animations flash après leur durée
    setTimeout(() => {
        mapSection.classList.remove("success-flash");
    }, 1200);
    
    console.log("✅ Bravo! Score: " + score + "/" + totalAttempts);
}

function showError(wrongAnswer) {
    loser.classList.add("active");
    congrats.classList.remove("active");
    
    // Masquer le quiz
    leQuiz.classList.remove("active");
    
    // Animation de la map-section en rouge
    mapSection.classList.remove("success-flash");
    mapSection.classList.add("error-flash");
    
    // Changer le message et le style
    if (infoLabel) {
        infoLabel.textContent = "❌ Non, tu as sélectionné :";
        infoLabel.classList.remove("success-text");
        infoLabel.classList.add("error-text");
    }
    
    nomElement.classList.remove("success-badge");
    nomElement.classList.add("error-badge");
    
    // Retirer seulement les animations flash après leur durée
    setTimeout(() => {
        mapSection.classList.remove("error-flash");
    }, 1200);
    
    trueAnswerElement.textContent = wrongAnswer;
    console.log("❌ Faux! Vous avez cliqué sur: " + wrongAnswer);
}

// ==================== UTILITAIRES ====================
function resetVisualState() {
    // Réinitialiser les classes et textes de l'info-section
    infoLabel.textContent = "Canton sélectionné :";
    infoLabel.classList.remove("success-text", "error-text");
    
    // Réinitialiser le badge du canton au texte par défaut
    nomElement.textContent = "Cliquez sur un canton";
    nomElement.classList.remove("success-badge", "error-badge");
    
    // Retirer les animations en cours
    mapSection.classList.remove("success-flash", "error-flash");
    
    // Remettre le texte original
    if (infoLabel) {
        infoLabel.textContent = "Canton sélectionné:";
        infoLabel.classList.remove("success-text", "error-text");
    }
}

function getCantonNameById(id) {
    return cantonMap[id] || "Canton inconnu";
}

function resetQuiz() {
    quizLaunched = false;
    randCanton = null;
    answer = null;
    
    leQuiz.classList.remove("active");
    congrats.classList.remove("active");
    loser.classList.remove("active");
    
    nomElement.textContent = "Cliquez sur un canton";
}

// Réinitialiser avec double-clic sur le titre
document.querySelector("header")?.addEventListener("dblclick", resetQuiz);

// Afficher le score avec la touche 's'
document.addEventListener("keydown", function(event) {
    if (event.key === "s" || event.key === "S") {
        const percentage = totalAttempts > 0 ? Math.round(score/totalAttempts*100) : 0;
        console.log(`📊 Score actuel: ${score}/${totalAttempts} (${percentage}%)`);
        console.log(`🔥 Bonnes réponses consécutives: ${consecutiveScore}`);
    }
});

// Fonction pour mettre à jour l'affichage du score consécutif
function updateConsecutiveScore() {
    if (consecutiveScoreElement) {
        consecutiveScoreElement.textContent = consecutiveScore;
    }
}

// ==================== ANIMATION +1 JEU VIDÉO ====================
function triggerPlusOneAnimation() {
    const container = document.getElementById('plus-one-container');
    if (!container) return;
    
    // Créer l'élément +1
    const plusOne = document.createElement('div');
    plusOne.className = 'plus-one-animation';
    
    // Variantes de couleurs aléatoires
    const variants = ['', 'variant-1', 'variant-2', 'variant-3'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    if (randomVariant) {
        plusOne.classList.add(randomVariant);
    }
    
    plusOne.textContent = '+1';
    
    // Position aléatoire sur la largeur de l'écran (zone centrale)
    const randomX = 30 + Math.random() * 40; // Entre 30% et 70%
    const randomY = 40 + Math.random() * 20; // Entre 40% et 60%
    
    plusOne.style.left = `${randomX}%`;
    plusOne.style.top = `${randomY}%`;
    
    // Ajouter au container
    container.appendChild(plusOne);
    
    // Supprimer après l'animation (1.5s)
    setTimeout(() => {
        plusOne.remove();
    }, 1500);
}

