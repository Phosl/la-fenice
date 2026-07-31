import type { ImageAsset } from "./types";

const legacyImage = (id: string, filename: string): ImageAsset => ({
  id,
  src: `/images/legacy/${filename}`,
  width: 968,
  height: 345,
});

/**
 * Existing 968 x 345 photographs, retained only as launch fallbacks until the
 * owner supplies high-resolution originals.
 */
export const media = {
  home: {
    room: legacyImage("home-room", "stanza-da-letto-positano.jpg"),
    garden: legacyImage("home-garden", "our-garden-positano.jpg"),
    panorama: legacyImage("home-panorama", "panorama-positano.jpg"),
    view: legacyImage("home-view", "amazing-view-positano.jpg"),
  },
  rooms: [
    legacyImage("rooms-balcony", "affitto-camera-positano.jpg"),
    legacyImage("rooms-interior", "b-and-b-in-positano.jpg"),
    legacyImage("rooms-garden", "giardino-vista-mare-positano.jpg"),
    legacyImage("rooms-view", "romms-with-seaview-positano.jpg"),
  ],
  pool: [
    legacyImage("pool-terrace", "apartment-with-pool-positano.jpg"),
    legacyImage("pool-waterfall", "piscina-positano.jpg"),
  ],
  privateBeach: [
    legacyImage("beach-sea", "private-beach-positano.jpg"),
    legacyImage("beach-private", "spiaggia-privata-positano.jpg"),
  ],
  gardenTable: [
    legacyImage("garden-produce", "prodotti-tipici-positano.jpg"),
    legacyImage("garden-harvest", "typical-product-positano.jpg"),
    legacyImage("garden-olives", "typical-product.jpg"),
    legacyImage("garden-figs", "prodotti-tipici-fichi.jpg"),
  ],
  location: legacyImage("location-map-view", "dove-siamo.jpg"),
  availability: legacyImage("availability-room", "richiesta.jpg"),
} as const;
