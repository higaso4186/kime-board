@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0infra.ps1" %*
