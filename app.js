/**
 * Application Cartes Interactives
 * Script principal pour la page de présentation
 */

// ========================================
// INITIALISATION - Exécution au chargement
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Application Cartes Interactives chargée');
    
    // Initialiser les animations
    initializeAnimations();
    
    // Initialiser les interactions
    initializeInteractions();
});

// ========================================
// ANIMATIONS - Animations des éléments
// ========================================

/**
 * Initialise les animations lors du scroll
 */
function initializeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observer tous les éléments avec la classe 'map-card'
    document.querySelectorAll('.map-card, .feature-item').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// ========================================
// INTERACTIONS - Interactions utilisateur
// ========================================

/**
 * Initialise les interactions avec les boutons
 */
function initializeInteractions() {
    const buttons = document.querySelectorAll('.btn--primary');
    
    buttons.forEach(button => {
        // Animation au survol
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        // Log pour suivi
        button.addEventListener('click', function(e) {
            const mapName = this.parentElement.querySelector('h3')?.textContent || 'Carte';
            console.log(`Navigation vers: ${mapName}`);
        });
    });
}

// ========================================
// UTILITAIRES - Fonctions utilitaires
// ========================================

/**
 * Log un message avec le préfixe de l'application
 * @param {string} message - Message à afficher
 */
function logApp(message) {
    console.log(`[Cartes Interactives] ${message}`);
}

/**
 * Ajoute une classe avec animation
 * @param {HTMLElement} element - Élément cible
 * @param {string} className - Classe à ajouter
 */
function addClassWithAnimation(element, className) {
    element.classList.add(className);
    element.style.animation = 'fadeIn 0.3s ease';
}
