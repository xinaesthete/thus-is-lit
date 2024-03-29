varying float vsegAng;
uniform sampler2D texture1;
uniform mat3 textureMatrix1;
uniform float ScreenAspect;
uniform float ImageAspect;
uniform vec2 UVLimit;
uniform float Zoom;
uniform float Leaves;
uniform float Angle;
uniform float AngleGain;
uniform float KaleidMix;
uniform float Angle2;
uniform float OutAngle;
uniform float Mozaic;
uniform float MozGain;
//TODO: more struct-based args... modular shaders...
struct colParms {
  float contrast;
  float saturation;
  float brightness;
};
uniform float ContrastPostBias;
uniform float ContrastPreBias;
uniform float ContrastGain;
uniform float Saturation;
uniform float Brightness;
uniform float SaturationBias;
uniform float SaturationGain;
uniform float HueShift;
uniform float HueSteps;
uniform float HueStepShape;
uniform vec2 Centre;
uniform vec2 ImageCentre;
uniform vec2 Vignette;
uniform float OutputMult;
uniform float DebugMix;

uniform float BarbHueShift;
uniform float BarbLeafGlitch;

varying vec4 vertColor;
varying vec2 vertTexCoord;

#define PI 3.14159265359

mat2 rotate2d(float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}
// 2d cartesian to polar coordinates
vec2 car2pol(vec2 IN) { return vec2(length(IN), atan(IN.y, IN.x)); }
// 2d polar to cartesian coordinates
vec2 pol2car(vec2 IN) { return vec2(IN.x * cos(IN.y), IN.x * sin(IN.y)); }
vec2 mirrorRepeat(vec2 uv, vec2 limit) {
  // https://www.desmos.com/calculator/jqniynd1hh
  // return abs(mod((vec2(-1.)-uv),vec2(2.))+vec2(1.));
  //hmm.
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
vec2 mozaic(vec2 uv, float num, float g) {
  vec2 uv2 = (uv - 0.5) * num;
  vec2 _frac = gain(fract(uv2), g);
  vec2 _floor = floor(uv2);
  uv2 = _floor / num;
  uv2 += _frac / num;
  uv2 += 0.5;
  return uv2;
}

vec2 correctAspect(vec2 uv) {
  //uv.x *= ScreenAspect; // doesn't seem to make sense to do this after "/ UVLimit".
  //uv /= UVLimit*ScreenAspect;
  
  return (vec3(uv, 1.) * textureMatrix1).xy;
  //return (textureMatrix1*vec3(uv, 1.)).yx * vec2(1., -1.);
  // return vec2(-1., 1.) * (1. - (textureMatrix1*vec3(uv, 1.)).yx);
}

float quant(float v, float steps) {
  return floor(steps * v) / (steps-1.);
}
/*** 
different implementations of quantization with variable softness of step.
probably would've been worth looking up how others've done it.
quantSmoothS uses smoothstep: 
  probably quite a bit faster & has good behaviour with low values of soft
  high values of soft have wave-y artefacts.
  */
float quantSmoothS(float v, float steps, float soft) {
  float r = steps * v;
  r += 0.5;
  float f = smoothstep(-soft, soft, fract(r)-0.5);
  return (floor(r)+f-1.) / (steps-1.);
}
/**
quantSmoothG uses gain:
  identical to no quantization when soft = 1. but slower & bad abrupt onset of smoothing.
*/
float quantSmoothG(float v, float steps, float soft) {
  float r = steps * v;
  r -= 0.5;
  float g = 1. - (0.5*soft);
  float f = gain(fract(r), g);
  return (floor(r)+f) / (steps-1.);
}
float quant(float v, float steps, float soft) {
  return quantSmoothS(v, steps, soft);
}
float debugZero(float test, float thresh) {
  // return 1. - (1./thresh) * min(thresh, abs(test));
  return 1.-smoothstep(0., thresh, abs(test));
}
float debugNear(float test, float targ, float thresh) {
  return debugZero(targ-test, thresh);
}
float debugMod(float test, float m, float thresh) {
  float m2 = mod(test, m);
  float v = min(abs(m-m2), m2);
  return debugZero(v, thresh);
}

void xmain() {
  vec2 uv = correctAspect(vertTexCoord);
  uv = mirrorRepeat(uv, UVLimit + (0.5*UVLimit));
  gl_FragColor = texture2D(texture1, uv);
}

float shadeSeg(in vec2 p, in float angle) {
  float a = abs(0.5*angle+atan(p.y, p.x)-0.5*angle);
  return smoothstep(angle, angle+0.001, a);
}
vec4 previs_main() {
  float segAng = vsegAng;
  vec2 uv = vertTexCoord;
  // vec2 dp = uv - 0.5*(ImageCentre + 1.);
  vec2 dp = uv - ImageCentre;
  dp.x *= ScreenAspect;
  dp = rotate2d(Angle) * dp;
  
  float d = shadeSeg(dp, segAng*0.25);
  vec4 vidCol = texture2D(texture1, uv);
  vec4 overlay = vidCol;
  overlay.a = 1.;
  //overlay.rgb = mix(hsv2rgb(vec3(dp.x, 0.5, dp.y)), vidCol.rgb, 0.5);
  float a = d;//smoothstep(0.03, 0.04, d);
  return mix(overlay, 0.6*vidCol, a);
}
vec4 k_main() {
  float segAng = vsegAng;
  //see https://gist.github.com/bartwttewaall/5a1168d04a07d52eaf0571f7990191c2 for setting up textureMatrix
  vec2 uv = vertTexCoord;
  float barbScreenI = floor(uv.x * 6.);
  float barbScreenF = barbScreenI / 6.;
  segAng += (barbScreenF - 0.5) * BarbLeafGlitch;
  vec2 normalAspectUV = correctAspect(vertTexCoord.xy);
  uv -= 0.5;
  uv.x *= ScreenAspect;
  //uv.x = mod(uv.x, 6.);
  
  vec2 c = Centre;
  
  vec2 polar = car2pol(uv - c);
  vec2 polarDry = polar;
  float pSign = sign(polar.y);
  polar.y += OutAngle * segAng;
  polar.y += Angle2 * segAng;
  float leavesI = floor(Leaves);
  float leavesFr = fract(Leaves);
  
  polar.y = mod(polar.y+PI, 2.*PI);
  polar.y -= PI;
  
  float leaf = polar.y / segAng; ///....
  leaf += 1.5;
  //leaf += (barbScreenF - 0.5) * BarbLeafGlitch;
  float leafI = ceil(leaf);
  float fr = fract(leaf);
  fr = gain(fr, AngleGain);
  float rfr = fr > 0.5 ? 1. - fr : fr;
  polar.y = Angle + rfr * segAng;
  polar.y -= Angle2 * segAng;

  ///consider something more interesting here...
  polar.x *= Zoom;

  vec2 uv_a = correctAspect(pol2car(polar) + ImageCentre);
  
  vec2 uv2 = uv_a; //mix(normalAspectUV, uv_a, KaleidMix); // don't blend UV for KaleidMix
  uv2 = mozaic(uv2, sqrt(Mozaic), MozGain);

  //FFS... all the mathematical rigour of a chimp brandishing a compass...
  //(this is wrong at the moment?)
  vec2 _uvLim = vec2(1., mix(UVLimit.y, UVLimit.x, min(floor(ImageAspect), 1.)));
  uv2 = mirrorRepeat(uv2, _uvLim);
  
  vec4 kcol = texture2D(texture1, uv2);
  vec4 col = mix(texture2D(texture1, normalAspectUV), kcol, KaleidMix);
  vec3 colHSV = rgb2hsv(col.rgb);
  #define _HUE_EXPERIMENT
  #ifdef HUE_EXPERIMENT
  //might be interesting with feedback, would need tuning in any case.
  colHSV.x = quant(colHSV.x, HueSteps, HueStepShape);
  #endif
  colHSV.x = mod(1. + colHSV.x + HueShift, 1.);//should be no-op as long as HueShift == 0
  
  colHSV.y = bias(gain(colHSV.y, SaturationGain), SaturationBias);
  colHSV.z = bias(colHSV.z, ContrastPreBias);
  colHSV.z = bias(gain(colHSV.z, ContrastGain), ContrastPostBias);
  
  #define DEBUG
  #ifdef DEBUG
  vec3 dbg = vec3(0.);
  float thresh = 0.002/polarDry.x;
  float a = MozGain*debugMod(polarDry.y+((Angle2+OutAngle)*segAng), segAng/2., thresh);
  dbg.y = colHSV.y;  //abs(f-g)*10.;
  dbg.z = max(a, leafI/Leaves);// max(a, rfr);//polar.y / (2.*PI);
  dbg.x = dbg.z;
  dbg.z = dbg.z > 1. ? 0. : dbg.z;
  colHSV = mix(colHSV, dbg, DebugMix);
  #endif
  colHSV.x += barbScreenF * BarbHueShift;
  colHSV.y *= Saturation;
  colHSV.z *= Brightness;
  
  col.rgb = hsv2rgb(colHSV);

  float feather = smoothstep(0., Vignette.x, 0.5 - abs(0.5 - vertTexCoord.x));
  feather *= smoothstep(0., Vignette.y, 0.5 - abs(0.5 - vertTexCoord.y));
  col.a = feather;

  return col * OutputMult;
}

void main() {
  #ifdef PREVIS
    gl_FragColor = previs_main();
  #else
    gl_FragColor = k_main();
  #endif
}
