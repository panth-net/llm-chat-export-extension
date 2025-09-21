# LLM Conversation Exporter

An extension to export conversations from ChatGPT, Claude, Gemini, and Grok to plain text files. All processing happens locally in your browser.

## 📖 Usage

1. Navigate to ChatGPT, Claude, Gemini, or Grok
2. Open a conversation you want to export
3. Click the extension icon in your browser toolbar
4. Click "Export Conversation"
5. Your conversation will be downloaded as a text file

## Supported Platforms
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- Grok (X)

## Development Setup

### Chrome
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select this directory
5. Extension icon appears in toolbar

### Firefox
This extension uses chrome.offscreen that are not available in Firefox. To port to Firefox, you'll need to replace this.

## Privacy & Security

- **No data collection**
- **Local processing**
- **No analytics**
- **Open source**

It's a quick project to solve a pain point -- no need to over-engineer. Click export -> exports .txt to your computer.

## Forking and Contributing

I won't be able to actively maintain this project. Please feel free to fork it or support on this repo.
I've tried to make the selector paths as generic as possible to last longer, but they will inevitably break as the platforms update their code.

## 📄 License

MIT License - see LICENSE file for details.
