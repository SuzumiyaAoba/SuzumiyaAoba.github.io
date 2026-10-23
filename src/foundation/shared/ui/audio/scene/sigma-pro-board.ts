import { MeshStandardMaterial, Path } from "three";
import { SIGMA_WINDOW, sigmaOutline, sigmaPlate } from "./sigma-pro-geometry";
import type { SigmaParts } from "./sigma-pro-parts";
import {
  SIGMA_BOARD,
  createSigmaBoardParts,
  sigmaBoardPoint,
} from "./sigma-pro-board-parts";
import type { SigmaBoardParts } from "./sigma-pro-board-parts";

const viaPositions: readonly (readonly [number, number])[] = [
  [194, 205],
  [315, 205],
  [222, 262],
  [288, 262],
  [154, 362],
  [171, 364],
  [259, 364],
  [277, 364],
  [359, 364],
  [375, 364],
  [446, 364],
  [462, 364],
  [553, 364],
  [570, 364],
  [645, 364],
  [661, 364],
  [104, 805],
  [122, 805],
  [140, 805],
  [104, 824],
  [122, 824],
  [140, 824],
  [85, 1068],
  [102, 1068],
  [85, 1085],
  [102, 1085],
  [294, 1038],
  [309, 1038],
  [397, 1038],
  [412, 1038],
  [491, 1038],
  [506, 1038],
  [594, 1038],
  [609, 1038],
  [659, 1324],
  [676, 1324],
  [693, 1324],
  [710, 1324],
  [726, 1324],
  [744, 1324],
  [760, 1324],
  [807, 1211],
  [822, 1211],
  [943, 1211],
  [957, 1211],
  [807, 1270],
  [822, 1270],
  [943, 1270],
  [957, 1270],
];

function substrate(parts: SigmaParts) {
  const shape = sigmaOutline(SIGMA_BOARD.width, SIGMA_BOARD.depth, 1.2);
  for (const [px, py] of viaPositions) {
    const [x, z] = sigmaBoardPoint(px, py);
    const hole = new Path();
    hole.absarc(x, -(z - SIGMA_WINDOW.z), 0.12, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const board = parts.mesh(
    sigmaPlate(
      shape,
      SIGMA_BOARD.thickness - SIGMA_BOARD.bevel * 2,
      SIGMA_BOARD.bevel
    ),
    parts.boardSurface,
    [0, SIGMA_BOARD.top - SIGMA_BOARD.thickness / 2, SIGMA_WINDOW.z],
    "Black solder-mask PCB with drilled through vias"
  );
  board.rotation.x = -Math.PI / 2;
  board.userData["castShadow"] = false;
}

function transistor(
  board: SigmaBoardParts,
  parts: SigmaParts,
  x: number,
  y: number,
  side: number
) {
  board.outline(x, y, 53, 95);
  board.box(
    x + side * 27,
    y,
    26,
    42,
    0.15,
    parts.solder,
    "Transistor exposed heat-transfer pad"
  );
  board.box(
    x,
    y,
    43,
    82,
    1.05,
    parts.packageSurface,
    "Discrete amplifier power transistor",
    0.13
  );
  board.box(
    x + side * 25,
    y,
    18,
    39,
    0.13,
    parts.solder,
    "Formed transistor heat tab",
    0.25
  );
  for (const offset of [-26, 0, 26]) {
    board.box(
      x - side * 29,
      y + offset,
      21,
      8,
      0.13,
      parts.solder,
      "Transistor lead solder fillet"
    );
    board.box(
      x - side * 24,
      y + offset,
      15,
      6,
      0.16,
      parts.solder,
      "Three formed transistor contact feet",
      0.12
    );
    board.box(
      x - side * 20,
      y + offset,
      4,
      6,
      0.43,
      parts.solder,
      "Transistor bent contact shoulders",
      0.2
    );
  }
}

function passiveCluster(board: SigmaBoardParts, x: number, y: number) {
  board.outline(x, y, 65, 36);
  for (const offset of [-21, 0, 21]) {
    board.passive(x + offset, y, 11, 23, offset === 0);
  }
}

/** The four amplifier stages follow the measured left/right and upper/lower placement. */
function amplifier(
  board: SigmaBoardParts,
  parts: SigmaParts,
  x: number,
  y: number,
  side: number
) {
  const outputX = side < 0 ? 215 : 680;
  const lowerOffset = y === 600 ? 75 : 66;
  transistor(board, parts, outputX, y - 70, side);
  transistor(board, parts, outputX, y + lowerOffset, side);
  board.chip(x, y, 45, 47, 5, "Current-mode amplifier control IC");
  for (const dx of [-66, 66]) {
    for (const dy of [-98, 98]) {
      passiveCluster(board, x + dx * 0.4, y + dy);
    }
  }
  for (const dx of [-64, 43]) {
    for (const dy of [-56, 42]) {
      board.passive(x + dx, y + dy, 10, 21, dx > 0);
      board.passive(x + dx + 17, y + dy, 10, 21);
    }
  }
  for (const dy of [-60, -33, 33, 60]) {
    board.passive(x - side * 44, y + dy, 20, 10, dy < 0);
  }
  board.chip(
    x - side * 43,
    y - 57,
    15,
    19,
    2,
    "Small-signal amplifier transistor",
    "sot23"
  );
  board.chip(
    x - side * 43,
    y + 53,
    15,
    19,
    2,
    "Small-signal amplifier transistor",
    "sot23"
  );
  for (const dy of [-13, 14]) {
    board.passive(outputX, y + dy, 31, 14, true);
  }
  board.trace([
    [outputX, y - 115],
    [outputX - side * 24, y - 115],
    [outputX - side * 39, y - 100],
    [outputX - side * 39, y - 71],
  ]);
  board.trace([
    [outputX, y + lowerOffset + 49],
    [outputX - side * 33, y + lowerOffset + 49],
    [outputX - side * 44, y + lowerOffset + 60],
    [outputX - side * 44, y + lowerOffset + 98],
  ]);
  for (const offset of [-1, 1]) {
    board.trace([
      [x + offset * 14, y - 27],
      [x + offset * 14, y - 46],
      [x + offset * 27, y - 59],
      [x + offset * 27, y - 80],
    ]);
    board.trace([
      [x + offset * 14, y + 27],
      [x + offset * 14, y + 52],
      [x + offset * 26, y + 64],
      [x + offset * 26, y + 85],
    ]);
  }
}

function inputAndPower(board: SigmaBoardParts, parts: SigmaParts) {
  for (const x of [192, 306, 412, 501, 603, 738]) {
    board.chip(
      x - 25,
      386,
      31,
      30,
      3,
      "Input and amplifier bias transistor",
      "sot23"
    );
    board.passive(x, 386, 17, 24, true);
    board.passive(x, 423, 30, 14, true);
    board.passive(x - 34, 423, 13, 11);
  }
  for (const [x, y, w, d] of [
    [801, 370, 32, 45],
    [892, 410, 31, 48],
    [799, 487, 38, 32],
    [938, 989, 34, 32],
    [803, 1003, 32, 37],
    [816, 1144, 35, 27],
    [109, 857, 25, 31],
    [100, 949, 32, 31],
    [116, 1018, 23, 29],
    [210, 1214, 25, 31],
    [672, 1189, 30, 36],
  ] as const) {
    board.chip(x, y, w, d, 3, "Power regulation and switching package", "dual");
  }
  for (const [x, y, w, d] of [
    [667, 237, 14, 24],
    [695, 235, 14, 24],
    [722, 236, 12, 24],
    [649, 267, 20, 13],
    [683, 272, 17, 23],
    [723, 278, 17, 24],
    [771, 277, 15, 18],
    [822, 271, 16, 20],
    [852, 270, 17, 20],
    [884, 270, 21, 15],
    [919, 273, 18, 23],
    [948, 273, 16, 22],
    [805, 336, 16, 20],
    [791, 389, 17, 24],
    [811, 425, 16, 18],
    [845, 410, 26, 18],
    [926, 435, 16, 22],
    [955, 432, 15, 23],
    [926, 465, 16, 20],
    [955, 465, 16, 20],
    [1004, 481, 12, 25],
    [800, 523, 15, 15],
    [834, 530, 17, 20],
    [858, 530, 16, 20],
    [884, 531, 17, 20],
    [872, 563, 15, 18],
    [898, 563, 16, 18],
    [927, 563, 16, 18],
    [955, 562, 14, 18],
    [1002, 580, 12, 23],
    [1002, 610, 12, 23],
    [1002, 638, 12, 23],
    [1002, 665, 12, 23],
    [792, 595, 17, 18],
    [799, 629, 19, 16],
    [846, 603, 13, 24],
    [846, 632, 13, 24],
    [846, 661, 13, 24],
    [883, 712, 16, 19],
    [911, 712, 17, 19],
    [940, 712, 17, 19],
    [961, 756, 19, 15],
    [984, 710, 14, 21],
    [909, 880, 15, 19],
    [936, 879, 15, 20],
    [935, 915, 16, 20],
    [810, 970, 30, 12],
    [826, 1039, 16, 18],
    [815, 1091, 16, 18],
    [815, 1124, 20, 13],
    [941, 1041, 16, 19],
    [941, 1070, 16, 19],
    [963, 1112, 15, 19],
    [962, 1144, 16, 19],
    [875, 1150, 20, 12],
    [905, 1150, 20, 12],
    [969, 1215, 16, 19],
    [969, 1245, 16, 19],
    [969, 1274, 16, 19],
    [801, 1182, 16, 18],
    [900, 1194, 13, 20],
    [840, 1244, 13, 21],
    [924, 1265, 15, 18],
    [69, 943, 12, 23],
    [138, 946, 12, 20],
    [81, 1013, 12, 22],
    [80, 1039, 23, 13],
    [129, 1016, 13, 25],
    [166, 1025, 16, 14],
    [74, 1080, 14, 20],
    [107, 1084, 14, 20],
    [137, 1083, 14, 20],
    [164, 1085, 14, 21],
    [211, 1097, 15, 21],
    [245, 1183, 14, 21],
    [276, 1145, 11, 22],
    [296, 1152, 12, 22],
    [288, 1178, 16, 20],
    [289, 1205, 14, 20],
    [174, 1171, 15, 20],
    [173, 1200, 14, 20],
    [173, 1228, 16, 20],
    [474, 1176, 12, 22],
    [474, 1203, 12, 22],
    [474, 1232, 12, 22],
    [399, 1143, 12, 18],
    [589, 1150, 12, 19],
    [596, 1273, 14, 20],
    [596, 1300, 14, 20],
    [667, 1160, 16, 13],
    [717, 1183, 16, 14],
    [717, 1207, 16, 14],
    [717, 1231, 16, 14],
    [309, 1257, 19, 16],
    [357, 1265, 15, 18],
    [382, 1298, 14, 20],
    [188, 1273, 16, 20],
    [247, 1250, 15, 18],
  ] as const) {
    board.passive(x, y, w, d, (x + y) % 3 === 0);
  }
  for (const x of [60, 66, 72]) {
    board.trace([
      [x, 251],
      [x, 298],
      [x + 6, 304],
      [x + 6, 335],
    ]);
  }
  for (const offset of [0, 5, 10, 15]) {
    board.trace([
      [178, 289 + offset],
      [101 + offset, 366],
      [101 + offset, 453 - offset],
      [91 + offset, 464 - offset],
    ]);
    board.trace([
      [800 + offset, 450],
      [800 + offset, 394],
      [922 + offset, 277],
      [964, 277],
    ]);
    board.trace([
      [29 + offset, 1162],
      [44 + offset, 1147],
      [44 + offset, 1093],
      [77 + offset, 1060],
    ]);
  }
  // Crystal cans have a metal lid, bevelled shoulders and a ceramic base.
  for (const [x, y, width] of [
    [955, 519, 27],
    [989, 519, 27],
    [974, 751, 34],
    [875, 1238, 68],
  ] as const) {
    board.box(
      x,
      y,
      width + 5,
      39,
      0.15,
      parts.packageSurface,
      "Crystal oscillator ceramic base"
    );
    board.box(
      x,
      y,
      width,
      34,
      0.7,
      parts.machined,
      "Bevelled quartz crystal can",
      0.15
    );
    board.box(
      x,
      y,
      width - 4,
      30,
      0.04,
      parts.solder,
      "Stamped oscillator lid",
      0.85
    );
    board.text("24.000", x, y, width > 40 ? 0.38 : 0.22, 0.91);
  }
}

function converters(board: SigmaBoardParts) {
  for (const x of [349, 543]) {
    board.chip(x, 1047, 46, 45, 5, "Converter analogue support IC");
    for (const dx of [-53, 56]) {
      for (const dy of [-9, 17, 48]) {
        board.passive(x + dx, 1047 + dy, 15, 18, dy === 17);
      }
    }
    board.passive(x, 1018, 23, 11);
    board.passive(x, 1078, 23, 11, true);
    board.chip(
      x,
      1200,
      68,
      69,
      12,
      "ESS ES9069Q DAC with individually formed leads"
    );
    board.text("ESS", x, 1186, 0.6);
    board.text("ES9069Q", x, 1203, 0.34);
    for (let pin = 0; pin < 6; pin += 1) {
      const offset = pin * 5;
      board.trace([
        [x - 30 + offset, 1240],
        [x - 30 + offset, 1270 + offset],
        [x - 54 + offset, 1294 + offset],
        [x - 54 + offset, 1325],
      ]);
      board.trace([
        [x - 15 + offset, 1160],
        [x - 15 + offset, 1138 - offset],
        [x - 35 + offset, 1118 - offset],
        [x - 35 + offset, 1101],
      ]);
    }
  }
  board.chip(921, 630, 94, 93, 16, "XMOS USB audio interface QFP package");
  board.text("XMOS", 921, 630, 1.3, 0.87, -Math.PI / 2);
  board.text("XU316", 947, 630, 0.34, 0.87, -Math.PI / 2);
  board.chip(842, 730, 78, 42, 8, "Digital interface support IC", "dual");
  board.text("DIGITAL", 842, 726, 0.35);
  board.chip(884, 895, 49, 45, 8, "Clock and logic package");
  board.chip(
    880,
    1068,
    76,
    73,
    12,
    "Cirrus Logic digital input sample-rate converter"
  );
  board.text("CIRRUS", 880, 1058, 0.67);
  board.text("8422N", 880, 1075, 0.46);
  for (const offset of [0, 5, 10, 15, 20, 25]) {
    board.trace([
      [846 + offset, 922],
      [846 + offset, 940],
      [890 + offset, 984],
      [890 + offset, 1027],
    ]);
    board.trace([
      [837 + offset, 1110],
      [791 + offset, 1156],
      [752 + offset, 1156],
      [710 + offset, 1198],
      [710 + offset, 1258],
      [641 + offset, 1327],
    ]);
  }
  for (const x of [743, 750, 757]) {
    board.trace(
      [
        [x, 452],
        [x, 1172],
        [x - 35, 1207],
        [x - 35, 1240],
      ],
      2.2
    );
  }
}

function currentModeMark(board: SigmaBoardParts, parts: SigmaParts) {
  board.text("Current Mode", 83, 563, 1.9, 0.04, Math.PI / 2, parts.silkscreen);
  board.text(
    "Amplification",
    110,
    563,
    1.9,
    0.04,
    Math.PI / 2,
    parts.silkscreen
  );
  board.trace(
    [
      [68, 669],
      [55, 691],
      [80, 740],
      [121, 740],
      [146, 691],
      [134, 669],
    ],
    12,
    parts.silkscreen,
    0.028
  );
  board.trace(
    [
      [100, 723],
      [100, 680],
    ],
    5,
    parts.silkscreen,
    0.028
  );
  board.trace(
    [
      [91, 689],
      [100, 678],
      [109, 689],
    ],
    5,
    parts.silkscreen,
    0.028
  );
}

function glassFrit(board: SigmaBoardParts) {
  const pitch = 14;
  for (let row = 0; row < 110; row += 1) {
    const y = row * pitch + 4;
    for (let column = 0; column < 74; column += 1) {
      const x = column * pitch + ((row % 2) * pitch) / 2 + 4;
      if (x > 1019 || y > 1531) {
        continue;
      }
      const sideFade = Math.max(0, 1 - Math.min(x, 1024 - x) / 95);
      const topFade = Math.max(0, 1 - y / 375);
      const bottomFade = Math.max(0, 1 - (1536 - y) / 370);
      const fade = Math.max(sideFade, topFade, bottomFade);
      if (fade > 0.08) {
        board.glassDot(x, y, 0.68 * Math.sqrt(fade));
      }
    }
  }
}

function operatingIndicators(board: SigmaBoardParts, parts: SigmaParts) {
  const light = new MeshStandardMaterial({
    color: 0xe6_39_0c,
    emissive: 0xff_36_08,
    emissiveIntensity: 1.6,
    roughness: 0.24,
    toneMapped: false,
  });
  for (const x of [215, 680]) {
    for (const y of [600, 873]) {
      for (const side of [-1, 1]) {
        board.box(
          x + side * 9,
          y,
          5,
          12,
          0.12,
          parts.solder,
          "Indicator LED solder pad"
        );
      }
      board.box(
        x,
        y,
        14,
        11,
        0.2,
        parts.ceramic,
        "Ceramic carrier of the amplifier indicator",
        0.12
      );
      board.box(
        x,
        y,
        8,
        8,
        0.28,
        light,
        "Red current-mode amplifier operating indicator",
        0.3
      );
    }
  }
}

export function createSigmaBoard(parts: SigmaParts) {
  substrate(parts);
  const board = createSigmaBoardParts(parts);
  for (const [x, y] of viaPositions) {
    board.via(x, y);
  }
  inputAndPower(board, parts);
  for (const y of [600, 873]) {
    amplifier(board, parts, 383, y, -1);
    amplifier(board, parts, 510, y, 1);
  }
  converters(board);
  currentModeMark(board, parts);
  operatingIndicators(board, parts);
  glassFrit(board);
  board.finish();
}
