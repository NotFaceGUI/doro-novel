#!/bin/bash

# -----------------------------
# Configuration
# -----------------------------
PORTABLE_GIT="./MinGit-2.51.0-64-bit/cmd/git"
PORTABLE_GIT_ZIP="./MinGit-2.51.0-64-bit.zip"
PORTABLE_GIT_DIR="./MinGit-2.51.0-64-bit"
MINGIT_DOWNLOAD_URL="https://github.com/git-for-windows/git/releases/download/v2.51.0.windows.1/MinGit-2.51.0-64-bit.zip"
REPO_URL="https://github.com/Nikke-db/Nikke-db.github.io.git"
BRANCH="main"
REPO_NAME="data"                                   # Folder name for clone
REPO_DIR="$(pwd)/$REPO_NAME"
CHARACTER_DIR="./resources/character"             # Target folder
L2D_DIR="$REPO_DIR/l2d"

# -----------------------------
# Download and extract MinGit if not exists (Linux uses system git instead)
# -----------------------------
# Note: On Linux, we'll use system git instead of MinGit
# MinGit is Windows-specific, so we'll check for system git availability

# -----------------------------
# Determine which Git to use
# -----------------------------
if command -v git &> /dev/null; then
    GIT_EXE=$(which git)
    echo "Using system Git: $GIT_EXE"
else
    echo "❌ Git not found. Please install Git using:"
    echo "   Ubuntu/Debian: sudo apt-get install git"
    echo "   CentOS/RHEL/Fedora: sudo yum install git (or dnf install git)"
    echo "   Arch Linux: sudo pacman -S git"
    echo "   or download from: https://git-scm.com/download/linux"
    exit 1
fi

# -----------------------------
# Show Git version
# -----------------------------
if ! "$GIT_EXE" --version; then
    echo "❌ Failed to execute Git"
    exit 1
fi

# -----------------------------
# Clone or Pull Repository
# -----------------------------
if [ -d "$REPO_DIR" ]; then
    echo "📂 Repository already exists. Running git pull to update..."
    ORIGINAL_LOCATION=$(pwd)
    cd "$REPO_DIR" || exit 1
    if ! "$GIT_EXE" pull origin "$BRANCH"; then
        echo "❌ Failed to run git pull"
        cd "$ORIGINAL_LOCATION" || exit 1
        exit 1
    fi
    cd "$ORIGINAL_LOCATION" || exit 1
else
    echo "📂 Repository not found. Cloning repository..."
    if ! "$GIT_EXE" clone --depth 1 -b "$BRANCH" "$REPO_URL" "$REPO_NAME"; then
        echo "❌ Failed to clone repository"
        exit 1
    fi
fi

# -----------------------------
# Ensure target folder exists
# -----------------------------
if [ ! -d "$CHARACTER_DIR" ]; then
    mkdir -p "$CHARACTER_DIR"
fi

# -----------------------------
# Copy missing files from data/l2d to resources/character
# -----------------------------
echo "🔄 Comparing $L2D_DIR with $CHARACTER_DIR..."

# Use find to recursively process files and directories
find "$L2D_DIR" -type f -o -type d | while read -r item; do
    # Calculate relative path
    RELATIVE_PATH="${item#$L2D_DIR/}"
    DESTINATION_PATH="$CHARACTER_DIR/$RELATIVE_PATH"
    
    if [ ! -e "$DESTINATION_PATH" ]; then
        if [ -d "$item" ]; then
            mkdir -p "$DESTINATION_PATH"
            echo "📁 Created directory: $DESTINATION_PATH"
        elif [ -f "$item" ]; then
            # Ensure parent directory exists
            mkdir -p "$(dirname "$DESTINATION_PATH")"
            cp "$item" "$DESTINATION_PATH"
            echo "📄 Copied file: $DESTINATION_PATH"
        fi
    fi
done

echo "✅ Migration completed. $CHARACTER_DIR has been updated."