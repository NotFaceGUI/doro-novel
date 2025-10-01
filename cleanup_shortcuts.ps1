# 清理快捷方式脚本
# 删除之前创建的 .lnk 快捷方式文件

param(
    [switch]$Confirm = $true
)

$TargetDir = "E:\SelfProject\doro-novel\src-tauri\target\debug\resources\character"

Write-Host "开始清理快捷方式文件..." -ForegroundColor Yellow
Write-Host "目标目录: $TargetDir" -ForegroundColor Cyan

# 检查目标目录是否存在
if (-not (Test-Path $TargetDir)) {
    Write-Host "目标目录不存在: $TargetDir" -ForegroundColor Red
    exit 1
}

# 获取所有 .lnk 文件
$ShortcutFiles = Get-ChildItem -Path $TargetDir -Filter "*.lnk"

if ($ShortcutFiles.Count -eq 0) {
    Write-Host "未找到任何快捷方式文件。" -ForegroundColor Green
    exit 0
}

Write-Host "找到 $($ShortcutFiles.Count) 个快捷方式文件。" -ForegroundColor Yellow

if ($Confirm) {
    $response = Read-Host "是否确认删除这些快捷方式文件？(y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "操作已取消。" -ForegroundColor Yellow
        exit 0
    }
}

$DeletedCount = 0
$ErrorCount = 0

foreach ($file in $ShortcutFiles) {
    try {
        Remove-Item $file.FullName -Force
        Write-Host "已删除: $($file.Name)" -ForegroundColor Green
        $DeletedCount++
    } catch {
        Write-Error "删除失败: $($file.Name) - $($_.Exception.Message)"
        $ErrorCount++
    }
}

Write-Host "`n清理完成!" -ForegroundColor Green
Write-Host "删除: $DeletedCount 个快捷方式文件" -ForegroundColor Green
if ($ErrorCount -gt 0) {
    Write-Host "错误: $ErrorCount 个文件删除失败" -ForegroundColor Red
}

Write-Host "`n使用说明:" -ForegroundColor Cyan
Write-Host "- 使用 -Confirm:`$false 参数可以跳过确认直接删除" -ForegroundColor White
Write-Host "  例如: .\cleanup_shortcuts.ps1 -Confirm:`$false" -ForegroundColor White