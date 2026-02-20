$d = Join-Path $PSScriptRoot ""
New-Item -ItemType Directory -Force -Path $d | Out-Null
$urls = @(
  'https://repo1.maven.org/maven2/ai/djl/openvino/openvino-engine/0.36.0/openvino-engine-0.36.0.jar',
  'https://repo1.maven.org/maven2/ai/djl/openvino/openvino-engine/0.36.0/openvino-engine-0.36.0.pom',
  'https://repo1.maven.org/maven2/ai/djl/openvino/openvino-native-auto/0.36.0/openvino-native-auto-0.36.0.jar',
  'https://repo1.maven.org/maven2/ai/djl/openvino/openvino-native-auto/0.36.0/openvino-native-auto-0.36.0.pom'
)
foreach ($url in $urls) {
  $file = Join-Path $d ([IO.Path]::GetFileName($url))
  Write-Host "Downloading $url -> $file"
  Invoke-WebRequest -Uri $url -OutFile $file -UseBasicParsing -ErrorAction Stop
}
Write-Host 'Installing to local Maven repo...'
& "$PSScriptRoot\..\mvnw.cmd" org.apache.maven.plugins:maven-install-plugin:3.1.0:install-file -Dfile="$d\openvino-engine-0.36.0.jar" -DpomFile="$d\openvino-engine-0.36.0.pom" -DskipTests=true
& "$PSScriptRoot\..\mvnw.cmd" org.apache.maven.plugins:maven-install-plugin:3.1.0:install-file -Dfile="$d\openvino-native-auto-0.36.0.jar" -DpomFile="$d\openvino-native-auto-0.36.0.pom" -DskipTests=true
Write-Host 'Installed artifacts. Now running package...'
& "$PSScriptRoot\..\mvnw.cmd" -s "$PSScriptRoot\..\settings-bypass-artifactory.xml" -Pdev -DskipTests=true package
