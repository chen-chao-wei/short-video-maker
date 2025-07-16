/* eslint-disable @remotion/deterministic-randomness */
import { getOrientationConfig } from "../../components/utils";
import { logger } from "../../logger";
import { OrientationEnum, type Video } from "../../types/shorts";

const jokerTerms: string[] = ["nature", "globe", "space", "ocean"];
const durationBufferSeconds = 3;
const defaultTimeoutMs = 5000;
const retryTimes = 3;

export class PexelsAPI {
  constructor(private API_KEY: string) {}

  private async _findVideo(
    searchTerm: string,
    minDurationSeconds: number,
    excludeIds: string[],
    orientation: OrientationEnum,
    timeout: number,
  ): Promise<Video> {
    if (!this.API_KEY) {
      throw new Error("API key not set");
    }
    logger.debug(
      { searchTerm, minDurationSeconds, orientation },
      "Searching for video in Pexels API",
    );
    const headers = new Headers();
    headers.append("Authorization", this.API_KEY);
    const response = await fetch(
      `https://api.pexels.com/videos/search?orientation=${orientation}&size=medium&per_page=80&query=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(timeout),
      },
    )
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error(
              "Invalid Pexels API key - please make sure you get a valid key from https://www.pexels.com/api and set it in the environment variable PEXELS_API_KEY",
            );
          }
          throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .catch((error: unknown) => {
        logger.error(error, "Error fetching videos from Pexels API");
        throw error;
      });
    const videos = response.videos as {
      id: string;
      duration: number;
      video_files: {
        fps: number;
        quality: string;
        width: number;
        height: number;
        id: string;
        link: string;
      }[];
    }[];

    const { width: requiredVideoWidth, height: requiredVideoHeight } =
      getOrientationConfig(orientation);

    if (!videos || videos.length === 0) {
      logger.error(
        { searchTerm, orientation },
        "No videos found in Pexels API",
      );
      throw new Error("No videos found");
    }

    // find all the videos that fits the criteria, then select one randomly
    const filteredVideos = videos
      .map((video) => {
        if (excludeIds.includes(video.id)) {
          return;
        }
        if (!video.video_files.length) {
          return;
        }

        // calculate the real duration of the video by converting the FPS to 25
        const fps = video.video_files[0].fps;
        const duration =
          fps < 25 ? video.duration * (fps / 25) : video.duration;

        if (duration >= minDurationSeconds + durationBufferSeconds) {
          for (const file of video.video_files) {
            if (
              file.quality === "hd" &&
              file.width === requiredVideoWidth &&
              file.height === requiredVideoHeight
            ) {
              return {
                id: video.id,
                url: file.link,
                width: file.width,
                height: file.height,
              };
            }
          }
        }
      })
      .filter(Boolean);
    if (!filteredVideos.length) {
      logger.error({ searchTerm }, "No videos found in Pexels API");
      throw new Error("No videos found");
    }

    const video = filteredVideos[
      Math.floor(Math.random() * filteredVideos.length)
    ] as Video;

    logger.debug(
      { searchTerm, video: video, minDurationSeconds, orientation },
      "Found video from Pexels API",
    );

    return video;
  }

  async findVideo(
    searchTerms: string[],
    minDurationSeconds: number,
    excludeIds: string[] = [],
    orientation: OrientationEnum = OrientationEnum.portrait,
    timeout: number = defaultTimeoutMs,
    retryCounter: number = 0,
  ): Promise<Video> {
    // shuffle the search terms to randomize the search order
    const shuffledJokerTerms = jokerTerms.sort(() => Math.random() - 0.5);
    const shuffledSearchTerms = searchTerms.sort(() => Math.random() - 0.5);

    for (const searchTerm of [...shuffledSearchTerms, ...shuffledJokerTerms]) {
      try {
        return await this._findVideo(
          searchTerm,
          minDurationSeconds,
          excludeIds,
          orientation,
          timeout,
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error instanceof DOMException &&
          error.name === "TimeoutError"
        ) {
          if (retryCounter < retryTimes) {
            logger.warn(
              { searchTerm, retryCounter },
              "Timeout error, retrying...",
            );
            return await this.findVideo(
              searchTerms,
              minDurationSeconds,
              excludeIds,
              orientation,
              timeout,
              retryCounter + 1,
            );
          }
          logger.error(
            { searchTerm, retryCounter },
            "Timeout error, retry limit reached",
          );
          throw error;
        }

        logger.error(error, "Error finding video in Pexels API for term");
      }
    }
    logger.error(
      { searchTerms },
      "No videos found in Pexels API for the given terms",
    );
    throw new Error("No videos found in Pexels API");
  }

  async findVideosForPreview(
    searchTerm: string,
    count: number = 10,
  ): Promise<{ id: string; image: string; url: string }[]> {
    if (!this.API_KEY) {
      throw new Error("API key not set");
    }
    logger.debug({ searchTerm, count }, "Searching for videos for preview");
    const headers = new Headers();
    headers.append("Authorization", this.API_KEY);
    const response = await fetch(
      `https://api.pexels.com/videos/search?per_page=${count}&query=${encodeURIComponent(
        searchTerm,
      )}`,
      {
        method: "GET",
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(defaultTimeoutMs),
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Invalid Pexels API key");
      }
      throw new Error(
        `Pexels API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (!data.videos || data.videos.length === 0) {
      return [];
    }

    return data.videos.map(
      (video: {
        id: string;
        image: string;
        video_files: { link: string; quality: string }[];
      }) => ({
        id: video.id,
        image: video.image, // The video thumbnail
        url:
          video.video_files.find((f) => f.quality === "hd")?.link ??
          video.video_files[0]?.link,
      }),
    );
  }

  private async _findImages(
    searchTerm: string,
    orientation: OrientationEnum,
  ): Promise<{ url: string; width: number; height: number; id: string }[]> {
    if (!this.API_KEY) {
      throw new Error("API key not set");
    }

    const { width: requiredWidth, height: requiredHeight } =
      getOrientationConfig(orientation);

    logger.debug(
      { searchTerm, orientation, requiredWidth, requiredHeight },
      "Searching for images in Pexels API",
    );

    const headers = new Headers();
    headers.append("Authorization", this.API_KEY);
    const query = encodeURIComponent(searchTerm);

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=80&orientation=${orientation}`,
      {
        method: "GET",
        headers,
      },
    );
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Invalid Pexels API key - please make sure you get a valid key from https://www.pexels.com/api and set it in the environment variable PEXELS_API_KEY",
        );
      }
      throw new Error(
        `Pexels API error: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    if (
      !data.photos ||
      !Array.isArray(data.photos) ||
      data.photos.length === 0
    ) {
      throw new Error(`No images found for term: ${searchTerm}`);
    }

    const filtered = data.photos
      .filter(
        (photo: any) =>
          photo.width === requiredWidth && photo.height === requiredHeight,
      )
      .map((photo: any) => ({
        url: photo.src.original,
        width: photo.width,
        height: photo.height,
        id: photo.id.toString(),
      }));
    if (filtered.length === 0) {
      throw new Error(
        `No images with matching resolution found for term: ${searchTerm}`,
      );
    }

    return filtered;
  }

  /**
   * 依關鍵字搜尋 Pexels 圖片，回傳圖片連結陣列
   * @param searchTerms 關鍵字陣列
   * @param count 最多回傳幾張
   * @param orientation 圖片方向 (portrait or landscape)
   */
  async findImages(
    searchTerms: string[],
    count: number = 5,
    orientation: OrientationEnum = OrientationEnum.portrait,
  ): Promise<{ url: string; width: number; height: number; id: string }[]> {
    const shuffledJokerTerms = jokerTerms.sort(() => Math.random() - 0.5);
    const shuffledSearchTerms = searchTerms
      .filter((s) => s)
      .sort(() => Math.random() - 0.5);

    for (const searchTerm of [...shuffledSearchTerms, ...shuffledJokerTerms]) {
      try {
        const images = await this._findImages(searchTerm, orientation);
        // shuffle the result before slicing
        const shuffledImages = images.sort(() => Math.random() - 0.5);
        return shuffledImages.slice(0, count);
      } catch (error: unknown) {
        logger.warn(
          error instanceof Error ? error.message : String(error),
          `Could not find images for term: ${searchTerm}`,
        );
      }
    }

    logger.error(
      { searchTerms },
      "No images found in Pexels API for the given terms",
    );
    throw new Error("No images found in Pexels API for any search term");
  }
}
