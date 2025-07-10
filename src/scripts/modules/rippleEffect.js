export const rippleEffect = (rippleClass) => {
    // Store the current ripple element for later removal
    let elcreativeRipple;

    // Listen for pointer down events on the document
    document.addEventListener('pointerdown', (event) => {
        // Get the target element of the event
        let rippleTarget = event.target;

        // Remove the previous ripple element after 400ms
        if (elcreativeRipple) {
            elcreativeRipple.remove();
            elcreativeRipple = null;
        }

        // Find the closest ancestor element with the specified ripple class
        while (rippleTarget && rippleTarget.classList && !rippleTarget.classList.contains(rippleClass)) {
            rippleTarget = rippleTarget.parentNode;
        }

        // If a target element with the ripple class is found
        if (rippleTarget && rippleTarget.classList && rippleTarget.classList.contains(rippleClass)) {
            // Get the bounding rectangle of the target element
            const rect = rippleTarget.getBoundingClientRect();

            // Calculate the position of the ripple relative to the target element
            const rippleAxisX = event.clientX - rect.left;
            const rippleAxisY = event.clientY - rect.top;

            // Calculate the width and height of the ripple based on the position
            const rippleWidth = Math.max(rippleAxisX, rippleTarget.offsetWidth - rippleAxisX);
            const rippleHeight = Math.max(rippleAxisY, rippleTarget.offsetHeight - rippleAxisY);

            // Calculate the diameter of the ripple
            const rippleDiameter = Math.sqrt(rippleWidth * rippleWidth + rippleHeight * rippleHeight);

            // Get the color of the target element and create a transparent version
            const rippleParentColor = getComputedStyle(rippleTarget).color;
            const rippleParentColorTransparent = `rgba${rippleParentColor.slice(3, -1)}, 0.18`;

            // Create the ripple container element
            const rippleContainer = document.createElement('div');
            rippleContainer.classList.add(
                'ripple_container',
                'pointer-events-none',
                'absolute',
                'inset-0',
                'overflow-hidden',
                'text-transparent',
                '[transform:perspective(0)]'
            );

            // Append the ripple container to the target element
            rippleTarget.appendChild(rippleContainer);

            // Create the ripple element
            const rippleElement = document.createElement('div');

            // Set the position, size, and style of the ripple element
            rippleElement.style.top = rippleAxisY - rippleDiameter + 'px';
            rippleElement.style.left = rippleAxisX - rippleDiameter + 'px';
            rippleElement.style.height = 2 * rippleDiameter + 'px';
            rippleElement.style.width = 2 * rippleDiameter + 'px';
            rippleElement.style.borderRadius = '50%';
            rippleElement.style.backgroundColor = rippleParentColorTransparent;
            rippleElement.classList.add(
                'absolute',
                'rounded-full',
                'transition-[opacity,transform]',
                'duration-700',
                'ease-in-out',
                'dark:bg-colorDarkTextTrans2'
            );

            // Append the ripple element to the ripple container
            rippleContainer.appendChild(rippleElement);

            // Store the ripple container for later removal
            elcreativeRipple = rippleContainer;

            // Animate the ripple
            rippleElement.style.transform = 'scale(0)';
            rippleElement.style.opacity = '1';
            setTimeout(() => {
                rippleElement.style.transform = 'scale(1)';
            }, 24);

            // Handle pointer up, pointer cancel, and pointer move events
            const handlePointerUp = () => {
                // Remove event listeners
                document.removeEventListener('pointerup', handlePointerUp);
                document.removeEventListener('pointercancel', handlePointerUp);
                document.removeEventListener('pointermove', handlePointerMove);

                // Fade out the ripple
                rippleElement.style.opacity = '0';
            };

            const handlePointerMove = (event) => {
                // Calculate the new position of the ripple
                const newRippleAxisX = event.clientX - rect.left;
                const newRippleAxisY = event.clientY - rect.top;

                // Calculate the distance the pointer has moved
                const distance = Math.sqrt(
                    (newRippleAxisX - rippleAxisX) * (newRippleAxisX - rippleAxisX) +
                    (newRippleAxisY - rippleAxisY) * (newRippleAxisY - rippleAxisY)
                );

                // If the pointer moves too far, cancel the ripple
                if (distance > rippleDiameter / 2) {
                    handlePointerUp();
                }
            };

            // Add event listeners for pointer up, pointer cancel, and pointer move
            document.addEventListener('pointerup', handlePointerUp);
            document.addEventListener('pointercancel', handlePointerUp);
            document.addEventListener('pointermove', handlePointerMove);
        }
    });
};
