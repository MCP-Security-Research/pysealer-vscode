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

// =============================================================================
// IMPORTS
// =============================================================================

// VS Code API
import * as vscode from 'vscode';

// Node.js built-in modules
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

// =============================================================================
// CONSTANTS & GLOBALS
// =============================================================================

/**
 * Promisified version of exec for async/await usage
 */
const execAsync = promisify(exec);

/**
 * Global extension context for accessing extension resources
 * Set during activation and used by helper functions
 */
let extensionContext: vscode.ExtensionContext;

// =============================================================================
// EXTENSION LIFECYCLE
// =============================================================================

/**
 * Extension Activation
 * 
 * Called when the extension is first activated (typically on first use).
 * Sets up all commands and event handlers for the extension.
 * 
 * REGISTERED COMMANDS:
 * - pysealer.lockFile: Manually lock the current Python file
 * - pysealer.initProject: Initialize project with cryptographic keys
 * 
 * EVENT HANDLERS:
 * - onDidSaveTextDocument: Auto-lock Python files on save
 * 
 * @param context - Extension context providing APIs and resource paths
 */
export function activate(context: vscode.ExtensionContext) {
    extensionContext = context;
    console.log('Pysealer extension is now active!');

    // -------------------------------------------------------------------------
    // Command: Manual File Lock
    // -------------------------------------------------------------------------
    // Allows users to manually trigger pysealer lock via command palette
    const lockCommand = vscode.commands.registerCommand('pysealer.lockFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (editor.document.languageId !== 'python') {
            vscode.window.showErrorMessage('This command only works with Python files');
            return;
        }

        await lockFile(editor.document.uri.fsPath);
    });

    // -------------------------------------------------------------------------
    // Command: Project Initialization
    // -------------------------------------------------------------------------
    // Sets up cryptographic keys for the project
    const initCommand = vscode.commands.registerCommand('pysealer.initProject', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        await initProject(workspaceFolder.uri.fsPath);
    });

    // -------------------------------------------------------------------------
    // Event Handler: Auto-lock on Save
    // -------------------------------------------------------------------------
    // Automatically runs pysealer lock when Python files are saved
    const saveHandler = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'python') {
            await lockFile(document.uri.fsPath);
        }
    });

    // Register all disposables for proper cleanup
    context.subscriptions.push(lockCommand, initCommand, saveHandler);
}

/**
 * Extension Deactivation
 * 
 * Called when the extension is deactivated. VS Code automatically disposes
 * all subscriptions, so no manual cleanup is needed.
 */
export function deactivate() {}

// =============================================================================
// CORE OPERATIONS
// =============================================================================

/**
 * Lock File Operation
 * 
 * Executes pysealer lock on a specific Python file. This is the main operation
 * that adds type annotations and decorators to the code.
 * 
 * PROCESS:
 * 1. Shows status indicator in status bar
 * 2. Resolves Python interpreter path
 * 3. Constructs command using bundled pysealer
 * 4. Executes command in workspace context
 * 5. Displays result (success or error)
 * 
 * @param filePath - Absolute path to the Python file to lock
 */
async function lockFile(filePath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer lock...';
    statusBarItem.show();

    try {
        // Determine working directory from workspace context
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const cwd = workspaceFolder?.uri.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        
        // Resolve Python interpreter and construct command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, filePath);
        
        // Execute pysealer lock
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd });
        
        // Show success status (auto-hide after 3 seconds)
        statusBarItem.text = '$(check) Pysealer locks applied';
        setTimeout(() => statusBarItem.dispose(), 3000);

        // Log output for debugging
        if (stdout) { console.log('Pysealer output:', stdout); }
        if (stderr) { console.warn('Pysealer warnings:', stderr); }
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'locks');
    }
}

/**
 * Initialize Project Operation
 * 
 * Executes pysealer init on the project directory. This sets up cryptographic
 * keys needed for the locking process. After initialization, automatically
 * locks all Python files in the project directory.
 * 
 * PROCESS:
 * 1. Shows status indicator in status bar
 * 2. Resolves Python interpreter path
 * 3. Constructs init command using bundled pysealer
 * 4. Executes command in project directory
 * 5. Finds all Python files in the project
 * 6. Locks each Python file to add decorators
 * 7. Displays result (success or error)
 * 
 * @param projectPath - Absolute path to the project directory
 */
async function initProject(projectPath: string): Promise<void> {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = '$(sync~spin) Running pysealer init...';
    statusBarItem.show();

    try {
        // Resolve Python interpreter and construct init command
        const pythonPath = await getPythonPath();
        const pysealerCommand = getBundledPysealerCommand(pythonPath, projectPath, 'init');
        
        // Execute pysealer init
        const { stdout, stderr } = await execAsync(pysealerCommand, { cwd: projectPath });
        
        // Log init output for debugging
        if (stdout) { console.log('Pysealer init output:', stdout); }
        if (stderr) { console.warn('Pysealer init warnings:', stderr); }
        
        // Show success for init
        statusBarItem.text = '$(check) Pysealer init complete, locking files...';
        
        // Find all Python files in the project directory
        const pythonFiles = await findPythonFiles(projectPath);
        
        if (pythonFiles.length === 0) {
            statusBarItem.text = '$(check) Pysealer init complete (no Python files found)';
            setTimeout(() => statusBarItem.dispose(), 3000);
            vscode.window.showInformationMessage('Pysealer project initialized successfully. No Python files found to lock.');
            return;
        }
        
        // Lock all Python files
        let lockedCount = 0;
        let failedCount = 0;
        
        for (const filePath of pythonFiles) {
            try {
                statusBarItem.text = `$(sync~spin) Locking ${lockedCount + 1}/${pythonFiles.length} files...`;
                const lockCommand = getBundledPysealerCommand(pythonPath, filePath, 'lock');
                await execAsync(lockCommand, { cwd: projectPath });
                lockedCount++;
            } catch (error) {
                console.error(`Failed to lock ${filePath}:`, error);
                failedCount++;
            }
        }
        
        // Show final status
        if (failedCount === 0) {
            statusBarItem.text = `$(check) Pysealer init complete, locked ${lockedCount} files`;
            vscode.window.showInformationMessage(`Pysealer project initialized and ${lockedCount} Python files locked successfully!`);
        } else {
            statusBarItem.text = `$(warning) Locked ${lockedCount} files, ${failedCount} failed`;
            vscode.window.showWarningMessage(`Pysealer init complete: ${lockedCount} files locked, ${failedCount} failed.`);
        }
        
        setTimeout(() => statusBarItem.dispose(), 5000);
        
    } catch (error: any) {
        statusBarItem.dispose();
        handlePysealerError(error, 'init');
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build Pysealer Command
 * 
 * Constructs the command string to execute bundled pysealer. Uses the bundled
 * server.py script and libraries to ensure consistency across installations.
 * 
 * COMMAND FORMAT:
 * - Lock: <python> <server.py> lock <filePath>
 * - Init: <python> <server.py> init
 * 
 * @param pythonPath - Path to Python interpreter
 * @param targetPath - Path to file (lock) or directory (init)
 * @param command - Pysealer command: 'lock' (default) or 'init'
 * @returns Complete command string ready for execution
 * @throws Error if bundled server.py not found
 */
function getBundledPysealerCommand(pythonPath: string, targetPath: string, command: string = 'lock'): string {
    const serverPath = path.join(extensionContext.extensionPath, 'bundled', 'tool', 'server.py');
    
    // Verify bundled server exists
    if (!fs.existsSync(serverPath)) {
        throw new Error('Bundled pysealer not found. Please reinstall the extension.');
    }
    
    // Quote paths to handle spaces (cross-platform support)
    const quotedPythonPath = pythonPath.includes(' ') ? `"${pythonPath}"` : pythonPath;
    const quotedServerPath = `"${serverPath}"`;
    
    // Init command works on current directory (no path argument)
    if (command === 'init') {
        return `${quotedPythonPath} ${quotedServerPath} ${command}`;
    }
    
    // Lock command requires file path argument
    const quotedTargetPath = `"${targetPath}"`;
    return `${quotedPythonPath} ${quotedServerPath} ${command} ${quotedTargetPath}`;
}

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
 * @param operation - The operation that failed ('locks' or 'init')
 */
function handlePysealerError(error: any, operation: string): void {
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Find All Python Files
 * 
 * Recursively searches for all Python files (.py) in the specified directory.
 * Excludes common directories that shouldn't be locked (venv, node_modules, etc).
 * 
 * @param rootPath - Root directory to search from
 * @returns Array of absolute paths to Python files
 */
async function findPythonFiles(rootPath: string): Promise<string[]> {
    const pythonFiles: string[] = [];
    const excludeDirs = ['venv', '.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.tox', '.pytest_cache'];
    
    async function searchDirectory(dirPath: string): Promise<void> {
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip excluded directories
                    if (!excludeDirs.includes(entry.name)) {
                        await searchDirectory(fullPath);
                    }
                } else if (entry.isFile() && entry.name.endsWith('.py')) {
                    pythonFiles.push(fullPath);
                }
            }
        } catch (error) {
            console.warn(`Could not read directory ${dirPath}:`, error);
        }
    }
    
    await searchDirectory(rootPath);
    return pythonFiles;
}

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
async function getPythonPath(): Promise<string> {
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
