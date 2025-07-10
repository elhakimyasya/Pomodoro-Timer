let backgroundInterval;

browser.browserAction.enable();

const playAlarmSound = () => {
    const audio = new Audio(browser.runtime.getURL('src/audios/alarm.mp3'));
    audio.loop = false;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();

    gainNode.gain.value = 0.3;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audio.play().catch((e) => {
        console.warn('Autoplay blocked:', e);
    });
};


const showNotification = () => {
    browser.notifications.create({
        type: 'basic',
        iconUrl: 'src/images/icons/mipmap-mdpi/icon.png',
        title: 'Waktu Habis!',
        message: 'Timer kamu sudah selesai.'
    });
}

const updateBadge = async () => {
    const { timerData } = await browser.storage.local.get('timerData');
    const { isRunning, startTime, duration } = timerData || {};
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

        if (timerData?.next?.duration) {
            const nextDuration = timerData.next.duration;
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

        playAlarmSound();
        showNotification();

        return;
    }

    const remainingMin = Math.ceil(remaining / 60000);
    await browser.browserAction.setBadgeText({ text: `${remainingMin}` });
    await browser.browserAction.setBadgeBackgroundColor({ color: '#c62828' });
};

const startBackgroundTimer = () => {
    clearInterval(backgroundInterval);

    updateBadge();

    backgroundInterval = setInterval(updateBadge, 1000);
};

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    switch (message.type) {
        case 'START_TIMER': {
            const durationMs = message.durationInMinutes * 60000;
            browser.storage.local.set({
                timerData: {
                    isRunning: true,
                    startTime: Date.now(),
                    duration: durationMs
                }
            }).then(startBackgroundTimer);
            break;
        }
        case 'STOP_TIMER':
            browser.storage.local.remove('timerData').then(() => {
                browser.browserAction.setBadgeText({ text: '' });
                clearInterval(backgroundInterval);
            });
            break;
        case 'PAUSE_TIMER':
            browser.storage.local.get('timerData').then(({ timerData }) => {
                const now = Date.now();
                const remaining = (timerData?.startTime || 0) + (timerData?.duration || 0) - now;

                const remainingMin = Math.ceil(remaining / 60000);

                browser.storage.local.set({
                    timerData: {
                        isRunning: false,
                        duration: Math.max(0, remaining)
                    }
                }).then(() => {
                    browser.browserAction.setBadgeText({ text: `${remainingMin}` });
                    browser.browserAction.setBadgeBackgroundColor({ color: '#c62828' });
                    clearInterval(backgroundInterval);
                });
            });
            break;
        case 'RESUME_TIMER':
            const now = Date.now();
            const durationMs = message.durationInMs;

            browser.storage.local.set({
                timerData: {
                    isRunning: true,
                    startTime: now,
                    duration: durationMs
                }
            }).then(startBackgroundTimer);

            break;
        case 'GET_TIMER':
            browser.storage.local.get('timerData').then(({ timerData }) => sendResponse(timerData));
            return true; // Keep response channel open
        case 'UPDATE_BADGE':
            startBackgroundTimer();
            break;
    }

    return true;
});
