# Fix import paths in all component files
$files = @(
    "src/app/components/pages/add-product/add-product.component.ts",
    "src/app/components/pages/cart/cart.component.ts", 
    "src/app/components/pages/checkout/checkout.component.ts",
    "src/app/components/pages/confirmation/confirmation.component.ts",
    "src/app/components/pages/edit-product/edit-product.component.ts",
    "src/app/components/pages/product-detail/product-detail.component.ts",
    "src/app/components/shared/header/header.component.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace '\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
        $content = $content -replace '\.\./\.\./\.\./\.\./shared/', '../../shared/'
        $content = $content -replace '\.\./\.\./\.\./core/', '../../../core/'
        $content = $content -replace '\.\./\.\./\.\./shared/', '../../shared/'
        $content = $content -replace '\.\./\.\./core/', '../../../core/'
        $content = $content -replace '\.\./\.\./shared/', '../../shared/'
        $content = $content -replace '\.\./core/', '../../../core/'
        $content = $content -replace '\.\./shared/', '../../shared/'
        $content = $content -replace '\.\./\.\./\.\./\.\./\.\./core/', '../../../core/'
        $content = $content -replace '\.\./\.\./\.\./\.\./\.\./shared/', '../../shared/'
        Set-Content $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    }
}
Write-Host "Import paths fixed!"

