import leftHtml from "../design/left.html?raw";

/** Pixel-matched left sidebar from feed.html (`display:contents` keeps Bootstrap cols direct). */
export function LeftSidebar() {
  return (
    <div className="_design_slot" dangerouslySetInnerHTML={{ __html: leftHtml }} />
  );
}
