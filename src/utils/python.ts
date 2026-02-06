/**
 * Python Interpreter Utilities
 * 
 * Handles Python interpreter path resolution.
 */

import * as vscode from 'vscode';
import { execAsync } from './exec';

/**
 * Resolve Python Interpreter Path
 * 
 * Determines which Python interpreter to use by checking multiple sources.
 * This ensures compatibility with user configurations.
 * 
 * RESOLUTION ORDER:
 * 1. Python extension's configured interpreter (if available)
 * 2. python3 command (preferred on Unix systems)
 * 3. python command (fallback)
 * 
 * @returns Path to Python interpreter ('python3', 'python', or custom path)
 */
export async function getPythonPath(): Promise<string> {
    // Try Python extension integration
    try {
        const pythonExtension = vscode.extensions.getExtension('ms-python.python');
        if (pythonExtension) {
            if (!pythonExtension.isActive) {
                await pythonExtension.activate();
            }
            const pythonPath = pythonExtension.exports?.settings?.getExecutionDetails?.()?.execCommand?.[0];
            if (pythonPath) {
                return pythonPath;
            }
        }
    } catch (error) {
        console.warn('Could not get Python path from Python extension:', error);
    }
    
    // Fallback: Check system Python installations
    try {
        await execAsync('python3 --version');
        return 'python3';
    } catch {
        try {
            await execAsync('python --version');
            return 'python';
        } catch {
            // Default to python3; let error handler catch if not available
            return 'python3';
        }
    }
}
