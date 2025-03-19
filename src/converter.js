// CSV to STL Converter for Height Data

/**
 * Function to convert CSV height data to STL
 * @param {string} csvFilePath - Path to the CSV file
 * @param {string} outputFilePath - Path to save the STL file
 * @param {number|string} magnificationOrScale - Either a magnification level (20x, 30x, etc.) or a custom X scale factor
 * @param {number} yScale - Scale factor for Y dimension (default: same as X scale)
 * @param {number} zScale - Scale factor for Z dimension (height) (default: 1)
 * @param {number} downsample - Downsample factor to reduce mesh size (default: 1, no downsampling)
 * @param {string} microscope - Microscope model (default: 'VHX-7100', can also be 'VHX-7020')
 */
async function convertCSVToSTL(csvFilePath, outputFilePath, magnificationOrScale = 1, yScale = null, zScale = 1, downsample = 1, microscope = 'VHX-7100') {
  try {
    const fs = require('fs');
    const Papa = require('papaparse');
    
    // VHX-7100 microscope pixel sizes (in μm) at different magnifications
    const pixelSizes = {
      'VHX-7100': {
        '20x': 5.2,
        '30x': 3.5,
        '40x': 2.6,
        '50x': 2.1,
        '80x': 1.3,
        '100x': 1.04,
        '150x': 0.69,
        '200x': 0.52,
        '300x': 0.35,
        '400x': 0.26,
        '500x': 0.208,
        '700x': 0.149,
        '1000x': 0.104,
        '1500x': 0.069,
        '2000x': 0.052,
        '2500x': 0.0417,
        '4000x': 0.0260,
        '5000x': 0.0208,
        '6000x': 0.0174
      },
      'VHX-7020': {
        '20x': 7.3,
        '30x': 4.9,
        '40x': 3.7,
        '50x': 2.9,
        '80x': 1.8,
        '100x': 1.46,
        '150x': 0.98,
        '200x': 0.73,
        '300x': 0.49,
        '400x': 0.37,
        '500x': 0.293,
        '700x': 0.209,
        '1000x': 0.146,
        '1500x': 0.098,
        '2000x': 0.073,
        '2500x': 0.0586,
        '4000x': 0.0366,
        '5000x': 0.0293,
        '6000x': 0.0244
      }
    };
    
    // Determine xScale based on input - either use magnification or direct scale
    let actualXScale;
    if (typeof magnificationOrScale === 'string' && magnificationOrScale.endsWith('x')) {
      // Input is a magnification (e.g., '500x')
      if (!pixelSizes[microscope] || !pixelSizes[microscope][magnificationOrScale]) {
        console.warn(`Warning: Unknown magnification "${magnificationOrScale}" for microscope "${microscope}". Using default scale of 1.`);
        actualXScale = 1;
      } else {
        // Get pixel size in μm based on magnification and microscope model
        const pixelSize = pixelSizes[microscope][magnificationOrScale];
        actualXScale = pixelSize;
        console.log(`Using pixel size ${pixelSize} μm (${magnificationOrScale} on ${microscope})`);
      }
    } else {
      // Input is a direct scale factor
      actualXScale = Number(magnificationOrScale);
    }
    
    // Use provided yScale or make it same as xScale if not specified
    const actualYScale = yScale === null ? actualXScale : yScale;
    
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    
    // Parse the CSV data
    const parsedData = Papa.parse(csvData, {
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    const heightMap = parsedData.data;
    
    // Apply downsampling if needed
    let downsampledHeightMap = heightMap;
    if (downsample > 1) {
      downsampledHeightMap = [];
      for (let i = 0; i < heightMap.length; i += downsample) {
        const row = [];
        for (let j = 0; j < heightMap[0].length; j += downsample) {
          row.push(heightMap[i][j]);
        }
        downsampledHeightMap.push(row);
      }
    }
    
    // Get dimensions
    const rows = downsampledHeightMap.length;
    const cols = downsampledHeightMap[0].length;
    
    console.log(`Processing ${rows} x ${cols} grid (after downsampling)`);
    
    // *** IMPORTANT FIX: Adjust X and Y scale to maintain aspect ratio when downsampling ***
    const adjustedXScale = actualXScale * downsample;
    const adjustedYScale = actualYScale * downsample;
    
    console.log(`Using adjusted scales: X=${adjustedXScale} mm, Y=${adjustedYScale} mm, Z=${zScale}`);
    
    // Generate STL content
    const stlContent = generateSTL(downsampledHeightMap, rows, cols, adjustedXScale, adjustedYScale, zScale);
    
    // Write the STL file
    fs.writeFileSync(outputFilePath, stlContent);
    
    console.log(`STL file saved to ${outputFilePath}`);
    return true;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Generate STL content from height map
 * @param {Array<Array<number>>} heightMap - 2D array of height values
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {number} xScale - Scale factor for X
 * @param {number} yScale - Scale factor for Y
 * @param {number} zScale - Scale factor for Z (height)
 * @returns {string} - ASCII STL content
 */
function generateSTL(heightMap, rows, cols, xScale, yScale, zScale) {
  // Start the STL file content
  let stlContent = 'solid heightmap\n';
  
  // Helper function to calculate the normal of a triangle
  function calculateNormal(v1, v2, v3) {
    // Calculate vectors
    const u = [
      v2[0] - v1[0],
      v2[1] - v1[1],
      v2[2] - v1[2]
    ];
    
    const v = [
      v3[0] - v1[0],
      v3[1] - v1[1],
      v3[2] - v1[2]
    ];
    
    // Cross product
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
    
    // Normalize
    const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
    if (length > 0) {
      normal[0] /= length;
      normal[1] /= length;
      normal[2] /= length;
    }
    
    return normal;
  }
  
  // Generate top surface triangles
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      // Define the four corners of the grid cell
      const v1 = [j * xScale, i * yScale, heightMap[i][j] * zScale];
      const v2 = [(j + 1) * xScale, i * yScale, heightMap[i][j + 1] * zScale];
      const v3 = [j * xScale, (i + 1) * yScale, heightMap[i + 1][j] * zScale];
      const v4 = [(j + 1) * xScale, (i + 1) * yScale, heightMap[i + 1][j + 1] * zScale];
      
      // First triangle (v1, v2, v3)
      const normal1 = calculateNormal(v1, v2, v3);
      stlContent += `  facet normal ${normal1[0]} ${normal1[1]} ${normal1[2]}\n`;
      stlContent += '    outer loop\n';
      stlContent += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
      stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      stlContent += '    endloop\n';
      stlContent += '  endfacet\n';
      
      // Second triangle (v2, v4, v3)
      const normal2 = calculateNormal(v2, v4, v3);
      stlContent += `  facet normal ${normal2[0]} ${normal2[1]} ${normal2[2]}\n`;
      stlContent += '    outer loop\n';
      stlContent += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
      stlContent += `      vertex ${v4[0]} ${v4[1]} ${v4[2]}\n`;
      stlContent += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
      stlContent += '    endloop\n';
      stlContent += '  endfacet\n';
    }
  }
  
  // Add bottom and sides to create a solid model
  // Find minimum height to create a base
  let minHeight = Number.MAX_VALUE;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (heightMap[i][j] < minHeight) {
        minHeight = heightMap[i][j];
      }
    }
  }
  
  // Base thickness (can be adjusted)
  const baseThickness = 1;
  const baseZ = (minHeight - baseThickness) * zScale;
  
  // Add bottom face (a single rectangle using two triangles)
  const bottomCorners = [
    [0, 0, baseZ],
    [(cols - 1) * xScale, 0, baseZ],
    [0, (rows - 1) * yScale, baseZ],
    [(cols - 1) * xScale, (rows - 1) * yScale, baseZ]
  ];
  
  // First triangle of bottom
  const bottomNormal1 = [0, 0, -1]; // Pointing downward
  stlContent += `  facet normal ${bottomNormal1[0]} ${bottomNormal1[1]} ${bottomNormal1[2]}\n`;
  stlContent += '    outer loop\n';
  stlContent += `      vertex ${bottomCorners[0][0]} ${bottomCorners[0][1]} ${bottomCorners[0][2]}\n`;
  stlContent += `      vertex ${bottomCorners[2][0]} ${bottomCorners[2][1]} ${bottomCorners[2][2]}\n`;
  stlContent += `      vertex ${bottomCorners[1][0]} ${bottomCorners[1][1]} ${bottomCorners[1][2]}\n`;
  stlContent += '    endloop\n';
  stlContent += '  endfacet\n';
  
  // Second triangle of bottom
  stlContent += `  facet normal ${bottomNormal1[0]} ${bottomNormal1[1]} ${bottomNormal1[2]}\n`;
  stlContent += '    outer loop\n';
  stlContent += `      vertex ${bottomCorners[1][0]} ${bottomCorners[1][1]} ${bottomCorners[1][2]}\n`;
  stlContent += `      vertex ${bottomCorners[2][0]} ${bottomCorners[2][1]} ${bottomCorners[2][2]}\n`;
  stlContent += `      vertex ${bottomCorners[3][0]} ${bottomCorners[3][1]} ${bottomCorners[3][2]}\n`;
  stlContent += '    endloop\n';
  stlContent += '  endfacet\n';
  
  // Add side walls (4 sides connecting the top and bottom)
  // Front side (y = 0)
  for (let j = 0; j < cols - 1; j++) {
    const topLeft = [j * xScale, 0, heightMap[0][j] * zScale];
    const topRight = [(j + 1) * xScale, 0, heightMap[0][j + 1] * zScale];
    const bottomLeft = [j * xScale, 0, baseZ];
    const bottomRight = [(j + 1) * xScale, 0, baseZ];
    
    // First triangle
    const sideNormal = [0, -1, 0]; // Pointing front
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${topLeft[0]} ${topLeft[1]} ${topLeft[2]}\n`;
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
    
    // Second triangle
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${bottomRight[0]} ${bottomRight[1]} ${bottomRight[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
  }
  
  // Back side (y = rows-1)
  for (let j = 0; j < cols - 1; j++) {
    const topLeft = [j * xScale, (rows - 1) * yScale, heightMap[rows - 1][j] * zScale];
    const topRight = [(j + 1) * xScale, (rows - 1) * yScale, heightMap[rows - 1][j + 1] * zScale];
    const bottomLeft = [j * xScale, (rows - 1) * yScale, baseZ];
    const bottomRight = [(j + 1) * xScale, (rows - 1) * yScale, baseZ];
    
    // First triangle
    const sideNormal = [0, 1, 0]; // Pointing back
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${topLeft[0]} ${topLeft[1]} ${topLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
    
    // Second triangle
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += `      vertex ${bottomRight[0]} ${bottomRight[1]} ${bottomRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
  }
  
  // Left side (x = 0)
  for (let i = 0; i < rows - 1; i++) {
    const topLeft = [0, i * yScale, heightMap[i][0] * zScale];
    const topRight = [0, (i + 1) * yScale, heightMap[i + 1][0] * zScale];
    const bottomLeft = [0, i * yScale, baseZ];
    const bottomRight = [0, (i + 1) * yScale, baseZ];
    
    // First triangle
    const sideNormal = [-1, 0, 0]; // Pointing left
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${topLeft[0]} ${topLeft[1]} ${topLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
    
    // Second triangle
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += `      vertex ${bottomRight[0]} ${bottomRight[1]} ${bottomRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
  }
  
  // Right side (x = cols-1)
  for (let i = 0; i < rows - 1; i++) {
    const topLeft = [(cols - 1) * xScale, i * yScale, heightMap[i][cols - 1] * zScale];
    const topRight = [(cols - 1) * xScale, (i + 1) * yScale, heightMap[i + 1][cols - 1] * zScale];
    const bottomLeft = [(cols - 1) * xScale, i * yScale, baseZ];
    const bottomRight = [(cols - 1) * xScale, (i + 1) * yScale, baseZ];
    
    // First triangle
    const sideNormal = [1, 0, 0]; // Pointing right
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${topLeft[0]} ${topLeft[1]} ${topLeft[2]}\n`;
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
    
    // Second triangle
    stlContent += `  facet normal ${sideNormal[0]} ${sideNormal[1]} ${sideNormal[2]}\n`;
    stlContent += '    outer loop\n';
    stlContent += `      vertex ${bottomLeft[0]} ${bottomLeft[1]} ${bottomLeft[2]}\n`;
    stlContent += `      vertex ${bottomRight[0]} ${bottomRight[1]} ${bottomRight[2]}\n`;
    stlContent += `      vertex ${topRight[0]} ${topRight[1]} ${topRight[2]}\n`;
    stlContent += '    endloop\n';
    stlContent += '  endfacet\n';
  }
  
  // End STL file
  stlContent += 'endsolid heightmap\n';
  
  return stlContent;
}

// Export the function properly at the end of the file
module.exports = { convertCSVToSTL };