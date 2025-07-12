let timerCountdownInterval;
let timerIsPaused = false;
let timerPausedRemaining = 0;
let timerPreviousDuration = 0;
let timerAudio = null;
let timerAudioContext = null;
let backgroundInterval;

export const timerAudioPlay = () => {
    const audio = new Audio(browser.runtime.getURL('src/audios/alarm.mp3'));
    audio.loop = false;

    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();

    gainNode.gain.value = 0.3;

    audioContext.createMediaElementSource(audio).connect(gainNode);
    gainNode.connect(audioContext.destination);

    timerAudio = audio;
    timerAudioContext = audioContext;

    audio.play().catch((error) => {
        console.warn('Autoplay Blocked:', error);
    });
};

export const timerAudioStop = () => {
    if (timerAudio) {
        timerAudio.pause();
        timerAudio.currentTime = 0;
        timerAudio = null;
    }

    if (timerAudioContext) {
        if (timerAudioContext.state !== 'closed') {
            timerAudioContext.close().catch((e) => {
                console.warn('AudioContext close failed:', e);
            });
        }
        timerAudioContext = null;
    }
};

export const updateBadge = async () => {
    const { timerData } = await browser.storage.local.get('timerData');
    const { isRunning, startTime, duration, next } = timerData || {};
    const now = Date.now();
    const end = (startTime || 0) + (duration || 0);
    const remaining = end - now;

    if (!isRunning || !startTime || !duration) {
        await browser.browserAction.setBadgeText({ text: '' });
        clearInterval(backgroundInterval);
        return;
    }

    if (remaining <= 0) {
        await browser.browserAction.setBadgeText({ text: '' });
        clearInterval(backgroundInterval);

        if (next?.duration) {
            const nextDuration = next.duration;
            await browser.storage.local.set({
                timerData: {
                    isRunning: true,
                    startTime: Date.now(),
                    duration: nextDuration
                }
            });
            startBackgroundTimer();
        } else {
            await browser.storage.local.set({
                timerData: {
                    isRunning: false,
                    startTime,
                    duration,
                    isFinished: true
                }
            });
        }

        timerAudioPlay();
        return;
    }

    const remainingMin = Math.ceil(remaining / 60000);
    await browser.browserAction.setBadgeText({ text: `${remainingMin}` });
    await browser.browserAction.setBadgeBackgroundColor({ color: '#c62828' });
};

export const startBackgroundTimer = () => {
    clearInterval(backgroundInterval);

    updateBadge();

    backgroundInterval = setInterval(updateBadge, 1000);
};

export const timer = () => {
    const containerForm = document.querySelector('.element_form');
    const containerTimer = document.querySelector('.element_timer');
    const containerDone = document.querySelector('.element_done');

    if (!containerForm || !containerTimer || !containerDone) {
        return
    };

    const selectDuration = containerForm.querySelector('.select_duration');

    const containerCustomInput = containerForm.querySelector('.container_custom_input');
    const inputCustomDuration = containerCustomInput.querySelector('.input_duration_custom');

    const timeDisplay = containerTimer.querySelector('.element_time');

    const buttonStop = containerTimer.querySelector('.button_stop');
    const buttonPause = containerTimer.querySelector('.button_play_pause');

    const buttonNew = containerDone.querySelector('.button_new');
    const buttonBreak = containerDone.querySelector('.button_break');

    const timerToggleDisplay = (hide = [], show = []) => {
        hide.forEach(element => element?.classList?.add('hidden', 'opacity-0'));
        hide.forEach(element => element?.classList?.remove('flex'));

        show.forEach(element => element?.classList?.remove('hidden', 'opacity-0'));
        show.forEach(element => element?.classList?.add('flex'));
    };

    const timerToggleCustomInputDisplay = () => {
        const elementInputValues = selectDuration.value === 'custom';

        containerCustomInput.classList.toggle('hidden', !elementInputValues);

        containerCustomInput.disabled = !elementInputValues;
        inputCustomDuration.required = true;
        inputCustomDuration.disabled = false;

        if (!elementInputValues) {
            containerCustomInput.value = '';
            inputCustomDuration.required = false;
            inputCustomDuration.disabled = true;
        }
    };

    const timerAddOptionsDurations = () => {
        const fragments = document.createDocumentFragment();
        for (let minutes = 5; minutes <= 60; minutes += 5) {
            const options = document.createElement('option');
            options.value = minutes;
            options.textContent = `${minutes} ${browser.i18n?.getMessage('minutes') || 'Minutes'}`;

            fragments.appendChild(options);
        }

        selectDuration.appendChild(fragments);
    };

    const timerStartCountdown = (start, duration) => {
        let localStartTime = start;

        const timerTick = () => {
            if (timerIsPaused) {
                return
            };

            const remaining = Math.max(0, localStartTime + duration - Date.now());

            timeDisplay.textContent = `${Math.floor(remaining / 60000).toString().padStart(2, '0')}:${Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0')}`;

            if (remaining <= 0) {
                clearInterval(timerCountdownInterval);
                timerToggleDisplay([containerTimer, containerForm], [containerDone]);
            }

            timerPausedRemaining = Math.max(0, localStartTime + duration - Date.now());
        };

        clearInterval(timerCountdownInterval);
        timerTick();

        timerCountdownInterval = setInterval(timerTick, 1000);
    };

    const timerCheckExisting = () => {
        browser.storage.local.get('timerData').then(({ timerData }) => {
            const { isRunning, startTime, duration, isFinished } = timerData || {};
            const now = Date.now();
            if (isRunning && startTime && duration && now < startTime + duration) {
                timerToggleDisplay([containerForm, containerDone], [containerTimer]);
                timerStartCountdown(startTime, duration);

                timerIsPaused = false;
                timerPreviousDuration = duration;
            } else if (!isRunning && duration && !isFinished) {
                timerToggleDisplay([containerForm, containerDone], [containerTimer]);

                timerIsPaused = true;
                timerPausedRemaining = duration;

                timeDisplay.textContent = `${Math.floor(duration / 60000).toString().padStart(2, '0')}:${Math.floor((duration % 60000) / 1000).toString().padStart(2, '0')}`;

                buttonPause.querySelector('.play').classList.remove('hidden');
                buttonPause.querySelector('.pause').classList.add('hidden');
                buttonPause.querySelector('span').textContent = browser.i18n.getMessage('resume_session') || 'Resume Session';

                clearInterval(timerCountdownInterval);
            } else if (isFinished || (startTime && duration && now >= startTime + duration)) {
                timerToggleDisplay([containerForm, containerTimer], [containerDone]);

                clearInterval(timerCountdownInterval);
            } else {
                timerToggleDisplay([containerTimer, containerDone], [containerForm]);

                clearInterval(timerCountdownInterval);
            }
        });
    };

    const timerParse = (inputValue) => {
        const cleaned = inputValue.replace(',', '.').trim();

        const isValid = /^(\d+)?(\.\d{1,2})?$/.test(cleaned);
        if (!isValid) return NaN;

        const floatMinutes = parseFloat(cleaned);
        if (isNaN(floatMinutes) || floatMinutes <= 0) return NaN;

        return floatMinutes * 60000;
    };

    containerForm.addEventListener('submit', (event) => {
        event.preventDefault();

        timerToggleCustomInputDisplay();

        const values = selectDuration.value === 'custom' ? timerParse(inputCustomDuration.value) : parseInt(selectDuration.value, 10) * 60000;
        if (isNaN(values) || values <= 0) {
            return inputCustomDuration.focus();
        }

        timerPreviousDuration = values;

        browser.runtime.sendMessage({ type: 'TIMER_START', durationInMinutes: values / 60000 });

        timerToggleDisplay([containerForm, containerDone], [containerTimer]);

        timerStartCountdown(Date.now(), timerPreviousDuration);
    });

    buttonStop.addEventListener('click', (event) => {
        event.preventDefault();

        browser.storage.local.remove('timerData');
        browser.runtime.sendMessage({ type: 'TIMER_STOP' });
        browser.runtime.sendMessage({ type: 'TIMER_AUDIO_STOP' });

        clearInterval(timerCountdownInterval);
        timerToggleDisplay([containerTimer, containerDone], [containerForm]);
    });

    buttonPause.addEventListener('click', (event) => {
        event.preventDefault();

        timerIsPaused = !timerIsPaused;

        if (timerIsPaused) {
            browser.runtime.sendMessage({ type: 'TIMER_PAUSE' });

            buttonPause.querySelector('.play').classList.remove('hidden');
            buttonPause.querySelector('.pause').classList.add('hidden');

            buttonPause.querySelector('span').textContent = browser.i18n.getMessage('resume_session') || 'Resume Session';

            clearInterval(timerCountdownInterval);
        } else {
            buttonPause.querySelector('.play').classList.add('hidden');
            buttonPause.querySelector('.pause').classList.remove('hidden');

            buttonPause.querySelector('span').textContent = browser.i18n.getMessage('pause_session') || 'Pause Session';

            browser.runtime.sendMessage({ type: 'TIMER_RESUME', durationInMs: timerPausedRemaining });

            timerStartCountdown(Date.now(), timerPausedRemaining);
        }
    });

    buttonNew.addEventListener('click', (event) => {
        event.preventDefault();

        browser.storage.local.remove('timerData');
        browser.runtime.sendMessage({ type: 'TIMER_AUDIO_STOP' });

        timerToggleDisplay([containerTimer, containerDone], [containerForm]);
    });

    buttonBreak.addEventListener('click', (event) => {
        event.preventDefault();

        timerPreviousDuration = timerPreviousDuration || 25 * 60000;
        const breakDuration = Math.min(5, Math.floor(timerPreviousDuration / 60000)) * 60000;

        browser.runtime.sendMessage({ type: 'TIMER_AUDIO_STOP' });
        browser.storage.local.set({
            timerData: {
                isRunning: true,
                startTime: Date.now(),
                duration: breakDuration,
                next: {
                    duration: timerPreviousDuration
                }
            }
        });

        timerToggleDisplay([containerForm, containerDone], [containerTimer]);

        timerIsPaused = false;
        timerStartCountdown(Date.now(), breakDuration);
    });

    selectDuration.addEventListener('change', () => {
        timerToggleCustomInputDisplay()
    });

    timerAddOptionsDurations();
    timerCheckExisting();
};