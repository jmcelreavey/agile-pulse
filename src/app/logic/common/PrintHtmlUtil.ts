const BLOCKED_TAGS = ["script", "iframe", "object", "embed", "link", "meta", "base", "form"];

/** Remove anything executable from a generated document before it is printed. */
export function sanitiseHtmlDocument(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(BLOCKED_TAGS.join(",")).forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || ((name === "href" || name === "src") && value.startsWith("javascript:"))) {
        element.removeAttribute(attribute.name);
      }
    }
  });
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}

/**
 * Open the browser's print dialog for a generated document, where "Save as PDF" produces the file.
 * Runs in a hidden iframe so there are no pop-up blockers and no server-side PDF renderer.
 */
export function printHtmlDocument(html: string, title: string) {
  const frame = document.createElement("iframe");
  frame.title = title;
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.setAttribute("aria-hidden", "true");
  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument;
  if (!frameWindow || !frameDocument) {
    frame.remove();
    throw new Error("Printing is not available in this browser");
  }

  frameDocument.open();
  frameDocument.write(sanitiseHtmlDocument(html));
  frameDocument.close();
  frameDocument.title = title;

  const cleanUp = () => setTimeout(() => frame.remove(), 1000);
  frameWindow.addEventListener("afterprint", cleanUp, { once: true });
  setTimeout(() => {
    frameWindow.focus();
    frameWindow.print();
  }, 50);
}
