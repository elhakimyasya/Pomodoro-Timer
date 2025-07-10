export const colorMode = (options) => {
    document.querySelectorAll(options).forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            // Toggle the color mode in localStorage and update the document class
            const currentColorMode = localStorage.getItem('color_mode');
            if (currentColorMode === 'dark_mode') {
                localStorage.setItem('color_mode', 'light');

                document.documentElement.classList.remove('dark_mode');
            } else {
                localStorage.setItem('color_mode', 'dark_mode');

                document.documentElement.classList.add('dark_mode');
            }
        });
    });
}