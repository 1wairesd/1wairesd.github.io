export class ThemeManager {
    constructor(toggleButton) {
        this.toggleButton = toggleButton;
        this.toggleButton.addEventListener('click', this.toggleTheme.bind(this));
        this.updateButtonText();
    }

    toggleTheme() {
        document.body.classList.toggle('light-mode');
        this.updateButtonText();
    }

    updateButtonText() {
        this.toggleButton.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
    }
}