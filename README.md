# Bengali Voice Order Assistant 📋🎤🌐

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web-blue)
![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)
![No API Keys](https://img.shields.io/badge/API%20Keys-Not%20Required-brightgreen)

A Progressive Web App (PWA) that converts Bengali speech to text, formats it as a business order, and optionally translates it to English. Perfect for small businesses that need to quickly record and process orders in Bengali.

## Features ✨

- **Speech Recognition**: Uses browser's built-in Web Speech API to convert Bengali speech to text (no API key needed!)
- **Text Formatting**: Automatically formats speech into structured business orders with dimension-based parsing
- **Translation**: Free client-side translation from Bengali to English (no API key needed!)
- **Clipboard Support**: One-click copy for both Bengali and English text
- **PWA Support**: Install on desktop or mobile devices for offline use
- **Responsive Design**: Works on all device sizes
- **100% Free**: Works with zero setup using browser capabilities - no API keys required

## Demo 🎬

Check out the live demo [here](https://yourusername.github.io/bengali-voice-order/) (Replace with your GitHub Pages URL once deployed).

## Setup Instructions 🛠️

### Prerequisites

- A modern web browser (Chrome, Edge, or Safari) for speech recognition
- A web server for local development (e.g., Live Server extension for VSCode)

### Quick Start

1. Clone this repository
```bash
git clone https://github.com/yourusername/bengali-voice-order.git
cd bengali-voice-order
```

2. Serve the app using a local web server:
- With VSCode Live Server: Right-click index.html and select "Open with Live Server"
- With Python: `python -m http.server`
- With Node.js: Install `http-server` package and run `http-server`

3. Access the app at `http://localhost:8080` (or the port provided by your server)

### PWA Installation 📱

To install the app as a PWA on mobile:

#### Android
1. Open the app in Chrome
2. Tap the menu (⋮) in the top-right corner
3. Tap "Add to Home Screen"
4. Follow the prompts to install

#### iPhone/iPad
1. Open the app in Safari
2. Tap the share button (📤)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top-right corner

## How It Works 🔍

### Speech Recognition
The app uses the browser's built-in Web Speech API which supports Bengali language (bn-IN). This means:
- No external speech recognition API needed
- No signup or registration required
- Zero cost for speech recognition
- Works completely in the browser

### Translation
The app uses a client-side approach to connect directly to Google Translate:
- No Google Cloud account or API key required
- Free translation from Bengali to English
- Works directly in the browser
- No server setup needed

Note: The translation feature has usage limits. If you need high-volume translation, consider integrating with an official API.

### Dimension Order Formatting
The app can automatically detect and format dimension-based orders with categories:

**Input Example:**
```
S1 8x10 10kg 9x12 15kg 11x14 15kg 13x16 15kg 16x20 5kg Black loose 9x12 15kg 11x14 30kg 13x16 15kg Goutam 12x18 20kg 14x20 40kg
```

**Formatted Output:**
```
S1:
- 8x10: 10 kg
- 9x12: 15 kg
- 11x14: 15 kg
- 13x16: 15 kg
- 16x20: 5 kg

Black loose:
- 9x12: 15 kg
- 11x14: 30 kg
- 13x16: 15 kg

Goutam:
- 12x18: 20 kg
- 14x20: 40 kg
```

## Browser Compatibility 🌐

The Web Speech API is supported in:
- Google Chrome (desktop and Android)
- Microsoft Edge
- Safari (desktop and iOS)

Firefox and some other browsers may not support speech recognition features.

## Contributing 🤝

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits 🙏

Developed using:
- Web Speech API for speech recognition
- Client-side Google Translate for translation
- Modern web technologies 

## Deployment 🚀

### Deploy to GitHub Pages

This repository includes a PowerShell script for easy deployment to GitHub Pages:

1. Make sure you have Git installed and configured
2. Push your changes to your GitHub repository
3. Run the deployment script:
   ```powershell
   .\deploy.ps1
   ```
4. The script will create a `gh-pages` branch and deploy your app
5. Access your app at `https://yourusername.github.io/bengali-voice-order/`

Note: You need to enable GitHub Pages in your repository settings and set the source to the `gh-pages` branch. 