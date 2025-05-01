@echo off
setlocal

echo === Building Bill Generator Docker Image ===

REM Build the Docker image
echo Building Docker image...
docker build -t bill-gen:latest .

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
docker tag bill-gen:latest bill-gen:%datestamp%

echo === Build and Tag Complete ===
echo To push to a registry, run:
echo docker push bill-gen:latest
echo docker push bill-gen:%datestamp%

echo To run the container locally:
echo docker run -p 8080:8080 bill-gen:latest

endlocal
