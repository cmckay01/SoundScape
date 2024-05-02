export function createDelay(audioContext) {
    const delay = audioContext.createDelay(5.0);
    const input = audioContext.createGain();
    const output = audioContext.createGain();
    const dry = audioContext.createGain();
    const wet = audioContext.createGain();
    const feedback = audioContext.createGain();
  
    input.connect(dry);
    input.connect(wet);
    wet.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    feedback.connect(output);
    dry.connect(output);
  
    const setParams = (params) => {
      delay.delayTime.value = params.delayTime;
      feedback.gain.value = params.delayTime;
      wet.gain.value = params.delayTime;
      dry.gain.value = 1 - params.delayTime;
    };
  
    const getParams = () => ({
      delayTime: delay.delayTime.value,
    });
  
    return {
      input,
      output,
      setParams,
      getParams,
    };
  }