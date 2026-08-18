# =====================================================================
#  wait-for-port.ps1
#  Attend qu'un port TCP soit ouvert (un service demarre) ou ferme.
# =====================================================================
#  Utilisation :
#    .\wait-for-port.ps1 -Port 3306 -TimeoutSeconds 30
#    .\wait-for-port.ps1 -Port 3306 -Host '192.168.1.50' -TimeoutSeconds 15
#  Retour : $true si le port repond, $false si timeout.
# =====================================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)] [int]$Port,
    [string]$HostName = '127.0.0.1',
    [int]$TimeoutSeconds = 30
)

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
$ok = $false

while ((Get-Date) -lt $deadline) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($HostName, $Port, $null, $null)
        $success = $iar.AsyncWaitHandle.WaitOne(1000, $false)
        if ($success -and $client.Connected) {
            $client.EndConnect($iar)
            $client.Close()
            $ok = $true
            break
        }
        $client.Close()
    } catch {
        # Port encore ferme, on reessaie
    }
    Start-Sleep -Milliseconds 500
}

if ($ok) {
    Write-Host "[OK] Port $HostName`:$Port est accessible."
} else {
    Write-Warning "Timeout : le port $HostName`:$Port n'a pas repondu en $TimeoutSeconds s."
}
return $ok
