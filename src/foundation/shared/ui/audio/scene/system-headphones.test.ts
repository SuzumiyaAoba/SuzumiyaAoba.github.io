import { Group, Object3D } from "three";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { createClearMgPro } from "./clear-mg-pro";
import { createHd800s } from "./hd-800s";
import { createIe600 } from "./ie-600";
import { createSystemHeadphones } from "./system-headphones";

vi.mock(import("./hd-800s"), () => ({
  createHd800s: vi.fn<typeof createHd800s>(),
}));
vi.mock(import("./clear-mg-pro"), () => ({
  createClearMgPro: vi.fn<typeof createClearMgPro>(),
}));
vi.mock(import("./ie-600"), () => ({
  createIe600: vi.fn<typeof createIe600>(),
}));

let headphones: ReturnType<typeof createSystemHeadphones> | undefined;
const disposals: (() => void)[] = [];

function model(name: string) {
  const group = new Group();
  group.position.y = 20;
  for (const side of ["Left", "Right"]) {
    const exit = new Object3D();
    exit.name = `${name} ${side} cable exit`;
    exit.position.x = side === "Left" ? -30 : 30;
    group.add(exit);
    if (name === "Clear Mg Professional") {
      exit.name = `Clear Mg Professional ${side.toLowerCase()} ear cup`;
      const socket = new Object3D();
      socket.name = "Recessed detachable 3.5 mm cable socket";
      exit.add(socket);
    }
  }
  const dispose = vi.fn<() => void>();
  disposals.push(dispose);
  return {
    group,
    dispose,
    updateDetail() {
      return false;
    },
  };
}

beforeEach(() => {
  disposals.length = 0;
  // oxlint-disable vitest/prefer-mock-return-shorthand -- 遅延生成を検証するため、呼び出し時にモデルを作る。
  vi.mocked(createHd800s)
    .mockReset()
    .mockImplementation(() => model("HD 800 S"));
  vi.mocked(createClearMgPro)
    .mockReset()
    .mockImplementation(() => model("Clear Mg Professional"));
  vi.mocked(createIe600)
    .mockReset()
    .mockImplementation(() => model("IE 600"));
  // oxlint-enable vitest/prefer-mock-return-shorthand
});

afterEach(() => {
  headphones?.dispose();
  headphones = undefined;
});

it("初期選択だけを生成し、切り替えたモデルと配線を再利用する", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  expect(createHd800s).toHaveBeenCalledTimes(1);
  expect(createClearMgPro).not.toHaveBeenCalled();
  expect(createIe600).not.toHaveBeenCalled();
  const [initial] = headphones.group.children;
  expect(initial?.children[0]?.position.toArray()).toStrictEqual([390, 44, 25]);

  await headphones.setHeadphones("clear-mg-pro");
  const [, selected] = headphones.group.children;
  expect(createClearMgPro).toHaveBeenCalledTimes(1);
  expect(initial?.visible).toBe(false);
  expect(selected?.visible).toBe(true);
  expect(selected?.children).toHaveLength(2);

  await headphones.setHeadphones("hd-800s");
  await headphones.setHeadphones("clear-mg-pro");
  expect(headphones.group.children).toHaveLength(2);
  expect(createHd800s).toHaveBeenCalledTimes(1);
  expect(createClearMgPro).toHaveBeenCalledTimes(1);
  expect(selected?.visible).toBe(true);
});

it("IE 600 は単体ケーブルを作らず、UD-505 のバランス出力へ接続する", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  await headphones.setHeadphones("ie-600");
  expect(createIe600).toHaveBeenCalledWith({ standaloneCable: false });
  const [, assembly] = headphones.group.children;
  const plug = assembly?.getObjectByName(
    "IE 600 4.4 mm balanced cable plug in UD-505 metal collar"
  );
  expect(plug?.position.toArray()).toStrictEqual([25.5, 30.8, 120.4]);
  expect(assembly?.children[0]?.position.toArray()).toStrictEqual([
    390, 32, 25,
  ]);
});

it("生成したモデルだけを一度ずつ解放し、破棄後にはモデルを作らない", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  await headphones.setHeadphones("ie-600");
  headphones.dispose();
  headphones.dispose();
  await headphones.setHeadphones("clear-mg-pro");
  expect(disposals).toHaveLength(2);
  expect(disposals[0]).toHaveBeenCalledTimes(1);
  expect(disposals[1]).toHaveBeenCalledTimes(1);
  expect(createClearMgPro).not.toHaveBeenCalled();
  expect(headphones.group.children).toHaveLength(0);
});

it("切り替え先の生成に失敗しても現在のモデルを表示し続ける", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  vi.mocked(createClearMgPro).mockImplementationOnce(() => {
    throw new Error("Model creation failed");
  });
  await expect(headphones.setHeadphones("clear-mg-pro")).rejects.toThrow(
    "Model creation failed"
  );
  expect(headphones.group.children).toHaveLength(1);
  expect(headphones.group.children[0]?.visible).toBe(true);
});

it("読み込み中に初期選択へ戻った場合は、遅れて届くモデルを生成しない", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  const pending = headphones.setHeadphones("clear-mg-pro");
  await headphones.setHeadphones("hd-800s");
  await pending;
  expect(createClearMgPro).not.toHaveBeenCalled();
  expect(headphones.group.children).toHaveLength(1);
});

it("読み込み中に破棄した場合は、遅れて届くモデルを生成しない", async () => {
  headphones = createSystemHeadphones(new Group(), new Group());
  const pending = headphones.setHeadphones("ie-600");
  headphones.dispose();
  await pending;
  expect(createIe600).not.toHaveBeenCalled();
  expect(headphones.group.children).toHaveLength(0);
});
