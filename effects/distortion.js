export function createDistortion(audioContext) {
    const distortion = audioContext.createWaveShaper();
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const dry = audioContext.createGain();
    const wet = audioContext.createGain();
  
    input.connect(dry);
    input.connect(wet);
    wet.connect(distortion);
    distortion.connect(output);
    dry.connect(output);
  
    const setParams = (params) => {
      const amount = params.amount * 100;
      const k = amount / 100;
      const deg = Math.PI / 180;
      const curve = new Float32Array(44100);
      const x = 2 * k / (1 - k);
  
      for (let i = 0; i < 44100; i++) {
        const a = i / 44100;
        curve[i] = (1 + x) * a / (1 + x * Math.abs(a));
      }
  
      distortion.curve = curve;
      wet.gain.value = params.amount;
      dry.gain.value = 1 - params.amount;
    };
  
    const getParams = () => ({
      amount: wet.gain.value,
    });
  
    return {
      input,
      output,
      setParams,
      getParams,
    };
  }