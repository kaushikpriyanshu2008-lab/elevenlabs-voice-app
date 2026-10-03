/**
 * ElevenLabs Voice Studio - Application Logic
 * Integrates ElevenLabs Text-to-Speech API with real-time audio visualization,
 * dynamic model/voice selection, and custom playback controls.
 */

// ============================================================================
// State Management
// ============================================================================
const state = {
  apiKey: localStorage.getItem('elevenlabs_api_key') || '',
  isGenerating: false,
  isPlaying: false,
  currentAudioUrl: null,
  currentAudioBlob: null,
  playbackSpeed: 1.0,
  isMuted: false,
  previousVolume: 1.0,
  history: [],
  audioContext: null,
  analyser: null,
  sourceNode: null,
  isAudioContextInitialized: false,
  visualizerAnimationId: null,
  isDemoMode: false,
};

// Preset text snippets for quick testing
const PRESETS = {
  quote: "The first move is what sets everything in motion. In a world full of noise, the clarity of a single authentic voice can spark an entire revolution.",
  story: "Across the neon-drenched canyons of New Kyoto, the automated delivery skiffs hummed through the rain. Dr. Vance adjusted his neural interface, listening for the whisper in the static.",
  podcast: "Welcome back to The Frontier, where we break down the boldest ideas shaping artificial intelligence, human ingenuity, and the next century of technology."
};

// Available ElevenLabs Models
const MODELS = [
  { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2 (High Fidelity & Expressive)' },
  { id: 'eleven_turbo_v2_5', name: 'Eleven Turbo v2.5 (Fast & Low Latency)' },
  { id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5 (Ultra Fast - 75ms)' },
  { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1 (English Classic)' },
  { id: 'eleven_turbo_v2', name: 'Eleven Turbo v2 (Balanced Latency)' }
];

// Curated Default Voices
const CURATED_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George - Warm, Captivating & Storyteller' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Calm, Natural & Professional' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Deep, Grounded & Narrative' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Well-rounded, Crisp & Expressive' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Dynamic, Soft & Youthful' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie - Australian, Conversational' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte - Seductive, Posh & Eloquent' },
  { id: 'custom', name: '-- Custom Voice ID --' }
];

// ============================================================================
// DOM Elements
// ============================================================================
const elements = {
  // Inputs
  textInput: document.getElementById('textInput'),
  charCount: document.getElementById('charCount'),
  wordCount: document.getElementById('wordCount'),
  estTime: document.getElementById('estTime'),
  pasteBtn: document.getElementById('pasteBtn'),
  clearBtn: document.getElementById('clearBtn'),
  
  // Selectors
  modelSelect: document.getElementById('modelSelect'),
  voiceSelect: document.getElementById('voiceSelect'),
  customVoiceGroup: document.getElementById('customVoiceGroup'),
  customVoiceId: document.getElementById('customVoiceId'),
  verifyVoiceBtn: document.getElementById('verifyVoiceBtn'),
  voiceTypeBadge: document.getElementById('voiceTypeBadge'),
  
  // Tuning Accordion
  tuningToggleBtn: document.getElementById('tuningToggleBtn'),
  tuningBody: document.getElementById('tuningBody'),
  accordion: document.querySelector('.accordion'),
  stabilitySlider: document.getElementById('stabilitySlider'),
  stabilityVal: document.getElementById('stabilityVal'),
  similaritySlider: document.getElementById('similaritySlider'),
  similarityVal: document.getElementById('similarityVal'),
  outputFormatSelect: document.getElementById('outputFormatSelect'),

  // CTA Button
  postBtn: document.getElementById('postBtn'),
  postBtnText: document.getElementById('postBtnText'),
  btnSpinner: document.querySelector('.btn-spinner'),
  btnNormalIcon: document.querySelector('.normal-icon'),
  statusMessage: document.getElementById('statusMessage'),

  // Visualizer & Player
  visualizerCanvas: document.getElementById('visualizerCanvas'),
  visualizerPlaceholder: document.getElementById('visualizerPlaceholder'),
  playbackStateBadge: document.getElementById('playbackStateBadge'),
  audioElement: document.getElementById('audioElement'),
  
  // Player Controls
  progressBarContainer: document.getElementById('progressBarContainer'),
  progressFill: document.getElementById('progressFill'),
  progressScrubber: document.getElementById('progressScrubber'),
  currentTime: document.getElementById('currentTime'),
  durationTime: document.getElementById('durationTime'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  playIcon: document.getElementById('playIcon'),
  pauseIcon: document.getElementById('pauseIcon'),
  rewindBtn: document.getElementById('rewindBtn'),
  forwardBtn: document.getElementById('forwardBtn'),
  speedBtn: document.getElementById('speedBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  volumeBtn: document.getElementById('volumeBtn'),
  volumeSlider: document.getElementById('volumeSlider'),

  // Metadata Card & History
  metaInfoCard: document.getElementById('metaInfoCard'),
  metaModelBadge: document.getElementById('metaModelBadge'),
  metaVoiceBadge: document.getElementById('metaVoiceBadge'),
  metaLatencyBadge: document.getElementById('metaLatencyBadge'),
  metaExcerpt: document.getElementById('metaExcerpt'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),

  // API Modal
  apiKeyBtn: document.getElementById('apiKeyBtn'),
  apiKeyStatusText: document.getElementById('apiKeyStatusText'),
  apiModal: document.getElementById('apiModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveKeyBtn: document.getElementById('saveKeyBtn'),
  simulateKeyBtn: document.getElementById('simulateKeyBtn'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),

  // Notifications
  toastContainer: document.getElementById('toastContainer')
};

// ============================================================================
// Initialization
// ============================================================================
function init() {
  bindEvents();
  updateTextStats();
  checkApiKeyStatus();
  initVisualizerIdleCanvas();

  // If API key is present, attempt fetching remote voices
  if (state.apiKey) {
    fetchRemoteVoices();
  }
}

// ============================================================================
// Event Binding
// ============================================================================
function bindEvents() {
  // Text Input handlers
  elements.textInput.addEventListener('input', updateTextStats);
  elements.pasteBtn.addEventListener('click', handlePaste);
  elements.clearBtn.addEventListener('click', handleClear);

  // Preset Pills
  document.querySelectorAll('.preset-pills .pill-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetKey = e.currentTarget.dataset.preset;
      if (PRESETS[presetKey]) {
        elements.textInput.value = PRESETS[presetKey];
        updateTextStats();
        showToast('Preset text loaded', 'info');
      }
    });
  });

  // Voice Selection Change
  elements.voiceSelect.addEventListener('change', handleVoiceChange);

  // Voice Fine-Tuning Accordion
  elements.tuningToggleBtn.addEventListener('click', () => {
    const isHidden = elements.tuningBody.classList.contains('hidden');
    elements.tuningBody.classList.toggle('hidden', !isHidden);
    elements.accordion.classList.toggle('open', isHidden);
  });

  // Sliders
  elements.stabilitySlider.addEventListener('input', (e) => {
    elements.stabilityVal.textContent = parseFloat(e.target.value).toFixed(2);
  });
  elements.similaritySlider.addEventListener('input', (e) => {
    elements.similarityVal.textContent = parseFloat(e.target.value).toFixed(2);
  });

  // Post / Generate Button
  elements.postBtn.addEventListener('click', handleGenerateSpeech);

  // Global Keyboard shortcut: Ctrl+Enter or Cmd+Enter
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      elements.postBtn.click();
    }
  });

  // Audio Playback Controls
  elements.playPauseBtn.addEventListener('click', togglePlayPause);
  elements.rewindBtn.addEventListener('click', () => seekRelative(-5));
  elements.forwardBtn.addEventListener('click', () => seekRelative(5));
  elements.speedBtn.addEventListener('click', cyclePlaybackSpeed);
  elements.downloadBtn.addEventListener('click', handleDownload);
  elements.volumeSlider.addEventListener('input', handleVolumeChange);
  elements.volumeBtn.addEventListener('click', toggleMute);

  // Progress Bar / Scrubber
  elements.progressBarContainer.addEventListener('click', handleProgressBarClick);

  // HTML5 Audio Element Events
  elements.audioElement.addEventListener('timeupdate', updatePlaybackProgress);
  elements.audioElement.addEventListener('ended', onAudioEnded);
  elements.audioElement.addEventListener('pause', onAudioPause);
  elements.audioElement.addEventListener('play', onAudioPlay);
  elements.audioElement.addEventListener('loadedmetadata', onAudioLoadedMetadata);

  // API Key Modal Controls
  elements.apiKeyBtn.addEventListener('click', openApiModal);
  elements.closeModalBtn.addEventListener('click', closeApiModal);
  elements.saveKeyBtn.addEventListener('click', saveApiKey);
  elements.simulateKeyBtn.addEventListener('click', activateDemoMode);
  elements.toggleKeyVisibilityBtn.addEventListener('click', toggleKeyVisibility);
  
  // Close modal on backdrop click
  elements.apiModal.addEventListener('click', (e) => {
    if (e.target === elements.apiModal) closeApiModal();
  });

  // History Clear
  elements.clearHistoryBtn.addEventListener('click', clearHistory);
}

// ============================================================================
// Text Stats & Helpers
// ============================================================================
function updateTextStats() {
  const text = elements.textInput.value.trim();
  const chars = text.length;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  // Average speaking rate: ~150 words per minute => 2.5 words per sec
  const estSeconds = Math.max(1, Math.round(words / 2.5));

  elements.charCount.textContent = `${chars} characters`;
  elements.wordCount.textContent = `${words} words`;
  elements.estTime.textContent = `~${estSeconds}s audio`;
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      elements.textInput.value = text;
      updateTextStats();
      showToast('Pasted text from clipboard', 'success');
    }
  } catch (err) {
    showToast('Clipboard permission needed to paste', 'info');
  }
}

function handleClear() {
  elements.textInput.value = '';
  updateTextStats();
  elements.textInput.focus();
}

function handleVoiceChange() {
  const isCustom = elements.voiceSelect.value === 'custom';
  elements.customVoiceGroup.classList.toggle('hidden', !isCustom);
  elements.voiceTypeBadge.textContent = isCustom ? 'Custom' : 'Pre-made';
}

// ============================================================================
// API Key & Remote Voices
// ============================================================================
function checkApiKeyStatus() {
  if (state.apiKey) {
    elements.apiKeyBtn.classList.add('connected');
    elements.apiKeyStatusText.textContent = 'API Key Connected';
  } else if (state.isDemoMode) {
    elements.apiKeyBtn.classList.add('connected');
    elements.apiKeyStatusText.textContent = 'Demo Simulation';
  } else {
    elements.apiKeyBtn.classList.remove('connected');
    elements.apiKeyStatusText.textContent = 'Set API Key';
  }
}

function openApiModal() {
  elements.apiKeyInput.value = state.apiKey;
  elements.apiModal.classList.remove('hidden');
  elements.apiKeyInput.focus();
}

function closeApiModal() {
  elements.apiModal.classList.add('hidden');
}

function toggleKeyVisibility() {
  const isPass = elements.apiKeyInput.type === 'password';
  elements.apiKeyInput.type = isPass ? 'text' : 'password';
}

function saveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  if (!key) {
    showToast('Please enter a valid ElevenLabs API key', 'error');
    return;
  }
  state.apiKey = key;
  state.isDemoMode = false;
  localStorage.setItem('elevenlabs_api_key', key);
  checkApiKeyStatus();
  closeApiModal();
  showToast('API Key saved successfully!', 'success');
  fetchRemoteVoices();
}

function activateDemoMode() {
  state.isDemoMode = true;
  state.apiKey = '';
  checkApiKeyStatus();
  closeApiModal();
  showToast('Simulation Demo Mode activated! Speech will synthesize in browser.', 'info');
}

async function fetchRemoteVoices() {
  if (!state.apiKey) return;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': state.apiKey }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.voices && data.voices.length > 0) {
        populateVoiceDropdown(data.voices);
        showToast(`Loaded ${data.voices.length} voices from your ElevenLabs account`, 'info');
      }
    }
  } catch (err) {
    console.warn('Could not fetch remote voices, continuing with default voices:', err);
  }
}

function populateVoiceDropdown(voices) {
  elements.voiceSelect.innerHTML = '';
  voices.forEach(voice => {
    const opt = document.createElement('option');
    opt.value = voice.voice_id;
    const category = voice.category ? ` (${voice.category})` : '';
    opt.textContent = `${voice.name}${category}`;
    elements.voiceSelect.appendChild(opt);
  });
  
  // Re-add custom voice option at bottom
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = '-- Custom Voice ID --';
  elements.voiceSelect.appendChild(customOpt);
}

// ============================================================================
// Speech Synthesis (ElevenLabs API & Fallback)
// ============================================================================
async function handleGenerateSpeech() {
  const text = elements.textInput.value.trim();
  if (!text) {
    showToast('Please enter text content before generating speech.', 'error');
    elements.textInput.focus();
    return;
  }

  // If no API key and not in demo mode, prompt user
  if (!state.apiKey && !state.isDemoMode) {
    openApiModal();
    showToast('Please provide your ElevenLabs API Key or select Demo Mode.', 'info');
    return;
  }

  // Determine Voice ID
  let voiceId = elements.voiceSelect.value;
  if (voiceId === 'custom') {
    voiceId = elements.customVoiceId.value.trim();
    if (!voiceId) {
      showToast('Please specify a custom Voice ID', 'error');
      elements.customVoiceId.focus();
      return;
    }
  }

  const modelId = elements.modelSelect.value;
  const outputFormat = elements.outputFormatSelect.value;
  const stability = parseFloat(elements.stabilitySlider.value);
  const similarity = parseFloat(elements.similaritySlider.value);

  // Update UI to Generating state
  setGeneratingState(true);
  const startTime = performance.now();

  try {
    let audioBlob;
    let latencyMs;

    if (state.isDemoMode) {
      // Demo / Simulation Mode: Synthesize audio using Web Audio Buffer + Web Speech
      audioBlob = await simulateSpeechSynthesis(text);
      latencyMs = Math.round(performance.now() - startTime);
    } else {
      // ElevenLabs API Call
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`;
      
      const payload = {
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: stability,
          similarity_boost: similarity,
          use_speaker_boost: true
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': state.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorDetail = 'API Request Failed';
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail?.message || errJson.detail?.status || JSON.stringify(errJson);
        } catch (e) {
          errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }

      audioBlob = await response.blob();
      latencyMs = Math.round(performance.now() - startTime);
    }

    // Load Audio and Play
    loadGeneratedAudio(audioBlob, {
      text,
      modelId,
      voiceName: elements.voiceSelect.options[elements.voiceSelect.selectedIndex].text.split(' - ')[0],
      latencyMs
    });

    showToast('Narration synthesized successfully!', 'success');
  } catch (error) {
    console.error('Synthesis error:', error);
    showToast(`Error: ${error.message}`, 'error');
  } finally {
    setGeneratingState(false);
  }
}

function setGeneratingState(isBusy) {
  state.isGenerating = isBusy;
  elements.postBtn.disabled = isBusy;
  elements.btnSpinner.classList.toggle('hidden', !isBusy);
  elements.btnNormalIcon.classList.toggle('hidden', isBusy);
  elements.postBtnText.textContent = isBusy ? 'Synthesizing Voice...' : 'Start Narration';
  elements.playbackStateBadge.textContent = isBusy ? 'Generating...' : (state.isPlaying ? 'Playing' : 'Ready');
  elements.playbackStateBadge.className = `state-pill ${isBusy ? 'loading' : ''}`;
}

// Load audio blob into player and update session history
function loadGeneratedAudio(blob, metadata) {
  // Revoke previous URL to prevent memory leaks
  if (state.currentAudioUrl) {
    URL.revokeObjectURL(state.currentAudioUrl);
  }

  state.currentAudioBlob = blob;
  state.currentAudioUrl = URL.createObjectURL(blob);

  // Set audio source
  elements.audioElement.src = state.currentAudioUrl;
  elements.audioElement.playbackRate = state.playbackSpeed;

  // Enable controls
  elements.playPauseBtn.disabled = false;
  elements.rewindBtn.disabled = false;
  elements.forwardBtn.disabled = false;
  elements.downloadBtn.disabled = false;

  // Metadata Card Display
  elements.metaInfoCard.classList.remove('hidden');
  elements.metaModelBadge.textContent = `Model: ${metadata.modelId}`;
  elements.metaVoiceBadge.textContent = `Voice: ${metadata.voiceName}`;
  elements.metaLatencyBadge.textContent = `Render: ${metadata.latencyMs}ms`;
  elements.metaExcerpt.textContent = `"${metadata.text.substring(0, 100)}${metadata.text.length > 100 ? '...' : ''}"`;

  // Start Playback
  initAudioContext();
  elements.audioElement.play().catch(err => {
    console.log('Autoplay prevented, user interaction required:', err);
  });

  // Add to History
  addToHistory({
    id: Date.now(),
    text: metadata.text,
    voiceName: metadata.voiceName,
    modelId: metadata.modelId,
    blob: blob,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
}

// Fallback simulator for test runs without API keys
async function simulateSpeechSynthesis(text) {
  return new Promise((resolve) => {
    // Generate a rich synthetic harmonic audio buffer to play
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = Math.min(15, Math.max(2, Math.round(text.split(/\s+/).length / 2.5)));
    const sampleRate = audioCtx.sampleRate;
    const numFrames = sampleRate * duration;
    const buffer = audioCtx.createBuffer(2, numFrames, sampleRate);
    
    // Fill buffer with melodic speech-like formants
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < numFrames; i++) {
        const t = i / sampleRate;
        // Pitch variation imitating speech cadence
        const pitch = 130 + Math.sin(t * 3) * 25 + Math.cos(t * 7) * 15;
        // Modulated harmonics
        const envelope = Math.sin((t / duration) * Math.PI);
        const wave = (Math.sin(2 * Math.PI * pitch * t) * 0.4 +
                      Math.sin(2 * Math.PI * (pitch * 2) * t) * 0.2 +
                      Math.sin(2 * Math.PI * (pitch * 3) * t) * 0.1) * envelope;
        // Slight breath noise
        const noise = (Math.random() * 2 - 1) * 0.03 * envelope;
        channelData[i] = wave + noise;
      }
    }

    // Convert AudioBuffer to WAV Blob
    const wavBlob = audioBufferToWavBlob(buffer);

    // Also trigger browser speech synthesis simultaneously if available for real spoken voice!
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => resolve(wavBlob), 600);
  });
}

// ============================================================================
// Audio Player Controls & Logic
// ============================================================================
function togglePlayPause() {
  if (!elements.audioElement.src) return;
  initAudioContext();

  if (state.audioContext && state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }

  if (elements.audioElement.paused) {
    elements.audioElement.play();
  } else {
    elements.audioElement.pause();
  }
}

function onAudioPlay() {
  state.isPlaying = true;
  elements.playIcon.classList.add('hidden');
  elements.pauseIcon.classList.remove('hidden');
  elements.playbackStateBadge.textContent = 'Playing';
  elements.playbackStateBadge.className = 'state-pill playing';
  elements.visualizerPlaceholder.classList.add('active');
  startVisualizer();
}

function onAudioPause() {
  state.isPlaying = false;
  elements.playIcon.classList.remove('hidden');
  elements.pauseIcon.classList.add('hidden');
  elements.playbackStateBadge.textContent = 'Paused';
  elements.playbackStateBadge.className = 'state-pill';
}

function onAudioEnded() {
  state.isPlaying = false;
  elements.playIcon.classList.remove('hidden');
  elements.pauseIcon.classList.add('hidden');
  elements.playbackStateBadge.textContent = 'Completed';
  elements.playbackStateBadge.className = 'state-pill';
  elements.progressFill.style.width = '0%';
  elements.progressScrubber.style.left = '0%';
  elements.currentTime.textContent = '00:00';
  elements.visualizerPlaceholder.classList.remove('active');
}

function seekRelative(seconds) {
  if (!elements.audioElement.duration) return;
  elements.audioElement.currentTime = Math.max(
    0,
    Math.min(elements.audioElement.duration, elements.audioElement.currentTime + seconds)
  );
}

function cyclePlaybackSpeed() {
  const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
  const currentIndex = speeds.indexOf(state.playbackSpeed);
  const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
  state.playbackSpeed = nextSpeed;
  elements.audioElement.playbackRate = nextSpeed;
  elements.speedBtn.textContent = `${nextSpeed}x`;
  showToast(`Speed set to ${nextSpeed}x`, 'info');
}

function handleVolumeChange(e) {
  const vol = parseFloat(e.target.value);
  elements.audioElement.volume = vol;
  state.isMuted = vol === 0;
  updateVolumeIcon(vol);
}

function toggleMute() {
  if (state.isMuted) {
    elements.audioElement.volume = state.previousVolume || 1.0;
    elements.volumeSlider.value = elements.audioElement.volume;
    state.isMuted = false;
  } else {
    state.previousVolume = elements.audioElement.volume;
    elements.audioElement.volume = 0;
    elements.volumeSlider.value = 0;
    state.isMuted = true;
  }
  updateVolumeIcon(elements.audioElement.volume);
}

function updateVolumeIcon(vol) {
  if (vol === 0) {
    elements.volumeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>`;
  } else {
    elements.volumeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>`;
  }
}

function updatePlaybackProgress() {
  const current = elements.audioElement.currentTime || 0;
  const duration = elements.audioElement.duration || 0;
  if (!duration) return;

  const percent = (current / duration) * 100;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressScrubber.style.left = `${percent}%`;
  elements.currentTime.textContent = formatTime(current);
}

function onAudioLoadedMetadata() {
  elements.durationTime.textContent = formatTime(elements.audioElement.duration || 0);
  elements.currentTime.textContent = '00:00';
}

function handleProgressBarClick(e) {
  if (!elements.audioElement.duration) return;
  const rect = elements.progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  elements.audioElement.currentTime = percent * elements.audioElement.duration;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleDownload() {
  if (!state.currentAudioBlob) return;
  const url = URL.createObjectURL(state.currentAudioBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elevenlabs-narration-${Date.now()}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Audio file downloaded', 'success');
}

// ============================================================================
// Web Audio API & Visualizer Canvas
// ============================================================================
function initAudioContext() {
  if (state.isAudioContextInitialized) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 128;
    state.analyser.smoothingTimeConstant = 0.8;

    state.sourceNode = state.audioContext.createMediaElementSource(elements.audioElement);
    state.sourceNode.connect(state.analyser);
    state.analyser.connect(state.audioContext.destination);

    state.isAudioContextInitialized = true;
  } catch (e) {
    console.warn('AudioContext initialization note:', e);
  }
}

function initVisualizerIdleCanvas() {
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext('2d');
  
  function drawIdle() {
    if (state.isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Draw subtle glowing center wave line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    const time = performance.now() * 0.002;
    for (let x = 0; x < width; x += 4) {
      const y = centerY + Math.sin(x * 0.03 + time) * 4;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    requestAnimationFrame(drawIdle);
  }
  drawIdle();
}

function startVisualizer() {
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext('2d');
  
  if (!state.analyser) return;
  const bufferLength = state.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function renderFrame() {
    if (!state.isPlaying) return;

    state.visualizerAnimationId = requestAnimationFrame(renderFrame);
    state.analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = 42;
    const barWidth = (canvas.width / barCount) - 3;
    const centerY = canvas.height / 2;

    for (let i = 0; i < barCount; i++) {
      // Map bar index to frequency array
      const dataIndex = Math.floor((i / barCount) * bufferLength * 0.85);
      const val = dataArray[dataIndex] || 0;
      const barHeight = Math.max(4, (val / 255) * (canvas.height * 0.85));

      const x = i * (barWidth + 3) + 2;
      const y = centerY - barHeight / 2;

      // Dynamic color gradient (Indigo -> Electric Violet -> Cyan)
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#6366f1');
      gradient.addColorStop(1, '#06b6d4');

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
      
      // Rounded pill bar
      roundRect(ctx, x, y, barWidth, barHeight, 3);
      ctx.fill();
    }
  }

  renderFrame();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ============================================================================
// History Log
// ============================================================================
function addToHistory(item) {
  state.history.unshift(item);
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<div class="history-empty">No previous narrations in this session yet.</div>';
    return;
  }

  elements.historyList.innerHTML = '';
  state.history.slice(0, 10).forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div style="flex: 1; min-width: 0; margin-right: 12px;">
        <div class="history-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</div>
        <div class="history-meta">${item.voiceName} &bull; ${item.timestamp}</div>
      </div>
      <div class="history-actions">
        <button class="history-play-btn" title="Replay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
        <button class="history-download-btn" title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    `;

    // Replay click
    div.querySelector('.history-play-btn').addEventListener('click', () => {
      loadGeneratedAudio(item.blob, {
        text: item.text,
        modelId: item.modelId,
        voiceName: item.voiceName,
        latencyMs: 0
      });
      showToast('Replaying selected clip', 'info');
    });

    // Download click
    div.querySelector('.history-download-btn').addEventListener('click', () => {
      const url = URL.createObjectURL(item.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elevenlabs-${item.voiceName.toLowerCase()}-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    elements.historyList.appendChild(div);
  });
}

function clearHistory() {
  state.history = [];
  renderHistory();
  showToast('Session history cleared', 'info');
}

// ============================================================================
// Notifications & Toast
// ============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Utility to convert AudioBuffer to WAV Blob for simulation
function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);         // SubChunk1Size
  setUint16(1);          // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
