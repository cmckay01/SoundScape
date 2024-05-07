export function createEqualizer(audioContext, container) {
  container.innerHTML = ''; // Clear the container before creating new bands

  // Define the frequencies for the equalizer bands
  const frequencies = [100, 250, 500, 1000, 2000, 4000, 8000];

  const filters = frequencies.map((frequency, index) => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 1.5;
    filter.gain.value = 0 
    return filter;
  });

  const input = audioContext.createGain();
  const output = audioContext.createGain();

  input.connect(filters[0]);
  for (let i = 0; i < filters.length - 1; i++) {
    filters[i].connect(filters[i + 1]);
  }
  filters[filters.length - 1].connect(output);

  const bands = frequencies.map((frequency, index) => {
    const band = document.createElement('div');
    band.classList.add('band');
  
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '-28';
    input.max = '28';
    input.value = '0';
    input.step = '0.1';
    input.id = `freq-${frequency}`;
  
    // Event listener to apply changes immediately on user input
    input.addEventListener('input', () => {
      const newParams = { bands: bands.map(band => parseFloat(band.value)) };
      setParams(newParams);
    });
  
    const label = document.createElement('label');
    label.textContent = `${frequency} Hz`;
    label.htmlFor = input.id;
  
    band.appendChild(label);
    band.appendChild(input);
    container.appendChild(band);
  
    return input;
  });

  const setParams = (params) => {
    //console.log("Setting EQ Params:", params);
    params.bands.forEach((value, index) => {
      const gainValue = Math.pow(10, value / 20); // Convert dB to linear
      filters[index].gain.value = gainValue;
      bands[index].value = value; // Update the slider UI
      //console.log(`Band ${index + 1} (${frequencies[index]} Hz): ${gainValue}`);
    });
  };

  const getParams = () => ({
    bands: bands.map(band => parseFloat(band.value)),
  });

  let onParamsChange = () => {};

  return {
    input,
    output,
    setParams,
    getParams,
    onParamsChange: (callback) => {
      onParamsChange = callback;
    },
  };
}
