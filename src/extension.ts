/**
 * =============================================================================
 * Pysealer VS Code Extension
 * =============================================================================
 * 
 * OVERVIEW:
 * This extension integrates the pysealer CLI tool into VS Code, providing
 * automatic code locking for Python files. Pysealer adds type annotations
 * and decorators to improve code quality and security.
 * 
 * KEY FEATURES:
 * - Automatic locking on save for Python files
 * - Manual lock command via command palette
 * - Project initialization for cryptographic keys
 * - Uses bundled pysealer libraries for consistency
 * 
 * ARCHITECTURE:
 * 1. Extension activation registers commands and event handlers
 * 2. Save events trigger automatic pysealer lock operations
 * 3. Commands are executed via Python subprocess using bundled tools
 * 4. Status feedback is provided through status bar items
 */

import * as vscode from 'vscode';
import {
    registerLockFileCommand,
    registerCheckFileCommand,
    registerInitProjectCommand,
    registerRemoveFileCommand
} from './commands';
import { registerAutoLockHandler } from './events/autoLock';
import { initializePysealerUtils } from './utils/pysealer';

/**
 * Extension Activation
 * 
 * Called when the extension is first activated (typically on first use).
 * Sets up all commands and event handlers for the extension.
 * 
 * @param context - Extension context providing APIs and resource paths
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Pysealer extension is now active!');

    // Initialize utilities with context
    initializePysealerUtils(context);

    // Register all commands
    registerLockFileCommand(context);
    registerCheckFileCommand(context);
    registerInitProjectCommand(context);
    registerRemoveFileCommand(context);

    // Register event handlers
    registerAutoLockHandler(context);
}

/**
 * Extension Deactivation
 * 
 * Called when the extension is deactivated. VS Code automatically disposes
 * all subscriptions, so no manual cleanup is needed.
 */
export function deactivate() {}