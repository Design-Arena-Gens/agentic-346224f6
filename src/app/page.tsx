'use client';

import { FormEvent, useMemo, useState } from "react";
import { CredentialChecklist } from "@/components/CredentialChecklist";
import { StatusBanner } from "@/components/StatusBanner";
import { TagInput } from "@/components/TagInput";

type UploadState = "idle" | "submitting" | "success" | "error";

const defaultTags = ["Shorts", "YouTubeShorts", "VerticalVideo"];

export default function Page() {
  const [tags, setTags] = useState(defaultTags);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);

  const helperText = useMemo(() => {
    if (!videoDuration) return "Drop a vertical MP4 under 60 seconds.";
    return `Detected duration: ${videoDuration}`;
  }, [videoDuration]);

  const handleVideoSelection = async (file: File | null) => {
    if (!file) {
      setVideoDuration(null);
      return;
    }
    try {
      const duration = await fileDuration(file);
      setVideoDuration(duration ? `~${duration.toFixed(0)}s` : null);
    } catch {
      setVideoDuration(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fieldset = form.querySelector("fieldset");
    const videoFile = (form.elements.namedItem("video") as HTMLInputElement | null)?.files?.[0];

    if (!videoFile) {
      setState("error");
      setMessage("Select an .mp4 or .mov file before publishing.");
      return;
    }

    setState("submitting");
    setMessage("Launching upload session with YouTube...");
    fieldset?.setAttribute("disabled", "true");

    try {
      const formData = new FormData(form);
      tags.forEach((tag) => formData.append("tags[]", tag));
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed");
      }

      setState("success");
      setMessage(`Upload complete! Watch at https://youtube.com/shorts/${payload.videoId}`);
      form.reset();
      setTags(defaultTags);
      setVideoDuration(null);
    } catch (error) {
      console.error(error);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      fieldset?.removeAttribute("disabled");
    }
  };

  return (
    <div className="card">
      <header>
        <h1 className="title">ShortWave Launchpad</h1>
        <p className="subtitle">
          Ingest your edited vertical clips, auto-enrich metadata, and push straight to your YouTube
          Shorts shelf.
        </p>
      </header>

      <StatusBanner
        message={message}
        variant={state === "error" ? "error" : state === "success" ? "success" : "info"}
      />

      <form onSubmit={handleSubmit}>
        <fieldset className="form-grid">
          <div className="two-col">
            <section className="panel">
              <span className="panel-title">Video Payload</span>
              <div className="form-row">
                <label className="form-label" htmlFor="video">
                  Shorts file
                </label>
                <input
                  type="file"
                  name="video"
                  id="video"
                  accept="video/mp4,video/quicktime"
                  className="form-control"
                  onChange={(event) => handleVideoSelection(event.target.files?.[0] ?? null)}
                  required
                />
                <p className="form-helper">{helperText}</p>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  id="title"
                  placeholder="Hook your audience in 50 characters"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="form-textarea form-control"
                  name="description"
                  id="description"
                  rows={5}
                  placeholder="Add context, CTA links, and hashtags."
                  maxLength={5000}
                />
              </div>

              <TagInput
                label="Tags"
                helper="Use 3-7 targeted keywords. #Shorts is appended automatically by YouTube."
                name="tags"
                tags={tags}
                onChange={setTags}
              />
            </section>

            <section className="panel">
              <span className="panel-title">Publishing Options</span>

              <div className="form-row">
                <label className="form-label" htmlFor="privacyStatus">
                  Privacy
                </label>
                <select name="privacyStatus" id="privacyStatus" className="form-select" defaultValue="public">
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="categoryId">
                  Category
                </label>
                <select name="categoryId" id="categoryId" className="form-select" defaultValue="22">
                  <option value="1">Film &amp; Animation</option>
                  <option value="2">Autos &amp; Vehicles</option>
                  <option value="10">Music</option>
                  <option value="15">Pets &amp; Animals</option>
                  <option value="17">Sports</option>
                  <option value="19">Travel &amp; Events</option>
                  <option value="20">Gaming</option>
                  <option value="22">People &amp; Blogs</option>
                  <option value="23">Comedy</option>
                  <option value="24">Entertainment</option>
                  <option value="25">News &amp; Politics</option>
                  <option value="26">Howto &amp; Style</option>
                  <option value="27">Education</option>
                  <option value="28">Science &amp; Technology</option>
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="madeForKids">
                  Audience
                </label>
                <select name="madeForKids" id="madeForKids" className="form-select" defaultValue="false">
                  <option value="false">Not made for kids</option>
                  <option value="true">Made for kids</option>
                </select>
                <p className="form-helper">
                  Required by YouTube&apos;s audience setting policy. Shorts can be flagged if misclassified.
                </p>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="notifySubscribers">
                  Notify subscribers
                </label>
                <select name="notifySubscribers" id="notifySubscribers" className="form-select" defaultValue="true">
                  <option value="true">Yes, send notification</option>
                  <option value="false">No, suppress notification</option>
                </select>
              </div>

              <CredentialChecklist />
            </section>
          </div>

          <button type="submit" className="pill-button" disabled={state === "submitting"}>
            {state === "submitting" ? "Uploading…" : "Deploy to YouTube Shorts"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}

async function fileDuration(file: File) {
  return new Promise<number | null>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = (error) => {
      reject(error);
    };
    video.src = URL.createObjectURL(file);
  });
}
