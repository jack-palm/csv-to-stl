const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectCSVFile: () => ipcRenderer.invoke('select-csv-file'),
  selectSaveLocation: () => ipcRenderer.invoke('select-save-location'),
  convertCSVToSTL: (args) => ipcRenderer.invoke('convert-csv-to-stl', args)
});
