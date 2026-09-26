/**
 * デモ間で共有する GLSL 関数群。
 * simplex noise は Ashima Arts / Stefan Gustavson の実装（MIT）を元にしている。
 */

export const glslHash = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}
`;

/** snoise(vec3) : -1〜1 の 3D simplex noise。 */
export const glslSimplex = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm3(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += snoise(p) * amp;
    p = p * 2.03 + vec3(17.1, 3.7, 9.2);
    amp *= 0.5;
  }
  return sum;
}
`;

/**
 * perlin2(p) : 2D 勾配（パーリン）ノイズ、おおよそ -0.7〜0.7。
 * perlin2p(p, period) : 格子座標を period で折り返した周期版。
 */
export const glslPerlin = /* glsl */ `
vec2 perlinGradient(vec2 cell) {
  float angle = 6.2831853 * hash12(cell + 0.5);
  return vec2(cos(angle), sin(angle));
}
vec2 perlinFade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float perlin2p(vec2 p, vec2 period) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 i00 = mod(i, period);
  vec2 i10 = mod(i + vec2(1.0, 0.0), period);
  vec2 i01 = mod(i + vec2(0.0, 1.0), period);
  vec2 i11 = mod(i + vec2(1.0, 1.0), period);
  float n00 = dot(perlinGradient(i00), f);
  float n10 = dot(perlinGradient(i10), f - vec2(1.0, 0.0));
  float n01 = dot(perlinGradient(i01), f - vec2(0.0, 1.0));
  float n11 = dot(perlinGradient(i11), f - vec2(1.0, 1.0));
  vec2 u = perlinFade(f);
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}
float perlin2(vec2 p) { return perlin2p(p, vec2(289.0)); }
float perlinFbm(vec2 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 10; i++) {
    if (i >= octaves) break;
    sum += perlin2(p) * amp;
    p = p * lacunarity + vec2(19.3, 7.1);
    amp *= gain;
  }
  return sum;
}
`;

/** value2(p) : 格子点の乱数値を補間する 2D 値ノイズ（0〜1）。 */
export const glslValue = /* glsl */ `
float value2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

/** worley2(p, t) : 近い特徴点への距離 (F1, F2) と最近傍セルの ID。 */
export const glslWorley = /* glsl */ `
vec3 worley2(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float f1 = 8.0;
  float f2 = 8.0;
  float id = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 cell = vec2(float(x), float(y));
      vec2 h = hash22(i + cell);
      vec2 feature = cell + 0.5 + 0.4 * sin(t + 6.2831853 * h);
      float d = length(feature - f);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = hash12(i + cell + 7.0);
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return vec3(f1, f2, id);
}
`;

/** snoise2(vec2) : -1〜1 の 2D simplex noise。 */
export const glslSimplex2 = /* glsl */ `
vec3 sxMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 sxMod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 sxPermute(vec3 x) { return sxMod289(((x * 34.0) + 10.0) * x); }
float snoise2(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = sxMod289(i);
  vec3 p = sxPermute(sxPermute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

/** 画面上で太さが一定の格子線。coord の整数位置に線を引く（0〜1）。 */
export const glslGridLine = /* glsl */ `
float gridLine(float coord, float width) {
#ifdef SURFACE_VERTEX
  return 0.0;
#else
  float d = abs(fract(coord - 0.5) - 0.5) / max(fwidth(coord), 1e-5);
  return 1.0 - clamp(d - width, 0.0, 1.0);
#endif
}
`;
