
// ==================== VARIABLES D'ÉTAT ====================
let quizLaunched = false;
let randCountry = null;
let answer = null;
let consecutiveScore = 0;
let modalTimeout = null;

let selection;
let paths;
let questionBtn;

let nameEl, capitalEl, populationEl, areaEl, languagesEl, flagEl, flagBottomEl, fullNameEl;
let congrats, loser, btnQuiz, leQuiz, questionElement, trueAnswerElement;
let mapElement, contentSection, infoLineEl;
let modalOverlay, modalFeedback, modalQuestion, modalErrorOverlay, modalErrorFeedback;

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", function() {
  console.log("🚀 Initialisation de l'app...");
  initializeApp();
});

function initializeApp() {
  // ==================== SÉLECTEURS DOM ====================
  selection = document.querySelector(".selection");
  paths = document.querySelectorAll(".land");
  questionBtn = document.querySelector(".question-btn");

  nameEl = document.getElementById("name");
  capitalEl = document.getElementById("capital");
  populationEl = document.getElementById("population");
  areaEl = document.getElementById("area");
  languagesEl = document.getElementById("languages");
  flagEl = document.getElementById("flag");
  flagBottomEl = document.getElementById("flag-bottom");
  fullNameEl = document.getElementById("full-name");

  // Éléments du quiz
  congrats = document.getElementById("congrats");
  loser = document.getElementById("loser");
  btnQuiz = document.getElementById("btn-quiz");
  leQuiz = document.getElementById("le-quiz");
  questionElement = document.getElementById("question");
  trueAnswerElement = document.getElementById("true-answer");
  
  // Éléments de la modale
  modalOverlay = document.getElementById("modalOverlay");
  modalFeedback = document.getElementById("modalFeedback");
  modalQuestion = document.getElementById("modalQuestion");
  modalErrorOverlay = document.getElementById("modalErrorOverlay");
  modalErrorFeedback = document.getElementById("modalErrorFeedback");
  
  console.log("✅ Modale elements:", { modalOverlay, modalFeedback, modalQuestion, modalErrorOverlay, modalErrorFeedback });
  
  mapElement = document.querySelector(".map-section");
  contentSection = document.querySelector(".content-section");
  infoLineEl = document.querySelector(".info-line");

  // Masquer les messages de résultat au démarrage
  congrats.classList.remove("active");
  loser.classList.remove("active");
  leQuiz.classList.remove("active");
  modalOverlay.classList.remove("active");

  // Ajuster le viewBox du SVG selon la taille d'écran
  adjustSVGViewBox();
  window.addEventListener("resize", adjustSVGViewBox);

  // Initialiser les event listeners
  showCountryOnClick();
  btnQuiz.addEventListener("click", launchQuiz);
  
  // Fermer la modale en cliquant sur l'overlay
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function(e) {
      if (e.target === modalOverlay) {
        hideModal();
      }
    });
  }
  
  // Fermer la modale d'erreur en cliquant sur l'overlay
  if (modalErrorOverlay) {
    modalErrorOverlay.addEventListener("click", function(e) {
      if (e.target === modalErrorOverlay) {
        hideErrorModal();
      }
    });
  }
  
  // Mettre à jour le score initial
  updateConsecutiveScore();

  // S'assurer que le bouton est bien actif au démarrage
  setQuizButtonState(false);
}

// ==================== FONCTIONS ====================

// Active/désactive le bouton de quiz pour empêcher le spam
function setQuizButtonState(isDisabled) {
  if (!btnQuiz) return;
  btnQuiz.disabled = isDisabled;
  btnQuiz.classList.toggle("is-disabled", isDisabled);
}

// Ajuste le viewBox du SVG selon la taille d'écran
function adjustSVGViewBox() {
  const svg = document.querySelector("svg");
  if (!svg) return;
  
  const width = window.innerWidth;
  

}

// Clique principal sur les pays pour avoir les infos
function showCountryOnClick() {
  paths.forEach(function(path) {
    path.addEventListener("click", function() {
      const code = this.id;
      const name = countryMap[code];
      
      console.log("🖱️ Clic sur:", name, "quizLaunched:", quizLaunched);
      
      // Si le quiz n'est PAS lancé, réinitialiser l'apparence
      if (!quizLaunched) {
        resetVisualState();
      }
      
      // Afficher les informations du pays
      displayCountry(code, name);
      answer = name;
      
      // Vérifier la réponse si le quiz est lancé
      if (quizLaunched) {
        console.log("Vérification de la réponse...");
        checkAnswer(name);
      } else {
        console.log("❌ Quiz non lancé, pas de vérification");
      }
    });
  });
}

function displayCountry(code, name) {
  selection.textContent = name;
  selection.style.animation = "none";
  setTimeout(() => {
    selection.style.animation = "slideIn 0.3s ease";
  }, 10);
  
  fullNameEl.textContent = countriesData[code].fullName;
  capitalEl.textContent = countriesData[code].capital;
  populationEl.textContent = countriesData[code].population;
  areaEl.textContent = countriesData[code].area;
  languagesEl.textContent = countriesData[code].languages;
  const flagSrc = "assets/flags/" + countriesData[code].flag;
  flagEl.src = flagSrc;
  if (flagBottomEl) {
    flagBottomEl.src = flagSrc;
  }

  // Size handled by CSS for consistent square flags
  flagEl.style.width = "";
  flagEl.style.height = "";
  flagEl.classList.toggle("square-flag", code === "CH");
  if (flagBottomEl) {
    flagBottomEl.style.width = "";
    flagBottomEl.style.height = "";
    flagBottomEl.classList.toggle("square-flag", code === "CH");
  }
}

// ==================== SYSTÈME DE QUIZ ====================
function launchQuiz() {
  if (quizLaunched) {
    return; // Une question est déjà en cours, il faut y répondre d'abord
  }

  console.log("🎯 Quiz lancé!");
  quizLaunched = true;
  setQuizButtonState(true);
  randCountry = countries[Math.floor(Math.random() * countries.length)];
  console.log("Pays choisi:", randCountry);
  
  // Réinitialiser l'apparence pour la nouvelle question
  resetVisualState();
  
  // Afficher le pays à chercher sur le bouton
  btnQuiz.textContent = "Cherche: " + randCountry;
  
  // Afficher aussi dans la modale
  questionElement.textContent = randCountry;
  
  // Annuler le timeout précédent s'il existe
  if (modalTimeout) {
    clearTimeout(modalTimeout);
  }
  
  // Afficher la modale avec la question
  modalQuestion.textContent = randCountry;
  modalOverlay.classList.add("active");
  
  // Vider le feedback de la modale
  modalFeedback.innerHTML = "";

  // Auto-fermer la question après 2.5s tout en laissant la réponse obligatoire
  modalTimeout = setTimeout(() => {
    hideModal();
  }, 2500);
  
  // Masquer les anciens messages
  congrats.classList.remove("active");
  loser.classList.remove("active");
  leQuiz.classList.remove("active");

  // Animation du bouton
  btnQuiz.style.transform = "scale(0.98)";
  setTimeout(() => {
    btnQuiz.style.transform = "scale(1)";
  }, 100);
}

function checkAnswer(userAnswer) {
  console.log("✓ Réponse vérifiée:", userAnswer, "vs", randCountry, "quizLaunched:", quizLaunched);
  const isCorrect = userAnswer === randCountry;
  console.log("isCorrect:", isCorrect);

  quizLaunched = false;

  if (isCorrect) {
    console.log("✅ CORRECT!");
    showSuccess();
    consecutiveScore++;
    updateConsecutiveScore();
    
    // 🟢 SUCCÈS: Auto-lancer après 600ms
    setTimeout(() => {
      resetQuiz();
      launchQuiz();
    }, 600);
  } else {
    console.log("❌ FAUX!");
    showError(userAnswer);
    consecutiveScore = 0;
    updateConsecutiveScore();
    
    // 🔴 ERREUR: Réinitialiser après 1.5s
    setTimeout(() => {
      resetQuiz();
    }, 1500);
  }
}

function showSuccess() {
  console.log("✅ Réponse correcte!");
  
  // Fermer la modale immédiatement
  modalOverlay.classList.remove("active");
  
  // 🎮 ANIMATION +1
  triggerPlusOneAnimation();
  
  // Animation de la map en vert
  mapElement.classList.remove("error-flash");
  mapElement.classList.add("success-flash");
  
  // Retirer après 800ms
  setTimeout(() => {
    mapElement.classList.remove("success-flash");
  }, 800);
}

function showError(wrongAnswer) {
  console.log("❌ Réponse fausse:", wrongAnswer);
  
  // Fermer la modale de question immédiatement
  modalOverlay.classList.remove("active");
  
  // Animation de la map en rouge
  mapElement.classList.remove("success-flash");
  mapElement.classList.add("error-flash");
  
  // Afficher la modale d'erreur tout de suite
  showErrorModal(wrongAnswer);
  
  // Retirer l'animation
  setTimeout(() => {
    mapElement.classList.remove("error-flash");
  }, 800);
}

// ==================== FONCTIONS MODALE ====================
function showModal(isSuccess, wrongAnswer) {
  console.log("📱 Affichage modale:", { isSuccess, wrongAnswer });
  // Afficher la modale
  modalOverlay.classList.add("active");
  
  // Remplir les informations de la question
  modalQuestion.textContent = randCountry;
  
  // Vider le contenu précédent du feedback
  modalFeedback.innerHTML = "";
  
  // Annuler le timeout précédent s'il existe
  if (modalTimeout) {
    clearTimeout(modalTimeout);
  }
  
  // Masquer la modale après 2 secondes
  modalTimeout = setTimeout(() => {
    hideModal();
  }, 2000);
}

function hideModal() {
  modalOverlay.classList.remove("active");
  if (modalTimeout) {
    clearTimeout(modalTimeout);
    modalTimeout = null;
  }
}

function showErrorModal(wrongAnswer) {
  console.log("📱 Affichage modale erreur:", wrongAnswer);
  
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
  modalErrorOverlay.classList.remove("active");
  if (modalTimeout) {
    clearTimeout(modalTimeout);
    modalTimeout = null;
  }
}

// ==================== UTILITAIRES ====================
function resetVisualState() {
  // Retirer les animations en cours
  mapElement.classList.remove("success-flash", "error-flash");
  
  if (infoLineEl) {
    infoLineEl.classList.remove("success-state", "error-state");
  }
}

function resetQuiz() {
  quizLaunched = false;
  randCountry = null;
  answer = null;
  
  // Fermer les modales
  modalOverlay.classList.remove("active");
  modalErrorOverlay.classList.remove("active");
  
  // Nettoyer les animations
  leQuiz.classList.remove("active");
  congrats.classList.remove("active");
  loser.classList.remove("active");
  mapElement.classList.remove("success-flash", "error-flash");
  
  // Annuler les timeouts
  if (modalTimeout) {
    clearTimeout(modalTimeout);
    modalTimeout = null;
  }

  // Restaurer le texte original du bouton
  btnQuiz.textContent = "Teste-moi! 🎯";

  // Réactiver le bouton pour permettre une nouvelle question
  setQuizButtonState(false);
}

function updateConsecutiveScore() {
  const scoreValueEl = document.querySelector(".score-value");
  if (scoreValueEl) {
    scoreValueEl.textContent = consecutiveScore;
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

// ==================== RACCOURCIS CLAVIER ====================
document.addEventListener("keydown", function(event) {
  if (event.key === "s" || event.key === "S") {
    console.log(`🔥 Bonnes réponses consécutives: ${consecutiveScore}`);
  }
});
