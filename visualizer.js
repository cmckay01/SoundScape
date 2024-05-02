export function createVisualizer(audioContext, sourceNode) {
    const analyser = audioContext.createAnalyser();
    sourceNode.connect(analyser);
  
    const canvas = document.getElementById('visualizer');
    const canvasContext = canvas.getContext('2d');
  
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  
    function draw() {
      requestAnimationFrame(draw);
  
      analyser.getByteFrequencyData(dataArray);
  
      canvasContext.fillStyle = 'rgb(0, 0, 0)';
      canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
  
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
  
        canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
  
        x += barWidth + 1;
      }
    }
  
    draw();
  }