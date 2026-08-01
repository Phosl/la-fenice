import type { CSSProperties } from "react";

import type { ImageAsset, ImageFocusPoint } from "./types";

type ImageFocusStyle = CSSProperties & {
  "--image-focus-desktop": string;
  "--image-focus-mobile": string;
};

const DEFAULT_FOCUS: ImageFocusPoint = { x: 50, y: 50 };

const asPosition = ({ x, y }: ImageFocusPoint) => `${x}% ${y}%`;

export function getImageFocusStyle(image: ImageAsset): ImageFocusStyle {
  const desktop = image.focus?.desktop ?? DEFAULT_FOCUS;
  const mobile = image.focus?.mobile ?? desktop;

  return {
    "--image-focus-desktop": asPosition(desktop),
    "--image-focus-mobile": asPosition(mobile),
  };
}
