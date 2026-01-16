// utils/episodeUtils.ts
export function determineEpisodeStatus(
  publishDate?: string,
  publishTime?: string
) {
  let status: "draft" | "scheduled" | "published" = "draft";
  let isPublic = false;

  if (publishDate) {
    const publishDateTime = new Date(
      `${publishDate}T${publishTime || "00:00"}`
    );
    const now = new Date();

    if (publishDateTime <= now) {
      status = "published";
      isPublic = true;
    } else {
      status = "scheduled";
      isPublic = false;
    }
  }

  return { status, isPublic };
}
