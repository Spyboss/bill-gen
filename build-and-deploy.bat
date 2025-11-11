@echo off
setlocal

echo === Building TMR Docker Image ===

REM Build the Docker image
echo Building Docker image...
docker build -t tmr:latest .

REM Check if build was successful
if %ERRORLEVEL% NEQ 0 (
    echo Docker build failed!
    exit /b 1
)

echo Docker image built successfully!

REM Tag the image for deployment
echo Tagging image for deployment...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set datestamp=%%c%%a%%b
)
docker tag tmr:latest tmr:%datestamp%

echo === Build and Tag Complete ===
echo To push to a registry, run:
echo docker push tmr:latest
echo docker push tmr:%datestamp%

echo To run the container locally:
echo docker run -p 8080:8080 tmr:latest

endlocal
