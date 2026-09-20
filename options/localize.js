// Automatically translate __MSG_ keys in the DOM since this is a custom options page
document.addEventListener("DOMContentLoaded", () => {
    const replaceText = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(/__MSG_(\w+)__/g, (match, key) => {
                return chrome.i18n.getMessage(key) || match;
            });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let attr of node.attributes) {
                attr.value = attr.value.replace(/__MSG_(\w+)__/g, (match, key) => {
                    return chrome.i18n.getMessage(key) || match;
                });
            }
            for (let child of node.childNodes) {
                replaceText(child);
            }
        }
    };
    replaceText(document.documentElement);
    document.title = document.title.replace(/__MSG_(\w+)__/g, (match, key) => {
        return chrome.i18n.getMessage(key) || match;
    });
});
