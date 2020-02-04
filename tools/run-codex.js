// This script creates an executable for Mac, Windows, and Linux
// using the npm package pkg

// change to file path
const path = require('path');
const cwd = path.dirname(process.execPath);
process.chdir(cwd);

// run npm install if node_modules doesn't exist
const fs = require('fs');
const childProcess = require('child_process');
if (!fs.existsSync(path.resolve(cwd, 'node_modules'))) {
  console.log('Installing npm dependencies...');
  childProcess.execSync('npm install'), function(err, stdout, stderr) { 
    console.log(stdout); 
};
}

// run dev server
console.log('Starting server at http://localhost:8080/');
childProcess.execSync('npm start', function(err, stdout, stderr) { 
  console.log(stdout); 
});