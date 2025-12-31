#!/usr/bin/env node
/**
 * Generate app icons for iOS and Android from SVG source
 * Requires: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '..', 'icon.svg');

// iOS icon sizes
const IOS_ICONS = [
  { size: 40, filename: 'icon_40.png' },
  { size: 58, filename: 'icon_58.png' },
  { size: 60, filename: 'icon_60.png' },
  { size: 80, filename: 'icon_80.png' },
  { size: 87, filename: 'icon_87.png' },
  { size: 120, filename: 'icon_120.png' },
  { size: 180, filename: 'icon_180.png' },
  { size: 1024, filename: 'icon_1024.png' },
];

// Android icon sizes (density buckets)
const ANDROID_ICONS = [
  { size: 48, folder: 'mipmap-mdpi' },
  { size: 72, folder: 'mipmap-hdpi' },
  { size: 96, folder: 'mipmap-xhdpi' },
  { size: 144, folder: 'mipmap-xxhdpi' },
  { size: 192, folder: 'mipmap-xxxhdpi' },
];

// Adaptive icon foreground sizes (with safe zone padding)
const ANDROID_FOREGROUND_ICONS = [
  { size: 108, folder: 'mipmap-mdpi' },
  { size: 162, folder: 'mipmap-hdpi' },
  { size: 216, folder: 'mipmap-xhdpi' },
  { size: 324, folder: 'mipmap-xxhdpi' },
  { size: 432, folder: 'mipmap-xxxhdpi' },
];

const IOS_OUTPUT_DIR = path.join(__dirname, '..', 'ios', 'guidr', 'Images.xcassets', 'AppIcon.appiconset');
const ANDROID_RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Background color for adaptive icons (from icon.svg)
const ICON_BACKGROUND_COLOR = '#A7F3D0';

async function generateIcon(svgBuffer, size, outputPath) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

async function generateRoundIcon(svgBuffer, size, outputPath) {
  // Create circular mask
  const circle = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`
  );

  const resized = await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toBuffer();

  await sharp(resized)
    .composite([{
      input: circle,
      blend: 'dest-in'
    }])
    .png()
    .toFile(outputPath);
  console.log(`Generated (round): ${outputPath} (${size}x${size})`);
}

// SVG for foreground only (circles on transparent background)
const FOREGROUND_SVG = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <circle cx="384" cy="640" r="32" fill="#0F172A" opacity="0.4"/>
    <circle cx="480" cy="544" r="40" fill="#0F172A" opacity="0.6"/>
    <circle cx="576" cy="448" r="48" fill="#0F172A"/>
    <circle cx="672" cy="352" r="56" fill="#0F172A" opacity="0.4"/>
</svg>`;

async function generateForegroundIcon(size, outputPath) {
  // For adaptive icons, the foreground needs padding (safe zone is 66% of total)
  // The icon content should be centered in the inner 66%
  const safeSize = Math.round(size * 0.66);
  const padding = Math.round((size - safeSize) / 2);

  const foregroundWithPadding = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${padding}, ${padding}) scale(${safeSize/1024})">
      <circle cx="384" cy="640" r="32" fill="#0F172A" opacity="0.4"/>
      <circle cx="480" cy="544" r="40" fill="#0F172A" opacity="0.6"/>
      <circle cx="576" cy="448" r="48" fill="#0F172A"/>
      <circle cx="672" cy="352" r="56" fill="#0F172A" opacity="0.4"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(foregroundWithPadding))
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`Generated (foreground): ${outputPath} (${size}x${size})`);
}

function generateColorsXml() {
  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${ICON_BACKGROUND_COLOR}</color>
</resources>
`;
  const outputPath = path.join(ANDROID_RES_DIR, 'values', 'colors.xml');
  fs.writeFileSync(outputPath, colorsXml);
  console.log(`Generated: ${outputPath}`);
}

function generateAdaptiveIconXml() {
  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

  // Generate ic_launcher.xml
  const launcherPath = path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26', 'ic_launcher.xml');
  fs.writeFileSync(launcherPath, adaptiveIconXml);
  console.log(`Generated: ${launcherPath}`);

  // Generate ic_launcher_round.xml
  const launcherRoundPath = path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26', 'ic_launcher_round.xml');
  fs.writeFileSync(launcherRoundPath, adaptiveIconXml);
  console.log(`Generated: ${launcherRoundPath}`);
}

async function main() {
  console.log('Reading SVG source...');
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // Generate iOS icons
  console.log('\n--- Generating iOS Icons ---');
  for (const icon of IOS_ICONS) {
    const outputPath = path.join(IOS_OUTPUT_DIR, icon.filename);
    await generateIcon(svgBuffer, icon.size, outputPath);
  }

  // Generate Android launcher icons (legacy)
  console.log('\n--- Generating Android Launcher Icons ---');
  for (const icon of ANDROID_ICONS) {
    const folderPath = path.join(ANDROID_RES_DIR, icon.folder);

    // Standard launcher icon
    await generateIcon(svgBuffer, icon.size, path.join(folderPath, 'ic_launcher.png'));

    // Round launcher icon
    await generateRoundIcon(svgBuffer, icon.size, path.join(folderPath, 'ic_launcher_round.png'));
  }

  // Generate Android adaptive icon foregrounds
  console.log('\n--- Generating Android Adaptive Icon Foregrounds ---');
  for (const icon of ANDROID_FOREGROUND_ICONS) {
    const folderPath = path.join(ANDROID_RES_DIR, icon.folder);
    await generateForegroundIcon(icon.size, path.join(folderPath, 'ic_launcher_foreground.png'));
  }

  // Also generate the 1024px PNG in project root for reference
  console.log('\n--- Generating Reference Icon ---');
  await generateIcon(svgBuffer, 1024, path.join(__dirname, '..', 'icon.png'));

  // Generate Android adaptive icon configuration
  console.log('\n--- Generating Android Adaptive Icon Configuration ---');
  generateColorsXml();
  generateAdaptiveIconXml();

  console.log('\n✅ All icons generated successfully!');
}

main().catch(console.error);

