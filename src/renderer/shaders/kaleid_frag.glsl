varying float segAng;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
uniform float ScreenAspect;
uniform vec2 UVLimit;
uniform float Zoom;
uniform float Angle;
uniform float AngleGain;
uniform float KaleidMix;
uniform float OutAngle;
uniform float Mozaic;
uniform float MozMix;
uniform float MozPow;
uniform float MozGain;
uniform float ContrastPostBias;
uniform float ContrastPreBias;
uniform float ContrastGain;
uniform float SaturationBias;
uniform float SaturationGain;
uniform vec2 Centre;
uniform vec2 ImageCentre;
uniform vec2 Vignette;

varying vec4 vertColor;
varying vec2 vertTexCoord;

// 2d cartesian to polar coordinates
vec2 car2pol(vec2 IN) { return vec2(length(IN), atan(IN.y, IN.x)); }
// 2d polar to cartesian coordinates
vec2 pol2car(vec2 IN) { return vec2(IN.x * cos(IN.y), IN.x * sin(IN.y)); }
vec2 mirrorRepeat(vec2 uv, vec2 limit) {
  // https://www.desmos.com/calculator/jqniynd1hh
  // return abs(mod((vec2(-1.)-uv),vec2(2.))+vec2(1.));
  return min(abs(mod(uv, 2. * limit)), abs(mod(2. * limit - uv, 2. * limit)));
}
// https://cis700-procedural-graphics.github.io/files/toolbox_functions.pdf
//(nb, switched arguments)
float bias(float t, float b) { return pow(t, log(b) / log(0.5)); }
float gain(float t, float g) {
  if (t < 0.5)
    return bias(2. * t, 1. - g) / 2.;
  else
    return 1. - bias(2. - 2. * t, 1. - g) / 2.;
}
vec2 gain(vec2 t, float g) { return vec2(gain(t.x, g), gain(t.y, g)); }
vec2 gain(vec2 t, vec2 g) { return vec2(gain(t.x, g.x), gain(t.y, g.y)); }

// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 hsv2rgb(in vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  vec3 pp = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  return clamp(
      pp, 0.0,
      1.0); // added sjpt 30 July 2015, can probably remove other clamp???
}
vec3 rgb2hsv(in vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec2 mozaic(vec2 uv, float num, float strength, float p, float g) {
  // TODO change GLSL version, use round
  //        vec2 uv2 = 0.5 + uv*num;
  //        vec2 _frac = abs(fract(uv2)-0.5) * 2.;
  //        _frac = gain(pow(_frac, vec2(p)), g);
  //        vec2 _floor = floor(uv2);
  //        uv2 = _floor / num;
  //        return mix(uv, uv2, strength* (1.-_frac));
  vec2 uv2 = (uv - 0.5) * num;
  vec2 _frac = gain(fract(uv2), g);
  vec2 _floor = floor(uv2);
  uv2 = _floor / num;
  uv2 += _frac / num;
  uv2 += 0.5;
  return mix(uv, uv2, strength);
}

void main(void) {
  vec2 uv = vertTexCoord.xy; // / UVLimit;
  uv.x *=
      ScreenAspect; // doesn't seem to make sense to do this after "/ UVLimit".
  uv /= UVLimit;    // TODO think coherently about coordinates :)
  vec2 c = Centre;
  c.x *= ScreenAspect;
  vec2 polar = car2pol(uv - c / UVLimit);
  polar.y += OutAngle * segAng;
  float fr = fract(polar.y / segAng);
  fr = gain(fr, AngleGain);
  polar.y = Angle + (fr > 0.5 ? 1. - fr : fr) * segAng;
  polar.x *= Zoom;

  vec2 uv2 = mix(uv, pol2car(polar) + ImageCentre, KaleidMix);
  uv2 = mozaic(uv2, Mozaic, MozMix, MozPow, MozGain);

  // uv2 = vertTexCoord;

  // uv2.x *= ScreenAspect;
  uv2 = mirrorRepeat(uv2, UVLimit);

  vec4 col = texture2D(texture1, uv2);
  vec3 colHSV = rgb2hsv(col.rgb);
  colHSV.y = bias(gain(colHSV.y, SaturationGain), SaturationBias);
  colHSV.z = bias(colHSV.z, ContrastPreBias);
  colHSV.z = bias(gain(colHSV.z, ContrastGain), ContrastPostBias);
  col.rgb = hsv2rgb(colHSV);

  float feather = smoothstep(0., Vignette.x, 0.5 - abs(0.5 - vertTexCoord.x));
  feather *= smoothstep(0., Vignette.y, 0.5 - abs(0.5 - vertTexCoord.y));
  col.a = feather;

  gl_FragColor = col;
}
