#!/usr/bin/env node

/**
 * Backend Health Checker for STEPVOICE AI
 * Utility to check if the AI service backend is running and provide instructions
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const AI_SERVICE_URLS = [
    'http://127.0.0.1:8052',
    'http://localhost:8052'
];

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection(url) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: '/ai/health',
            method: 'GET',
            timeout: 3000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        resolve({ success: true, data: response, url });
                    } catch (e) {
                        resolve({ success: false, error: 'Invalid JSON response', url });
                    }
                } else {
                    resolve({ success: false, error: `HTTP ${res.statusCode}`, url });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message, url });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, error: 'Connection timeout', url });
        });

        req.end();
    });
}

async function checkBackend() {
    log('blue', '🔍 STEPVOICE AI - Backend Health Checker');
    log('blue', '=====================================\n');
    
    let workingUrl = null;
    
    for (const url of AI_SERVICE_URLS) {
        log('cyan', `Testing connection to: ${url}`);
        const result = await testConnection(url);
        
        if (result.success) {
            log('green', `✅ Backend is running!`);
            log('green', `   Service: ${result.data.service}`);
            log('green', `   Version: ${result.data.version}`);
            log('green', `   Languages: ${result.data.supported_languages.join(', ')}`);
            log('green', `   Features: ${result.data.features.join(', ')}\n`);
            workingUrl = url;
            break;
        } else {
            log('red', `❌ Failed: ${result.error}`);
        }
    }
    
    if (!workingUrl) {
        log('yellow', '\n⚠️ Backend is not running!\n');
        log('cyan', 'To start the STEPVOICE AI backend:');
        log('cyan', '1. Make sure you are in the frontend directory');
        log('cyan', '2. Run: ./start_ai_service.sh');
        log('cyan', '3. Or manually: cd backend && python3 ai_service.py\n');
        
        const scriptPath = path.join(__dirname, '../../services/ai-service/ai_service.py');
        log('cyan', `Backend AI service location: ${scriptPath}`);
        log('cyan', 'To start manually: cd ../../services/ai-service && python3 ai_service.py');
        
        if (process.argv.includes('--start') || process.argv.includes('-s')) {
            log('blue', '\n🚀 Starting backend automatically...\n');
            await startBackend();
        } else {
            log('yellow', '\nRun this command with --start or -s to automatically start the backend.');
        }
    } else {
        log('green', '🎉 STEPVOICE AI backend is healthy and ready!');
        log('green', `🌐 Active URL: ${workingUrl}`);
    }
}

async function startBackend() {
    return new Promise((resolve, reject) => {
        const servicePath = path.join(__dirname, '../../services/ai-service');
        const scriptPath = path.join(servicePath, 'ai_service.py');
        
        log('cyan', `Executing: python3 ${scriptPath}`);
        
        const child = spawn('python3', [scriptPath], {
            stdio: 'inherit',
            cwd: servicePath
        });
        
        child.on('error', (error) => {
            log('red', `Failed to start backend: ${error.message}`);
            reject(error);
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                log('green', 'Backend started successfully!');
                resolve();
            } else {
                log('red', `Backend exited with code: ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });
        
        // Give it some time to start
        setTimeout(() => {
            log('cyan', 'Backend is starting... Check the terminal output above.');
            resolve();
        }, 2000);
    });
}

// Main execution
if (require.main === module) {
    checkBackend().catch(error => {
        log('red', `Error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checkBackend, testConnection };
