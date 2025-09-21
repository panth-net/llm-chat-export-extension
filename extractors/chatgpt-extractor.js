// Universal LLM Conversation Exporter - ChatGPT Extractor (Simplified and More Robust)

class ChatGPTExtractor {
    constructor() {
        this.selectors = {
            // Just get all article elements - much simpler
            conversationTurn: 'article',
            authorRoleElement: '[data-message-author-role]',
            // Keep UI elements removal for cleaner text
            uiElementsToRemove: '[data-testid="copy-turn-action-button"], [aria-label="Edit message"], [aria-label="More actions"], button, .sr-only',
        };
    }

    /**
     * Entry point for extraction.
     */
    extractConversation() {
        console.log('ChatGPTExtractor: Starting simple article text extraction...');
        const messages = [];
        const articles = document.querySelectorAll(this.selectors.conversationTurn);

        if (articles.length === 0) {
            console.error('No articles found on page');
            throw new Error('No conversation articles found. Make sure you are on a ChatGPT conversation page.');
        }

        console.log(`Found ${articles.length} articles.`);

        for (const article of articles) {
            try {
                const message = this.extractMessageFromArticle(article);
                if (message) {
                    messages.push(message);
                }
            } catch (error) {
                console.warn('Could not extract message from article:', error);
            }
        }

        console.log(`Successfully extracted ${messages.length} messages.`);
        return messages;
    }

    /**
     * Extracts a single message object from an article element.
     * Simplified approach - just get all text from the article.
     */
    extractMessageFromArticle(articleElement) {
        // 1. Try to find the role element to determine if this is user or assistant
        const roleElement = articleElement.querySelector(this.selectors.authorRoleElement);
        let role = 'unknown';

        if (roleElement) {
            role = roleElement.getAttribute('data-message-author-role') || 'unknown';
        } else {
            // Fallback: try to determine role from content or position
            const text = articleElement.innerText || '';
            if (text.toLowerCase().includes('you said:') || text.toLowerCase().includes('you:')) {
                role = 'user';
            } else if (text.toLowerCase().includes('chatgpt said:') || text.toLowerCase().includes('chatgpt:')) {
                role = 'assistant';
            }
        }

        // 2. Clone the article to avoid modifying the live page
        const articleClone = articleElement.cloneNode(true);

        // 3. Remove UI elements for cleaner text
        const uiElements = articleClone.querySelectorAll(this.selectors.uiElementsToRemove);
        uiElements.forEach(el => el.remove());

        // 4. FORMATTING FIX: Get HTML content to preserve structure, fallback to text
        let content = '';
        try {
            // Try to get HTML content first to preserve formatting
            content = articleClone.innerHTML || articleClone.innerText || '';
        } catch (error) {
            // Fallback to text content if innerHTML fails
            content = articleClone.innerText || '';
        }

        if (content.trim().length === 0) {
            return null; // Skip empty articles
        }

        return {
            role: role,
            content: content.trim(),
        };
    }
}

/**
 * Main execution logic for the content script.
 * Listens for the message from the background script to start extraction.
 */
if (typeof window.chatGPT_extractor_injected === 'undefined') {
    window.chatGPT_extractor_injected = true;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'extractConversation') {
            try {
                const extractor = new ChatGPTExtractor();
                const conversationData = extractor.extractConversation();

                if (conversationData && conversationData.length > 0) {
                    // Generate filename: first_ten_chars_of_url_datetime_with_underscores
                    const url = window.location.href;
                    const urlStart = url.replace(/^https?:\/\//, '').substring(0, 10).replace(/[^a-z0-9]/gi, '_');
                    const now = new Date();
                    const datetime = now.toISOString().replace(/[-:T]/g, '_').split('.')[0]; // YYYY_MM_DD_HH_MM_SS
                    const filename = `${urlStart}_${datetime}.txt`;

                    // Use the content processor for consistent formatting
                    const contentProcessor = new window.ContentProcessor();
                    const formattedContent = contentProcessor.processConversation(
                        conversationData,
                        'text',
                        {
                            includeTimestamps: false,
                            includeMetadata: true,
                            platform: 'ChatGPT',
                            url: url
                        }
                    );

                    sendResponse({
                        success: true,
                        content: formattedContent,
                        filename: filename,
                    });
                } else {
                    throw new Error('No valid messages were extracted from the page.');
                }
            } catch (error) {
                console.error('Extraction failed in content script:', error);
                sendResponse({ success: false, error: error.message });
            }
        }
        return true; // Keep message channel open for async response.
    });
}

