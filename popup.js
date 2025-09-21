// Universal LLM Conversation Exporter - Popup Script

class PopupController {
    constructor() {
        this.currentTab = null;
        this.isExporting = false;
        this.init();
    }

    async init() {
        await this.loadCurrentTab();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadCurrentTab() {
        try {
            // Get the current active tab directly
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab) {
                const platform = this.detectPlatform(tab.url);

                this.currentTab = {
                    id: tab.id,
                    url: tab.url,
                    platform: platform
                };
            }
        } catch (error) {
            console.error('Error loading current tab:', error);
        }
    }

    detectPlatform(url) {
        const platformPatterns = {
            chatgpt: [
                /^https?:\/\/chat\.openai\.com/,
                /^https?:\/\/chatgpt\.com/
            ],
            claude: [
                /^https?:\/\/claude\.ai/
            ],
            gemini: [
                /^https?:\/\/gemini\.google\.com/
            ],
            grok: [
                /^https?:\/\/x\.com\/i\/grok/,
                /^https?:\/\/grok\.com\/c\//
            ]
        };

        for (const [platform, patterns] of Object.entries(platformPatterns)) {
            const matches = patterns.some(pattern => pattern.test(url));

            if (matches) {
                return platform;
            }
        }

        return null;
    }

    setupEventListeners() {
        // Export button
        const exportButton = document.getElementById('exportButton');
        exportButton.addEventListener('click', () => {
            this.handleExport();
        });

        // Help link
        document.getElementById('helpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.openHelpPage();
        });
    }

    updateUI() {
        const platformInfo = document.getElementById('platformInfo');
        const exportSection = document.getElementById('exportSection');
        const errorSection = document.getElementById('errorSection');
        const platformName = document.getElementById('platformName');
        const platformStatus = document.getElementById('platformStatus');

        if (!this.currentTab || !this.currentTab.platform) {
            // Show error state
            platformInfo.style.display = 'none';
            exportSection.style.display = 'none';
            errorSection.style.display = 'block';

            const errorText = document.getElementById('errorText');
            errorText.textContent = 'This extension works on ChatGPT, Claude, Gemini, and Grok conversation pages. Please navigate to one of these platforms and open a conversation to export it.';
            return;
        }

        // Show platform info and export section
        platformInfo.style.display = 'block';
        exportSection.style.display = 'block';
        errorSection.style.display = 'none';

        // Update platform display
        const platformNames = {
            chatgpt: 'ChatGPT',
            claude: 'Claude',
            gemini: 'Gemini',
            grok: 'Grok'
        };

        const displayName = platformNames[this.currentTab.platform] || 'Unknown Platform';
        platformName.textContent = displayName;
        platformStatus.className = 'platform-status';
        platformStatus.textContent = '●';
    }

    async handleExport() {
        if (this.isExporting) {
            return;
        }

        try {
            this.isExporting = true;
            this.showLoadingState();

            const format = 'text';
            const includeTimestamps = false;
            const includeMetadata = true;

            const message = {
                action: 'exportConversation',
                format: format,
                tabId: this.currentTab.id,
                platform: this.currentTab.platform,
                options: {
                    includeTimestamps,
                    includeMetadata
                }
            };

            const response = await chrome.runtime.sendMessage(message);

            if (response.success) {
                this.showSuccessState();
                // Auto-close popup after success
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                console.error('Export failed:', response.error);
                this.showErrorState(response.error || 'Export failed');
            }

        } catch (error) {
            console.error('Export error:', error);
            this.showErrorState('An unexpected error occurred during export. Please try again.');
        } finally {
            this.isExporting = false;
        }
    }

    showLoadingState() {
        document.getElementById('exportSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
        document.getElementById('successSection').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'block';
    }

    showSuccessState() {
        document.getElementById('exportSection').style.display = 'none';
        document.getElementById('errorSection').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('successSection').style.display = 'block';
    }

    showErrorState(errorMessage) {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('successSection').style.display = 'none';
        document.getElementById('exportSection').style.display = 'block';
        
        // Show error notification
        this.showNotification(errorMessage, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: '1000',
            backgroundColor: type === 'error' ? '#dc3545' : '#28a745',
            color: 'white'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }



    openHelpPage() {
        chrome.tabs.create({
            url: 'https://www.pantheonnetwork.co/connect'
        });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
