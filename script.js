document.addEventListener('DOMContentLoaded', () => {
    const eras = [
        { name: "Reiwa", kanji: "令和", start: 2019 },
        { name: "Heisei", kanji: "平成", start: 1989 },
        { name: "Shōwa", kanji: "昭和", start: 1926 },
        { name: "Taishō", kanji: "大正", start: 1912 },
        { name: "Meiji", kanji: "明治", start: 1868 },
    ];

    const westernYearInput = document.getElementById('western-year');
    const japaneseEraSelect = document.getElementById('japanese-era');
    const japaneseEraYearInput = document.getElementById('japanese-era-year');
    const errorMessage = document.getElementById('error-message');
    const clearButton = document.getElementById('clear-button');

    // A flag to prevent chained event listeners from creating unwanted "corrections".
    let isUpdating = false;

    function clearError() {
        errorMessage.textContent = '';
    }

    function showError(message) {
        errorMessage.textContent = message;
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
                showError("Please enter a valid Western year.");
                return;
            }

            const oldestEra = eras[eras.length - 1];
            if (year < oldestEra.start) {
                // For partial or invalid years, clear the result fields.
                japaneseEraYearInput.value = '';
                japaneseEraSelect.value = eras[0].name; // Reset dropdown to default

                // Only show an error if the user has likely finished typing a full year (4 digits).
                if (yearStr.length >= 4) {
                    showError(`Year must be ${oldestEra.start} or later.`);
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
                showError("Please enter a positive year for the era.");
                return;
            }

            const eraIndex = eras.findIndex(e => e.name === eraName);
            const era = eras[eraIndex];

            // This check is mostly for safety, as the dropdown should prevent this.
            if (!era) {
                westernYearInput.value = '';
                showError(`Era '${eraName}' not found.`);
                return;
            }

            // Validate that the year is within the bounds of the era.
            // The next chronological era is the one before it in the array.
            if (eraIndex > 0) { // Any era except the first one (Reiwa)
                const nextEra = eras[eraIndex - 1];
                const maxYearInEra = nextEra.start - era.start;
                if (yearInEra > maxYearInEra) {
                    westernYearInput.value = '';
                    showError(`${era.name} era ended in year ${maxYearInEra}.`);
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

    // --- Event Listeners ---
    // Automatically convert as the user types in either field.
    westernYearInput.addEventListener('input', convertToJapanese);
    japaneseEraSelect.addEventListener('change', convertToWestern);
    japaneseEraYearInput.addEventListener('input', convertToWestern);
    if (clearButton) {
        clearButton.addEventListener('click', clearAll);
    }
});
