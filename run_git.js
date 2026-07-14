const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('git log --name-status HEAD -1', { encoding: 'utf-8', cwd: 'd:\\crypto-appzeto\\crypto' });
  fs.writeFileSync('d:\\crypto-appzeto\\crypto\\git_output.txt', output);
  console.log('Success');
} catch (err) {
  fs.writeFileSync('d:\\crypto-appzeto\\crypto\\git_output.txt', err.toString());
  console.error('Error');
}
