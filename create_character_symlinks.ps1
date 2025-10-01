# 创建角色符号链接脚本
# 将 E:\SelfProject\Nikke-db.github.io\l2d 的内容创建符号链接到 E:\SelfProject\doro-novel\src-tauri\target\debug\resources\character
# 符号链接可以被Tauri正确识别和读取

param(
    [switch]$Force = $false
)

# 定义源目录和目标目录
$SourceDir = "E:\SelfProject\Nikke-db.github.io\l2d"
$TargetDir = "E:\SelfProject\doro-novel\src-tauri\target\debug\resources\character"

Write-Host "开始创建角色符号链接..." -ForegroundColor Green
Write-Host "源目录: $SourceDir" -ForegroundColor Cyan
Write-Host "目标目录: $TargetDir" -ForegroundColor Cyan

# 检查是否以管理员权限运行
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Warning "创建符号链接需要管理员权限。正在尝试以管理员权限重新运行脚本..."
    $scriptPath = $MyInvocation.MyCommand.Path
    $arguments = ""
    if ($Force) {
        $arguments = "-Force"
    }
    Start-Process PowerShell -Verb RunAs -ArgumentList "-File `"$scriptPath`" $arguments"
    exit
}

# 检查源目录是否存在
if (-not (Test-Path $SourceDir)) {
    Write-Error "源目录不存在: $SourceDir"
    exit 1
}

# 检查目标目录是否存在，如果不存在则创建
if (-not (Test-Path $TargetDir)) {
    Write-Host "目标目录不存在，正在创建: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# 获取源目录中的所有项目（文件夹和文件）
$Items = Get-ChildItem -Path $SourceDir

$CreatedCount = 0
$SkippedCount = 0
$ErrorCount = 0

foreach ($Item in $Items) {
    try {
        # 构建符号链接的完整路径
        $LinkPath = Join-Path $TargetDir $Item.Name
        
        # 检查符号链接是否已存在
        if ((Test-Path $LinkPath) -and -not $Force) {
            Write-Host "跳过已存在的链接: $($Item.Name)" -ForegroundColor Yellow
            $SkippedCount++
            continue
        }
        
        # 如果强制覆盖且目标已存在，先删除
        if ($Force -and (Test-Path $LinkPath)) {
            Remove-Item $LinkPath -Force -Recurse
        }
        
        # 创建符号链接
        if ($Item.PSIsContainer) {
            # 为文件夹创建目录符号链接
            New-Item -ItemType SymbolicLink -Path $LinkPath -Target $Item.FullName | Out-Null
            Write-Host "已创建文件夹符号链接: $($Item.Name) -> $LinkPath" -ForegroundColor Green
        } else {
            # 为文件创建文件符号链接
            New-Item -ItemType SymbolicLink -Path $LinkPath -Target $Item.FullName | Out-Null
            Write-Host "已创建文件符号链接: $($Item.Name) -> $LinkPath" -ForegroundColor Green
        }
        
        $CreatedCount++
        
    } catch {
        Write-Error "创建符号链接失败: $($Item.Name) - $($_.Exception.Message)"
        $ErrorCount++
    }
}

# 输出统计信息
Write-Host "`n操作完成!" -ForegroundColor Green
Write-Host "创建: $CreatedCount 个符号链接" -ForegroundColor Green
Write-Host "跳过: $SkippedCount 个已存在的符号链接" -ForegroundColor Yellow
if ($ErrorCount -gt 0) {
    Write-Host "错误: $ErrorCount 个符号链接创建失败" -ForegroundColor Red
}

Write-Host "`n使用说明:" -ForegroundColor Cyan
Write-Host "- 符号链接可以被Tauri应用正确识别和读取" -ForegroundColor White
Write-Host "- 重新运行脚本时，已存在的符号链接会被跳过" -ForegroundColor White
Write-Host "- 使用 -Force 参数可以强制覆盖已存在的符号链接" -ForegroundColor White
Write-Host "  例如: .\create_character_symlinks.ps1 -Force" -ForegroundColor White
Write-Host "- 此脚本需要管理员权限才能创建符号链接" -ForegroundColor Yellow