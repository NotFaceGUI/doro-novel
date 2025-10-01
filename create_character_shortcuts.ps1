# 创建角色快捷方式脚本
# 将 E:\SelfProject\Nikke-db.github.io\l2d 的内容生成快捷方式到 E:\SelfProject\doro-novel\src-tauri\target\debug\resources\character

param(
    [switch]$Force = $false
)

# 定义源目录和目标目录
$SourceDir = "E:\SelfProject\Nikke-db.github.io\l2d"
$TargetDir = "E:\SelfProject\doro-novel\src-tauri\target\debug\resources\character"

Write-Host "开始创建角色快捷方式..." -ForegroundColor Green
Write-Host "源目录: $SourceDir" -ForegroundColor Cyan
Write-Host "目标目录: $TargetDir" -ForegroundColor Cyan

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

# 创建 WScript.Shell 对象用于创建快捷方式
$WshShell = New-Object -ComObject WScript.Shell

# 获取源目录中的所有项目（文件夹和文件）
$Items = Get-ChildItem -Path $SourceDir

$CreatedCount = 0
$SkippedCount = 0
$ErrorCount = 0

foreach ($Item in $Items) {
    try {
        # 构建快捷方式的完整路径
        $ShortcutPath = Join-Path $TargetDir "$($Item.Name).lnk"
        
        # 检查快捷方式是否已存在
        if ((Test-Path $ShortcutPath) -and -not $Force) {
            Write-Host "跳过已存在的快捷方式: $($Item.Name)" -ForegroundColor Yellow
            $SkippedCount++
            continue
        }
        
        # 创建快捷方式
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = $Item.FullName
        
        # 如果是文件夹，设置工作目录
        if ($Item.PSIsContainer) {
            $Shortcut.WorkingDirectory = $Item.FullName
        } else {
            $Shortcut.WorkingDirectory = $Item.DirectoryName
        }
        
        # 保存快捷方式
        $Shortcut.Save()
        
        Write-Host "已创建快捷方式: $($Item.Name) -> $ShortcutPath" -ForegroundColor Green
        $CreatedCount++
        
    } catch {
        Write-Error "创建快捷方式失败: $($Item.Name) - $($_.Exception.Message)"
        $ErrorCount++
    }
}

# 释放 COM 对象
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($WshShell) | Out-Null

# 输出统计信息
Write-Host "`n操作完成!" -ForegroundColor Green
Write-Host "创建: $CreatedCount 个快捷方式" -ForegroundColor Green
Write-Host "跳过: $SkippedCount 个已存在的快捷方式" -ForegroundColor Yellow
if ($ErrorCount -gt 0) {
    Write-Host "错误: $ErrorCount 个快捷方式创建失败" -ForegroundColor Red
}

Write-Host "`n使用说明:" -ForegroundColor Cyan
Write-Host "- 重新运行脚本时，已存在的快捷方式会被跳过" -ForegroundColor White
Write-Host "- 使用 -Force 参数可以强制覆盖已存在的快捷方式" -ForegroundColor White
Write-Host "  例如: .\create_character_shortcuts.ps1 -Force" -ForegroundColor White