# Render Deployment Guide

## Problem Fixed
The deployment was failing because Render was looking for `package.json` in the wrong directory (`/opt/render/project/src/`).

## Solution Applied
Updated `render.yaml` to use `rootDir` property instead of `cd` commands. This tells Render where to find the correct `package.json` file.

### Changes Made:
1. **render.yaml** - Fixed deployment configuration:
   - Changed from: `buildCommand: cd backend && npm install`
   - Changed to: `rootDir: backend` + `buildCommand: npm install`

2. **ResultsView.jsx** - Added JSON download button:
   - Added `downloadJSON()` function to create downloadable JSON files
   - Added download button with icon in the JSON Output section

## Deployment Steps

### Option 1: Deploy via Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `https://github.com/Bharathi5170/idp`
4. Render will automatically detect `render.yaml` and configure the service
5. Click "Create Web Service"

### Option 2: Deploy via Render Blueprint (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Select your GitHub repository: `Bharathi5170/idp`
