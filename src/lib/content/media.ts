import type { ImageAsset, ImageFocusPoint } from "./types";

const legacyImage = (id: string, filename: string): ImageAsset => ({
  id,
  src: `/images/legacy/${filename}`,
  width: 968,
  height: 345,
});

const restoredImage = (
  id: string,
  filename: string,
  width: number,
  height: number,
  desktop: ImageFocusPoint = { x: 50, y: 50 },
  mobile: ImageFocusPoint = desktop,
): ImageAsset => ({
  id,
  src: `/images/restored/${filename}`,
  width,
  height,
  focus: { desktop, mobile },
});

/**
 * Restored photographs lead the public pages. A few original 968 x 345
 * collages remain as secondary gallery fallbacks until larger originals arrive.
 */
export const media = {
  home: {
    room: restoredImage(
      "home-room",
      "v1/room-green-shutters--v1.webp",
      2100,
      749,
    ),
    garden: restoredImage(
      "home-garden",
      "v1/garden-triptych--v1.webp",
      2100,
      749,
      { x: 80, y: 50 },
      { x: 84, y: 50 },
    ),
    panorama: restoredImage(
      "home-panorama",
      "v1/home-panorama--v1.webp",
      2101,
      748,
      { x: 50, y: 50 },
      { x: 22, y: 50 },
    ),
    view: restoredImage(
      "home-view",
      "v1/sea-view-vase--v1.webp",
      2100,
      749,
      { x: 58, y: 50 },
      { x: 76, y: 50 },
    ),
  },
  rooms: [
    restoredImage(
      "rooms-balcony",
      "v1/room-purple-bed--v1.webp",
      2100,
      749,
      { x: 58, y: 50 },
      { x: 60, y: 50 },
    ),
    restoredImage("rooms-interior", "room-iron-bed-restored.jpg", 1280, 1380),
    legacyImage("rooms-garden", "giardino-vista-mare-positano.jpg"),
    legacyImage("rooms-view", "romms-with-seaview-positano.jpg"),
  ],
  pool: [
    restoredImage(
      "pool-terrace",
      "v1/pool-pair--v1.webp",
      2100,
      749,
      { x: 25, y: 50 },
      { x: 25, y: 50 },
    ),
    restoredImage("pool-waterfall", "pool-waterfall-restored.jpg", 1928, 1380),
  ],
  privateBeach: [
    restoredImage(
      "beach-sea",
      "v1/beach-clear-water--v1.webp",
      2101,
      748,
      { x: 54, y: 50 },
      { x: 58, y: 50 },
    ),
    restoredImage(
      "beach-private",
      "private-beach-cove-restored.jpg",
      3872,
      1380,
      { x: 51, y: 50 },
      { x: 60, y: 50 },
    ),
  ],
  gardenTable: [
    restoredImage(
      "garden-produce",
      "v1/garden-table--v1.webp",
      2098,
      750,
      { x: 50, y: 50 },
      { x: 18, y: 50 },
    ),
    restoredImage(
      "garden-harvest",
      "v1/garden-triptych--v1.webp",
      2100,
      749,
      { x: 50, y: 50 },
      { x: 82, y: 50 },
    ),
    restoredImage(
      "garden-potatoes",
      "garden-potato-harvest-restored.jpg",
      1280,
      1380,
    ),
    legacyImage("garden-figs", "prodotti-tipici-fichi.jpg"),
  ],
  location: restoredImage(
    "location-view",
    "v1/sea-view-vase--v1.webp",
    2100,
    749,
    { x: 58, y: 50 },
    { x: 76, y: 50 },
  ),
  availability: restoredImage(
    "availability-room",
    "v1/room-purple-bed--v1.webp",
    2100,
    749,
    { x: 58, y: 50 },
    { x: 60, y: 50 },
  ),
} as const;
