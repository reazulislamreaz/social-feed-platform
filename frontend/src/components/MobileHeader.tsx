import mobileHtml from "../design/mobile_header.html?raw";

/** Mobile header / bottom nav from feed.html */
export function MobileHeader() {
  return (
    <div className="_design_slot" dangerouslySetInnerHTML={{ __html: mobileHtml }} />
  );
}
