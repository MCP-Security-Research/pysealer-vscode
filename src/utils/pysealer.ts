/**
 * Pysealer Command Builder
 * 
 * Constructs pysealer commands using bundled libraries.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * Global extension context for accessing extension resources
 */
let extensionContext: vscode.ExtensionContext;

/**
 * Initialize the pysealer utility with extension context
 * 
 * @param context - Extension context from activation
 */
export function initializePysealerUtils(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Build Pysealer Command
 * 
 * Constructs the command string to execute bundled pysealer. Uses the bundled
 * server.py script and libraries to ensure consistency across installations.
 * 
 * COMMAND FORMAT:
 * - Lock: <python> <server.py> lock <filePath>
 * - Check: <python> <server.py> check <filePath>
 * - Init: <python> <server.py> init [envFile] [--github-token <token>]
 * 
 * @param pythonPath - Path to Python interpreter
 * @param targetPath - Path to file (lock/check) or directory (init)
 * @param command - Pysealer command: 'lock' (default), 'check', or 'init'
 * @param envFilePath - Optional path to .env file (init only)
 * @param githubToken - Optional GitHub token (init only)
 * @returns Complete command string ready for execution
 * @throws Error if bundled server.py not found
 */
export function getBundledPysealerCommand(
    pythonPath: string, 
    targetPath: string, 
    command: string = 'lock',
    envFilePath?: string,
    githubToken?: string
): string {
    if (!extensionContext) {
        throw new Error('Pysealer utils not initialized. Call initializePysealerUtils first.');
    }
    
    const serverPath = path.join(extensionContext.extensionPath, 'bundled', 'tool', 'server.py');
    
    // Verify bundled server exists
    if (!fs.existsSync(serverPath)) {
        throw new Error('Bundled pysealer not found. Please reinstall the extension.');
    }
    
    // Quote paths to handle spaces (cross-platform support)
    const quotedPythonPath = pythonPath.includes(' ') ? `"${pythonPath}"` : pythonPath;
    const quotedServerPath = `"${serverPath}"`;
    
    // Init command with optional parameters
    if (command === 'init') {
        let initCommand = `${quotedPythonPath} ${quotedServerPath} ${command}`;
        
        // Add optional env file path
        if (envFilePath) {
            const quotedEnvPath = `"${envFilePath}"`;
            initCommand += ` ${quotedEnvPath}`;
        }
        
        // Add optional GitHub token
        if (githubToken) {
            initCommand += ` --github-token "${githubToken}"`;
        }
        
        return initCommand;
    }
    
    // Lock and check commands require file path argument
    const quotedTargetPath = `"${targetPath}"`;
    return `${quotedPythonPath} ${quotedServerPath} ${command} ${quotedTargetPath}`;
}
