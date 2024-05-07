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
  updateTimeCounter();
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

  if (reverbNode) reverbNode.setParams({ seconds: reverbValue / 100 });
  if (delayNode) delayNode.setParams({ delayTime: delayValue });
  if (distortionNode) distortionNode.setParams({ amount: distortionValue / 100 });
  if (filterNode) filterNode.setParams({ frequency: filterValue });
  if (pitchShifterNode) pitchShifterNode.setParams({ pitch: pitchValue, gain: 1 }); // Set the pitch and gain values
  if (equalizerNode) equalizerNode.setParams(equalizerNode.getParams());

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
    if (equalizerNode) {
      equalizerNode.setParams(preset.equalizer);
    }
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

  // Check if the source is playing
  if (source && source.started) {
    console.log("Stopping audio playback...");
    source.stop();
    source.started = false; // Resetting the flag
    cancelAnimationFrame(updateTimeCounter.animationFrameId); // Stop updating the time counter
  } else {
    console.log("Starting audio playback...");
    if (!source.buffer) {
      // If buffer is empty, load it
      const selectedValue = sourceSelect.value;
      await loadAudioBuffer(`assets/audio/${selectedValue}.mp3`);
    }
    source = audioContext.createBufferSource();
    source.buffer = await audioContext.decodeAudioData(await (await fetch(`assets/audio/${sourceSelect.value}.mp3`)).arrayBuffer());
    source.connect(gainNode); // Ensure all connections in the audio graph are made again
    source.start(0);
    source.started = true; // Setting the flag to mark as started
    source.startTime = audioContext.currentTime; // Update start time for accurate timing

    source.onended = function() {
      console.log("Audio playback ended.");
      source.started = false;
      cancelAnimationFrame(updateTimeCounter.animationFrameId); // Ensure to stop the time counter
      updateTimeCounter(); // Update once more to show the end time
    };
    updateTimeCounter(); // Start updating the time counter again
  }
});


presetSelect.addEventListener('change', loadPreset);
savePresetButton.addEventListener('click', savePreset);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePresetOptions();
});

// Update time counter
function updateTimeCounter() {
  const timeCounter = document.getElementById('time-counter');
  if (source && source.buffer && source.started) {
    const currentTime = audioContext.currentTime - source.startTime;
    const duration = source.buffer.duration;
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeCounter.textContent = `${formattedTime} / ${formatTime(duration)}`;
  } else {
    // Ensure that the counter shows zero when the audio is not playing
    timeCounter.textContent = '00:00 / ' + formatTime(source.buffer.duration);
  }

  updateTimeCounter.animationFrameId = requestAnimationFrame(updateTimeCounter);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

//Takes the audio buffer and applies all the effects to it
async function processAudio(audioBuffer) {
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  const gainNode = offlineContext.createGain();
  source.connect(gainNode);

  const reverbNode = await createReverb(offlineContext);
  const delayNode = await createDelay(offlineContext);
  const distortionNode = await createDistortion(offlineContext);
  const filterNode = await createFilter(offlineContext);
  const pitchShifterNode = await createPitchShifter(offlineContext);
  const equalizerNode = await createEqualizer(offlineContext, equalizerContainer);

  gainNode.connect(reverbNode.input);
  reverbNode.output.connect(delayNode.input);
  delayNode.output.connect(distortionNode.input);
  distortionNode.output.connect(filterNode.input);
  filterNode.output.connect(pitchShifterNode.input);
  pitchShifterNode.output.connect(equalizerNode.input);
  equalizerNode.output.connect(offlineContext.destination);

  // Apply effect parameters
  reverbNode.setParams({ seconds: parseFloat(reverbControl.value) / 100 });
  delayNode.setParams({ delayTime: parseFloat(delayControl.value) });
  distortionNode.setParams({ amount: parseFloat(distortionControl.value) / 100 });
  filterNode.setParams({ frequency: parseFloat(filterControl.value) });
  pitchShifterNode.setParams({ pitch: parseFloat(pitchControl.value) });
  equalizerNode.setParams(equalizerNode.getParams());

  source.start();

  return offlineContext.startRendering();
}

// Download the modified audio
async function downloadAudio() {
  if (source && source.buffer) {
    const renderedBuffer = await processAudio(source.buffer);
    const audioData = renderedBuffer.getChannelData(0);
    const dataview = encodeWAV(audioData, renderedBuffer.sampleRate);
    const audioBlob = new Blob([dataview], { type: 'audio/wav' });
    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modified_audio.wav';
    link.click();
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  floatTo16BitPCM(view, 44, samples);

  return view;
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

// Add download button event listener
const downloadButton = document.getElementById('download-audio');
downloadButton.addEventListener('click', downloadAudio);