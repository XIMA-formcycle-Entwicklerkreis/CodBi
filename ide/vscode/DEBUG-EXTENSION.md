# Debugging CodBi Formatter Extension

## How to Check if the Extension is Running

### 1. Check Extension Output

1. Open VS Code
2. Go to **View → Output** (or press `Ctrl+Shift+U`)
3. In the dropdown at the top right, select **"CodBi Formatter"** (if it appears)
4. If you don't see "CodBi Formatter" in the dropdown, the extension is not active

### 2. Check Developer Console

1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Developer: Toggle Developer Tools"
4. Go to the **Console** tab
5. Look for messages starting with `[CodBi Formatter]`

### 3. Test the Extension Manually

1. Open a TypeScript or JavaScript file
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Test CodBi Script (Current File)"
4. Check the Output panel for results

### 4. Check if Extension is Installed

The extension should be in:
```
ide/vscode/.vscode/extensions/codbi-formatter/
```

If it's not there, run:
```powershell
cd ide/vscode
powershell -ExecutionPolicy Bypass -File install-codbi-formatter.ps1
```

### 5. Reload VS Code

After installing or updating the extension:
1. Press `Ctrl+Shift+P`
2. Type "Developer: Reload Window"
3. Save a TypeScript/JavaScript file
4. Check the Output panel for `[CodBi Formatter]` messages

## Expected Log Messages

When you save a TypeScript/JavaScript file, you should see:

```
[CodBi Formatter] ========================================
[CodBi Formatter] Extension activated!
[CodBi Formatter] ========================================
[CodBi Formatter] File saved: C:\path\to\file.ts (language: typescript)
[CodBi Formatter] Processing file: path\to\file.ts
[CodBi Formatter] Executing: node "C:\path\to\scripts\apply-codbi-patterns.js" "C:\path\to\file.ts"
[CodBi Script] Starting - File: C:\path\to\file.ts
[CodBi Script] ✓ Applied patterns to: path\to\file.ts
[CodBi Formatter] Script output: Applied CodBi patterns to: C:\path\to\file.ts
[CodBi Formatter] File content changed, updating editor...
[CodBi Formatter] ✓ Patterns applied to: path\to\file.ts
```

## Troubleshooting

### Extension Not Appearing in Output Dropdown

- The extension might not be installed
- VS Code might need to be reloaded
- Check if the extension files exist in `.vscode/extensions/codbi-formatter/`

### No Log Messages When Saving

- Check if `editor.formatOnSave` is enabled
- Check if Prettier is set as the default formatter
- Check if the file is in an ignored directory (node_modules, .git, etc.)
- Check if the file is in the ROOT workspace folder

### Script Not Found Error

- Verify the script exists at: `src/main/web/scripts/apply-codbi-patterns.js`
- Check that the ROOT workspace folder is correctly configured
- The extension looks for a workspace folder named "ROOT"

### Script Runs But No Changes

- The file might already match the patterns
- Check the script output: `[CodBi Script] - No changes needed`
- Try manually editing the file to break a pattern (e.g., remove spaces in `(variable)`) and save again
