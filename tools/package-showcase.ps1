$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$staging=Join-Path $projectRoot 'output\axis09-package-v1'
$archive=Join-Path $projectRoot 'output\2026_8月合輯_AXIS09_完整版.zip'
if ((Test-Path -LiteralPath $staging) -or (Test-Path -LiteralPath $archive)) { throw 'The package already exists. Use a new version directory to package again.' }
New-Item -ItemType Directory -Path $staging | Out-Null
$files=@('showcase.html','showcase.css','showcase.js','showcase-data.js','axis-model.js','axis-renderer.js','storyboard.html','storyboard.css','server.mjs','package.json','Start-Showcase.cmd','index.html','styles.css','app.js','engine.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','og.png','README.md','2026_8月合輯_滾動網站建議版本_v1.md','output\pdf\2026_8月合輯_作品手冊.pdf')
foreach($relative in $files){
 $destination=Join-Path $staging $relative
 New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
 Copy-Item -LiteralPath (Join-Path $projectRoot $relative) -Destination $destination
}
foreach($relative in @('assets','docs','tests','tools','output\showcase-qa')){
 $destination=Join-Path $staging $relative
 New-Item -ItemType Directory -Force -Path (Split-Path $destination -Parent) | Out-Null
 Copy-Item -LiteralPath (Join-Path $projectRoot $relative) -Destination $destination -Recurse
}
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $archive -CompressionLevel Optimal
Get-Item -LiteralPath $archive | Select-Object FullName,Length
