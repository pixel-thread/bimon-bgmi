#!/usr/bin/env node

/**
 * Build wrapper script that filters out noisy console warnings.
 * This runs the actual build and suppresses repetitive warnings
 * that don't affect the build output.
 */

const { spawn } = require('child_process');

// Patterns to filter out (these are harmless warnings)
const FILTER_PATTERNS = [
    /\[baseline-browser-mapping\]/,
];

function shouldFilter(line) {
    return FILTER_PATTERNS.some(pattern => pattern.test(line));
}

// Run the actual build command
const buildProcess = spawn('npx', ['next', 'build', '--webpack'], {
    cwd: process.cwd(),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
});

buildProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (line.trim() && !shouldFilter(line)) {
            process.stdout.write(line + '\n');
        }
    }
});

buildProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (line.trim() && !shouldFilter(line)) {
            process.stderr.write(line + '\n');
        }
    }
});

buildProcess.on('close', (code) => {
    process.exit(code);
});
