import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs-extra";
const execAsync = util.promisify(exec);

/**
 * 對單張圖片產生 Ken Burns 動畫影片
 * @param imagePath 圖片路徑
 * @param outputPath 輸出 mp4 路徑
 * @param duration 秒數
 * @param maxZoom 最大縮放
 */
export async function kenBurnsClip(
  imagePath: string,
  outputPath: string,
  duration: number = 3,
  maxZoom: number = 1.2,
) {
  // Ken Burns 動畫模式列表
  const modes = [
    // 左上到右下
    { xStart: 0, yStart: 0, xEnd: 0.3, yEnd: 0.3 },
    // 右下到左上
    { xStart: 0.3, yStart: 0.3, xEnd: 0, yEnd: 0 },
    // 左下到右上
    { xStart: 0, yStart: 0.3, xEnd: 0.3, yEnd: 0 },
    // 右上到左下
    { xStart: 0.3, yStart: 0, xEnd: 0, yEnd: 0.3 },
    // 垂直移動
    { xStart: 0.15, yStart: 0, xEnd: 0.15, yEnd: 0.3 },
    // 水平移動
    { xStart: 0, yStart: 0.15, xEnd: 0.3, yEnd: 0.15 },
  ];
  // 隨機選擇一個模式
  const mode = modes[Math.floor(Math.random() * modes.length)];

  const zoomStart = 1;
  const zoomEnd = maxZoom;
  const { xStart, yStart, xEnd, yEnd } = mode;

  // ffmpeg zoompan 濾鏡
  const filter = `zoompan=z='${zoomStart}+(on/${duration * 25})*(${zoomEnd}-${zoomStart})':x='iw*${xStart}+on*(iw*(${xEnd}-${xStart})/${duration * 25})':y='ih*${yStart}+on*(ih*(${yEnd}-${yStart})/${duration * 25})':d=${duration * 25}:s=1280x720`;

  const cmd = `ffmpeg -y -i "${imagePath}" -vf "${filter}" -t ${duration} -r 25 -pix_fmt yuv420p "${outputPath}"`;
  await execAsync(cmd);
}

/**
 * 多個 mp4 片段 concat 成單一 mp4
 * @param videoPaths mp4 路徑陣列
 * @param outputPath 輸出 mp4
 */
export async function concatVideos(videoPaths: string[], outputPath: string) {
  // 產生 concat list file
  const listPath = path.join(
    path.dirname(outputPath),
    `concat_${Date.now()}.txt`,
  );
  const listContent = videoPaths.map((p) => `file '${p}'`).join("\n");
  fs.writeFileSync(listPath, listContent);
  const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
  await execAsync(cmd);
  fs.unlinkSync(listPath);
}
