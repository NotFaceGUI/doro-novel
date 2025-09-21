# -----------------------------
# Configuration
# -----------------------------
$PortableGit = ".\MinGit-2.51.0-64-bit\cmd\git.exe"
$PortableGitZip = ".\MinGit-2.51.0-64-bit.zip"
$PortableGitDir = ".\MinGit-2.51.0-64-bit"
$MinGitDownloadUrl = "https://github.com/git-for-windows/git/releases/download/v2.51.0.windows.1/MinGit-2.51.0-64-bit.zip"
$RepoUrl = "https://github.com/Nikke-db/Nikke-db.github.io.git"
$Branch = "main"
$RepoName = "data"                                   # Folder name for clone
$RepoDir = Join-Path (Get-Location) $RepoName
$CharacterDir = ".\resources\character"             # Target folder
$L2dDir = Join-Path $RepoDir "l2d"

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
    Write-Output "📂 Repository already exists. Running git pull to update..."
    $OriginalLocation = Get-Location
    Set-Location $RepoDir
    try {
        & "$GitExe" pull origin $Branch
    } catch {
        Write-Error "Failed to run git pull: $_"
        Set-Location $OriginalLocation
        exit 1
    }
    Set-Location $OriginalLocation
} else {
    Write-Output "📂 Repository not found. Cloning repository..."
    try {
        & "$GitExe" clone --depth 1 -b $Branch $RepoUrl $RepoName
    } catch {
        Write-Error "Failed to clone repository: $_"
        exit 1
    }
}

# -----------------------------
# Ensure target folder exists
# -----------------------------
if (-Not (Test-Path $CharacterDir)) {
    New-Item -ItemType Directory -Force -Path $CharacterDir | Out-Null
}

# -----------------------------
# Copy missing files from data/l2d to resources/character
# -----------------------------
Write-Output "🔄 Comparing $L2dDir with $CharacterDir..."
Get-ChildItem -Path $L2dDir -Recurse | ForEach-Object {
    $RelativePath = $_.FullName.Substring($L2dDir.Length).TrimStart('\')
    $DestinationPath = Join-Path $CharacterDir $RelativePath

    if (-Not (Test-Path $DestinationPath)) {
        if ($_.PSIsContainer) {
            New-Item -ItemType Directory -Force -Path $DestinationPath | Out-Null
            Write-Output "📁 Created directory: $DestinationPath"
        } else {
            Copy-Item -Path $_.FullName -Destination $DestinationPath -Force
            Write-Output "📄 Copied file: $DestinationPath"
        }
    }
}

Write-Output "✅ Migration completed. $CharacterDir has been updated."
