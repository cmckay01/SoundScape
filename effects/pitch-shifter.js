export function createPitchShifter(audioContext) {
  const workletUrl = 'effects/pitch-shifter-processor.js';
  return audioContext.audioWorklet.addModule(workletUrl).then(() => {
    const pitchShifterNode = new AudioWorkletNode(audioContext, 'pitch-shifter-processor');
    const inputNode = audioContext.createGain();
    const outputNode = audioContext.createGain();
    inputNode.connect(pitchShifterNode);
    pitchShifterNode.connect(outputNode);

    return {
      input: inputNode,
      output: outputNode,
      node: pitchShifterNode, // added this to access the actual AudioWorkletNode
      setParams: (params) => {
        pitchShifterNode.parameters.get('pitch').setValueAtTime(params.pitch, audioContext.currentTime);
      },
      getParams: () => ({
        pitch: pitchShifterNode.parameters.get('pitch').value
      })
    };
  });
}
