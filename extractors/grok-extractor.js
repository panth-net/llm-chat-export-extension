// Universal LLM Conversation Exporter - Grok Extractor

class GrokExtractor {
    constructor() {
        this.selectors = {
            // Message bubbles containing both user and Grok messages
            messageBubble: 'div[class*="message-bubble"]',

            // Elements to exclude (thinking containers)
            thinkingContainer: 'div[class*="thinking-container"]'
        };
    }

    /**
     * Extract conversation from Grok interface
     */
    extractConversation() {
        console.log('Grok Extractor: Starting extraction...');

        const messages = [];

        // Find all message bubble elements
        const messageBubbles = Array.from(document.querySelectorAll(this.selectors.messageBubble));

        // Filter out thinking containers
        const validMessages = messageBubbles.filter(element => {
            // Check if this element or any parent contains thinking-container class
            let current = element;
            while (current) {
                if (current.className && current.className.includes('thinking-container')) {
                    return false;
                }
                current = current.parentElement;
            }
            return true;
        });

        console.log(`Found ${messageBubbles.length} total message bubbles, ${validMessages.length} valid messages after filtering`);

        // Process each valid message bubble
        validMessages.forEach((element) => {
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
                // Try to determine if this is a user or assistant message
                // This is a simple heuristic - you may need to adjust based on Grok's actual HTML structure
                const isUserMessage = this.isUserMessage(element);
                const role = isUserMessage ? 'user' : 'assistant';
                const prefix = isUserMessage ? 'User: ' : 'Grok: ';

                messages.push({
                    role: role,
                    content: `${prefix}${content.trim()}`
                });
            }
        });

        if (messages.length === 0) {
            throw new Error('No messages found. Make sure you are on a Grok conversation page.');
        }

        console.log(`Grok Extractor: Successfully extracted ${messages.length} messages`);
        return messages;
    }

    /**
     * Determine if a message bubble is from the user
     * This is a heuristic that may need adjustment based on Grok's actual HTML structure
     */
    isUserMessage(element) {
        // Look for common indicators of user messages
        const elementText = element.className || '';
        const parentText = element.parentElement?.className || '';

        // Common patterns for user messages (adjust as needed)
        if (elementText.includes('user') || parentText.includes('user')) {
            return true;
        }

        // If we can't determine, alternate between user and assistant
        // This is a fallback - ideally we'd have better selectors
        const allMessages = Array.from(document.querySelectorAll(this.selectors.messageBubble));
        const index = allMessages.indexOf(element);
        return index % 2 === 0; // Assume first message is user, then alternating
    }

    // All complex methods removed - using simple element selection
}

// Export for use in main extractor
if (typeof window !== 'undefined') {
    window.GrokExtractor = GrokExtractor;
}

// Message listener for content script
if (typeof window.grok_extractor_injected === 'undefined') {
    window.grok_extractor_injected = true;

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'extractConversation') {
            try {
                const extractor = new GrokExtractor();
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
                            platform: 'Grok',
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
                console.error('Grok extraction error:', error);
                sendResponse({
                    success: false,
                    error: error.message,
                });
            }
        }
        return true;
    });
}
