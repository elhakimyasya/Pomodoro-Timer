let countdownInterval;
let isPaused = false;
let pausedRemaining = 0;
let previousDuration = 0;

export const timerStart = (duration) => {
    browser.runtime.sendMessage({
        type: 'START_TIMER',
        durationInMinutes: duration
    });
};

export const timerStop = () => {
    browser.runtime.sendMessage({ type: 'STOP_TIMER' });
};

export const timerPause = () => {
    browser.runtime.sendMessage({ type: 'PAUSE_TIMER' });
};

export const timer = () => {
    const containerForm = document.querySelector('.element_form');
    const containerTimer = document.querySelector('.element_timer');
    const containerDone = document.querySelector('.element_done');

    if (!containerForm || !containerTimer || !containerDone) return;

    const selectDuration = containerForm.querySelector('.select_duration');

    const containerCustomInput = containerForm.querySelector('.container_custom_input');
    const inputCustomDuration = containerCustomInput.querySelector('.input_duration_custom');

    const timeDisplay = containerTimer.querySelector('.element_time');

    const buttonStop = containerTimer.querySelector('.button_stop');
    const buttonPause = containerTimer.querySelector('.button_play_pause');

    const buttonNew = containerDone.querySelector('.button_new');
    const buttonBreak = containerDone.querySelector('.button_break');

    const toggle = (hide = [], show = []) => {
        hide.forEach(element => element?.classList?.add('hidden', 'opacity-0'));
        hide.forEach(element => element?.classList?.remove('flex'));
        show.forEach(element => element?.classList?.remove('hidden', 'opacity-0'));
        show.forEach(element => element?.classList?.add('flex'));
    };

    const updateFormUI = () => {
        const isCustom = selectDuration.value === 'custom';
        containerCustomInput.classList.toggle('hidden', !isCustom);
        inputCustomDuration.disabled = !isCustom;
        inputCustomDuration.required = isCustom;

        if (!isCustom) {
            inputCustomDuration.value = ''
        };
    };

    const addDurationOptions = () => {
        const fragments = document.createDocumentFragment();
        for (let minutes = 5; minutes <= 60; minutes += 5) {
            const options = document.createElement('option');
            options.value = minutes;
            options.textContent = `${minutes} ${browser.i18n?.getMessage('minutes') || 'Minutes'}`;

            fragments.appendChild(options);
        }
        selectDuration.appendChild(fragments);
    };

    const startCountdown = (start, duration) => {
        let localStartTime = start;

        const tick = () => {
            if (isPaused) return;

            const now = Date.now();
            const remaining = Math.max(0, localStartTime + duration - now);

            const min = Math.floor(remaining / 60000).toString().padStart(2, '0');
            const sec = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
            timeDisplay.textContent = `${min}:${sec}`;

            if (remaining <= 0) {
                clearInterval(countdownInterval);
                toggle([containerTimer, containerForm], [containerDone]);
            }

            pausedRemaining = Math.max(0, localStartTime + duration - Date.now());
        };

        clearInterval(countdownInterval);

        tick();

        countdownInterval = setInterval(tick, 1000);
    };

    const checkExistingTimer = () => {
        browser.storage.local.get('timerData').then(({ timerData }) => {
            const { isRunning, startTime, duration, isFinished } = timerData || {};
            const now = Date.now();

            if (isRunning && startTime && duration && now < startTime + duration) {
                toggle([containerForm, containerDone], [containerTimer]);
                isPaused = false;
                startCountdown(startTime, duration);
                previousDuration = duration;
            } else if (!isRunning && duration && !isFinished) {
                toggle([containerForm, containerDone], [containerTimer]);
                isPaused = true;
                pausedRemaining = duration;

                const min = Math.floor(duration / 60000).toString().padStart(2, '0');
                const sec = Math.floor((duration % 60000) / 1000).toString().padStart(2, '0');
                timeDisplay.textContent = `${min}:${sec}`;

                buttonPause.querySelector('.play').classList.remove('hidden');
                buttonPause.querySelector('.pause').classList.add('hidden');
                buttonPause.querySelector('span').textContent = browser.i18n.getMessage('resume_session') || 'Resume Session';

                clearInterval(countdownInterval);
            } else if (isFinished || (startTime && duration && now >= startTime + duration)) {
                toggle([containerForm, containerTimer], [containerDone]);
                clearInterval(countdownInterval);
            } else {
                toggle([containerTimer, containerDone], [containerForm]);
                clearInterval(countdownInterval);
            }
        });
    };


    containerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        updateFormUI();

        const values = selectDuration.value === 'custom' ? parseInt(inputCustomDuration.value.trim(), 10) : parseInt(selectDuration.value, 10);
        if (isNaN(values) || values <= 0) {
            return inputCustomDuration.focus()
        };

        previousDuration = values * 60000;
        timerStart(values);
        toggle([containerForm, containerDone], [containerTimer]);
        startCountdown(Date.now(), previousDuration);
    });

    buttonStop.addEventListener('click', (event) => {
        event.preventDefault();

        browser.storage.local.remove('timerData');

        clearInterval(countdownInterval);
        toggle([containerTimer, containerDone], [containerForm]);
        timerStop();
    });

    buttonPause.addEventListener('click', (event) => {
        event.preventDefault();

        isPaused = !isPaused;

        if (isPaused) {
            timerPause();
            buttonPause.querySelector('.play').classList.remove('hidden');
            buttonPause.querySelector('.pause').classList.add('hidden');

            buttonPause.querySelector('span').textContent = browser.i18n.getMessage('resume_session') || 'Resume Session';

            clearInterval(countdownInterval);
        } else {
            buttonPause.querySelector('.play').classList.add('hidden');
            buttonPause.querySelector('.pause').classList.remove('hidden');

            buttonPause.querySelector('span').textContent = browser.i18n.getMessage('pause_session') || 'Pause Session';

            browser.runtime.sendMessage({
                type: 'RESUME_TIMER',
                durationInMs: pausedRemaining
            });

            startCountdown(Date.now(), pausedRemaining);
        }
    });

    buttonNew.addEventListener('click', (event) => {
        event.preventDefault();

        browser.storage.local.remove('timerData');
        toggle([containerTimer, containerDone], [containerForm]);
    });

    buttonBreak.addEventListener('click', (event) => {
        event.preventDefault();

        previousDuration = previousDuration || 25 * 60000;
        const breakDuration = Math.min(5, Math.floor(previousDuration / 60000)) * 60000;

        browser.storage.local.set({
            timerData: {
                isRunning: true,
                startTime: Date.now(),
                duration: breakDuration,
                next: {
                    duration: previousDuration
                }
            }
        });

        toggle([containerForm, containerDone], [containerTimer]);
        isPaused = false;
        startCountdown(Date.now(), breakDuration);
    });


    selectDuration.addEventListener('change', updateFormUI);
    addDurationOptions();
    checkExistingTimer();
};
