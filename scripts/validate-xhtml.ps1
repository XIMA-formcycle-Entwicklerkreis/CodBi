# Well-formedness check for the Facelets files (what the JSF SAX compiler does before rendering).
# Catches the classic authoring mistakes early: a double hyphen inside an XML comment, an unescaped
# ampersand in an attribute value, an unclosed tag.
$files = Get-ChildItem -Path 'src/main/resources/WEB-INF/ui' -Filter '*.xhtml' -File
$failed = $false
foreach ($file in $files) {
    try {
        $doc = New-Object System.Xml.XmlDocument
        $doc.XmlResolver = $null
        $doc.Load($file.FullName)
        Write-Host "[validate-xhtml] OK   $($file.Name)"
    } catch {
        $failed = $true
        Write-Host "[validate-xhtml] FAIL $($file.Name): $($_.Exception.Message)"
    }
}
if ($failed) { exit 1 }
