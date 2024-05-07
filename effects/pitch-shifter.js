export function createPitchShifter(audioContext) {
  const workletUrl = 'effects/pitch-shifter-processor.js';
  return audioContext.audioWorklet.addModule(workletUrl).then(() => {
    const pitchShifterNode = new AudioWorkletNode(audioContext, 'pitch-shifter-processor');
    const inputNode = audioContext.createGain();
    const outputNode = audioContext.createGain();
    const gainNode = audioContext.createGain(); // Add a gain node for controlling the output

    inputNode.connect(pitchShifterNode);
    pitchShifterNode.connect(gainNode);
    gainNode.connect(outputNode);

    return {
      input: inputNode,
      output: outputNode,
      node: pitchShifterNode,
      setParams: (params) => {
        pitchShifterNode.parameters.get('pitch').setValueAtTime(params.pitch, audioContext.currentTime);
        gainNode.gain.setValueAtTime(params.gain || 1, audioContext.currentTime); // Set the gain value
      },
      getParams: () => ({
        pitch: pitchShifterNode.parameters.get('pitch').value,
        gain: gainNode.gain.value // Get the current gain value
      })
    };
  });
}