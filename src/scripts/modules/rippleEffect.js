export const rippleEffect = (rippleClass) => {
    document.addEventListener('pointerdown', (event) => {
        const target = event.target.closest(`.${rippleClass}`);
        if (!target) {
            return
        };

        const rectangles = target.getBoundingClientRect();
        const offsetX = event.clientX - rectangles.left;
        const offsetY = event.clientY - rectangles.top;

        const maxX = Math.max(offsetX, rectangles.width - offsetX);
        const maxY = Math.max(offsetY, rectangles.height - offsetY);
        const radius = Math.sqrt(maxX ** 2 + maxY ** 2);

        // Ripple container
        const container = document.createElement('div');
        container.className = 'ripple_container pointer-events-none absolute inset-0 overflow-hidden text-transparent [transform:perspective(0)]';
        target.appendChild(container);

        // Ripple element
        const ripple = document.createElement('div');
        Object.assign(ripple.style, {
            position: 'absolute',
            top: `${offsetY - radius}px`,
            left: `${offsetX - radius}px`,
            width: `${2 * radius}px`,
            height: `${2 * radius}px`,
            borderRadius: '50%',
            backgroundColor: `rgba${getComputedStyle(target).color.slice(3, -1)}, 0.18`,
            transform: 'scale(0)',
            opacity: '1',
            transition: 'opacity 700ms ease-in-out, transform 700ms ease-in-out',
        });
        ripple.className = 'rounded-full dark:bg-colorDarkTextTrans2';

        container.appendChild(ripple);

        // Animate
        requestAnimationFrame(() => {
            ripple.style.transform = 'scale(1)';
        });

        // Fade out after pointer up or timeout
        const fadeOut = () => {
            ripple.style.opacity = '0';

            setTimeout(() => {
                container.remove();
            }, 700); // Match transition duration
        };

        const handleMove = (eventHandleMove) => {
            if (Math.sqrt(eventHandleMove.clientX - event.clientX ** 2 + eventHandleMove.clientY - event.clientY ** 2) > radius / 2) {
                fadeOut();
                removeListeners();
            }
        };

        const handleEnd = () => {
            fadeOut();
            removeListeners();
        };

        const removeListeners = () => {
            document.removeEventListener('pointerup', handleEnd);
            document.removeEventListener('pointercancel', handleEnd);
            document.removeEventListener('pointermove', handleMove);
        };

        document.addEventListener('pointerup', handleEnd);
        document.addEventListener('pointercancel', handleEnd);
        document.addEventListener('pointermove', handleMove);
    });
};
