import { PMREMGenerator } from "three";
import type { WebGLRenderer } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createViewerEnvironment(renderer: WebGLRenderer) {
  const room = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  try {
    return pmrem.fromScene(room, 0.04);
  } finally {
    pmrem.dispose();
    room.dispose();
  }
}
