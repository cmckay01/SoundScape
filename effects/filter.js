export function createFilter(audioContext) {
    const filter = audioContext.createBiquadFilter();
    const input = audioContext.createGain();
    const output = audioContext.createGain();
  
    input.connect(filter);
    filter.connect(output);
  
    const setParams = (params) => {
      filter.type = 'lowpass';
      filter.frequency.value = params.frequency;
      filter.Q.value = 1;
    };
  
    const getParams = () => ({
      frequency: filter.frequency.value,
    });
  
    return {
      input,
      output,
      setParams,
      getParams,
    };
  }