#!/usr/bin/env node
const tinify = require("tinify");
const params = require("minimist")(process.argv.slice(2));
const ProgressBar = require("progress");
const fs = require("fs");
const path = require("path");
const colors = require("colors");

// tinify 官方 key
tinify.key = "9gfxRWlW6Kbym9jlrPNmSHcKwLCr5wCP";
// 待匹配的文件格式
const type = ".png";

// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
let bar = null;

const picSizeComparation = {};
// 没传参数抛出错误;
if (!params.src) {
  throw new Error("Expected src");
} else if (!params.target) {
  throw new Error("Expected target");
}

function getFiles(filePath) {
  return new Promise((resolve, reject) => {
    let files;
    try {
      files = fs.readdirSync(filePath);
    } catch (err) {
      console.log("can not open this file");
      throw new Error(err);
    }
    bar = new ProgressBar("Compressing <:bar> :percent", {
      // 有一个apple隐藏文件
      total: (files.length - 1) * 10,
    });
    resolve(files);
  });
}

function isPngPic(fileStats, fileName) {
  const isFile = fileStats.isFile(); // 是文件
  const isPng = new RegExp(type).test(fileName);
  return isFile && isPng;
}

function writeFile(data, fileName) {
  const path = params.target + "/" + fileName;
  fs.writeFileSync(path, data);
}

async function getCompressedPicSize(fileName) {
  const path = params.target + "/" + fileName;
  const picStats = fs.statSync(path);
  picSizeComparation[fileName] = {
    ...picSizeComparation[fileName],
    endSize: Math.floor(picStats.size / 1024) + "kb",
  }; //压缩后大小
  await bar.tick(10);
  if (bar.complete) {
    console.log("compress successfully".green);
    for (let key in picSizeComparation) {
      console.info(
        key,
        "\t=>",
        "|before".blue,
        picSizeComparation[key].startSize,
        "|after".blue,
        picSizeComparation[key].endSize
      );
    }
  }
}

async function compressPic(fileStats, fileName, picture) {
  // 压缩前大小
  picSizeComparation[fileName] = {
    startSize: Math.floor(fileStats.size / 1024) + "kb",
  };
  // 压缩
  await tinify.fromBuffer(picture).toBuffer(function (err, resultData) {
    if (err) throw err;
    writeFile(resultData, fileName);
    getCompressedPicSize(fileName);
  });
}

function main(sourcePath) {
  getFiles(sourcePath).then((files) => {
    // 进度条初始化
    bar = new ProgressBar("Compressing <:bar> :percent", {
      // 有一个apple隐藏文件
      total: (files.length - 1) * 10,
    });
    files.forEach((fileName) => {
      // 获取当前文件的绝对路径
      let filedir = path.join(sourcePath, fileName);
      // 当前文件状态
      const fileStats = fs.statSync(filedir);
      const picture = fs.readFileSync(filedir);

      if (isPngPic(fileStats, fileName)) {
        compressPic(fileStats, fileName, picture);
      }
    });
  });
}
main(params.src);
