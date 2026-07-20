const { spawn } = require('child_process');
const fs = require('fs');
const child = spawn('node', ['server.js']);
child.stdout.on('data', data => fs.appendFileSync('out.log', data));
child.stderr.on('data', data => fs.appendFileSync('out.log', data));
child.on('close', code => fs.appendFileSync('out.log', `Exited with ${code}`));
