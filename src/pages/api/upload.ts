import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import { google } from "googleapis";
import fs from "fs/promises";
import { createReadStream } from "fs";
import os from "os";
import path from "path";

type UploadResponse = {
  videoId: string;
};

type ErrorResponse = {
  error: string;
};

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "256mb"
  }
};

const REQUIRED_ENV_VARS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "YOUTUBE_REFRESH_TOKEN"
] as const;

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

function coerceField(value: undefined | string | string[]): string {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
}

function coerceBoolean(value: undefined | string | string[]): boolean {
  return coerceField(value) === "true";
}

function extractTags(fields: formidable.Fields): string[] {
  const raw = fields["tags[]"] ?? fields.tags;
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => (Array.isArray(entry) ? entry : [entry])).map((tag) => `${tag}`.trim()).filter(Boolean);
  }
  return [`${raw}`.trim()].filter(Boolean);
}

async function parseForm(req: NextApiRequest) {
  const uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "shortwave-"));
  const form = formidable({
    uploadDir,
    multiples: false,
    keepExtensions: true,
    maxFileSize: 256 * 1024 * 1024
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ fields, files });
    });
  });
}

async function uploadToYouTube(videoFile: File, fields: formidable.Fields) {
  validateEnv();

  const title = coerceField(fields.title) || "Untitled Shorts Upload";
  const description = coerceField(fields.description);
  const privacyStatus = coerceField(fields.privacyStatus) || "public";
  const categoryId = coerceField(fields.categoryId) || "22";
  const madeForKids = coerceBoolean(fields.madeForKids);
  const notifySubscribers = coerceBoolean(fields.notifySubscribers);
  const tags = extractTags(fields);

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  auth.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
  });

  const youtube = google.youtube({
    version: "v3",
    auth
  });

  const mediaStream = createReadStream(videoFile.filepath);

  const response = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: madeForKids
        }
      },
      media: {
        body: mediaStream
      },
      notifySubscribers
    },
    {
      onUploadProgress: (event) => {
        const progress = event.bytesRead / videoFile.size;
        if (progress >= 1) {
          console.log("Video upload completed");
        }
      }
    }
  );

  return response.data.id;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let videoFile: File | null = null;
  let tempDirectory: string | null = null;

  try {
    const { fields, files } = await parseForm(req);
    const uploaded = files.video;
    if (!uploaded) {
      throw new Error("No video file provided.");
    }

    videoFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    tempDirectory = path.dirname(videoFile.filepath);

    if (!videoFile.originalFilename) {
      throw new Error("Invalid upload: missing filename metadata.");
    }

    const videoId = await uploadToYouTube(videoFile, fields);

    res.status(200).json({ videoId: videoId ?? "unknown" });
  } catch (error) {
    console.error("Upload failed", error);
    const message =
      error instanceof Error ? error.message : "Unexpected error during upload.";
    res.status(500).json({ error: message });
  } finally {
    try {
      if (videoFile) {
        await fs.unlink(videoFile.filepath);
      }
    } catch (error) {
      console.warn("Failed to cleanup temp video file", error);
    }

    if (tempDirectory) {
      try {
        await fs.rm(tempDirectory, { recursive: true, force: true });
      } catch {
        // Ignore errors while cleaning up temp artifacts.
      }
    }
  }
}
