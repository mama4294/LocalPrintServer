param(
    [string]$printerIP = "10.145.0.50",
    [int]$port = 9100,
    [string]$labelsJson
)


Write-Host "Labels: $labelsJson`n"
try {
    $labels = $labelsJson | ConvertFrom-Json
} catch {
    Write-Error "⚠️ Failed to parse labelsJson:`n$labelsJson`n"
    exit 1
}

Write-Host "Parsed $($labels.Count) label(s).`n"

if ($labels.Count -eq 0) {
    Write-Error "No labels parsed. Exiting."
    exit 1
}


$idObj = "id"
$barcodeObj = "barcode"
$descObj = "type"
$locObj = "location"
$titleObj = "Text5"

function Get-ByteLengthChars($text) {
    $size = $text.Length
    $n1 = [char]([byte]($size % 256))
    $n2 = [char]([byte]([math]::Floor($size / 256)))
    return @($n1, $n2)
}

# Connect to printer
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($printerIP, $port)
    Write-Host "✅ Connected to printer at ip: $printerIP, port: $port"
} catch {
    Write-Error "❌ Failed to connect to printer: $_"
    exit 1
}

$networkStream = $tcpClient.GetStream()
$streamWriter = New-Object System.IO.StreamWriter($networkStream)

$labelCount = $labels.Count
$index = 0

foreach ($label in $labels) {
    $index++
    $id = $label.id
    $description = $label.description
    $location = $label.location
    $title = $label.title

    $idBytes = Get-ByteLengthChars $id
    $descBytes = Get-ByteLengthChars $description
    $locBytes = Get-ByteLengthChars $location
    $titleBytes = Get-ByteLengthChars $title

    # Determine if this is the last label
    $cutCode = if ($index -eq $labelCount) { "^CO1001" } else { "^CO0000" }


    $bplScript = @"
^11
^TS003
$cutCode
^ON$idObj$([char]0)
^DI$($idBytes[0])$($idBytes[1])$id
^ON$descObj$([char]0)
^DI$($descBytes[0])$($descBytes[1])$description
^ON$locObj$([char]0)
^DI$($locBytes[0])$($locBytes[1])$location
^ON$titleObj$([char]0)
^DI$($titleBytes[0])$($titleBytes[1])$title
^ON$barcodeObj$([char]0)
^DI$($idBytes[0])$($idBytes[1])$id
^FF
"@

    Write-Host "`n--- BPL Script for ID: $id ---"
    Write-Host $bplScript
    Write-Host "-----------------------------"

    try {
        $streamWriter.Write($bplScript)
        $streamWriter.Flush()
        Write-Host "✅ Sent label for ID: $id"
    } catch {
    Write-Error "❌ Failed to send label for $id $_"
    exit 1
    }
}

# Cleanup
$streamWriter.Close()
$networkStream.Close()
$tcpClient.Close()
Write-Host "`n✅ All labels processed."