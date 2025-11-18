'use client';

const checklist = [
  "Create a Google Cloud project with the YouTube Data API v3 enabled.",
  "Configure an OAuth client with type Web Application to obtain the client ID and secret.",
  "Add https://developers.google.com/oauthplayground as an authorized redirect URI to use the OAuth playground.",
  "Exchange authorization code for refresh token using the YouTube upload scope.",
  "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and YOUTUBE_REFRESH_TOKEN as environment variables."
];

export function CredentialChecklist() {
  return (
    <div className="panel">
      <span className="panel-title">Credential Checklist</span>
      <div className="checklist">
        {checklist.map((step) => (
          <span key={step} className="checklist-item">
            <span aria-hidden="true">•</span>
            <span>{step}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
