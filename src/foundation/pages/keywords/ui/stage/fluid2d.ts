import {
  Color,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { IUniform, Texture } from "three";
import type { DemoContext } from "./types";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** 近傍の 4 点も読む計算用の共通部分。 */
const neighbors = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 uTexel;
  vec2 L() { return vUv - vec2(uTexel.x, 0.0); }
  vec2 R() { return vUv + vec2(uTexel.x, 0.0); }
  vec2 B() { return vUv - vec2(0.0, uTexel.y); }
  vec2 T() { return vUv + vec2(0.0, uTexel.y); }
`;

const shaders = {
  // 半ラグランジュ移流：速度を逆向きにたどった場所の値を持ってくる
  advect: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 uTexel;
    uniform float uDt;
    uniform float uDissipation;
    void main() {
      vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
      gl_FragColor = texture2D(uSource, coord) / (1.0 + uDissipation * uDt);
    }
  `,
  // 発散：その場所から流れ出す量（壁では反対向きの速度で打ち消す）
  divergence: /* glsl */ `
    ${neighbors}
    uniform sampler2D uVelocity;
    void main() {
      vec2 c = texture2D(uVelocity, vUv).xy;
      float l = texture2D(uVelocity, L()).x;
      float r = texture2D(uVelocity, R()).x;
      float b = texture2D(uVelocity, B()).y;
      float t = texture2D(uVelocity, T()).y;
      if (L().x < 0.0) l = -c.x;
      if (R().x > 1.0) r = -c.x;
      if (B().y < 0.0) b = -c.y;
      if (T().y > 1.0) t = -c.y;
      gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
    }
  `,
  curl: /* glsl */ `
    ${neighbors}
    uniform sampler2D uVelocity;
    void main() {
      float l = texture2D(uVelocity, L()).y;
      float r = texture2D(uVelocity, R()).y;
      float b = texture2D(uVelocity, B()).x;
      float t = texture2D(uVelocity, T()).x;
      gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
    }
  `,
  // 渦度閉じ込め：渦の強い所へ向かう向きと直角に、回転を強める力を足す
  vorticity: /* glsl */ `
    ${neighbors}
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float uStrength;
    uniform float uDt;
    void main() {
      float l = texture2D(uCurl, L()).x;
      float r = texture2D(uCurl, R()).x;
      float b = texture2D(uCurl, B()).x;
      float t = texture2D(uCurl, T()).x;
      float c = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
      force /= length(force) + 0.0001;
      force *= uStrength * c;
      force.y *= -1.0;
      vec2 velocity = texture2D(uVelocity, vUv).xy + force * uDt;
      gl_FragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
    }
  `,
  // 圧力のポアソン方程式をヤコビ法で 1 回解く
  pressure: /* glsl */ `
    ${neighbors}
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    void main() {
      float l = texture2D(uPressure, L()).x;
      float r = texture2D(uPressure, R()).x;
      float b = texture2D(uPressure, B()).x;
      float t = texture2D(uPressure, T()).x;
      float divergence = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((l + r + b + t - divergence) * 0.25, 0.0, 0.0, 1.0);
    }
  `,
  // 圧力の勾配を引いて、発散のない速度にする（圧力投影）
  gradient: /* glsl */ `
    ${neighbors}
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    void main() {
      float l = texture2D(uPressure, L()).x;
      float r = texture2D(uPressure, R()).x;
      float b = texture2D(uPressure, B()).x;
      float t = texture2D(uPressure, T()).x;
      vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(r - l, t - b);
      gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
  `,
  scale: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uSource;
    uniform float uValue;
    void main() { gl_FragColor = texture2D(uSource, vUv) * uValue; }
  `,
  // 円形に値を足す（煙を出す、かき混ぜる）
  splat: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uSource;
    uniform vec2 uPoint;
    uniform vec3 uValue;
    uniform float uRadius;
    uniform float uAspect;
    void main() {
      vec2 p = vUv - uPoint;
      p.x *= uAspect;
      vec3 splat = exp(-dot(p, p) / uRadius) * uValue;
      gl_FragColor = vec4(texture2D(uSource, vUv).xyz + splat, 1.0);
    }
  `,
} as const;

type PassName = keyof typeof shaders;

function doubleTarget(width: number, height: number, linear: boolean) {
  const make = () =>
    new WebGLRenderTarget(width, height, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: linear ? LinearFilter : NearestFilter,
      magFilter: linear ? LinearFilter : NearestFilter,
      depthBuffer: false,
    });
  let read = make();
  let write = make();
  return {
    get read() {
      return read;
    },
    get write() {
      return write;
    },
    swap() {
      [read, write] = [write, read];
    },
    dispose() {
      read.dispose();
      write.dispose();
    },
  };
}

/** 1 枚だけのレンダーターゲット（発散・渦度用）。 */
const single = (size: Vector2) =>
  new WebGLRenderTarget(size.x, size.y, {
    type: HalfFloatType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
  });

export type FluidOptions = {
  /** 速度・圧力の格子の横幅（縦は aspect から決める）。 */
  simWidth?: number;
  /** 煙（染料）の格子の横幅。 */
  dyeWidth?: number;
  aspect?: number;
};

export type FluidStepOptions = {
  dt: number;
  pressureIterations: number;
  vorticity: number;
  velocityDissipation: number;
  dyeDissipation: number;
  /** false にすると圧力投影を飛ばす（発散した流れになる）。 */
  project?: boolean;
};

/**
 * GPU で動く 2 次元の格子流体（安定流体法）。
 * 移流 → 外力 → 渦度閉じ込め → 圧力投影 の順に、テクスチャを往復させて更新する。
 */
export function gpuFluid(context: DemoContext, options: FluidOptions = {}) {
  const { renderer } = context;
  const aspect = options.aspect ?? 1;
  const simWidth = options.simWidth ?? 192;
  const dyeWidth = options.dyeWidth ?? 512;
  const simSize = new Vector2(simWidth, Math.round(simWidth / aspect));
  const dyeSize = new Vector2(dyeWidth, Math.round(dyeWidth / aspect));
  const velocity = doubleTarget(simSize.x, simSize.y, true);
  const dye = doubleTarget(dyeSize.x, dyeSize.y, true);
  const pressure = doubleTarget(simSize.x, simSize.y, false);
  const divergence = single(simSize);
  const curl = single(simSize);
  context.track(velocity);
  context.track(dye);
  context.track(pressure);
  context.track(divergence);
  context.track(curl);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new Mesh(context.track(new PlaneGeometry(2, 2)));
  quad.frustumCulled = false;
  scene.add(quad);
  const makeMaterial = (name: PassName) =>
    context.track(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: shaders[name],
        uniforms: {},
        depthTest: false,
        depthWrite: false,
      })
    );
  const materials: Record<PassName, ShaderMaterial> = {
    advect: makeMaterial("advect"),
    divergence: makeMaterial("divergence"),
    curl: makeMaterial("curl"),
    vorticity: makeMaterial("vorticity"),
    pressure: makeMaterial("pressure"),
    gradient: makeMaterial("gradient"),
    scale: makeMaterial("scale"),
    splat: makeMaterial("splat"),
  };

  const run = (
    name: PassName,
    uniforms: Record<string, unknown>,
    target: WebGLRenderTarget
  ) => {
    const material = materials[name];
    for (const [key, value] of Object.entries(uniforms)) {
      const uniform: IUniform | undefined = material.uniforms[key];
      if (uniform) {
        uniform.value = value;
      } else {
        material.uniforms[key] = { value };
      }
    }
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  };

  const simTexel = new Vector2(1 / simSize.x, 1 / simSize.y);
  const dyeTexel = new Vector2(1 / dyeSize.x, 1 / dyeSize.y);
  const point = new Vector2();
  const value = new Color();

  const withTarget = (body: () => void) => {
    const previous = renderer.getRenderTarget();
    const { autoClear } = renderer;
    renderer.autoClear = false;
    body();
    renderer.autoClear = autoClear;
    renderer.setRenderTarget(previous);
  };

  const splat = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: Color,
    radius = 0.0025
  ) => {
    withTarget(() => {
      point.set(x, y);
      run(
        "splat",
        {
          uSource: velocity.read.texture,
          uPoint: point,
          uValue: value.setRGB(dx, dy, 0),
          uRadius: radius,
          uAspect: aspect,
        },
        velocity.write
      );
      velocity.swap();
      run(
        "splat",
        {
          uSource: dye.read.texture,
          uPoint: point,
          uValue: color,
          uRadius: radius,
          uAspect: aspect,
        },
        dye.write
      );
      dye.swap();
    });
  };

  const step = (settings: FluidStepOptions) => {
    const { dt } = settings;
    withTarget(() => {
      // 1. 渦度閉じ込め（計算で弱まった渦を補う）
      if (settings.vorticity > 0) {
        run(
          "curl",
          { uVelocity: velocity.read.texture, uTexel: simTexel },
          curl
        );
        run(
          "vorticity",
          {
            uVelocity: velocity.read.texture,
            uCurl: curl.texture,
            uStrength: settings.vorticity,
            uDt: dt,
            uTexel: simTexel,
          },
          velocity.write
        );
        velocity.swap();
      }
      // 2. 圧力投影（流れが湧き出したり吸い込まれたりしないよう速度を直す）
      if (settings.project ?? true) {
        run(
          "divergence",
          { uVelocity: velocity.read.texture, uTexel: simTexel },
          divergence
        );
        run(
          "scale",
          { uSource: pressure.read.texture, uValue: 0.8 },
          pressure.write
        );
        pressure.swap();
        for (let i = 0; i < settings.pressureIterations; i++) {
          run(
            "pressure",
            {
              uPressure: pressure.read.texture,
              uDivergence: divergence.texture,
              uTexel: simTexel,
            },
            pressure.write
          );
          pressure.swap();
        }
        run(
          "gradient",
          {
            uPressure: pressure.read.texture,
            uVelocity: velocity.read.texture,
            uTexel: simTexel,
          },
          velocity.write
        );
        velocity.swap();
      }
      // 3. 移流（速度自身と煙を、流れに沿って運ぶ）
      run(
        "advect",
        {
          uVelocity: velocity.read.texture,
          uSource: velocity.read.texture,
          uTexel: simTexel,
          uDt: dt,
          uDissipation: settings.velocityDissipation,
        },
        velocity.write
      );
      velocity.swap();
      run(
        "advect",
        {
          uVelocity: velocity.read.texture,
          uSource: dye.read.texture,
          uTexel: simTexel,
          uDt: dt,
          uDissipation: settings.dyeDissipation,
        },
        dye.write
      );
      dye.swap();
    });
  };

  const clear = () => {
    withTarget(() => {
      for (const target of [velocity, dye, pressure]) {
        run("scale", { uSource: target.read.texture, uValue: 0 }, target.write);
        target.swap();
      }
    });
  };

  /** 表示用の現在のテクスチャ。 */
  const textures = {
    get dye(): Texture {
      return dye.read.texture;
    },
    get velocity(): Texture {
      return velocity.read.texture;
    },
    get pressure(): Texture {
      return pressure.read.texture;
    },
    get divergence(): Texture {
      return divergence.texture;
    },
    get curl(): Texture {
      return curl.texture;
    },
  };

  return {
    splat,
    step,
    clear,
    textures,
    simSize,
    dyeSize,
    dyeTexel,
    computeCurl: () =>
      withTarget(() =>
        run(
          "curl",
          { uVelocity: velocity.read.texture, uTexel: simTexel },
          curl
        )
      ),
  };
}

/** 煙のテクスチャを色付けして板に表示するシェーダー。 */
export const fluidDisplayFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uDye;
  uniform sampler2D uVelocity;
  uniform sampler2D uPressure;
  uniform sampler2D uCurl;
  uniform float uMode;
  vec3 diverging(float v) {
    return v > 0.0 ? mix(vec3(0.06, 0.07, 0.1), vec3(1.0, 0.45, 0.35), clamp(v, 0.0, 1.0)) : mix(vec3(0.06, 0.07, 0.1), vec3(0.3, 0.6, 1.0), clamp(-v, 0.0, 1.0));
  }
  void main() {
    vec3 color;
    if (uMode < 0.5) {
      vec3 dye = texture2D(uDye, vUv).rgb;
      color = dye + vec3(0.02, 0.025, 0.035);
      color = color / (1.0 + max(max(color.r, color.g), color.b) * 0.15);
    } else if (uMode < 1.5) {
      vec2 v = texture2D(uVelocity, vUv).xy;
      float speed = length(v);
      float angle = atan(v.y, v.x);
      color = (0.5 + 0.5 * cos(angle + vec3(0.0, 2.1, 4.2))) * clamp(speed * 0.004, 0.0, 1.0);
    } else if (uMode < 2.5) {
      color = diverging(texture2D(uPressure, vUv).x * 0.004);
    } else {
      color = diverging(texture2D(uCurl, vUv).x * 0.01);
    }
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
