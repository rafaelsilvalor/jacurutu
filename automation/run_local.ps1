# run_local.ps1
# Wrapper PowerShell pra chamar run_local.py via Windows Task Scheduler.
#
# O Task Scheduler executa este script. Ele garante que o cwd e o ambiente
# Python estao corretos e captura o exit code.
#
# Uso direto pra teste:
#   powershell -ExecutionPolicy Bypass -File run_local.ps1

$ErrorActionPreference = "Stop"

# Caminho do script (mesma pasta deste arquivo)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Tenta achar python no PATH; fallback pra python3
$PythonExe = Get-Command python -ErrorAction SilentlyContinue
if (-not $PythonExe) {
    $PythonExe = Get-Command python3 -ErrorAction SilentlyContinue
}
if (-not $PythonExe) {
    Write-Error "Python nao encontrado no PATH. Instale ou ajuste o PATH."
    exit 127
}

$PyPath = $PythonExe.Source
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Usando Python: $PyPath"

# Executa o orquestrador
& $PyPath "run_local.py"
$ExitCode = $LASTEXITCODE

if ($ExitCode -eq 0) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] OK"
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] FALHOU com exit code $ExitCode" -ForegroundColor Red
}

exit $ExitCode
