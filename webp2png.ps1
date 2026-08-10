Add-Type -AssemblyName PresentationCore
$src = "C:\WPS-Syn\09-MyProjectcs\MyProjects-Home\PaperMan\portfolio-website-v2-qdoer\assets"
$out = "C:\WPS-Syn\09-MyProjectcs\MyProjects-Home\PaperMan\itch-assets"
$files = @("cover-room.webp","scene-desk.webp","scene-wardrobe.webp","dialog-fail.webp","playtest-level.webp")
foreach ($f in $files) {
  $inPath = Join-Path $src $f
  $outPath = Join-Path $out ($f -replace '\.webp$','.png')
  $img = New-Object System.Windows.Media.Imaging.BitmapImage
  $img.BeginInit()
  $img.UriSource = New-Object System.Uri($inPath)
  $img.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
  $img.EndInit()
  $img.Freeze()
  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($img))
  $fs = [System.IO.File]::Create($outPath)
  $encoder.Save($fs)
  $fs.Close()
  Write-Output "$f -> $outPath ($($img.PixelWidth)x$($img.PixelHeight))"
}
