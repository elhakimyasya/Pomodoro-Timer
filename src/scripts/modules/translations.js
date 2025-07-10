export const translations = (selector) => {
    document.querySelectorAll(`[${selector}]`).forEach((element) => {
        const message = browser.i18n.getMessage(element.getAttribute(selector));

        // If no message is found, skip the element
        if (!message) {
            return
        };

        let replaced = false;
        for (const attributes of element.attributes) {
            // Check if the attribute value contains a message placeholder
            if (attributes.value.includes('__MSG_')) {
                const matched = attributes.value.match(/__MSG_(.*?)__/);

                // If a placeholder is found, replace it with the corresponding message
                if (matched) {
                    const messages = browser.i18n.getMessage(matched[1]);

                    // If the message exists, replace the placeholder in the attribute value
                    if (messages) {
                        element.setAttribute(attributes.name, attributes.value.replace(/__MSG_.*?__/, messages));

                        replaced = true;
                    }
                }
            }
        }

        // If no placeholders were replaced, set the text content of the element to the message
        if (!replaced) {
            element.textContent = message;
        }
    });
}