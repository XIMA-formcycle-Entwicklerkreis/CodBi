#!/bin/bash
# Install CodBi Formatter Extension
# This script installs the extension to your VS Code extensions directory

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
EXTENSION_SOURCE="$SCRIPT_DIR/.vscode/extensions/codbi-formatter"

if [ "$(uname)" == "Darwin" ]; then
    # macOS
    EXTENSION_DEST="$HOME/.vscode/extensions/codbi-formatter"
else
    # Linux
    EXTENSION_DEST="$HOME/.vscode/extensions/codbi-formatter"
fi

if [ ! -d "$EXTENSION_SOURCE" ]; then
    echo "Error: Extension source not found at $EXTENSION_SOURCE"
    exit 1
fi

# Remove existing installation if it exists
if [ -d "$EXTENSION_DEST" ]; then
    echo "Removing existing installation..."
    rm -rf "$EXTENSION_DEST"
fi

# Copy extension
echo "Installing CodBi Formatter extension..."
cp -r "$EXTENSION_SOURCE" "$EXTENSION_DEST"

echo "Extension installed successfully!"
echo "Please reload VS Code for the extension to take effect."
