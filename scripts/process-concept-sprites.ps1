# Process and generate high-detail transparent pixel art PNG sprites from concept renders
Add-Type -AssemblyName System.Drawing

$baseDir = Split-Path -Parent $PSScriptRoot
$conceptDir = Join-Path $baseDir "public\assets\sprites\houses\concept"
$housesDir = Join-Path $baseDir "public\assets\sprites\houses"
$spritesDir = Join-Path $baseDir "public\assets\sprites"

New-Item -ItemType Directory -Force -Path $housesDir | Out-Null
New-Item -ItemType Directory -Force -Path $spritesDir | Out-Null

$variants = @(
    @{ Id = 0; Name = "terracotta"; File = "concept_variant_0_terracotta.jpg" },
    @{ Id = 1; Name = "cobalt";     File = "concept_variant_1_cobalt.jpg" },
    @{ Id = 2; Name = "colonial";   File = "concept_variant_2_colonial.jpg" }
)

function ConvertTo-TransparentSprite {
    param(
        [string]$inputPath,
        [string]$outBaseName,
        [int]$threshold = 220
    )

    $srcBmp = [System.Drawing.Bitmap]::FromFile($inputPath)
    $w = $srcBmp.Width
    $h = $srcBmp.Height

    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($srcBmp, 0, 0, $w, $h)
    $g.Dispose()
    $srcBmp.Dispose()

    # Fast pixel access via LockBits
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = [Math]::Abs($bmpData.Stride) * $h
    $rgbValues = New-Object byte[] $bytes
    [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $rgbValues, 0, $bytes)

    # Flood fill transparency from outer borders
    $visited = New-Object bool[] ($w * $h)
    $queue = New-Object System.Collections.Generic.Queue[int]

    for ($x = 0; $x -lt $w; $x++) {
        $queue.Enqueue($x)
        $queue.Enqueue(($h - 1) * $w + $x)
    }
    for ($y = 0; $y -lt $h; $y++) {
        $queue.Enqueue($y * $w)
        $queue.Enqueue($y * $w + ($w - 1))
    }

    while ($queue.Count -gt 0) {
        $idx = $queue.Dequeue()
        if ($visited[$idx]) { continue }
        $visited[$idx] = $true

        $px = $idx % $w
        $py = [Math]::Floor($idx / $w)
        $byteIdx = ($py * $w + $px) * 4

        $b = $rgbValues[$byteIdx]
        $gColor = $rgbValues[$byteIdx + 1]
        $r = $rgbValues[$byteIdx + 2]

        # White/cream outer background check
        $isBg = ($r -ge $threshold) -and ($gColor -ge $threshold) -and ($b -ge $threshold)
        if ($isBg) {
            $rgbValues[$byteIdx + 3] = 0 # Transparent

            if ($px -gt 0) { $queue.Enqueue($idx - 1) }
            if ($px -lt $w - 1) { $queue.Enqueue($idx + 1) }
            if ($py -gt 0) { $queue.Enqueue($idx - $w) }
            if ($py -lt $h - 1) { $queue.Enqueue($idx + $w) }
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $bmpData.Scan0, $bytes)
    $bmp.UnlockBits($bmpData)

    # Bounding box of house
    $minX = $w; $maxX = 0; $minY = $h; $maxY = 0
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $byteIdx = ($y * $w + $x) * 4
            if ($rgbValues[$byteIdx + 3] -gt 0) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    $cropW = [Math]::Max(1, $maxX - $minX + 1)
    $cropH = [Math]::Max(1, $maxY - $minY + 1)
    $maxDim = [Math]::Max($cropW, $cropH)

    $squareBmp = New-Object System.Drawing.Bitmap($maxDim, $maxDim, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $sg = [System.Drawing.Graphics]::FromImage($squareBmp)
    $sg.Clear([System.Drawing.Color]::Transparent)

    $offsetX = [Math]::Floor(($maxDim - $cropW) / 2)
    $offsetY = [Math]::Floor(($maxDim - $cropH) / 2)
    $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
    $destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $cropW, $cropH)
    $sg.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $sg.Dispose()
    $bmp.Dispose()

    # Save multiple sizes
    $sizes = @(32, 48, 64, 128)
    foreach ($size in $sizes) {
        $resized = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $rg = [System.Drawing.Graphics]::FromImage($resized)
        if ($size -le 64) {
            $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
            $rg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        } else {
            $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        }
        $rg.DrawImage($squareBmp, 0, 0, $size, $size)
        $rg.Dispose()

        $outName = "${outBaseName}_${size}.png"
        $outPath = Join-Path $housesDir $outName
        $resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $resized.Dispose()
        Write-Host "Generated: $outPath ($size x $size)"
    }

    # Save HD master cropped
    $hdPath = Join-Path $housesDir "${outBaseName}_hd.png"
    $squareBmp.Save($hdPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated HD master: $hdPath"

    return ,$squareBmp
}

# Process all variants
$hdBitmaps = @()
foreach ($v in $variants) {
    $inJpg = Join-Path $conceptDir $v.File
    $baseName = "house_variant_$($v.Id)_$($v.Name)"
    $bmp = ConvertTo-TransparentSprite $inJpg $baseName 220
    $hdBitmaps += $bmp

    # Copy 64x64 as primary game sprite house_{id}.png in both folders
    $src64 = Join-Path $housesDir "${baseName}_64.png"
    Copy-Item -Force $src64 (Join-Path $housesDir "house_$($v.Id).png")
    Copy-Item -Force $src64 (Join-Path $spritesDir "house_$($v.Id).png")
    Write-Host "Set primary game sprite: house_$($v.Id).png"
}

# Generate 3-house horizontal spritesheet (192x64)
$sheet64 = New-Object System.Drawing.Bitmap(192, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$shg = [System.Drawing.Graphics]::FromImage($sheet64)
$shg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$shg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

for ($i = 0; $i -lt 3; $i++) {
    $shg.DrawImage($hdBitmaps[$i], ($i * 64), 0, 64, 64)
}
$shg.Dispose()

$sheetPath = Join-Path $housesDir "house_spritesheet_64.png"
$sheet64.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sheet64.Dispose()
Write-Host "Generated spritesheet: $sheetPath (192x64)"

foreach ($b in $hdBitmaps) {
    $b.Dispose()
}

Write-Host "All high-detail house sprites successfully processed and installed!"
