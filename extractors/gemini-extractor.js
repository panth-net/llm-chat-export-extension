// Universal LLM Conversation Exporter - Gemini Extractor

class GeminiExtractor {
    constructor() {
        this.selectors = {
            // User query content
            userQueryContent: 'user-query-content',

            // Gemini message content
            messageContent: 'message-content'
        };
    }

    /**
     * Extract conversation from Gemini interface
     */
    extractConversation() {
        console.log('Gemini Extractor: Starting simple extraction...');

        const messages = [];

        // Find all elements of both types
        const userElements = Array.from(document.querySelectorAll(this.selectors.userQueryContent));
        const geminiElements = Array.from(document.querySelectorAll(this.selectors.messageContent));

        console.log(`Found ${userElements.length} user messages and ${geminiElements.length} Gemini messages`);

        // Combine all elements and sort by their position in the document (top to bottom)
        const allElements = [
            ...userElements.map(el => ({ element: el, type: 'user' })),
            ...geminiElements.map(el => ({ element: el, type: 'assistant' }))
        ];

        // Sort by document position (top to bottom)
        allElements.sort((a, b) => {
            const position = a.element.compareDocumentPosition(b.element);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
                return -1; // a comes before b
            } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
                return 1; // a comes after b
            }
            return 0; // same position
        });

        // Process elements in order
        allElements.forEach(({ element, type }) => {
            // FORMATTING FIX: Get innerHTML to preserve structure, fallback to text
            let content = '';
            try {
                // Try to get HTML content first to preserve formatting
                content = element.innerHTML || element.textContent || element.innerText || '';
            } catch (error) {
                // Fallback to text content if innerHTML fails
                content = element.textContent || element.innerText || '';
            }

            if (content.trim()) {
                const prefix = type === 'user' ? 'User: ' : 'Gemini says: ';
                messages.push({
                    role: type,
                    content: `${prefix}${content.trim()}`
                });
            }
        });

        if (messages.length === 0) {
            throw new Error('No messages found. Make sure you are on a Gemini conversation page.');
        }

        console.log(`Gemini Extractor: Successfully extracted ${messages.length} messages in conversation order`);
        return messages;
    }

    // All complex methods removed - using simple element selection
}

// Export for use in main extractor
if (typeof window !== 'undefined') {
    window.GeminiExtractor = GeminiExtractor;
}

// Message listener for content script
if (typeof window.gemini_extractor_injected === 'undefined') {
    window.gemini_extractor_injected = true;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'extractConversation') {
            try {
                const extractor = new GeminiExtractor();
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
                            platform: 'Gemini',
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
                console.error('Gemini extraction error:', error);
                sendResponse({
                    success: false,
                    error: error.message,
                });
            }
        }
        return true;
    });
}
