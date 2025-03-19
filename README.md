# CSV to STL Converter

A desktop application that converts CSV height data from microscope scans into 3D STL models for visualization and 3D printing.

![Application Screenshot](https://via.placeholder.com/800x500?text=CSV+to+STL+Converter)

## Features

- User-friendly interface for converting CSV height maps to 3D STL files
- Support for VHX-7100 and VHX-7020 microscope data
- Predefined magnification levels with proper scaling
- Custom scale options for specialized datasets
- Z-scale adjustment for height exaggeration
- Downsampling controls to manage file size and detail level
- Solid model generation with proper base and side walls

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- npm (included with Node.js)

### Setup Instructions

#### macOS and Linux

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/csv-to-stl.git
cd csv-to-stl
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the application in development mode**

```bash
npm start
```

#### Windows

1. **Clone the repository**
   - If you have Git installed:
   ```cmd
   git clone https://github.com/yourusername/csv-to-stl.git
   cd csv-to-stl
   ```
   - Alternatively, download the ZIP file from GitHub and extract it

2. **Install dependencies**
   - Open Command Prompt or PowerShell as Administrator
   - Navigate to the extracted folder:
   ```cmd
   cd path\to\csv-to-stl
   ```
   - Install dependencies:
   ```cmd
   npm install
   ```
   - If you encounter errors, try running:
   ```cmd
   npm install --legacy-peer-deps
   ```

3. **Run the application in development mode**
   ```cmd
   npm start
   ```

### Building a Standalone Application

To create a distributable package that doesn't require Node.js to be installed:

#### macOS
```bash
npm run build
```

#### Windows
```cmd
npm run build
```
or specifically for Windows:
```cmd
npm run build -- --win
```

This will create executable files in the `dist` folder for your platform.

#### Windows-Specific Notes
- The generated Windows installer will be in `.exe` format in the `dist` folder
- You may need to give permission to run the app the first time
- If you receive SmartScreen warnings, click "More info" and then "Run anyway"

## Usage Guide

1. **Select Input File**: Click "Browse" next to "Input CSV File" to select your microscope height data
2. **Set Output Location**: Choose where to save the STL file
3. **Configure Settings**:
   - Select your microscope model
   - Choose the magnification level used when capturing the data
   - Adjust Z-scale to control the height exaggeration
   - Set the downsample factor (higher = smaller file size but less detail)
4. **Convert**: Click the "Convert to STL" button to generate your 3D model

### Windows-Specific Usage Tips
- Use Windows Explorer to navigate to your CSV files
- For faster access, pin the application to your taskbar or Start menu
- CSV files should use comma (,) as the delimiter (not semicolon)
- If dealing with very large files, try increasing the downsample factor

## Microscope Calibration

The application uses the following pixel sizes for different magnifications:

### VHX-7100 Model
| Magnification | Pixel Size (μm) |
|---------------|----------------|
| 20x           | 5.2            |
| 50x           | 2.1            |
| 100x          | 1.04           |
| 500x          | 0.208          |
| 1000x         | 0.104          |
| ...           | ...            |

### VHX-7020 Model
| Magnification | Pixel Size (μm) |
|---------------|----------------|
| 20x           | 7.3            |
| 50x           | 2.9            |
| 100x          | 1.46           |
| 500x          | 0.293          |
| 1000x         | 0.146          |
| ...           | ...            |

## Advanced Usage

### Custom Scaling

For datasets not captured with standard microscope magnifications, select "Custom Scale" in the magnification dropdown and enter your own scale factor.

### File Size Management

Large CSV files can create very detailed STL models that may be difficult to use. The downsample factor lets you reduce the mesh complexity. Start with a high value (20-50) if you have performance issues, then adjust down for more detail.

### Technical Details

The converter works by:
1. Reading the height map from the CSV
2. Creating a triangulated surface from the grid data
3. Adding sides and a base to create a solid model
4. Calculating proper surface normals for correct rendering
5. Generating an ASCII STL file compatible with most 3D software and printers

## Troubleshooting

### Common Issues on Windows
- **"npm is not recognized"**: Make sure Node.js is installed properly and added to your PATH
- **Permission errors**: Run Command Prompt/PowerShell as Administrator
- **Build errors**: Try running `npm install --legacy-peer-deps` or update Node.js
- **File path errors**: Make sure you use valid Windows file paths, or let the app browse for files
- **Conversion errors**: Ensure your CSV is properly formatted with numeric height values

### Common Issues on macOS
- **Permission issues**: You may need to allow the app in System Preferences > Security & Privacy
- **Terminal permissions**: Give Terminal full disk access if you encounter permission errors
- **Installation errors**: Try `sudo npm install` if you encounter permission issues

## Development

### Project Structure

```
csv-to-stl/
├── index.html        # Main application UI
├── main.js           # Electron main process
├── preload.js        # Secure bridge between processes
├── renderer.js       # UI logic
├── src/
│   └── converter.js  # CSV to STL conversion logic
└── styles.css        # Application styling
```

### Building for Different Platforms

To build for a specific platform:

```bash
# For macOS
npm run build -- --mac

# For Windows
npm run build -- --win

# For Linux
npm run build -- --linux
```

#### Cross-Platform Building Notes
- Building Windows apps from macOS requires Wine to be installed
- Building macOS apps is only fully supported on macOS systems
- For production builds, consider using GitHub Actions or another CI service

## License

MIT

## Acknowledgements

- Uses [Electron](https://www.electronjs.org/) for cross-platform desktop application
- [PapaParse](https://www.papaparse.com/) for CSV parsing

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.