export function createEqualizer(audioContext, container) {
  const frequencies = [60, 170, 350, 1000, 3500, 10000];
  const filters = frequencies.map((frequency) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
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
      input.min = '-12';
      input.max = '12';
      input.value = '0';
      input.step = '0.1';
      input.id = `freq-${frequency}`; // Unique ID for each input based on its frequency

      const label = document.createElement('label');
      label.textContent = `${frequency} Hz`;
      label.htmlFor = input.id; // Linking label to input using 'for' attribute

      band.appendChild(label);
      band.appendChild(input);
      container.appendChild(band);

      return input; // Return input element for further use in setParams/getParams
  });

  const setParams = (params) => {
      params.bands.forEach((value, index) => {
          filters[index].gain.value = value;
          bands[index].value = value;
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
