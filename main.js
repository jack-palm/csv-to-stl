const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { convertCSVToSTL } = require('./src/converter');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Uncomment for development tools
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle events from renderer
ipcMain.handle('select-csv-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-save-location', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'STL Files', extensions: ['stl'] }]
  });
  
  if (!result.canceled) {
    return result.filePath;
  }
  return null;
});

ipcMain.handle('convert-csv-to-stl', async (_, args) => {
  try {
    const {
      inputFile,
      outputFile,
      magnification,
      yScale,
      zScale,
      downsample,
      microscope
    } = args;
    
    // Convert null string to actual null
    const actualYScale = yScale === "null" ? null : parseFloat(yScale);
    
    await convertCSVToSTL(
      inputFile,
      outputFile,
      magnification,
      actualYScale,
      parseFloat(zScale),
      parseInt(downsample),
      microscope
    );
    
    return { success: true, message: `STL file saved to ${outputFile}` };
  } catch (error) {
    console.error('Conversion error:', error);
    return { success: false, message: `Error: ${error.message}` };
  }
});
