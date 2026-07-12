import storiesHtml from "../design/stories.html?raw";

/** Pixel-matched stories strip from feed.html */
export function StoriesStrip() {
  return (
    <div className="_design_slot" dangerouslySetInnerHTML={{ __html: storiesHtml }} />
  );
}
