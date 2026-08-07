# Starts a GreenMail SMTP/IMAP dev server for local formcycle development.
#
# SMTP:     localhost:3025   (no authentication required)
# IMAP:     localhost:3143   (connect your email client here to read captured mails)
# POP3:     localhost:3110   (alternative to IMAP)
# REST API: http://localhost:8025/api/service/readiness          (service status)
#           http://localhost:8025/api/user/<login>/messages/INBOX (JSON mail list)
#           http://localhost:8025/greenmail-openapi.yml           (OpenAPI spec)
#
# Email client setup (e.g. Thunderbird):
#   Incoming:  IMAP, localhost:3143, no SSL, username: any (e.g. "test")
#   Outgoing:  not needed (formcycle sends directly via SMTP)
#   Password:  any (authentication is disabled)
#
# Usage: .\scripts\launch-mailserver.ps1
#        Run BEFORE starting the formcycle server.  Formcycle must be (re)started
#        at least once after the first run so it picks up the pre-configured SMTP
#        settings from xfc-server/config/system-mail.properties.
#
# Stop with Ctrl+C.

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

Write-Host ""
Write-Host "=== GreenMail dev mail server ===" -ForegroundColor Cyan
Write-Host "  SMTP:     localhost:3025 (no auth)" -ForegroundColor Green
Write-Host "  IMAP:     localhost:3143 (read mails in Thunderbird/Outlook)" -ForegroundColor Green
Write-Host "  REST API: http://localhost:8025/api/service/readiness" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

& .\mvnw.cmd -Pmailserver exec:java
