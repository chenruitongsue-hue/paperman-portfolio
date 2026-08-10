Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
  ForEach-Object { "$($_.ProcessId) | $($_.CommandLine)" } |
  ForEach-Object { $_.Substring(0, [Math]::Min(220, $_.Length)) }
