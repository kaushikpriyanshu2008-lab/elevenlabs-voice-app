# ElevenLabs AI Voice Studio 🎙️

A modern, high-fidelity web application built with **HTML5, CSS3, and JavaScript** that converts text into lifelike speech using the **ElevenLabs Text-to-Speech API**.

---

## ✨ Features

- **Model Selection Dropdown**: Easily choose from ElevenLabs neural models:
  - `eleven_multilingual_v2` (Default - High Fidelity & Expressive)
  - `eleven_turbo_v2_5` (Ultra-low latency)
  - `eleven_flash_v2_5` (Fastest 75ms response)
  - `eleven_monolingual_v1` (Classic English)
  - `eleven_turbo_v2` (Balanced)
- **Voice Selection**:
  - Pre-loaded with iconic voices like **George** (`JBFqnCBsd6RMkjVDRZzb`), **Rachel**, **Adam**, **Antoni**, **Bella**, and **Charlie**.
  - Support for **Custom Voice IDs** (cloned or custom library voices).
  - Automatically loads your personal voice clones if an API key is connected.
- **Voice Fine-Tuning**:
  - Stability slider
  - Clarity + Similarity boost slider
  - Audio output format selector (MP3 128kbps, MP3 192kbps, PCM Raw)
- **Live Waveform Visualizer**: Real-time canvas equalizer reacting dynamically to speech frequencies via the Web Audio API.
- **Custom Audio Player**:
  - Play / Pause / Seek / Scrub
  - Rewind 5s & Fast Forward 5s
  - Playback speed multiplier (0.75x, 1.0x, 1.25x, 1.5x, 2.0x)
  - Direct MP3 Download button
  - Volume control with mute toggle
- **Session History**: Track and replay previously synthesized narrations in the current session.
- **Keyboard Shortcut**: Press `Ctrl + Enter` (or `Cmd + Enter`) anywhere to instantly trigger narration.
- **Demo / Simulation Mode**: Test the entire interface and audio player right away even before adding an API key.

---

## 🚀 Getting Started

### 1. Launching the App
Simply open `index.html` in any modern web browser:
- Double click [index.html](file:///c:/Users/Priyanshu/OneDrive/Desktop/New%20folder/index.html) to open directly.
- Or run a local HTTP server in PowerShell/Terminal:
  ```powershell
  # Using Python
  python -m http.server 3000

  # Or using Node npx
  npx serve .
  ```
  Then navigate to `http://localhost:3000` (or `http://localhost:5000`).

---

## 🔑 ElevenLabs API Key Setup

1. Sign up or log into [ElevenLabs](https://elevenlabs.io/).
2. Go to your Profile -> **API Keys** and copy your `xi-api-key`.
3. In the app, click the **Set API Key** button in the top right.
4. Paste your key and click **Save & Connect**.
   - Your key is stored securely in your browser's `localStorage` and sent strictly to `api.elevenlabs.io`.

---

## 🛠️ Code Structure

- [index.html](file:///c:/Users/Priyanshu/OneDrive/Desktop/New%20folder/index.html): Semantic layout, input workspace, audio player, visualizer canvas, and modal dialogs.
- [style.css](file:///c:/Users/Priyanshu/OneDrive/Desktop/New%20folder/style.css): Obsidian dark-theme design system, glassmorphism, responsive grid, and glowing accents.
- [app.js](file:///c:/Users/Priyanshu/OneDrive/Desktop/New%20folder/app.js): ElevenLabs API integration, Web Audio API frequency visualizer, player controls, and history management.
