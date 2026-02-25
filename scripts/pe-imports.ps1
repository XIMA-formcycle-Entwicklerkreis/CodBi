param(
  [Parameter(Mandatory=$true)][string]$Path
)

function Read-UInt16($br){ return $br.ReadUInt16() }
function Read-UInt32($br){ return $br.ReadUInt32() }
function Read-Int32($br){ return $br.ReadInt32() }

$fs = [System.IO.File]::OpenRead($Path)
$br = New-Object System.IO.BinaryReader($fs)
try {
  $fs.Seek(0, [System.IO.SeekOrigin]::Begin) > $null
  $mz = $br.ReadUInt16()
  if ($mz -ne 0x5A4D) { Write-Error "Not a PE file (MZ header missing)"; exit 2 }
  $fs.Seek(0x3C, [System.IO.SeekOrigin]::Begin) > $null
  $e_lfanew = Read-Int32 $br
  $fs.Seek($e_lfanew, [System.IO.SeekOrigin]::Begin) > $null
  $sig = Read-UInt32 $br
  if ($sig -ne 0x4550) { Write-Error "Invalid PE signature"; exit 2 }
  # FileHeader
  $machine = Read-UInt16 $br
  $numberOfSections = Read-UInt16 $br
  $timeDateStamp = Read-UInt32 $br
  $pointerToSymbolTable = Read-UInt32 $br
  $numberOfSymbols = Read-UInt32 $br
  $sizeOfOptionalHeader = Read-UInt16 $br
  $characteristics = Read-UInt16 $br

  # OptionalHeader magic
  $optionalStart = $fs.Position
  $magic = Read-UInt16 $br
  $isPE32 = ($magic -eq 0x10b)
  $isPE64 = ($magic -eq 0x20b)
  if (-not ($isPE32 -or $isPE64)) { Write-Error "Unknown Optional Header magic: $magic"; exit 2 }

  # DataDirectory offset within optional header
  if ($isPE32) { $dataDirOffset = $optionalStart + 96 } else { $dataDirOffset = $optionalStart + 112 }
  # Import Directory is DataDirectory[1]
  $fs.Seek($dataDirOffset + 8, [System.IO.SeekOrigin]::Begin) > $null
  $importRVA = Read-UInt32 $br
  $importSize = Read-UInt32 $br

  # Read section headers
  $sectionHeaders = @()
  $fs.Seek($optionalStart + $sizeOfOptionalHeader, [System.IO.SeekOrigin]::Begin) > $null
  for ($i=0; $i -lt $numberOfSections; $i++){
    $nameBytes = $br.ReadBytes(8)
    $name = ([System.Text.Encoding]::ASCII.GetString($nameBytes)).Trim([char]0)
    $virtualSize = Read-UInt32 $br
    $virtualAddress = Read-UInt32 $br
    $sizeOfRawData = Read-UInt32 $br
    $pointerToRawData = Read-UInt32 $br
    $br.ReadBytes(16) > $null # skip remaining fields
    $sectionHeaders += @{Name=$name; VirtualAddress=$virtualAddress; VirtualSize=$virtualSize; PointerToRawData=$pointerToRawData; SizeOfRawData=$sizeOfRawData}
  }

  function RvaToOffset([uint32]$rva){
    foreach ($s in $sectionHeaders){
      if ($rva -ge $s.VirtualAddress -and $rva -lt ($s.VirtualAddress + $s.VirtualSize)){
        return [uint32]($s.PointerToRawData + ($rva - $s.VirtualAddress))
      }
    }
    return $null
  }

  if ($importRVA -eq 0) { Write-Output "No import directory found."; exit 0 }
  $off = RvaToOffset $importRVA
  if ($off -eq $null) { Write-Error "Cannot map import RVA to file offset"; exit 2 }

  $fs.Seek($off, [System.IO.SeekOrigin]::Begin) > $null
  $imports = @()
  while ($true){
    $origFirstThunk = Read-UInt32 $br
    $timeDateStamp = Read-UInt32 $br
    $forwarderChain = Read-UInt32 $br
    $nameRVA = Read-UInt32 $br
    $firstThunk = Read-UInt32 $br
    if ($origFirstThunk -eq 0 -and $timeDateStamp -eq 0 -and $forwarderChain -eq 0 -and $nameRVA -eq 0 -and $firstThunk -eq 0) { break }
    $nameOff = RvaToOffset $nameRVA
    if ($nameOff -ne $null){
      $fs.Seek($nameOff, [System.IO.SeekOrigin]::Begin) > $null
      $chars = @()
      while ($true){
        $b = $br.ReadByte()
        if ($b -eq 0) { break }
        $chars += $b
      }
      $dllName = [System.Text.Encoding]::ASCII.GetString([byte[]]$chars)
      $imports += $dllName
    }
  }

  Write-Output "Imported DLLs for: $Path"
  $imports | Sort-Object -Unique | ForEach-Object { Write-Output " - $_" }
} finally {
  $br.Close()
  $fs.Close()
}
