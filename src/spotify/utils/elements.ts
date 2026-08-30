export function getSpotifyTitleNodeSelector(): string {
    // Spotify, Mobile Spotify
    return ".M2JmfO14JWCsGSjwzCF5, .Fsb4GXcpqhPtCxW8Dlqx";
}

export function getSpotifyTitleNode(): HTMLElement {
    return document.querySelector(getSpotifyTitleNodeSelector()) as HTMLElement;
}

export function getCurrentPageTitle(): string | null {
    const titleNode = getSpotifyTitleNode();
    if (titleNode) {
        return titleNode.textContent.trim();
    }
    return null;
}