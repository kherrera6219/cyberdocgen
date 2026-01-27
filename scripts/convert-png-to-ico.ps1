# PowerShell script to convert PNG to multi-resolution ICO
# Requires: .NET Framework (included in Windows)

param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePNG,
    
    [Parameter(Mandatory = $true)]
    [string]$OutputICO
)

Write-Host "Converting $SourcePNG to multi-resolution ICO: $OutputICO"

# Load required assemblies
Add-Type -AssemblyName System.Drawing

# Load source image
$sourceImage = [System.Drawing.Image]::FromFile($SourcePNG)

# Icon sizes to generate
$sizes = @(16, 32, 48, 64, 128, 256)

# Create temporary directory for intermediate files
$tempDir = Join-Path $env:TEMP "icon_conversion_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "Creating resized images..."

# Resize image to each size
$bitmapPaths = @()
foreach ($size in $sizes) {
    Write-Host "  - ${size}x${size}"
    
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    $tempPath = Join-Path $tempDir "${size}.png"
    $bitmap.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmapPaths += $tempPath
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

$sourceImage.Dispose()

Write-Host "Creating ICO file..."

# Create ICO file using .NET
# ICO file format: Header + IconDirEntry[] + ImageData[]

$iconStream = [System.IO.File]::Create($OutputICO)
$writer = New-Object System.IO.BinaryWriter($iconStream)

try {
    # ICO Header
    $writer.Write([UInt16]0)      # Reserved (must be 0)
    $writer.Write([UInt16]1)      # Image type (1 = icon)
    $writer.Write([UInt16]$sizes.Count)  # Number of images

    # Calculate offsets
    $headerSize = 6  # ICO header
    $dirEntrySize = 16  # Per image directory entry
    $dirSize = $sizes.Count * $dirEntrySize
    $dataOffset = $headerSize + $dirSize

    # Read all PNG data
    $imageDataList = @()
    foreach ($path in $bitmapPaths) {
        $imageDataList += [System.IO.File]::ReadAllBytes($path)
    }

    # Write directory entries
    $currentOffset = $dataOffset
    for ($i = 0; $i -lt $sizes.Count; $i++) {
        $size = $sizes[$i]
        $imageData = $imageDataList[$i]
        
        # Directory entry
        $widthByte = if ($size -eq 256) { 0 } else { $size }
        $heightByte = if ($size -eq 256) { 0 } else { $size }
        $writer.Write([byte]$widthByte)   # Width (0 means 256)
        $writer.Write([byte]$heightByte)  # Height (0 means 256)
        $writer.Write([byte]0)      # Color palette (0 = no palette)
        $writer.Write([byte]0)      # Reserved
        $writer.Write([UInt16]1)    # Color planes
        $writer.Write([UInt16]32)   # Bits per pixel
        $writer.Write([UInt32]$imageData.Length)  # Size of image data
        $writer.Write([UInt32]$currentOffset)     # Offset to image data
        
        $currentOffset += $imageData.Length
    }

    # Write image data
    foreach ($imageData in $imageDataList) {
        $writer.Write($imageData)
    }

    Write-Host "Successfully created ICO file: $OutputICO"
    Write-Host "File size: $([math]::Round((Get-Item $OutputICO).Length / 1KB, 2)) KB"
    
}
finally {
    $writer.Close()
    $iconStream.Close()
    
    # Cleanup temp files
    Remove-Item -Path $tempDir -Recurse -Force
}

Write-Host "Done!"
