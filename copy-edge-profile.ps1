$ErrorActionPreference = 'SilentlyContinue'
$src = "$env:LOCALAPPDATA\Microsoft\Edge\User Data"
$dst = "$env:LOCALAPPDATA\Microsoft\Edge\UserDataAuto"
New-Item -ItemType Directory -Force -Path "$dst\Default\Network" | Out-Null
Copy-Item "$src\Local State" "$dst\Local State" -Force
Copy-Item "$src\Default\Preferences" "$dst\Default\Preferences" -Force
Copy-Item "$src\Default\Secure Preferences" "$dst\Default\Secure Preferences" -Force
Copy-Item "$src\Default\Network\Cookies*" "$dst\Default\Network\" -Force
robocopy "$src\Default\Local Storage" "$dst\Default\Local Storage" /E /NFL /NDL /NJH /NJS | Out-Null
robocopy "$src\Default\Session Storage" "$dst\Default\Session Storage" /E /NFL /NDL /NJH /NJS | Out-Null
Write-Output "copied:"
Get-ChildItem "$dst" -Recurse -File | Measure-Object -Property Length -Sum | ForEach-Object { "files=$($_.Count) size=$([Math]::Round($_.Sum/1MB,1))MB" }
