// theme.js

document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const body = document.body;
    const themeClassName = 'theme-mondrian';

    // On page load, apply the saved theme
    if (localStorage.getItem('theme') === 'mondrian') {
        body.classList.add(themeClassName);
    }

    // Event listener for the theme switcher button (only on index.html)
    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            // Toggle the theme class
            body.classList.toggle(themeClassName);

            // Save the current state to localStorage
            if (body.classList.contains(themeClassName)) {
                localStorage.setItem('theme', 'mondrian');
            } else {
                localStorage.removeItem('theme');
            }
        });
    }
});