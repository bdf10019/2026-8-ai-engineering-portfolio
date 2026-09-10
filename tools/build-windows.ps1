param([string]$OutputDirectory = 'dist')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(-not (Test-Path -LiteralPath $compiler)) { $compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if(-not (Test-Path -LiteralPath $compiler)) {throw 'Windows .NET Framework C# compiler not found.'}
$buildDirectory=Join-Path $projectRoot '.build'
$outDirectory=if([IO.Path]::IsPathRooted($OutputDirectory)){$OutputDirectory}else{Join-Path $projectRoot $OutputDirectory}
New-Item -ItemType Directory -Force -Path $buildDirectory,$outDirectory | Out-Null
$zipPath=Join-Path $buildDirectory ('website-'+[Guid]::NewGuid().ToString('N')+'.zip')
$paths=New-Object 'System.Collections.Generic.List[string]'
foreach($file in @('showcase.html','showcase.css','showcase.js','showcase-data.js','axis-model.js','axis-renderer.js','storyboard.html','storyboard.css','index.html','styles.css','app.js','engine.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','og.png','output/pdf/2026_8月合輯_作品手冊.pdf')) {
 if(-not (Test-Path -LiteralPath (Join-Path $projectRoot $file) -PathType Leaf)){throw "Missing website asset: $file"}
 $paths.Add($file)
}
foreach($directory in @('assets','docs','output/showcase-qa')) {
 Get-ChildItem -LiteralPath (Join-Path $projectRoot $directory) -File -Recurse | ForEach-Object {
  $relative=$_.FullName.Substring($projectRoot.Length+1).Replace('\','/')
  if($_.Extension -in @('.html','.css','.js','.json','.png','.svg','.webp','.glb','.txt','.md','.pdf')) {$paths.Add($relative)}
 }
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::Open($zipPath,[IO.Compression.ZipArchiveMode]::Create)
try {
 foreach($relative in ($paths | Sort-Object -Unique)){
  $entry=$archive.CreateEntry($relative,[IO.Compression.CompressionLevel]::Optimal)
  $entry.LastWriteTime=[DateTimeOffset]::new(2026,8,1,0,0,0,[TimeSpan]::Zero)
  $source=[IO.File]::OpenRead((Join-Path $projectRoot $relative))
  $target=$entry.Open()
  try {$source.CopyTo($target)} finally {$target.Dispose();$source.Dispose()}
 }
} finally {$archive.Dispose()}
$exe=Join-Path $outDirectory '2026_8月合輯.exe'
$references=@('System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll')
$compilerArguments=@('/nologo','/target:winexe','/platform:anycpu','/optimize+','/codepage:65001',('/out:'+$exe),('/resource:'+$zipPath+',AXIS09.Website.zip'))
$compilerArguments+=@($references | ForEach-Object {'/reference:'+$_})
$compilerArguments+=(Join-Path $projectRoot 'desktop/Launcher.cs')
& $compiler @compilerArguments
if($LASTEXITCODE -ne 0){throw 'C# compilation failed.'}
$sha=(Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText((Join-Path $outDirectory 'SHA256SUMS.txt'),$sha+'  '+[IO.Path]::GetFileName($exe)+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
[PSCustomObject]@{Executable=$exe;Bytes=(Get-Item -LiteralPath $exe).Length;SHA256=$sha;EmbeddedAssets=$paths.Count}

