import rightHtml from "../design/right.html?raw";

/** Pixel-matched right sidebar from feed.html */
export function RightSidebar() {
  return (
    <div className="_design_slot" dangerouslySetInnerHTML={{ __html: rightHtml }} />
  );
}
