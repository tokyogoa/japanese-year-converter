// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const westernYearInput = document.getElementById('western-year');
    const japaneseEraSelect = document.getElementById('japanese-era');
    const japaneseEraYearInput = document.getElementById('japanese-era-year');
    const clearButton = document.getElementById('clear-button');
    const errorMessage = document.getElementById('error-message');

    // Age Calculator Elements
    const birthYearInput = document.getElementById('birth-year');
    const birthMonthSelect = document.getElementById('birth-month');
    const birthDaySelect = document.getElementById('birth-day');
    const referenceDateInput = document.getElementById('reference-date');
    const ageResultDiv = document.getElementById('age-result');

    // Language Switcher
    const langButtons = document.querySelectorAll('.lang-switcher button[data-lang]');

    // --- State ---
    let currentLang = 'ja';
    let isUpdating = false; // To prevent infinite loops on input events

    // --- Constants ---
    const MIN_YEAR = eras[eras.length - 1].start_year;

    // --- Functions ---

    // Internationalization (i18n)
    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        document.documentElement.lang = lang;

        // Update text content
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key]; // Use innerHTML to support <small> tags
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-key-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-key-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Update page title
        document.title = getTranslation('pageTitle');

        // Update active button
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Re-run calculations to update any language-dependent messages
        handleWesternYearInput();
        calculateAge();
    }

    function getTranslation(key, replacements = {}) {
        let text = (translations[currentLang] && translations[currentLang][key]) || key;
        for (const placeholder in replacements) {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return text;
    }

    function showError(message) {
        errorMessage.textContent = message;
    }

    // --- Year Converter Logic ---

    function handleWesternYearInput() {
        if (isUpdating) return;
        isUpdating = true;

        const year = parseInt(westernYearInput.value, 10);
        showError('');

        if (!westernYearInput.value) {
            clearJapaneseInputs();
            isUpdating = false;
            return;
        }

        if (isNaN(year)) {
            showError(getTranslation('errorValidYear'));
            clearJapaneseInputs();
            isUpdating = false;
            return;
        }

        if (year < MIN_YEAR) {
            showError(getTranslation('errorMinYear', { year: MIN_YEAR }));
            clearJapaneseInputs();
            isUpdating = false;
            return;
        }

        // Find era based on year. For crossover years, it will pick the one that starts in that year.
        const era = eras.find(e => year >= e.start_year && (e.end_date === null || year <= new Date(e.end_date).getFullYear()));
        
        if (era) {
            const eraYear = year - era.offset;
            japaneseEraSelect.value = era.name;
            japaneseEraYearInput.value = eraYear;

            // Check for crossover years
            const nextEra = eras[eras.indexOf(era) - 1];
            if (nextEra && new Date(nextEra.start_date).getFullYear() === year) {
                 showError(`注意: ${year}年は${era.name}と${nextEra.name}の両方が存在します。`);
            }
        } else {
            clearJapaneseInputs();
        }

        isUpdating = false;
    }

    function handleJapaneseYearInput() {
        if (isUpdating) return;
        isUpdating = true;

        const eraName = japaneseEraSelect.value;
        const eraYear = parseInt(japaneseEraYearInput.value, 10);
        showError('');

        if (!japaneseEraYearInput.value) {
            westernYearInput.value = '';
            isUpdating = false;
            return;
        }

        const era = eras.find(e => e.name === eraName);

        if (!era) {
            showError(getTranslation('errorEraNotFound', { eraName }));
            westernYearInput.value = '';
            isUpdating = false;
            return;
        }

        if (isNaN(eraYear) || eraYear <= 0) {
            showError(getTranslation('errorPositiveYear'));
            westernYearInput.value = '';
            isUpdating = false;
            return;
        }

        const westernYear = era.offset + eraYear;
        
        const eraEndDate = era.end_date ? new Date(era.end_date) : null;
        if (eraEndDate && westernYear > eraEndDate.getFullYear()) {
             showError(getTranslation('errorEraEnded', { eraName: era.name, maxYear: era.end_date ? new Date(era.end_date).getFullYear() : 'N/A' }));
             westernYearInput.value = '';
             isUpdating = false;
             return;
        }

        westernYearInput.value = westernYear;
        
        if (eraEndDate && westernYear === eraEndDate.getFullYear()) {
            const prevEra = eras[eras.indexOf(era) + 1];
            if(prevEra) showError(`注意: ${westernYear}年は${prevEra.name}と${era.name}の両方が存在します。`);
        }

        isUpdating = false;
    }

    function clearAllInputs() {
        isUpdating = true;
        westernYearInput.value = '';
        japaneseEraYearInput.value = '';
        japaneseEraSelect.selectedIndex = 0;
        showError('');
        isUpdating = false;
    }

    function clearJapaneseInputs() {
        japaneseEraSelect.selectedIndex = 0;
        japaneseEraYearInput.value = '';
    }

    // --- Age Calculator Logic ---

    function getEraForDate(date) {
        if (isNaN(date.getTime())) return null;
        const checkDateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
        
        for (const era of eras) {
            if (checkDateStr >= era.start_date && (!era.end_date || checkDateStr <= era.end_date)) {
                return era;
            }
        }
        return null;
    }

    function calculateAge() {
        const year = parseInt(birthYearInput.value, 10);
        const month = parseInt(birthMonthSelect.value, 10);
        const day = parseInt(birthDaySelect.value, 10);
        const refDateStr = referenceDateInput.value;

        if (!year || !month || !day || !refDateStr) {
            ageResultDiv.textContent = '';
            return;
        }

        const refDate = new Date(refDateStr);
        const birthDate = new Date(Date.UTC(year, month - 1, day));
        const referenceDateUTC = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()));

        if (birthDate.getUTCFullYear() !== year || birthDate.getUTCMonth() !== month - 1 || birthDate.getUTCDate() !== day) {
            ageResultDiv.textContent = getTranslation('errorInvalidDate');
            ageResultDiv.classList.add('error');
            return;
        }

        if (birthDate > referenceDateUTC) {
            ageResultDiv.textContent = getTranslation('errorBirthDateInFuture');
            ageResultDiv.classList.add('error');
            return;
        }

        ageResultDiv.classList.remove('error');

        let age = referenceDateUTC.getUTCFullYear() - birthDate.getUTCFullYear();
        const m = referenceDateUTC.getUTCMonth() - birthDate.getUTCMonth();
        if (m < 0 || (m === 0 && referenceDateUTC.getUTCDate() < birthDate.getUTCDate())) {
            age--;
        }

        const birthEra = getEraForDate(birthDate);
        if (birthEra) {
            const eraYear = year - birthEra.offset;
            const eraYearDisplay = eraYear === 1 ? '元' : eraYear;
            ageResultDiv.textContent = getTranslation('ageResultTextWithEra', {
                eraName: birthEra.name,
                eraYear: eraYearDisplay,
                age: age
            });
        } else {
            ageResultDiv.textContent = getTranslation('ageResultText', { age: age });
        }
    }

    function populateDateDropdowns() {
        const year = parseInt(birthYearInput.value, 10);
        const month = parseInt(birthMonthSelect.value, 10);
        const currentDay = parseInt(birthDaySelect.value, 10);

        if (!year || !month) return;

        const daysInMonth = new Date(year, month, 0).getDate();
        birthDaySelect.innerHTML = '';
        for (let i = 1; i <= daysInMonth; i++) {
            const option = new Option(i, i);
            if (i === currentDay) {
                option.selected = true;
            }
            birthDaySelect.add(option);
        }
    }

    // --- Initialization ---
    function init() {
        japaneseEraSelect.innerHTML = eras.map(era => `<option value="${era.name}">${era.name} (${era.romaji})</option>`).join('');

        for (let i = 1; i <= 12; i++) { birthMonthSelect.add(new Option(i, i)); }
        for (let i = 1; i <= 31; i++) { birthDaySelect.add(new Option(i, i)); }

        try {
            referenceDateInput.valueAsDate = new Date();
        } catch (e) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            referenceDateInput.value = `${yyyy}-${mm}-${dd}`;
        }

        const browserLang = navigator.language.split('-')[0];
        setLanguage(translations[browserLang] ? browserLang : 'ja');

        westernYearInput.addEventListener('input', handleWesternYearInput);
        japaneseEraSelect.addEventListener('change', handleJapaneseYearInput);
        japaneseEraYearInput.addEventListener('input', handleJapaneseYearInput);
        clearButton.addEventListener('click', clearAllInputs);

        [birthYearInput, birthMonthSelect, birthDaySelect, referenceDateInput].forEach(el => {
            el.addEventListener('change', calculateAge);
        });
        [birthYearInput, birthMonthSelect].forEach(el => {
            el.addEventListener('change', populateDateDropdowns);
        });

        langButtons.forEach(button => {
            button.addEventListener('click', () => setLanguage(button.dataset.lang));
        });
        
        calculateAge();
    }

    init();
});