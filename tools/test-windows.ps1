param([string]$Executable)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
if(-not $Executable){$Executable=Join-Path $projectRoot 'dist/2026_8月合輯.exe'}
$instanceFile=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'AXIS09/instance.json'
if(Test-Path -LiteralPath $instanceFile){
 $existing=Get-Content -Raw -LiteralPath $instanceFile | ConvertFrom-Json
 if(Get-Process -Id $existing.pid -ErrorAction SilentlyContinue){throw 'An AXIS-09 executable is already running; finish that session before automated launcher tests.'}
}
$portableDir=Join-Path $projectRoot ('.build/portable 測試 '+[Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $portableDir | Out-Null
$portableExe=Join-Path $portableDir '2026_8月合輯.exe'
Copy-Item -LiteralPath $Executable -Destination $portableExe
$results=New-Object 'System.Collections.Generic.List[string]'
function Assert-Check($condition,$name){if(-not $condition){throw $name};$results.Add($name);Write-Host ('PASS '+$name)}
function Start-Launcher {
 $process=Start-Process -FilePath $portableExe -ArgumentList '--no-browser' -WorkingDirectory $portableDir -WindowStyle Hidden -PassThru
 for($i=0;$i -lt 100;$i++){
  Start-Sleep -Milliseconds 100
  if(Test-Path -LiteralPath $instanceFile){
   try{$current=Get-Content -Raw -LiteralPath $instanceFile | ConvertFrom-Json;if($current.pid -eq $process.Id){return @{Process=$process;Info=$current}}}catch{}
  }
  if($process.HasExited){throw 'Launcher exited before becoming ready.'}
 }
 Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
 throw 'Launcher readiness timed out.'
}
function Stop-TestLauncher($session){
 if($session){Stop-Process -Id $session.Process.Id -ErrorAction SilentlyContinue;$session.Process.WaitForExit(5000) | Out-Null
 if(Test-Path -LiteralPath $instanceFile){$state=Get-Content -Raw -LiteralPath $instanceFile | ConvertFrom-Json;if($state.pid -eq $session.Process.Id){Remove-Item -LiteralPath $instanceFile}}}
}
function Raw-Request([int]$port,[string]$request) {
 $tcp=[Net.Sockets.TcpClient]::new('127.0.0.1',$port);$tcp.ReceiveTimeout=5000
 try{$stream=$tcp.GetStream();$bytes=[Text.Encoding]::ASCII.GetBytes($request);$stream.Write($bytes,0,$bytes.Length);$reader=[IO.StreamReader]::new($stream);return $reader.ReadToEnd()}finally{$tcp.Dispose()}
}
$session=$null;$reservation=$null
try {
 $session=Start-Launcher;$url=$session.Info.url;$port=([Uri]$url).Port
 Assert-Check ((Get-ChildItem -LiteralPath $portableDir -File).Count -eq 1) 'Runs from a directory containing only the EXE'
 $health=Invoke-RestMethod -Uri ($url+'__axis/health')
 Assert-Check ($health.app -eq 'AXIS09' -and $health.version -eq '1.1.0') 'Embedded HTTP server becomes ready'
 $html=Invoke-WebRequest -Uri $url -UseBasicParsing
 Assert-Check ($html.Content -match 'AXIS-09' -and $html.Content -match 'showcase.js') 'Default entry serves the actual portfolio'
 $js=Invoke-WebRequest -Uri ($url+'showcase.js') -UseBasicParsing
 Assert-Check ($js.Content -match 'compact-motion') 'Narrow-window scroll fix is inside the executable'
 foreach($relative in @('showcase.css','assets/vendor/three.module.min.js','assets/scenes/axis-scene-01.png','assets/axis-09.glb','docs/showcase-evidence.md','output/pdf/2026_8月合輯_作品手冊.pdf')) {
  $response=Invoke-WebRequest -Uri ($url+$relative) -UseBasicParsing
  Assert-Check ($response.StatusCode -eq 200) ('Embedded asset: '+$relative)
 }
 $head=Raw-Request $port ("HEAD /assets/axis-09.glb HTTP/1.1"+[char]13+[char]10+"Host: 127.0.0.1:"+$port+[char]13+[char]10+[char]13+[char]10)
 $modelLength=(Get-Item -LiteralPath (Join-Path $projectRoot 'assets/axis-09.glb')).Length
 Assert-Check ($head -match '200 OK' -and $head.Contains('Content-Length: '+$modelLength) -and $head.EndsWith(([char]13+[char]10+[char]13+[char]10))) 'HEAD returns asset length without a body'
 $range=Raw-Request $port ("GET /assets/axis-09.glb HTTP/1.1\r\nHost: 127.0.0.1:$port\r\nRange: bytes=0-3\r\n\r\n".Replace('\r',[string][char]13).Replace('\n',[string][char]10))
 Assert-Check ($range -match '206 Partial Content' -and $range.EndsWith('glTF')) 'Byte ranges return the correct GLB bytes'
 $missing=Raw-Request $port ("GET /missing-file HTTP/1.1\r\nHost: 127.0.0.1:$port\r\n\r\n".Replace('\r',[string][char]13).Replace('\n',[string][char]10))
 Assert-Check ($missing -match '404 Not Found') 'Missing paths do not fall through to unrelated content'
 $badHost=Raw-Request $port ("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n".Replace('\r',[string][char]13).Replace('\n',[string][char]10))
 Assert-Check ($badHost -match '403 Forbidden') 'Unexpected Host is rejected'
 $traversal=Raw-Request $port ("GET /%2e%2e/README.md HTTP/1.1\r\nHost: 127.0.0.1:$port\r\n\r\n".Replace('\r',[string][char]13).Replace('\n',[string][char]10))
 Assert-Check ($traversal -match '404 Not Found') 'Traversal cannot access disk paths'
 $post=Raw-Request $port ("POST / HTTP/1.1\r\nHost: 127.0.0.1:$port\r\nContent-Length: 0\r\n\r\n".Replace('\r',[string][char]13).Replace('\n',[string][char]10))
 Assert-Check ($post -match '405 Method Not Allowed') 'Read-only server rejects mutation methods'
 $again=Start-Process -FilePath $portableExe -ArgumentList '--no-browser' -WorkingDirectory $portableDir -WindowStyle Hidden -PassThru
 Assert-Check ($again.WaitForExit(5000)) 'Second launch reuses the running instance'
 $state=Get-Content -Raw -LiteralPath $instanceFile | ConvertFrom-Json
 Assert-Check ($state.pid -eq $session.Process.Id) 'Second launch does not replace the original server'
 Stop-TestLauncher $session;$session=$null
 if($port -eq 18409){
  $reservation=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,18409);$reservation.Start()
  $session=Start-Launcher
  Assert-Check (([Uri]$session.Info.url).Port -ne 18409) 'Occupied default port selects another loopback port'
  $health=Invoke-RestMethod -Uri ($session.Info.url+'__axis/health')
  Assert-Check ($health.app -eq 'AXIS09') 'Fallback-port service is reachable'
 }else{Assert-Check ($port -ne 18409) 'Existing port occupation already exercised fallback'}
 $resultPath=Join-Path $projectRoot 'dist/launcher-test-results.json'
 @{date=[DateTime]::UtcNow.ToString('o');checks=$results;count=$results.Count;executableSHA256=(Get-FileHash -LiteralPath $Executable -Algorithm SHA256).Hash} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resultPath -Encoding UTF8
} finally {Stop-TestLauncher $session;if($reservation){$reservation.Stop()}}
