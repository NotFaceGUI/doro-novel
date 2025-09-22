# -----------------------------
# Configuration
# -----------------------------
$PortableGit = ".\MinGit-2.51.0-64-bit\cmd\git.exe"
$PortableGitZip = ".\MinGit-2.51.0-64-bit.zip"
$PortableGitDir = ".\MinGit-2.51.0-64-bit"
$MinGitDownloadUrl = "https://github.com/git-for-windows/git/releases/download/v2.51.0.windows.1/MinGit-2.51.0-64-bit.zip"
$RepoUrl = "https://github.com/NotFaceGUI/Nikke-db.github.io.git"
$Branch = "main"
$RepoName = "data"                                   # Folder name for clone
$RepoDir = Join-Path (Get-Location) $RepoName
$CharacterDir = ".\resources\character"             # Target folder for character files
$ImageDir = ".\resources\image"                     # Target folder for image files
$AudioDir = ".\resources\audio"                     # Target folder for audio files
$L2dDir = Join-Path $RepoDir "l2d"
$RepoImageDir = Join-Path $RepoDir "image"
$RepoAudioDir = Join-Path $RepoDir "audio"

# -----------------------------
# Function: Sync Directory
# -----------------------------
function Sync-Directory {
    param(
        [string]$SourceDir,
        [string]$TargetDir,
        [string]$DirName
    )
    
    if (-Not (Test-Path $SourceDir)) {
        Write-Output "⚠️  Source directory $SourceDir not found, skipping $DirName sync."
        return
    }
    
    # Ensure target folder exists
    if (-Not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
        Write-Output "📁 Created target directory: $TargetDir"
    }
    
    Write-Output "🔄 Syncing $DirName files from $SourceDir to $TargetDir..."
    $syncCount = 0
    
    Get-ChildItem -Path $SourceDir -Recurse | ForEach-Object {
        $RelativePath = $_.FullName.Substring($SourceDir.Length).TrimStart('\')
        $DestinationPath = Join-Path $TargetDir $RelativePath

        if (-Not (Test-Path $DestinationPath)) {
            if ($_.PSIsContainer) {
                New-Item -ItemType Directory -Force -Path $DestinationPath | Out-Null
                Write-Output "📁 Created directory: $DestinationPath"
            } else {
                Copy-Item -Path $_.FullName -Destination $DestinationPath -Force
                Write-Output "📄 Copied file: $DestinationPath"
                $syncCount++
            }
        }
    }
    
    Write-Output "✅ $DirName sync completed. $syncCount new files copied."
}

# -----------------------------
# Download and extract MinGit if not exists
# -----------------------------
if (-Not (Test-Path $PortableGit)) {
    Write-Output "🔽 Portable Git not found. Downloading MinGit..."
    
    # Download MinGit if zip doesn't exist
    if (-Not (Test-Path $PortableGitZip)) {
        try {
            Write-Output "Downloading MinGit from GitHub..."
            Invoke-WebRequest -Uri $MinGitDownloadUrl -OutFile $PortableGitZip -UseBasicParsing
            Write-Output "✅ MinGit downloaded successfully."
        } catch {
            Write-Error "Failed to download MinGit: $_"
            exit 1
        }
    }
    
    # Extract MinGit
    if (Test-Path $PortableGitZip) {
        try {
            Write-Output "📦 Extracting MinGit..."
            Expand-Archive -Path $PortableGitZip -DestinationPath $PortableGitDir -Force
            Write-Output "✅ MinGit extracted successfully."
        } catch {
            Write-Error "Failed to extract MinGit: $_"
            exit 1
        }
    }
}

# -----------------------------
# Determine which Git to use
# -----------------------------
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    $SystemGit = $gitCmd.Source
} else {
    $SystemGit = $null
}

if (Test-Path $PortableGit) {
    # Convert relative path to absolute path to avoid issues when changing directories
    $GitExe = (Resolve-Path $PortableGit).Path
    Write-Output "Using portable Git: $GitExe"
} elseif ($SystemGit) {
    $GitExe = $SystemGit
    Write-Output "Using system Git: $GitExe"
} else {
    Write-Error "Git not found. Please install Git or provide Portable Git."
    exit 1
}

# -----------------------------
# Show Git version
# -----------------------------
try {
    & "$GitExe" --version
} catch {
    Write-Error "Failed to execute Git: $_"
    exit 1
}

# -----------------------------
# Clone or Pull Repository
# -----------------------------
if (Test-Path $RepoDir) {
    Write-Output "📂 Repository already exists. Checking remote URL..."
    $OriginalLocation = Get-Location
    Set-Location $RepoDir
    
    try {
        # Get current remote URL
        $CurrentRemoteUrl = & "$GitExe" remote get-url origin
        Write-Output "Current remote URL: $CurrentRemoteUrl"
        Write-Output "Expected remote URL: $RepoUrl"
        
        # Check if remote URL matches
        if ($CurrentRemoteUrl -ne $RepoUrl) {
            Write-Output "🔄 Remote URL has changed. Updating remote origin..."
            & "$GitExe" remote set-url origin $RepoUrl
            Write-Output "✅ Remote URL updated successfully."
        } else {
            Write-Output "✅ Remote URL is correct."
        }
        
        # Pull latest changes
        Write-Output "🔄 Running git pull to update..."
        & "$GitExe" pull origin $Branch
        Write-Output "✅ Repository updated successfully."
    } catch {
        Write-Error "Failed to update repository: $_"
        Set-Location $OriginalLocation
        exit 1
    }
    Set-Location $OriginalLocation
} else {
    Write-Output "📂 Repository not found. Cloning repository..."
    try {
        & "$GitExe" clone --depth 1 -b $Branch $RepoUrl $RepoName
        Write-Output "✅ Repository cloned successfully."
    } catch {
        Write-Error "Failed to clone repository: $_"
        exit 1
    }
}

# -----------------------------
# Sync all resource directories
# -----------------------------
Write-Output ""
Write-Output "🔄 Starting resource synchronization..."

# Sync character files (l2d -> character)
Sync-Directory -SourceDir $L2dDir -TargetDir $CharacterDir -DirName "Character"

# Sync image files (image -> image)
Sync-Directory -SourceDir $RepoImageDir -TargetDir $ImageDir -DirName "Image"

# Sync audio files (audio -> audio)
Sync-Directory -SourceDir $RepoAudioDir -TargetDir $AudioDir -DirName "Audio"

Write-Output ""
Write-Output "🎉 All resource synchronization completed successfully!"
Write-Output "📁 Character files: $CharacterDir"
Write-Output "🖼️ Image files: $ImageDir"
Write-Output "🔊 Audio files: $AudioDir"
