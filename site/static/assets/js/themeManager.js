export class ThemeManager {
    constructor(toggleElement) {
        this.toggleElement = toggleElement;
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // Устанавливаем начальный текст кнопки
        this.toggleElement.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

        // Обработчик клика для переключения темы
        this.toggleElement.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme')
                ? 'light' : 'dark';
            this.setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    setTheme(theme) {
        // Переключаем класс темы на теле документа
        document.body.classList.toggle('dark-theme', theme === 'dark');

        // Обновляем текст на кнопке в зависимости от темы
        this.toggleElement.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

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
