Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
$procs = Get-Process msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
foreach ($p in $procs) {
  Write-Output "window: '$($p.MainWindowTitle)' pid=$($p.Id)"
  [Win]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
  [Win]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
}
if (-not $procs) { Write-Output "NO visible Edge windows" }
