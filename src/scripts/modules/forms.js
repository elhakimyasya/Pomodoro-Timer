import { snackbar } from "./snackbar";

export const formValidate = () => {
    const inputs = document.querySelectorAll('input[data-type]');

    inputs.forEach(input => {
        const dataType = input.dataset.type;
        input.addEventListener('beforeinput', (event) => {
            const inputData = event.data;
            if (!inputData) return;

            switch (dataType) {
                case 'time': {
                    if (inputData === ',') {
                        event.preventDefault();

                        const start = input.selectionStart;
                        const end = input.selectionEnd;

                        input.setRangeText('.', start, end, 'end');

                        return;
                    }

                    if (!/[\d.]/.test(inputData)) {
                        event.preventDefault();

                        snackbar(browser.i18n.getMessage('form_invalid_character') || 'Only numbers and a single dot are allowed.', 3000);

                        return;
                    }

                    if (inputData === '.' && input.value.includes('.')) {
                        event.preventDefault();

                        snackbar(browser.i18n.getMessage('form_multiple_dots') || 'Only one dot is allowed.', 3000);

                        return;
                    }

                    const futureValue = [
                        input.value.slice(0, input.selectionStart), inputData, input.value.slice(input.selectionEnd),
                    ].join('');

                    const match = futureValue.match(/^(\d*)(\.(\d{0,2})?)?$/);
                    if (!match) {
                        event.preventDefault();

                        snackbar(browser.i18n.getMessage('form_max_two_decimals') || 'Only up to two digits allowed after the decimal point.', 3000);

                        return;
                    }

                    break;
                }

                default:
                    break;
            }
        });

        input.addEventListener('input', () => {
            let value = input.value.replace(/,/g, '.').trim();
            input.value = value;

            switch (dataType) {
                case 'time': {
                    const isValidTime = /^(\d+(\.\d{1,2})?|\.\d{1,2})?$/.test(value);
                    if (value !== '' && !isValidTime) {
                        // snackbar(browser.i18n.getMessage('form_invalid_format') || 'Enter a valid number in minutes, e.g., 1 or 1.5.', 3000);
                    }

                    break;
                }

                default:
                    break;
            }
        });
    });
};