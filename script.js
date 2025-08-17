document.addEventListener('DOMContentLoaded', () => {
    // The 'eras' and 'translations' constants are now loaded from external files.

    const LANG_STORAGE_KEY = 'japaneseYearConverterLang';
    const DEFAULT_LANG = 'ja';

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

    // 현재 표시된 연호 안내 메시지를 저장할 변수
    let currentEraMessage = null;

    function setLanguage(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        localStorage.setItem(LANG_STORAGE_KEY, lang);
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

        // Re-render the current error message in the new language, if it exists
        if (currentErrorState) {
            showError(currentErrorState.key, currentErrorState.params);
        }

        // Re-render the current era message in the new language, if it exists
        if (currentEraMessage) {
            showEraNotice(currentEraMessage[lang] || currentEraMessage['en']);
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


    // 연도만 비교 (월, 일 무시)
    function isYearInRange(year, start, end) {
        return year >= start.year && (!end || year <= end.year);
    }

    // 안내 메시지 표시용 영역 추가
    // 안내 메시지 표시 영역 robust하게 생성 및 관리
    function getEraNoticeElement() {
        let el = document.getElementById('era-notice');
        if (!el) {
            el = document.createElement('div');
            el.id = 'era-notice';
            el.style.color = '#e65100';
            el.style.fontSize = '1em';
            el.style.marginTop = '1em';
            el.style.padding = '0.8em 1em';
            el.style.backgroundColor = '#fff3e0';
            el.style.border = '1px solid #ffe0b2';
            el.style.borderRadius = '4px';
            el.style.lineHeight = '1.6';
            errorMessage.parentNode.insertBefore(el, errorMessage.nextSibling);
        }
        return el;
    }

    function showEraNotice(msg) {
        const el = getEraNoticeElement();
        if (typeof msg === 'object') {
            currentEraMessage = msg;
            el.textContent = msg[currentLang] || msg['en'];
        } else {
            currentEraMessage = null;
            el.textContent = msg || '';
        }
        el.style.display = el.textContent ? 'block' : 'none';
    }

    function convertToJapanese() {
        if (isUpdating) return;
        isUpdating = true;
        try {
            clearError();
            showEraNotice("");
            const yearStr = westernYearInput.value;
            if (!yearStr) {
                japaneseEraYearInput.value = '';
                showEraNotice("");
                return;
            }
            const year = parseInt(yearStr, 10);
            if (isNaN(year)) {
                japaneseEraYearInput.value = '';
                showEraNotice("");
                showError("errorValidYear");
                return;
            }
            let found = false;
            for (const era of eras) {
                if (isYearInRange(year, era.start, era.end)) {
                    japaneseEraSelect.value = era.name;
                    japaneseEraYearInput.value = year - era.start.year + 1;
                            // 해당 연도에 시작하는 연호와 끝나는 연호를 찾기
                    const startingEra = eras.find(e => e.start.year === year);
                    const endingEra = eras.find(e => e.end?.year === year);
                    
                    // 연호 변경 안내 메시지
                    if (startingEra && endingEra) {
                        // 한 해에 연호가 바뀌는 경우 (예: 2019년)
                        const messages = {
                            'en': `Era Change: ${endingEra.name} → ${startingEra.name}\n` +
                                 `${endingEra.name} (${endingEra.kanji}): Until ${endingEra.end.month}/${endingEra.end.day}\n` +
                                 `${startingEra.name} (${startingEra.kanji}): From ${startingEra.start.month}/${startingEra.start.day}`,
                            'ja': `元号変更：${endingEra.kanji} → ${startingEra.kanji}\n` +
                                 `${endingEra.kanji}：${endingEra.end.month}月${endingEra.end.day}日まで\n` +
                                 `${startingEra.kanji}：${startingEra.start.month}月${startingEra.start.day}日より`
                        };
                        showEraNotice(messages[currentLang] || messages['en']);
                    } else if (endingEra) {
                        const messages = {
                            'en': `${endingEra.name} (${endingEra.kanji}) era ends on ${endingEra.end.month}/${endingEra.end.day}`,
                            'ja': `${endingEra.kanji}は${endingEra.end.month}月${endingEra.end.day}日まで`
                        };
                        showEraNotice(messages[currentLang] || messages['en']);
                    } else if (startingEra) {
                        const messages = {
                            'en': `${startingEra.name} (${startingEra.kanji}) era begins from ${startingEra.start.month}/${startingEra.start.day}`,
                            'ja': `${startingEra.kanji}は${startingEra.start.month}月${startingEra.start.day}日より`
                        };
                        showEraNotice(messages[currentLang] || messages['en']);
                    } else {
                        showEraNotice("");
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                japaneseEraYearInput.value = '';
                showEraNotice("");
                showError("errorDateOutOfRange");
            }
        } finally {
            isUpdating = false;
        }
    }

    function convertToWestern() {
        if (isUpdating) return;
        isUpdating = true;
        try {
            clearError();
            showEraNotice("");
            const eraName = japaneseEraSelect.value;
            const yearInEraStr = japaneseEraYearInput.value;
            if (!yearInEraStr) {
                westernYearInput.value = '';
                showEraNotice("");
                return;
            }
            const yearInEra = parseInt(yearInEraStr, 10);
            if (isNaN(yearInEra) || yearInEra <= 0) {
                westernYearInput.value = '';
                showEraNotice("");
                showError("errorPositiveYear");
                return;
            }
            const era = eras.find(e => e.name === eraName);
            if (!era) {
                westernYearInput.value = '';
                showEraNotice("");
                showError("errorEraNotFound", { eraName });
                return;
            }
            const westernYear = era.start.year + yearInEra - 1;
            westernYearInput.value = westernYear;

            // 해당 연도에 시작하는 연호와 끝나는 연호를 찾기
            const startingEra = eras.find(e => e.start.year === westernYear);
            const endingEra = eras.find(e => e.end?.year === westernYear);
            
            // 연호 변경 안내 메시지
            if (startingEra && endingEra) {
                const messages = {
                    'en': `⚠️ Important: The Japanese era changes in this year\n` +
                         `• ${endingEra.name} era (${endingEra.kanji}) continues until ${endingEra.end.month}/${endingEra.end.day}\n` +
                         `• New ${startingEra.name} era (${startingEra.kanji}) begins from ${startingEra.start.month}/${startingEra.start.day}`,
                    'ja': `⚠️ ご注意：この年で元号が変わります\n` +
                         `• ${endingEra.end.month}月${endingEra.end.day}日まで：${endingEra.kanji}（${endingEra.name}）時代\n` +
                         `• ${startingEra.start.month}月${startingEra.start.day}日から：新しい${startingEra.kanji}（${startingEra.name}）時代`
                };
                showEraNotice(messages);
            } else if (endingEra) {
                const messages = {
                    'en': `⚠️ Note: The ${endingEra.name} era (${endingEra.kanji}) ends on ${endingEra.end.month}/${endingEra.end.day} of this year`,
                    'ja': `⚠️ ご注意：この年の${endingEra.end.month}月${endingEra.end.day}日で${endingEra.kanji}（${endingEra.name}）時代が終わります`
                };
                showEraNotice(messages);
            } else if (startingEra) {
                const messages = {
                    'en': `⚠️ Note: The new ${startingEra.name} era (${startingEra.kanji}) begins from ${startingEra.start.month}/${startingEra.start.day} of this year`,
                    'ja': `⚠️ ご注意：この年の${startingEra.start.month}月${startingEra.start.day}日から新しい${startingEra.kanji}（${startingEra.name}）時代が始まります`
                };
                showEraNotice(messages[currentLang] || messages['en']);
            } else {
                showEraNotice("");
            }
        } finally {
            isUpdating = false;
        }
    }

    function clearAll() {
        isUpdating = true;
        westernYearInput.value = '';
        japaneseEraSelect.value = eras[0].name;
        japaneseEraYearInput.value = '';
        showEraNotice("");
        clearError();
        isUpdating = false;
    }

    function getInitialLanguage() {
        const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang && translations[savedLang]) {
            return savedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            return browserLang;
        }
        return DEFAULT_LANG;
    }

    // --- Initialization ---
    populateEraDropdown();

    // Add event listeners for lang switcher
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.lang);
        });
    });

    setLanguage(getInitialLanguage());

    // --- Event Listeners ---
    // Automatically convert as the user types in either field.
    westernYearInput.addEventListener('input', convertToJapanese);
    japaneseEraSelect.addEventListener('change', convertToWestern);
    japaneseEraYearInput.addEventListener('input', convertToWestern);
    if (clearButton) {
        clearButton.addEventListener('click', clearAll);
    }
});
