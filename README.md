# 專案說明

這是一個開源的自動化影片創作工具，用於生成短影音內容。短影音製作工具結合了文字轉語音、自動字幕、背景影片和音樂，可以從簡單的文字輸入創建引人入勝的短影音。

這個專案旨在提供一個免費的替代方案，以取代耗費大量 GPU 資源的影片生成（以及昂貴的第三方 API 調用）。它不會根據圖像或圖像提示從頭開始生成影片。

伺服器公開了一個 [MCP](https://github.com/modelcontextprotocol) 和一個 REST 伺服器。

雖然 MCP 伺服器可以與 AI 代理（如 n8n）一起使用，但 REST 端點為影片生成提供了更大的靈活性。

# 目錄

## 入門

- [要求](#一般要求)
- [如何運行伺服器](#如何運行伺服器)
- [網頁使用者介面](#網頁使用者介面)
- [教學](#n8n教學)
- [範例](#範例)

## 用法

- [環境變數](#環境變數)
- [REST API](#rest-api)
- [配置選項](#配置選項)
- [MCP](#mcp伺服器)

## 資訊

- [功能](#功能)
- [工作原理](#工作原理)
- [限制](#限制)
- [概念](#概念)
- [故障排除](#故障排除)
- [雲端部署](#雲端部署)
- [常見問題](#常見問題)
- [依賴項](#影片生成依賴項)
- [貢獻](#如何貢獻)
- [許可證](#許可證)
- [致謝](#致謝)

# n8n教學

[![自動化無人影片生成 (n8n + MCP) 帶字幕、背景音樂，本地且 100% 免費](https://img.youtube.com/vi/jzsQpn-AciM/0.jpg)](https://www.youtube.com/watch?v=jzsQpn-AciM)

# 範例

<table>
  <tr>
    <td>
      <video src="https://github.com/user-attachments/assets/1b488e7d-1b40-439d-8767-6ab51dbc0922" width="480" height="270"></video>
    </td>
    <td>
      <video src="https://github.com/user-attachments/assets/bb7ce80f-e6e1-44e5-ba4e-9b13d917f55b" width="270" height="480"></video>
    </td>
<td>
  </tr>
</table>

# 功能

- 從文字提示生成完整的短影音
- 文字轉語音轉換
- 自動字幕生成和樣式設定
- 透過 Pexels 搜尋和選擇背景影片
- 從一系列圖像生成帶有 Ken Burns 效果的影片
- 媒體預覽功能，可在渲染前查看圖像/影片
- 帶有類型/情緒選擇的背景音樂
- 作為 REST API 和模型上下文協議 (MCP) 伺服器

# 工作原理

短影音創作者接收簡單的文字輸入和搜尋詞，然後：

1. 使用 Kokoro TTS 將文字轉換為語音
2. 透過 Whisper 生成準確的字幕
3. 從 Pexels 尋找相關的背景影片。如果來源是圖像，則使用 Ken Burns 效果創建動畫片段。
4. 使用 Remotion 組合所有元素
5. 渲染帶有完美定時字幕的專業短影音

# 限制

- 該專案目前只能生成英文配音的影片 (kokoro-js 暫不支援其他語言)
- 背景影片來源於 Pexels

# 一般要求

- 網路
- 免費 Pexels API 金鑰
- ≥ 3 GB 可用記憶體，建議 4 GB 記憶體
- ≥ 2 個虛擬 CPU
- ≥ 5 GB 磁碟空間

# 概念

## 場景

每個影片都由多個場景組成。這些場景包括：

1. 文字：旁白，TTS 將讀取並從中創建字幕的文字。
2. 搜尋詞：伺服器應用於從 Pexels API 尋找影片的關鍵字。如果找不到，則使用通用詞 (`nature`, `globe`, `space`, `ocean`)

# 入門

## Docker (推薦)

有三種 Docker 映像檔，適用於三種不同的使用案例。一般來說，大多數時候您會想啟動 `tiny` 映像檔。

### Tiny

- 使用 `tiny.en` whisper.cpp 模型
- 使用 `q4` 量化 kokoro 模型
- `CONCURRENCY=1` 以克服 Remotion 在資源有限時出現的 OOM 錯誤
- `VIDEO_CACHE_SIZE_IN_BYTES=2097152000` (2GB) 以克服 Remotion 在資源有限時出現的 OOM 錯誤

```jsx
docker run -it --rm --name short-video-maker -p 3123:3123 -e LOG_LEVEL=debug -e PEXELS_API_KEY= gyoridavid/short-video-maker:latest-tiny
```

### Normal

- 使用 `base.en` whisper.cpp 模型
- 使用 `fp32` kokoro 模型
- `CONCURRENCY=1` 以克服 Remotion 在資源有限時出現的 OOM 錯誤
- `VIDEO_CACHE_SIZE_IN_BYTES=2097152000` (2GB) 以克服 Remotion 在資源有限時出現的 OOM 錯誤

```jsx
docker run -it --rm --name short-video-maker -p 3123:3123 -e LOG_LEVEL=debug -e PEXELS_API_KEY= gyoridavid/short-video-maker:latest
```

### Cuda

如果您擁有 Nvidia GPU 並希望使用更大的 whisper 模型並進行 GPU 加速，您可以使用 CUDA 優化的 Docker 映像檔。

- 使用 `medium.en` whisper.cpp 模型 (帶 GPU 加速)
- 使用 `fp32` kokoro 模型
- `CONCURRENCY=1` 以克服 Remotion 在資源有限時出現的 OOM 錯誤
- `VIDEO_CACHE_SIZE_IN_BYTES=2097152000` (2GB) 以克服 Remotion 在資源有限時出現的 OOM 錯誤

```jsx
docker run -it --rm --name short-video-maker -p 3123:3123 -e LOG_LEVEL=debug -e PEXELS_API_KEY= --gpus=all gyoridavid/short-video-maker:latest-cuda
```

## Docker Compose

您可以使用 Docker Compose 運行 n8n 或其他服務，並希望將它們組合起來。請確保將共享網路添加到服務配置中。

```bash
version: "3"

services:
  short-video-maker:
    image: gyoridavid/short-video-maker:latest-tiny
    environment:
      - LOG_LEVEL=debug
      - PEXELS_API_KEY=
    ports:
      - "3123:3123"
    volumes:
	    - ./videos:/app/data/videos # expose the generated videos

```

如果您正在使用 [Self-hosted AI starter kit](https://github.com/n8n-io/self-hosted-ai-starter-kit)，您需要將 `networks: ['demo']` 添加到 `short-video-maker` 服務中，以便您可以在 n8n 中透過 http://short-video-maker:3123 訪問它。

# NPM

雖然 Docker 是運行此專案的推薦方式，但您也可以使用 npm 或 npx 運行它。
除了一般要求外，運行伺服器還需要以下條件。

## 支援的平台

- Ubuntu ≥ 22.04 (Whisper.cpp 需要 libc 2.5)
  - 所需套件：`git wget cmake ffmpeg curl make libsdl2-dev libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2`
- Mac OS
  - ffmpeg (`brew install ffmpeg`)
  - node.js (在 22+ 版本上測試)

目前不支援 Windows (whisper.cpp 安裝偶爾會失敗)。

# 網頁使用者介面

@mushitori 製作了一個網頁使用者介面，讓您可以從瀏覽器生成影片。

<table>
  <tr>
    <td>
      <img width="1088" alt="Screenshot 2025-05-12 at 1 45 11 PM" src="https://github.com/user-attachments/assets/2ab64aea-f639-41b0-bd19-2fcf73bb1a3d" />
    </td>
    <td>
      <img width="1075" alt="Screenshot 2025-05-12 at 1 45 44 PM" src="https://github.com/user-attachments/assets/0ff568fe-ddcb-4dad-ae62-2640290aef1e" />
    </td>
    <td>
      <img width="1083" alt="Screenshot 2025-05-12 at 1 45 51 PM" src="https://github.com/user-attachments/assets/d3c1c826-3cb3-4313-b17c-605ff612fb63" />
    </td>
    <td>
      <img width="1070" alt="Screenshot 2025-05-12 at 1 46 42 PM" src="https://github.com/user-attachments/assets/18edb1a0-9fc2-48b3-8896-e919e7dc57ff" />
    </td>
  </tr>
</table>

您可以在 http://localhost:3123 載入它。

# 環境變數

## 🟢 配置

| key             | 說明                                                       | 預設值 |
| --------------- | ---------------------------------------------------------- | ------ |
| PEXELS_API_KEY  | [您的 (免費) Pexels API 金鑰](https://www.pexels.com/api/) |        |
| LOG_LEVEL       | pino 日誌級別                                              | info   |
| WHISPER_VERBOSE | whisper.cpp 的輸出是否應轉發到標準輸出                     | false  |
| PORT            | 伺服器將監聽的埠號                                         | 3123   |

## ⚙️ 系統配置

| key                       | 說明                                                                                                                                                                                      | 預設值                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| KOKORO_MODEL_PRECISION    | 要使用的 Kokoro 模型大小。有效選項為 `fp32`、`fp16`、`q8`、`q4`、`q4f16`                                                                                                                  | 取決於上述 Docker 映像檔的說明 ^^ |
| CONCURRENCY               | [並發性是指在渲染期間同時打開的瀏覽器標籤數量。每個 Chrome 標籤渲染網頁內容然後截圖。](https://www.remotion.dev/docs/terminology/concurrency)。調整此值有助於在資源有限的情況下運行專案。 | 取決於上述 Docker 映像檔的說明 ^^ |
| VIDEO_CACHE_SIZE_IN_BYTES | Remotion 中 [<OffthreadVideo>](https://remotion.dev/docs/offthreadvideo) 影格的快取。調整此值有助於在資源有限的情況下運行專案。                                                           | 取決於上述 Docker 映像檔的說明 ^^ |

## ⚠️ 危險區域

| key           | 說明                                                                                                                                                                         | 預設值                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| WHISPER_MODEL | 要使用的 whisper.cpp 模型。有效選項為 `tiny`、`tiny.en`、`base`、`base.en`、`small`、`small.en`、`medium`、`medium.en`、`large-v1`、`large-v2`、`large-v3`、`large-v3-turbo` | 取決於上述 Docker 映像檔的說明。對於 npm，預設選項為 `medium.en`      |
| DATA_DIR_PATH | 專案的資料目錄                                                                                                                                                               | npm 為 `~/.ai-agents-az-video-generator`，Docker 映像檔為 `/app/data` |
| DOCKER        | 專案是否在 Docker 容器中運行                                                                                                                                                 | Docker 映像檔為 `true`，否則為 `false`                                |
| DEV           | 猜猜看！ :)                                                                                                                                                                  | `false`                                                               |

# 配置選項

| key                    | 說明                                                            | 預設值     |
| ---------------------- | --------------------------------------------------------------- | ---------- |
| paddingBack            | 結束畫面，旁白結束後影片應繼續播放多長時間 (毫秒)。             | 0          |
| music                  | 背景音樂的情緒。從 GET `/api/music-tags` 端點獲取可用選項。     | random     |
| captionPosition        | 字幕應渲染的位置。可能選項：`top`、`center`、`bottom`。預設值   | `bottom`   |
| captionBackgroundColor | 活動字幕項目的背景顏色。                                        | `blue`     |
| voice                  | Kokoro 語音。                                                   | `af_heart` |
| orientation            | 影片方向。可能選項為 `portrait` 和 `landscape`                  | `portrait` |
| musicVolume            | 設定背景音樂的音量。可能選項為 `low` `medium` `high` 和 `muted` | `high`     |
| media_type             | 視覺效果的來源。可以是 `video` 或 `image`。                     | `video`    |

# 用法

## MCP 伺服器

## 伺服器 URL

`/mcp/sse`

`/mcp/messages`

## 可用工具

- `create-short-video` 創建短影音 - LLM 將找出正確的配置。如果您想使用特定配置，則需要在提示中指定這些配置。
- `get-video-status` 有點無用，它用於檢查影片的狀態，但由於 AI 代理在時間概念上並不是很擅長，您可能最終還是會使用 REST API 來處理。

# REST API

### GET `/health`

健康檢查端點

```bash
curl --location 'localhost:3123/health'
```

```bash
{
    "status": "ok"
}
```

### POST `/api/short-video`

```bash
curl --location 'localhost:3123/api/short-video' \
--header 'Content-Type: application/json' \
--data '{
    "scenes": [
      {
        "text": "Hello world!",
        "searchTerms": ["river"]
      }
    ],
    "config": {
      "paddingBack": 1500,
      "music": "chill"
    }
}'
```

```bash
{
    "videoId": "cma9sjly700020jo25vwzfnv9"
}
```

### GET `/api/short-video/{id}/status`

```bash
curl --location 'localhost:3123/api/short-video/cm9ekme790000hysi5h4odlt1/status'
```

```bash
{
    "status": "ready"
}
```

### GET `/api/short-video/{id}`

```bash
curl --location 'localhost:3123/api/short-video/cm9ekme790000hysi5h4odlt1'
```

回應：影片的二進位資料。

### GET `/api/short-videos`

```bash
curl --location 'localhost:3123/api/short-videos'
```

```bash
{
    "videos": [
        {
            "id": "cma9wcwfc0000brsi60ur4lib",
            "status": "processing"
        }
    ]
}
```

### DELETE `/api/short-video/{id}`

```bash
curl --location --request DELETE 'localhost:3123/api/short-video/cma9wcwfc0000brsi60ur4lib'
```

```bash
{
    "success": true
}
```

### GET `/api/voices`

```bash
curl --location 'localhost:3123/api/voices'
```

```bash
[
    "af_heart",
    "af_alloy",
    "af_aoede",
    "af_bella",
    "af_jessica",
    "af_kore",
    "af_nicole",
    "af_nova",
    "af_river",
    "af_sarah",
    "af_sky",
    "am_adam",
    "am_echo",
    "am_eric",
    "am_fenrir",
    "am_liam",
    "am_michael",
    "am_onyx",
    "am_puck",
    "am_santa",
    "bf_emma",
    "bf_isabella",
    "bm_george",
    "bm_lewis",
    "bf_alice",
    "bf_lily",
    "bm_daniel",
    "bm_fable"
]
```

### GET `/api/music-tags`

```bash
curl --location 'localhost:3123/api/music-tags'
```

```bash
[
    "sad",
    "melancholic",
    "happy",
    "euphoric/high",
    "excited",
    "chill",
    "uneasy",
    "angry",
    "dark",
    "hopeful",
    "contemplative",
    "funny/quirky"
]
```

### GET `/api/preview`

返回指定搜尋詞的圖像或影片列表。

**查詢參數：**

- `term` (字串，必填)：搜尋詞。
- `media_type` ('image' | 'video'，必填)：要預覽的媒體類型。

```bash
cURL localhost:3123/api/preview?term=nature&media_type=image
```

# 故障排除

## Docker

伺服器至少需要 3GB 可用記憶體。請確保為 Docker 分配足夠的記憶體。

如果您在 Windows 上透過 wsl2 運行伺服器，則需要從 [wsl utility 2](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#configure-global-options-with-wslconfig) 設定資源限制 - 否則從 Docker Desktop 設定。（Ubuntu 不會限制資源，除非在運行命令中指定）。

## NPM

確保所有必要的套件都已安裝。

# n8n

設定 MCP (或 REST) 伺服器取決於您如何運行 n8n 和伺服器。請遵循以下矩陣中的範例。

|                                          | n8n 在本地運行，使用 `n8n start`               | n8n 在本地運行，使用 Docker                                                                                                                                         | n8n 在雲端運行                                 |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `short-video-maker` 在本地 Docker 中運行 | `http://localhost:3123`                        | 這取決於情況。您可以使用 `http://host.docker.internal:3123`，因為它指向主機，但您可以配置使用相同的網路並使用服務名稱進行通信，例如 `http://short-video-maker:3123` | 無法工作 - 將 `short-video-maker` 部署到雲端   |
| `short-video-maker` 使用 npm/npx 運行    | `http://localhost:3123`                        | `http://host.docker.internal:3123`                                                                                                                                  | 無法工作 - 將 `short-video-maker` 部署到雲端   |
| `short-video-maker` 在雲端運行           | 您應該使用您的 IP 位址 `http://{YOUR_IP}:3123` | 您應該使用您的 IP 位址 `http://{YOUR_IP}:3123`                                                                                                                      | 您應該使用您的 IP 位址 `http://{YOUR_IP}:3123` |

# 雲端部署

雖然每個 VPS 提供商都不同，並且不可能為所有提供商提供配置，但這裡有一些提示。

- 使用 Ubuntu ≥ 22.04
- 擁有 ≥ 4GB 記憶體、≥ 2 個虛擬 CPU 和 ≥ 5GB 儲存空間
- 使用 [pm2](https://pm2.keymetrics.io/) 運行/管理伺服器
- 將環境變數放入 `.bashrc` 文件 (或類似文件)

# 常見問題

## 我可以使用其他語言嗎？ (法語、德語等)

不幸的是，目前還不行。Kokoro-js 只支援英文。

## 我可以傳入圖像和影片並將它們拼接在一起嗎？

是的，您現在可以使用圖像作為影片的來源。

## 我應該使用 `npm` 還是 `docker` 運行專案？

Docker 是運行此專案的推薦方式。

## 影片生成使用了多少 GPU？

老實說，不多 - 只有 whisper.cpp 可以加速。

Remotion 是 CPU 密集型的，而 [Kokoro-js](https://github.com/hexgrad/kokoro) 在 CPU 上運行。

## 有沒有我可以使用的 UI 來生成影片？

是的，有一個網頁使用者介面可在 http://localhost:3123 獲取。

## 我可以選擇 Pexels 以外的影片來源，或提供自己的影片嗎？

不行

## 該專案可以從圖像生成影片嗎？

是的。

# 影片生成依賴項

| 依賴項                                                 | 版本     | 許可證                                                                           | 用途               |
| ------------------------------------------------------ | -------- | -------------------------------------------------------------------------------- | ------------------ |
| [Remotion](https://remotion.dev/)                      | ^4.0.286 | [Remotion 許可證](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) | 影片合成和渲染     |
| [Whisper CPP](https://github.com/ggml-org/whisper.cpp) | v1.5.5   | MIT                                                                              | 語音轉文字用於字幕 |
| [FFmpeg](https://ffmpeg.org/)                          | ^2.1.3   | LGPL/GPL                                                                         | 音訊/影片操作      |
| [Kokoro.js](https://www.npmjs.com/package/kokoro-js)   | ^1.2.0   | MIT                                                                              | 文字轉語音生成     |
| [Pexels API](https://www.pexels.com/api/)              | N/A      | [Pexels 條款](https://www.pexels.com/license/)                                   | 背景影片           |

## 如何貢獻？

歡迎提交 PR。
請參閱 [CONTRIBUTING.md](CONTRIBUTING.md) 文件以獲取設定本地開發環境的說明。

## 許可證

本專案根據 [MIT 許可證](LICENSE) 授權。

## 致謝

- ❤️ [Remotion](https://remotion.dev/) 用於程式化影片生成
- ❤️ [Whisper](https://github.com/ggml-org/whisper.cpp) 用於語音轉文字
- ❤️ [Pexels](https://www.pexels.com/) 用於影片內容
- ❤️ [FFmpeg](https://ffmpeg.org/) 用於音訊/影片處理
- ❤️ [Kokoro](https://github.com/hexgrad/kokoro) 用於 TTS
