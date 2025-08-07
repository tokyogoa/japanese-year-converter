document.addEventListener('DOMContentLoaded', () => {
    // The 'eras' and 'translations' constants are now loaded from external files.
    const westernYearInput = document.getElementById('western-year');
    const japaneseEraSelect = document.getElementById('japanese-era');
    const japaneseEraYearInput = document.getElementById('japanese-era-year');
    const errorMessage = document.getElementById('error-message');
    const clearButton = document.getElementById('clear-button');
    const langButtons = document.querySelectorAll('.lang-switcher button');

    // A flag to prevent chained event listeners from creating unwanted "corrections".
    let isUpdating = false;
    // State for the current language
    let currentLang = 'en';
    // State for the current error message
    let currentErrorState = null; // e.g., { key: 'errorKey', params: { ... } }

    function clearError() {
        currentErrorState = null;
        errorMessage.textContent = '';
    }

    function showError(key, params = {}) {
        currentErrorState = { key, params };
        let message = (translations[currentLang] && translations[currentLang][key]) || 'An unknown error occurred.';
        for (const [param, value] of Object.entries(params)) {
            message = message.replace(`{${param}}`, value);
        }
        errorMessage.textContent = message;
    }

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        localStorage.setItem('japaneseYearConverterLang', lang);
        document.documentElement.lang = lang;

        // Update UI text based on data-i18n-key attributes
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            if (translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-key-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Update document title
        document.title = translations[lang].pageTitle;

        // Update lang switcher active state
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Re-render the current error message in the new language, if it exists.
        if (currentErrorState) {
            showError(currentErrorState.key, currentErrorState.params);
        }
    }

    function populateEraDropdown() {
        eras.forEach(era => {
            const option = document.createElement('option');
            option.value = era.name;
            option.textContent = `${era.name} (${era.kanji})`;
            japaneseEraSelect.appendChild(option);
        });
    }

    function convertToJapanese() {
        if (isUpdating) return;
        isUpdating = true;
        try {
            clearError(); // Start by clearing any previous errors.
            const yearStr = westernYearInput.value;

            if (!yearStr) {
                japaneseEraYearInput.value = '';
                // When input is cleared, we don't need to show an error.
                return;
            }

            const year = parseInt(yearStr, 10);

            if (isNaN(year)) {
                japaneseEraYearInput.value = '';
                showError("errorValidYear");
                return;
            }

            const oldestEra = eras[eras.length - 1];
            if (year < oldestEra.start) {
                // For partial or invalid years, clear the result fields.
                japaneseEraYearInput.value = '';
                japaneseEraSelect.value = eras[0].name; // Reset dropdown to default

                // Only show an error if the user has likely finished typing a full year (4 digits).
                if (yearStr.length >= 4) {
                    showError("errorMinYear", { year: oldestEra.start });
                }
                return;
            }

            for (const era of eras) {
                if (year >= era.start) {
                    const yearInEra = year - era.start + 1;
                    japaneseEraSelect.value = era.name;
                    japaneseEraYearInput.value = yearInEra;
                    return;
                }
            }
        } finally {
            isUpdating = false;
        }
    }

    function convertToWestern() {
        if (isUpdating) return;
        isUpdating = true;
        try {
            clearError(); // Start by clearing any previous errors.
            const eraName = japaneseEraSelect.value;
            const yearInEraStr = japaneseEraYearInput.value;

            if (!yearInEraStr) {
                westernYearInput.value = '';
                return;
            }

            const yearInEra = parseInt(yearInEraStr, 10);

            if (isNaN(yearInEra) || yearInEra <= 0) {
                westernYearInput.value = '';
                showError("errorPositiveYear");
                return;
            }

            const eraIndex = eras.findIndex(e => e.name === eraName);
            const era = eras[eraIndex];

            // This check is mostly for safety, as the dropdown should prevent this.
            if (!era) {
                westernYearInput.value = '';
                showError("errorEraNotFound", { eraName: eraName });
                return;
            }

            // Validate that the year is within the bounds of the era.
            // The next chronological era is the one before it in the array.
            if (eraIndex > 0) { // Any era except the first one (Reiwa)
                const nextEra = eras[eraIndex - 1];
                const maxYearInEra = nextEra.start - era.start;
                if (yearInEra > maxYearInEra) {
                    westernYearInput.value = '';
                    showError("errorEraEnded", { eraName: era.name, maxYear: maxYearInEra });
                    return;
                }
            }

            const westernYear = era.start + yearInEra - 1;
            westernYearInput.value = westernYear;
        } finally {
            isUpdating = false;
        }
    }

    function clearAll() {
        isUpdating = true; // Prevent converters from firing
        westernYearInput.value = '';
        japaneseEraSelect.value = eras[0].name; // Reset to the most recent era
        japaneseEraYearInput.value = '';
        clearError();
        isUpdating = false;
    }

    // --- Initialization ---
    populateEraDropdown();

    // Add event listeners for lang switcher
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.lang);
        });
    });

    // Set initial language based on saved preference or browser language
    const savedLang = localStorage.getItem('japaneseYearConverterLang');
    const browserLang = navigator.language.split('-')[0];
    setLanguage(savedLang || (translations[browserLang] ? browserLang : 'ja'));

    // --- Event Listeners ---
    // Automatically convert as the user types in either field.
    westernYearInput.addEventListener('input', convertToJapanese);
    japaneseEraSelect.addEventListener('change', convertToWestern);
    japaneseEraYearInput.addEventListener('input', convertToWestern);
    if (clearButton) {
        clearButton.addEventListener('click', clearAll);
    }
});
