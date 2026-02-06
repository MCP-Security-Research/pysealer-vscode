/**
 * Error Handler Utilities
 * 
 * Provides user-friendly error messages for pysealer operations.
 */

import * as vscode from 'vscode';

/**
 * Handle Pysealer Errors
 * 
 * Provides user-friendly error messages based on the type of error encountered.
 * 
 * ERROR TYPES:
 * - Already initialized: Informational message, not an error
 * - Python not found: Installation or PATH issue
 * - Import error: Missing bundled libraries
 * - Other: Generic pysealer execution errors
 * 
 * @param error - The error object from execution
 * @param operation - The operation that failed ('locks', 'check', or 'init')
 */
export function handlePysealerError(error: any, operation: string): void {
    const errorMessage = error.message || '';
    const stderr = error.stderr || '';
    const combinedMessage = `${errorMessage} ${stderr}`.toLowerCase();
    
    // Check if project is already initialized (not really an error)
    if (combinedMessage.includes('already initialized') || combinedMessage.includes('already been initialized')) {
        vscode.window.showInformationMessage('Project is already initialized with pysealer.');
        return;
    }
    
    // Check for Python installation issues (be specific to avoid false positives)
    if (combinedMessage.includes('python: command not found') || 
        combinedMessage.includes('python3: command not found') ||
        combinedMessage.includes('is not recognized as an internal or external command') ||
        errorMessage.includes('ENOENT')) {
        vscode.window.showErrorMessage(
            'Python is not installed or not found in PATH. Please install Python 3.8 or later.'
        );
    } else if (combinedMessage.includes('could not import pysealer') || 
               combinedMessage.includes('no module named')) {
        vscode.window.showErrorMessage(
            'Pysealer bundled libraries are missing. Please reinstall the extension.'
        );
    } else {
        // Show the actual error message for better debugging
        vscode.window.showErrorMessage(`Pysealer error: ${errorMessage}`);
    }
    console.error(`Pysealer ${operation} failed:`, error);
}
