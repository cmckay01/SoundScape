// Import dependencies
import { createReverb } from './effects/reverb.js';
import { createDelay } from './effects/delay.js';
import { createDistortion } from './effects/distortion.js';
import { createFilter } from './effects/filter.js';
import { createPitchShifter } from './effects/pitch-shifter.js';
import { createEqualizer } from './effects/equalizer.js';
import { createVisualizer } from './visualizer.js';

let audioContext;
let source, gainNode;
let reverbNode, delayNode, distortionNode, filterNode, pitchShifterNode, equalizerNode;
let visualizer;

const sourceSelect = document.getElementById('source-select');
const uploadContainer = document.getElementById('upload-container');
const audioUpload = document.getElementById('audio-upload');
const reverbControl = document.getElementById('reverb');
const reverbValue = document.getElementById('reverb-value');
const delayControl = document.getElementById('delay');
const delayValue = document.getElementById('delay-value');
const distortionControl = document.getElementById('distortion');
const distortionValue = document.getElementById('distortion-value');
const filterControl = document.getElementById('filter');
const filterValue = document.getElementById('filter-value');
const pitchControl = document.getElementById('pitch');
const pitchValue = document.getElementById('pitch-value');
const equalizerContainer = document.getElementById('equalizer-container');
const playPauseButton = document.getElementById('play-pause');
const presetSelect = document.getElementById('preset-select');
const presetName = document.getElementById('preset-name');
const savePresetButton = document.getElementById('save-preset');

// Set up audio graph
async function setupAudioGraph() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  source = audioContext.createBufferSource();
  gainNode = audioContext.createGain();

  const reverbPromise = createReverb(audioContext);
  const delayPromise = createDelay(audioContext);
  const distortionPromise = createDistortion(audioContext);
  const filterPromise = createFilter(audioContext);
  const pitchShifterPromise = createPitchShifter(audioContext);
  const equalizerPromise = createEqualizer(audioContext, equalizerContainer);

  // Wait for all nodes to be ready
  [reverbNode, delayNode, distortionNode, filterNode, pitchShifterNode, equalizerNode] = await Promise.all([reverbPromise, delayPromise, distortionPromise, filterPromise, pitchShifterPromise, equalizerPromise]);

  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(reverbNode.input);
  reverbNode.output.connect(delayNode.input);
  delayNode.output.connect(distortionNode.input);
  distortionNode.output.connect(filterNode.input);
  filterNode.output.connect(pitchShifterNode.input);
  pitchShifterNode.output.connect(equalizerNode.input);
  equalizerNode.output.connect(audioContext.destination);

  visualizer = createVisualizer(audioContext, gainNode);
  console.log("Connecting audio nodes...");
}

// Load audio buffer
async function loadAudioBuffer(url) {
  console.log(`Loading audio buffer from URL: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      if (!source) {
          source = audioContext.createBufferSource();
          source.connect(audioContext.destination); // Ensure the source is connected
      }
      source.buffer = audioBuffer;
      console.log("Audio buffer loaded and assigned to source.");
  } catch (error) {
      console.error("Error decoding audio data:", error);
  }
}

// Ensure setupAudioGraph is called appropriately
if (!audioContext) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  setupAudioGraph().then(() => {
    console.log("Audio graph setup completed.");
  }).catch(console.error);
}

// Load audio file
async function loadAudioFile(file) {
  const reader = new FileReader();
  reader.onload = async (event) => {
    const arrayBuffer = event.target.result;
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    source.buffer = audioBuffer;
  };
  reader.readAsArrayBuffer(file);
}

// Apply audio effects
function applyAudioEffects() {
  const reverbValue = parseFloat(reverbControl.value);
  const delayValue = parseFloat(delayControl.value);
  const distortionValue = parseFloat(distortionControl.value);
  const filterValue = parseFloat(filterControl.value);
  const pitchValue = parseFloat(pitchControl.value);

  // Update effect values
  reverbNode.setParams({ seconds: reverbValue / 100 });
  delayNode.setParams({ delayTime: delayValue });
  distortionNode.setParams({ amount: distortionValue / 100 });
  filterNode.setParams({ frequency: filterValue });
  pitchShifterNode.setParams({ pitch: pitchValue });
  equalizerNode.setParams(equalizerNode.getParams());

  // Update value displays
  document.getElementById('reverb-value').textContent = reverbValue;
  document.getElementById('delay-value').textContent = delayValue;
  document.getElementById('distortion-value').textContent = distortionValue;
  document.getElementById('filter-value').textContent = filterValue;
  document.getElementById('pitch-value').textContent = pitchValue;
}

// Save preset
function savePreset() {
  const name = presetName.value;
  if (name) {
    const preset = {
      reverb: parseFloat(reverbControl.value),
      delay: parseFloat(delayControl.value),
      distortion: parseFloat(distortionControl.value),
      filter: parseFloat(filterControl.value),
      pitch: parseFloat(pitchControl.value),
      equalizer: equalizerNode.getParams(),
    };
    localStorage.setItem(name, JSON.stringify(preset));
    updatePresetOptions();
    presetName.value = '';
  }
}

// Load preset
function loadPreset() {
  const name = presetSelect.value;
  if (name) {
    const preset = JSON.parse(localStorage.getItem(name));
    reverbControl.value = preset.reverb;
    delayControl.value = preset.delay;
    distortionControl.value = preset.distortion;
    filterControl.value = preset.filter;
    pitchControl.value = preset.pitch;
    equalizerNode.setParams(preset.equalizer);
    applyAudioEffects();
  }
}

// Update preset options
function updatePresetOptions() {
  presetSelect.innerHTML = '<option value="">-- Select Preset --</option>';
  for (let i = 0; i < localStorage.length; i++) {
    const name = localStorage.key(i);
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    presetSelect.appendChild(option);
  }
}

// Event listeners
sourceSelect.addEventListener('change', async function() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (this.value === 'mic') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      source = audioContext.createMediaStreamSource(stream);
      uploadContainer.style.display = 'none';
      playPauseButton.textContent = 'Play/Pause';
      playPauseButton.disabled = false;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Failed to access the microphone. Please make sure you have granted permission.');
    }
  } else if (this.value === 'upload') {
    uploadContainer.style.display = 'block';
    playPauseButton.textContent = 'Upload File';
    playPauseButton.disabled = true;
  } else {
    await loadAudioBuffer(`assets/audio/${this.value}.mp3`);
    uploadContainer.style.display = 'none';
    playPauseButton.textContent = 'Play/Pause';
    playPauseButton.disabled = false;
  }
  setupAudioGraph();
});


audioUpload.addEventListener('change', function(event) {
  const file = event.target.files[0];
  loadAudioFile(file);
  playPauseButton.textContent = 'Play/Pause';
  playPauseButton.disabled = false;
});

reverbControl.addEventListener('input', applyAudioEffects);
delayControl.addEventListener('input', applyAudioEffects);
distortionControl.addEventListener('input', applyAudioEffects);
filterControl.addEventListener('input', applyAudioEffects);
pitchControl.addEventListener('input', applyAudioEffects);

// Event listener for the play/pause button
playPauseButton.addEventListener('click', async function() {
  if (!audioContext) {
      console.log("Initializing AudioContext...");
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await setupAudioGraph();
  }

  if (audioContext.state === 'suspended') {
      console.log("Resuming suspended AudioContext...");
      await audioContext.resume();
  }

  // Ensure source is ready and buffer is loaded
  if (!source || !source.buffer) {
      console.log("No audio source or buffer available. Loading buffer...");
      await loadAudioBuffer('assets/audio/sample1.mp3'); // Ensure this path is correct and accessible
      source.connect(audioContext.destination); // Connect source to destination if not already connected
  }

  if (source.started) {
      console.log("Stopping audio playback...");
      source.stop();
      source.started = false;  // Resetting the flag
  } else {
      console.log("Starting audio playback...");
      source.start(0);
      source.started = true;  // Setting the flag to mark as started
  }
});


presetSelect.addEventListener('change', loadPreset);
savePresetButton.addEventListener('click', savePreset);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePresetOptions();
});