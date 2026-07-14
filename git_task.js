const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command) {
    try {
        console.log(`Running: ${command}`);
        const output = execSync(command, { encoding: 'utf-8', cwd: 'd:\\crypto-appzeto\\crypto' });
        return output;
    } catch (err) {
        return err.stdout ? err.stdout.toString() : err.toString();
    }
}

const statusOutput = runCommand('git status');
fs.writeFileSync('d:\\crypto-appzeto\\crypto\\git_output.txt', statusOutput);
