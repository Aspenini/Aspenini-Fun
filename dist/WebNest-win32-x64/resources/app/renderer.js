const { dialog } = require('electron').remote;
const fs = require('fs');

document.getElementById('importButton').addEventListener('click', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'HTML Files', extensions: ['html'] }],
  });

  if (!result.canceled) {
    const selectedPath = result.filePaths[0];
    if (fs.lstatSync(selectedPath).isDirectory()) {
      // Handle importing a folder
      console.log('Folder selected:', selectedPath);
    } else {
      // Handle importing a single HTML file
      console.log('File selected:', selectedPath);
      fs.readFile(selectedPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return;
        }
        document.getElementById('importedContent').innerHTML = data;
      });
    }
  }
});
