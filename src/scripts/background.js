import { timerAudioPlay, timerAudioStop, updateBadge, startBackgroundTimer } from "./modules/timer";

let backgroundInterval;

browser.browserAction.enable();

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    switch (message.type) {
        case 'TIMER_START':
            browser.storage.local.set({
                timerData: {
                    isRunning: true,
                    startTime: Date.now(),
                    duration: message.durationInMinutes * 60000
                }
            }).then(startBackgroundTimer);

            break;
        case 'TIMER_STOP':
            browser.storage.local.remove('timerData').then(() => {
                browser.browserAction.setBadgeText({ text: '' });
                clearInterval();

                timerAudioStop();
            });

            break;
        case 'TIMER_PAUSE':
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
                    clearInterval();
                });
            });

            break;
        case 'TIMER_RESUME':
            browser.storage.local.set({
                timerData: {
                    isRunning: true,
                    startTime: Date.now(),
                    duration: message.durationInMs
                }
            }).then(startBackgroundTimer);

            break;
        case 'TIMER_AUDIO_STOP':
            timerAudioStop();

            break;
        case 'TIMER_GET':
            browser.storage.local.get('timerData').then(({ timerData }) => {
                sendResponse(timerData);
            });

            return true;
        default:
            break;
    }

    return;
});
