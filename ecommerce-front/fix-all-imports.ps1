# Comprehensive fix for all import paths
$basePath = "src/app"

# Get all TypeScript files
$tsFiles = Get-ChildItem -Path $basePath -Recurse -Filter "*.ts" | Where-Object { $_.Name -notlike "*.spec.ts" }

foreach ($file in $tsFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix all the broken import paths
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./core/', '../../../core/'
    $content = $content -replace '\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
    
    # Fix specific broken patterns
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
    $content = $content -replace '\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
    
    # Fix the weird .../ patterns
    $content = $content -replace '\.\.\./\.\.\./\.\.\./\.\.\./\.\.\./core/', '../../../core/'
    $content = $content -replace '\.\.\./\.\.\./\.\.\./\.\.\./\.\.\./shared/', '../../shared/'
    $content = $content -replace '\.\.\./\.\.\./\.\.\./\.\.\./core/', '../../../core/'
    $content = $content -replace '\.\.\./\.\.\./\.\.\./\.\.\./shared/', '../../shared/'
    $content = $content -replace '\.\.\./\.\.\./\.\.\./core/', '../../../core/'
    $content = $content -replace '\.\.\./\.\.\./\.\.\./shared/', '../../shared/'
    $content = $content -replace '\.\.\./\.\.\./core/', '../../../core/'
    $content = $content -replace '\.\.\./\.\.\./shared/', '../../shared/'
    $content = $content -replace '\.\.\./core/', '../../../core/'
    $content = $content -replace '\.\.\./shared/', '../../shared/'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "All import paths fixed!"

