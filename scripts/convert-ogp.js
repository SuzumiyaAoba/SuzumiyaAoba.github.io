#!/usr/bin/env node

/**
 * SVGをPNGに変換するスクリプト
 * 使用方法:
 * 1. npm install sharp を実行してsharpをインストール
 * 2. node scripts/convert-ogp.js を実行
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, "../public/assets/ogp-default.svg");
    const pngPath = path.join(__dirname, "../public/assets/ogp-default.png");

    if (!fs.existsSync(svgPath)) {
      console.error("SVGファイルが見つかりません:", svgPath);
      return;
    }

    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer).png().toFile(pngPath);

    console.log("SVGをPNGに変換しました:", pngPath);
  } catch (error) {
    console.error("変換中にエラーが発生しました:", error);
  }
}

convertSvgToPng();
