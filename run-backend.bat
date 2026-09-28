@echo off
echo Starting Spring Boot Backend...
cd /d "%~dp0backend"
mvnw.cmd spring-boot:run
