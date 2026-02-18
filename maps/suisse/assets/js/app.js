// ==================== VARIABLES D'ÉTAT ====================
let quizLaunched = false;
let randCanton = null;
let answer = null;
let consecutiveScore = 0;
let modalTimeout = null;

// ==================== SÉLECTEURS DOM ====================
let nomElement;
let congrats;
let loser;
let btnQuiz;
let leQuiz;
let questionElement;
let trueAnswerElement;
let mapSection;
let infoLabel;
let consecutiveScoreElement;
let fullNameElement;
let capitalElement;
let populationElement;
let areaElement;
let languagesElement;
let flagElement;
let flagBottomElement;
let modalOverlay;
let modalQuestion;
let modalFeedback;
let modalErrorOverlay;
let modalErrorFeedback;

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", function() {
    initializeApp();
});

function initializeApp() {
    nomElement = document.getElementById("nom");
    congrats = document.getElementById("congrats");
    loser = document.getElementById("loser");
    btnQuiz = document.getElementById("btn-quiz");
    leQuiz = document.getElementById("le-quiz");
    questionElement = document.getElementById("question");
    trueAnswerElement = document.getElementById("true-answer");
    mapSection = document.querySelector(".map-section");
    infoLabel = document.querySelector(".text-selection");
    consecutiveScoreElement = document.getElementById("consecutive-score");

    fullNameElement = document.getElementById("full-name");
    capitalElement = document.getElementById("capital");
    populationElement = document.getElementById("population");
    areaElement = document.getElementById("area");
    languagesElement = document.getElementById("languages");
    flagElement = document.getElementById("flag");
    flagBottomElement = document.getElementById("flag-bottom");

    modalOverlay = document.getElementById("modalOverlay");
    modalQuestion = document.getElementById("modalQuestion");
    modalFeedback = document.getElementById("modalFeedback");
    modalErrorOverlay = document.getElementById("modalErrorOverlay");
    modalErrorFeedback = document.getElementById("modalErrorFeedback");

    congrats.classList.remove("active");
    loser.classList.remove("active");
    leQuiz.classList.remove("active");
    if (modalOverlay) {
        modalOverlay.classList.remove("active");
    }
    if (modalErrorOverlay) {
        modalErrorOverlay.classList.remove("active");
    }

    Object.keys(cantonMap).forEach(cantonId => {
        const cantonElement = document.getElementById(cantonId);
        if (cantonElement) {
            cantonElement.style.cursor = "pointer";
            cantonElement.addEventListener("click", function() {
                handleCantonClick(cantonId);
            });
        }
    });

    btnQuiz?.addEventListener("click", launchQuiz);

    if (modalOverlay) {
        modalOverlay.addEventListener("click", function(e) {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }

    if (modalErrorOverlay) {
        modalErrorOverlay.addEventListener("click", function(e) {
            if (e.target === modalErrorOverlay) {
                hideErrorModal();
            }
        });
    }

    updateConsecutiveScore();
    
    // Ajuster le viewBox du SVG selon la taille d'écran
    adjustSVGViewBox();
    window.addEventListener("resize", adjustSVGViewBox);
    
    setQuizButtonState(false);
}

// Active/désactive le bouton de quiz pour éviter le spam
function setQuizButtonState(isDisabled) {
    if (!btnQuiz) return;
    btnQuiz.disabled = isDisabled;
    btnQuiz.classList.toggle("is-disabled", isDisabled);
}


// ==================== GESTION DES CLICS ====================
function handleCantonClick(cantonId) {
    const cantonName = cantonMap[cantonId];
    const cantonCode = cantonId.replace("CH-", "");

    if (!quizLaunched) {
        resetVisualState();
    }

    displayCanton(cantonName);
    displayCantonInfo(cantonCode);
    answer = cantonName;

    if (quizLaunched) {
        checkAnswer(cantonName);
    }
}

function displayCantonInfo(cantonCode) {
    const data = cantonData[cantonCode];
    if (!data) return;

    fullNameElement.textContent = data.fullName;
    capitalElement.textContent = data.chefLieu;
    populationElement.textContent = data.population;
    areaElement.textContent = data.area;
    languagesElement.textContent = data.languages;

    const flagSrc = data.flag;
    if (flagElement) {
        flagElement.src = flagSrc;
        flagElement.alt = `Drapeau de ${data.fullName}`;
        flagElement.style.width = "";
        flagElement.style.height = "";
    }
    if (flagBottomElement) {
        flagBottomElement.src = flagSrc;
        flagBottomElement.alt = `Drapeau de ${data.fullName}`;
        flagBottomElement.style.width = "";
        flagBottomElement.style.height = "";
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
    if (quizLaunched) {
        return;
    }

    quizLaunched = true;
    setQuizButtonState(true);
    randCanton = cantons[Math.floor(Math.random() * cantons.length)];

    resetVisualState();

    // Afficher le canton à chercher sur le bouton
    btnQuiz.textContent = "Cherche: " + randCanton;

    questionElement.textContent = randCanton;

    if (modalTimeout) {
        clearTimeout(modalTimeout);
    }

    if (modalQuestion && modalOverlay) {
        modalQuestion.textContent = randCanton;
        modalOverlay.classList.add("active");
        modalFeedback.innerHTML = "";

        modalTimeout = setTimeout(() => {
            hideModal();
        }, 2500);
    }

    congrats.classList.remove("active");
    loser.classList.remove("active");
    leQuiz.classList.remove("active");

    btnQuiz.style.transform = "scale(0.98)";
    setTimeout(() => {
        btnQuiz.style.transform = "scale(1)";
    }, 100);
}

function checkAnswer(userAnswer) {
    const isCorrect = userAnswer === randCanton;
    quizLaunched = false;

    if (isCorrect) {
        showSuccess();
        consecutiveScore++;
        updateConsecutiveScore();

        setTimeout(() => {
            resetQuiz();
            launchQuiz();
        }, 600);
    } else {
        showError(userAnswer);
        consecutiveScore = 0;
        updateConsecutiveScore();

        setTimeout(() => {
            resetQuiz();
        }, 1500);
    }
}

function showSuccess() {
    hideModal();
    triggerPlusOneAnimation();

    mapSection.classList.remove("error-flash");
    mapSection.classList.add("success-flash");

    setTimeout(() => {
        mapSection.classList.remove("success-flash");
    }, 800);
}

function showError(wrongAnswer) {
    hideModal();

    mapSection.classList.remove("success-flash");
    mapSection.classList.add("error-flash");

    showErrorModal(wrongAnswer);

    setTimeout(() => {
        mapSection.classList.remove("error-flash");
    }, 800);
}

// ==================== FONCTIONS MODALE ====================
function hideModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove("active");
    }
    if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
    }
}

function showErrorModal(wrongAnswer) {
    if (!modalErrorOverlay || !modalErrorFeedback) return;

    modalErrorOverlay.classList.add("active");
    modalErrorFeedback.innerHTML = `
        <div class="modal-feedback-item modal-error">
            <span class="icon">❌</span>
            <p>C'est faux!</p>
            <p>Tu as cliqué sur <b>${wrongAnswer}</b></p>
        </div>
    `;
}

function hideErrorModal() {
    if (modalErrorOverlay) {
        modalErrorOverlay.classList.remove("active");
    }
    if (modalTimeout) {
        clearTimeout(modalTimeout);
        modalTimeout = null;
    }
}

// ==================== UTILITAIRES ====================
function resetVisualState() {
    mapSection.classList.remove("success-flash", "error-flash");
}

function resetQuiz() {
    quizLaunched = false;
    randCanton = null;
    answer = null;

    hideModal();
    hideErrorModal();

    leQuiz.classList.remove("active");
    congrats.classList.remove("active");
    loser.classList.remove("active");
    mapSection.classList.remove("success-flash", "error-flash");

    nomElement.textContent = "Cliquez sur un canton";
    
    // Restaurer le texte original du bouton
    btnQuiz.textContent = "Teste-moi! 🎯";
    
    setQuizButtonState(false);
}

function updateConsecutiveScore() {
    if (consecutiveScoreElement) {
        consecutiveScoreElement.textContent = consecutiveScore;
    }
}

// ==================== ANIMATION +1 JEU VIDÉO ====================
function triggerPlusOneAnimation() {
    const container = document.getElementById('plus-one-container');
    if (!container) return;

    const plusOne = document.createElement('div');
    plusOne.className = 'plus-one-animation';

    const variants = ['', 'variant-1', 'variant-2', 'variant-3'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    if (randomVariant) {
        plusOne.classList.add(randomVariant);
    }

    plusOne.textContent = '+1';

    const randomX = 30 + Math.random() * 40;
    const randomY = 40 + Math.random() * 20;

    plusOne.style.left = `${randomX}%`;
    plusOne.style.top = `${randomY}%`;

    container.appendChild(plusOne);

    setTimeout(() => {
        plusOne.remove();
    }, 1500);
}

// ==================== RACCOURCIS CLAVIER ====================
document.addEventListener("keydown", function(event) {
    if (event.key === "s" || event.key === "S") {
        console.log(`🔥 Bonnes réponses consécutives: ${consecutiveScore}`);
    }
});

