// Creates a script in the root folder that will
// launch a terminal/console to run npm start
const isWin = process.platform === 'win32';
const nixScript = `#!/bin/bash
cd \`dirname "$0"\`
npm start`;
const winScript = `dir %~dp0
npm start
`;
const fileName = isWin ? 'run.bat' : 'run.command';
const script = isWin ? winScript : nixScript;

// create script
console.log(`Creating run script for Code X. You can run Code X by double-clicking ${fileName}.`)
const fs = require('fs');
fs.writeFileSync(
    fileName, 
    script,
    function () {}
);
// set execute
fs.chmodSync(fileName, 0o775, (err) => {
    if (err) throw err;
    console.log('Set executable.');
  });