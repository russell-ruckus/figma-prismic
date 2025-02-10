import uiHtml from "../ui/index.html";

// Show your UI (which is inlined in the HTML file)
figma.showUI(uiHtml, { width: 400, height: 300 });

// -------------------------
// Interfaces for slices
// -------------------------

// For text slices
interface RichTextSpan {
  start: number;
  end: number;
  type: string; // e.g., "strong", "em"
}

interface RichTextBlock {
  type: string; // "paragraph" or "list-item", etc.
  text: string;
  spans: RichTextSpan[];
  direction: string;
}

interface PrismicContent {
  id: string;
  title: string;
  bodyBlocks: RichTextBlock[];
}

// For image slices
interface PrismicImageContent {
  id: string;
  imageUrl: string;
  alt: string;
  dimensions: {
    width: number;
    height: number;
  };
  caption: any[]; // Typically an array of rich text blocks for the caption
}

// -------------------------
// Helpers for text slices
// -------------------------

// Helper: Dynamically load fonts for a TextNode.
async function loadFontsForTextNode(textNode: TextNode) {
  if (textNode.fontName === figma.mixed) {
    const uniqueFonts = new Set<string>();
    for (let i = 0; i < textNode.characters.length; i++) {
      const font = textNode.getRangeFontName(i, i + 1) as FontName;
      const fontKey = `${font.family}-${font.style}`;
      if (!uniqueFonts.has(fontKey)) {
        uniqueFonts.add(fontKey);
        await figma.loadFontAsync(font);
      }
    }
  } else {
    await figma.loadFontAsync(textNode.fontName as FontName);
  }
}

// Helper: Recursively find all text nodes.
async function findTextNodes(node: BaseNode): Promise<TextNode[]> {
  let nodes: TextNode[] = [];
  if (node.type === "TEXT") {
    nodes.push(node);
  }
  if ("children" in node) {
    for (const child of node.children) {
      nodes = nodes.concat(await findTextNodes(child));
    }
  }
  return nodes;
}

// Helper: Apply rich text formatting on a text node.
async function applyRichTextFormatting(textNode: TextNode, blocks: RichTextBlock[]) {
  let fullText = "";
  const blockOffsets: number[] = [];
  for (const block of blocks) {
    const prefix = block.type === "list-item" ? "* " : "";
    blockOffsets.push(fullText.length);
    fullText += prefix + block.text + "\n";
  }
  if (fullText.endsWith("\n")) {
    fullText = fullText.slice(0, -1);
  }
  textNode.characters = fullText;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const offset = blockOffsets[i];
    for (const span of block.spans) {
      const startIndex = offset + span.start;
      const endIndex = offset + span.end;
      const baseFont = textNode.getRangeFontName(0, 1) as FontName;
      let newFont: FontName;
      if (span.type === "strong") {
        newFont = { family: baseFont.family, style: "Bold" };
      } else if (span.type === "em") {
        newFont = { family: baseFont.family, style: "Regular Italic" };
      } else {
        newFont = baseFont;
      }
      await figma.loadFontAsync(newFont);
      textNode.setRangeFontName(startIndex, endIndex, newFont);
    }
  }
}

// Use the parsed content to import a text component, populate its text nodes,
// and add it into the given container.
async function populateComponentWithContent(
  content: PrismicContent,
  container: BaseNode & ChildrenMixin
) {
  const component = await figma.importComponentByKeyAsync("66df81fc54c5bf5b9000b90147afce6e6f392981");
  const instance = component.createInstance();

  const textNodes = await findTextNodes(instance);
  console.log("Found text nodes:");
  textNodes.forEach((node, index) => console.log(`Text node ${index} name: ${node.name}`));

  for (const textNode of textNodes) {
    await loadFontsForTextNode(textNode);
    if (textNode.name.toLowerCase().includes("title")) {
      textNode.characters = content.title;
    } else if (textNode.name.toLowerCase().includes("body")) {
      await applyRichTextFormatting(textNode, content.bodyBlocks);
    }
  }

  container.appendChild(instance);
}

// -------------------------
// Helpers for image slices
// -------------------------

// Update this with your actual image component key from your Figma library.
const YOUR_IMAGE_COMPONENT_KEY = "948afc9ce5d8d5c678237c8c17371a06e8f01aac";

async function populateImageWithCaptionContent(
  content: PrismicImageContent,
  container: BaseNode & ChildrenMixin
) {
  const component = await figma.importComponentByKeyAsync(YOUR_IMAGE_COMPONENT_KEY);
  const instance = component.createInstance();

  const imageNode = instance.findOne((node) =>
    node.type === "RECTANGLE" && node.name.toLowerCase().includes("image")
  ) as RectangleNode | null;

  if (imageNode) {
    const imageResponse = await fetch(content.imageUrl);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageHash = figma.createImage(new Uint8Array(imageArrayBuffer)).hash;
    imageNode.fills = [
      {
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash,
      },
    ];
  }

  const captionNode = instance.findOne((node) =>
    node.type === "TEXT" && node.name.toLowerCase().includes("caption")
  ) as TextNode | null;
  if (captionNode) {
    let captionText = "";
    if (content.caption && content.caption.length > 0) {
      captionText = content.caption.map((c: any) => c.text).join("\n");
    }
    captionNode.characters = captionText;
  }

  container.appendChild(instance);
}

// -------------------------
// Handling Messages and Parsing Prismic Content
// -------------------------

figma.ui.onmessage = async (msg) => {
  if (msg.type === "fetch-content") {
    try {
      const response = await fetch("https://prismic-proxy.vercel.app/api/proxy", {
        method: "GET",
        headers: {
          Origin: "null",
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // -------------------------
      // Create the Layout Container
      // -------------------------
      const layoutComponentKey = "6fc0de69e55c300c3aefc296121ae6b9859af04f";
      const layoutComponent = await figma.importComponentByKeyAsync(layoutComponentKey);
      // Create and detach the instance so that it becomes a FrameNode.
      const layoutInstance = layoutComponent.createInstance().detachInstance();
      figma.currentPage.appendChild(layoutInstance);

      // -------------------------
      // Combine Slices in Order
      // -------------------------
      type SliceUnion = {
        slice_type: "text";
        content: PrismicContent;
      } | {
        slice_type: "image_with_caption";
        content: PrismicImageContent;
      };

      const allSlices: SliceUnion[] = [];
      data.results.forEach((result: any) => {
        const titleBlock = result.data.title && result.data.title[0];
        const title = titleBlock ? titleBlock.text : "Untitled";

        // Iterate over each slice in the body, preserving order.
        result.data.body.forEach((slice: any) => {
          if (slice.slice_type === "text") {
            if (slice.primary.text) {
              allSlices.push({
                slice_type: "text",
                content: {
                  id: slice.id,
                  title,
                  bodyBlocks: slice.primary.text,
                },
              });
            }
          } else if (slice.slice_type === "image_with_caption") {
            if (slice.primary.image) {
              allSlices.push({
                slice_type: "image_with_caption",
                content: {
                  id: slice.id,
                  imageUrl: slice.primary.image.url,
                  alt: slice.primary.image.alt,
                  dimensions: slice.primary.image.dimensions,
                  caption: slice.primary.caption,
                },
              });
            }
          }
        });
      });

      // Process all slices in the order they were provided.
      for (const slice of allSlices) {
        if (slice.slice_type === "text") {
          await populateComponentWithContent(slice.content, layoutInstance);
        } else if (slice.slice_type === "image_with_caption") {
          await populateImageWithCaptionContent(slice.content, layoutInstance);
        }
      }

      figma.currentPage.selection = [layoutInstance];
      figma.viewport.scrollAndZoomIntoView([layoutInstance]);

      figma.ui.postMessage({
        type: "contentPopulated",
        data: { slices: allSlices },
      });
    } catch (error) {
      console.error("Error processing content:", error);
      figma.ui.postMessage({ type: "error", message: "Failed to populate content" });
    }
  }
};