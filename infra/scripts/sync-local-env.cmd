@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-local-env.ps1" %*
