import { easyToggleState } from './libraries/easyToggleState';
import { colorMode } from './modules/colorMode';
import { formValidate } from './modules/forms';
import { rippleEffect } from './modules/rippleEffect';
import { timer } from './modules/timer';
import { translations } from './modules/translations';

const colorModes = localStorage.getItem('color_mode');
document.documentElement.classList.toggle('dark_mode', colorModes === 'dark_mode');

document.addEventListener('DOMContentLoaded', () => {
    timer();

    formValidate();
    translations('data-i18n');
    colorMode('.button_color_mode');
    rippleEffect('elcreative_ripple');
    easyToggleState.window();
});
