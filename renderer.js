document.addEventListener('DOMContentLoaded', () => {
    const inputFileElement = document.getElementById('input-file-path');
    const outputFileElement = document.getElementById('output-file-path');
    const selectInputBtn = document.getElementById('select-input');
    const selectOutputBtn = document.getElementById('select-output');
    const convertBtn = document.getElementById('convert-btn');
    const statusElement = document.getElementById('status');
    const magnificationSelect = document.getElementById('magnification');
    const customScaleDiv = document.getElementById('custom-scale-div');
    const customScaleInput = document.getElementById('custom-scale');
    const yScaleInput = document.getElementById('y-scale');
    const zScaleInput = document.getElementById('z-scale');
    const downsampleInput = document.getElementById('downsample');
    const microscopeSelect = document.getElementById('microscope');
    
    // Toggle custom scale input based on magnification selection
    magnificationSelect.addEventListener('change', () => {
      if (magnificationSelect.value === 'custom') {
        customScaleDiv.style.display = 'block';
      } else {
        customScaleDiv.style.display = 'none';
      }
    });
    
    // Select input CSV file
    selectInputBtn.addEventListener('click', async () => {
      try {
        const filePath = await window.electronAPI.selectCSVFile();
        if (filePath) {
          inputFileElement.value = filePath;
          // Set a default output filename based on input
          if (!outputFileElement.value) {
            const inputFileName = filePath.split('/').pop().replace('.csv', '');
            outputFileElement.value = filePath.replace(/\.csv$/, '.stl');
          }
        }
      } catch (error) {
        setStatus(`Error selecting input file: ${error.message}`, true);
      }
    });
    
    // Select output STL location
    selectOutputBtn.addEventListener('click', async () => {
      try {
        const filePath = await window.electronAPI.selectSaveLocation();
        if (filePath) {
          outputFileElement.value = filePath;
        }
      } catch (error) {
        setStatus(`Error selecting output location: ${error.message}`, true);
      }
    });
    
    // Convert button action
    convertBtn.addEventListener('click', async () => {
      const inputFile = inputFileElement.value;
      const outputFile = outputFileElement.value;
      
      if (!inputFile || !outputFile) {
        setStatus('Please select both input and output files', true);
        return;
      }
      
      // Determine magnification or scale value
      let magnificationValue;
      if (magnificationSelect.value === 'custom') {
        magnificationValue = customScaleInput.value;
      } else {
        magnificationValue = magnificationSelect.value;
      }
      
      setStatus('Converting... Please wait', false);
      convertBtn.disabled = true;
      
      try {
        const result = await window.electronAPI.convertCSVToSTL({
          inputFile,
          outputFile,
          magnification: magnificationValue,
          yScale: yScaleInput.value || "null",
          zScale: zScaleInput.value || "1",
          downsample: downsampleInput.value || "1",
          microscope: microscopeSelect.value
        });
        
        if (result.success) {
          setStatus(result.message, false);
        } else {
          setStatus(result.message, true);
        }
      } catch (error) {
        setStatus(`Conversion failed: ${error.message}`, true);
      } finally {
        convertBtn.disabled = false;
      }
    });
    
    function setStatus(message, isError) {
      statusElement.textContent = message;
      statusElement.className = isError ? 'error' : 'success';
    }
  });