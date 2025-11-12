// subpage.js - Internationalization for subpages
document.addEventListener('DOMContentLoaded', () => {
    // Language Switcher
    const langButtons = document.querySelectorAll('.lang-switcher button[data-lang]');
    
    // State
    let currentLang = 'ja';

    // Internationalization (i18n)
    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        document.documentElement.lang = lang;

        // Update text content
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key]; // Use innerHTML to support formatting
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-key-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Update page title based on page type
        const pageType = document.body.getAttribute('data-page-type') || 'about';
        let titleKey = 'pageTitle'; // default
        
        switch(pageType) {
            case 'about':
                titleKey = 'aboutTitle';
                break;
            case 'guide':
                titleKey = 'guideTitle';
                break;
            case 'privacy':
                titleKey = 'privacyTitle';
                break;
        }
        
        document.title = getTranslation(titleKey) + ' | ' + getTranslation('pageTitleMain');

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', getTranslation('siteDescription'));
        }

        // Update active button
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    function getTranslation(key, replacements = {}) {
        let text = (translations[currentLang] && translations[currentLang][key]) || key;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    }

    // Initialize
    function init() {
        // Set initial language from localStorage or browser
        const savedLang = localStorage.getItem('preferredLang');
        const browserLang = navigator.language.split('-')[0];
        
        setLanguage(savedLang || (translations[browserLang] ? browserLang : 'ja'));

        // Add event listeners for language buttons
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedLang = button.dataset.lang;
                setLanguage(selectedLang);
                localStorage.setItem('preferredLang', selectedLang);
            });
        });
    }

    init();
});