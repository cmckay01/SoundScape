export function createReverb(audioContext) {
  const convolver = audioContext.createConvolver();
  const seconds = 3;
  const decay = 2;
  const rate = audioContext.sampleRate;
  const length = rate * seconds;
  const impulse = audioContext.createBuffer(2, length, rate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / rate;
    const e = Math.pow(1 - n / seconds, decay);
    left[i] = (Math.random() * 2 - 1) * e;
    right[i] = (Math.random() * 2 - 1) * e;
  }

  convolver.buffer = impulse;

  const input = audioContext.createGain();
  const output = audioContext.createGain();
  const dry = audioContext.createGain();
  const wet = audioContext.createGain();

  input.connect(dry);
  input.connect(wet);
  wet.connect(convolver);
  convolver.connect(output);
  dry.connect(output);

  const setParams = (params) => {
    wet.gain.value = params.seconds;
    dry.gain.value = 1 - params.seconds;
  };

  const getParams = () => ({
    seconds: wet.gain.value,
  });

  return {
    input,
    output,
    setParams,
    getParams,
  };
}