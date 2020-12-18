(() => {
  // src/renderer/shaders/kaleid_vert.glsl
  var kaleid_vert_default = "uniform float Leaves;\r\nvarying float segAng;\r\nvarying vec2 vertTexCoord;\r\n#define PI 3.14159265359\r\n\r\nvoid main() {\r\n  vertTexCoord = uv;\r\n  segAng = 2. * PI / Leaves;\r\n  gl_Position = vec4(position, 1.0);\r\n}\r\n";

  // src/renderer/shaders/kaleid_frag.glsl
  var kaleid_frag_default = `varying float segAng;\r
uniform sampler2D texture1;\r
uniform sampler2D texture2;\r
uniform sampler2D texture3;\r
uniform float ScreenAspect;\r
uniform vec2 UVLimit;\r
uniform float Zoom;\r
uniform float Angle;\r
uniform float AngleGain;\r
uniform float KaleidMix;\r
uniform float OutAngle;\r
uniform float Mozaic;\r
uniform float MozMix;\r
uniform float MozPow;\r
uniform float MozGain;\r
uniform float ContrastPostBias;\r
uniform float ContrastPreBias;\r
uniform float ContrastGain;\r
uniform float SaturationBias;\r
uniform float SaturationGain;\r
uniform vec2 Centre;\r
uniform vec2 ImageCentre;\r
uniform vec2 Vignette;\r
\r
varying vec4 vertColor;\r
varying vec2 vertTexCoord;\r
\r
// 2d cartesian to polar coordinates\r
vec2 car2pol(vec2 IN) { return vec2(length(IN), atan(IN.y, IN.x)); }\r
// 2d polar to cartesian coordinates\r
vec2 pol2car(vec2 IN) { return vec2(IN.x * cos(IN.y), IN.x * sin(IN.y)); }\r
vec2 mirrorRepeat(vec2 uv, vec2 limit) {\r
  // https://www.desmos.com/calculator/jqniynd1hh\r
  // return abs(mod((vec2(-1.)-uv),vec2(2.))+vec2(1.));\r
  return min(abs(mod(uv, 2. * limit)), abs(mod(2. * limit - uv, 2. * limit)));\r
}\r
// https://cis700-procedural-graphics.github.io/files/toolbox_functions.pdf\r
//(nb, switched arguments)\r
float bias(float t, float b) { return pow(t, log(b) / log(0.5)); }\r
float gain(float t, float g) {\r
  if (t < 0.5)\r
    return bias(2. * t, 1. - g) / 2.;\r
  else\r
    return 1. - bias(2. - 2. * t, 1. - g) / 2.;\r
}\r
vec2 gain(vec2 t, float g) { return vec2(gain(t.x, g), gain(t.y, g)); }\r
vec2 gain(vec2 t, vec2 g) { return vec2(gain(t.x, g.x), gain(t.y, g.y)); }\r
\r
// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl\r
vec3 hsv2rgb(in vec3 c) {\r
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\r
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\r
  vec3 pp = c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\r
  return clamp(\r
      pp, 0.0,\r
      1.0); // added sjpt 30 July 2015, can probably remove other clamp???\r
}\r
vec3 rgb2hsv(in vec3 c) {\r
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\r
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\r
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\r
\r
  float d = q.x - min(q.w, q.y);\r
  float e = 1.0e-10;\r
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\r
}\r
vec2 mozaic(vec2 uv, float num, float strength, float p, float g) {\r
  // TODO change GLSL version, use round\r
  //        vec2 uv2 = 0.5 + uv*num;\r
  //        vec2 _frac = abs(fract(uv2)-0.5) * 2.;\r
  //        _frac = gain(pow(_frac, vec2(p)), g);\r
  //        vec2 _floor = floor(uv2);\r
  //        uv2 = _floor / num;\r
  //        return mix(uv, uv2, strength* (1.-_frac));\r
  vec2 uv2 = (uv - 0.5) * num;\r
  vec2 _frac = gain(fract(uv2), g);\r
  vec2 _floor = floor(uv2);\r
  uv2 = _floor / num;\r
  uv2 += _frac / num;\r
  uv2 += 0.5;\r
  return mix(uv, uv2, strength);\r
}\r
\r
void main(void) {\r
  vec2 uv = vertTexCoord.xy; // / UVLimit;\r
  uv.x *=\r
      ScreenAspect; // doesn't seem to make sense to do this after "/ UVLimit".\r
  uv /= UVLimit;    // TODO think coherently about coordinates :)\r
  vec2 c = Centre;\r
  c.x *= ScreenAspect;\r
  vec2 polar = car2pol(uv - c / UVLimit);\r
  polar.y += OutAngle * segAng;\r
  float fr = fract(polar.y / segAng);\r
  fr = gain(fr, AngleGain);\r
  polar.y = Angle + (fr > 0.5 ? 1. - fr : fr) * segAng;\r
  polar.x *= Zoom;\r
\r
  vec2 uv2 = mix(uv, pol2car(polar) + ImageCentre, KaleidMix);\r
  uv2 = mozaic(uv2, Mozaic, MozMix, MozPow, MozGain);\r
\r
  // uv2 = vertTexCoord;\r
\r
  // uv2.x *= ScreenAspect;\r
  uv2 = mirrorRepeat(uv2, UVLimit);\r
\r
  vec4 col = texture2D(texture1, uv2);\r
  vec3 colHSV = rgb2hsv(col.rgb);\r
  colHSV.y = bias(gain(colHSV.y, SaturationGain), SaturationBias);\r
  colHSV.z = bias(colHSV.z, ContrastPreBias);\r
  colHSV.z = bias(gain(colHSV.z, ContrastGain), ContrastPostBias);\r
  col.rgb = hsv2rgb(colHSV);\r
\r
  float feather = smoothstep(0., Vignette.x, 0.5 - abs(0.5 - vertTexCoord.x));\r
  feather *= smoothstep(0., Vignette.y, 0.5 - abs(0.5 - vertTexCoord.y));\r
  col.a = feather;\r
\r
  gl_FragColor = col;\r
}\r
`;

  // three-ns:three
  var ACESFilmicToneMapping = window.THREE.ACESFilmicToneMapping;
  var AddEquation = window.THREE.AddEquation;
  var AddOperation = window.THREE.AddOperation;
  var AdditiveAnimationBlendMode = window.THREE.AdditiveAnimationBlendMode;
  var AdditiveBlending = window.THREE.AdditiveBlending;
  var AlphaFormat = window.THREE.AlphaFormat;
  var AlwaysDepth = window.THREE.AlwaysDepth;
  var AlwaysStencilFunc = window.THREE.AlwaysStencilFunc;
  var AmbientLight = window.THREE.AmbientLight;
  var AmbientLightProbe = window.THREE.AmbientLightProbe;
  var AnimationClip = window.THREE.AnimationClip;
  var AnimationLoader = window.THREE.AnimationLoader;
  var AnimationMixer = window.THREE.AnimationMixer;
  var AnimationObjectGroup = window.THREE.AnimationObjectGroup;
  var AnimationUtils = window.THREE.AnimationUtils;
  var ArcCurve = window.THREE.ArcCurve;
  var ArrayCamera = window.THREE.ArrayCamera;
  var ArrowHelper = window.THREE.ArrowHelper;
  var Audio = window.THREE.Audio;
  var AudioAnalyser = window.THREE.AudioAnalyser;
  var AudioContext = window.THREE.AudioContext;
  var AudioListener = window.THREE.AudioListener;
  var AudioLoader = window.THREE.AudioLoader;
  var AxesHelper = window.THREE.AxesHelper;
  var AxisHelper = window.THREE.AxisHelper;
  var BackSide = window.THREE.BackSide;
  var BasicDepthPacking = window.THREE.BasicDepthPacking;
  var BasicShadowMap = window.THREE.BasicShadowMap;
  var BinaryTextureLoader = window.THREE.BinaryTextureLoader;
  var Bone = window.THREE.Bone;
  var BooleanKeyframeTrack = window.THREE.BooleanKeyframeTrack;
  var BoundingBoxHelper = window.THREE.BoundingBoxHelper;
  var Box2 = window.THREE.Box2;
  var Box3 = window.THREE.Box3;
  var Box3Helper = window.THREE.Box3Helper;
  var BoxBufferGeometry = window.THREE.BoxBufferGeometry;
  var BoxGeometry = window.THREE.BoxGeometry;
  var BoxHelper = window.THREE.BoxHelper;
  var BufferAttribute = window.THREE.BufferAttribute;
  var BufferGeometry = window.THREE.BufferGeometry;
  var BufferGeometryLoader = window.THREE.BufferGeometryLoader;
  var ByteType = window.THREE.ByteType;
  var Cache = window.THREE.Cache;
  var Camera = window.THREE.Camera;
  var CameraHelper = window.THREE.CameraHelper;
  var CanvasRenderer = window.THREE.CanvasRenderer;
  var CanvasTexture = window.THREE.CanvasTexture;
  var CatmullRomCurve3 = window.THREE.CatmullRomCurve3;
  var CineonToneMapping = window.THREE.CineonToneMapping;
  var CircleBufferGeometry = window.THREE.CircleBufferGeometry;
  var CircleGeometry = window.THREE.CircleGeometry;
  var ClampToEdgeWrapping = window.THREE.ClampToEdgeWrapping;
  var Clock = window.THREE.Clock;
  var ClosedSplineCurve3 = window.THREE.ClosedSplineCurve3;
  var Color = window.THREE.Color;
  var ColorKeyframeTrack = window.THREE.ColorKeyframeTrack;
  var CompressedTexture = window.THREE.CompressedTexture;
  var CompressedTextureLoader = window.THREE.CompressedTextureLoader;
  var ConeBufferGeometry = window.THREE.ConeBufferGeometry;
  var ConeGeometry = window.THREE.ConeGeometry;
  var CubeCamera = window.THREE.CubeCamera;
  var CubeGeometry = window.THREE.CubeGeometry;
  var CubeReflectionMapping = window.THREE.CubeReflectionMapping;
  var CubeRefractionMapping = window.THREE.CubeRefractionMapping;
  var CubeTexture = window.THREE.CubeTexture;
  var CubeTextureLoader = window.THREE.CubeTextureLoader;
  var CubeUVReflectionMapping = window.THREE.CubeUVReflectionMapping;
  var CubeUVRefractionMapping = window.THREE.CubeUVRefractionMapping;
  var CubicBezierCurve = window.THREE.CubicBezierCurve;
  var CubicBezierCurve3 = window.THREE.CubicBezierCurve3;
  var CubicInterpolant = window.THREE.CubicInterpolant;
  var CullFaceBack = window.THREE.CullFaceBack;
  var CullFaceFront = window.THREE.CullFaceFront;
  var CullFaceFrontBack = window.THREE.CullFaceFrontBack;
  var CullFaceNone = window.THREE.CullFaceNone;
  var Curve = window.THREE.Curve;
  var CurvePath = window.THREE.CurvePath;
  var CustomBlending = window.THREE.CustomBlending;
  var CustomToneMapping = window.THREE.CustomToneMapping;
  var CylinderBufferGeometry = window.THREE.CylinderBufferGeometry;
  var CylinderGeometry = window.THREE.CylinderGeometry;
  var Cylindrical = window.THREE.Cylindrical;
  var DataTexture = window.THREE.DataTexture;
  var DataTexture2DArray = window.THREE.DataTexture2DArray;
  var DataTexture3D = window.THREE.DataTexture3D;
  var DataTextureLoader = window.THREE.DataTextureLoader;
  var DataUtils = window.THREE.DataUtils;
  var DecrementStencilOp = window.THREE.DecrementStencilOp;
  var DecrementWrapStencilOp = window.THREE.DecrementWrapStencilOp;
  var DefaultLoadingManager = window.THREE.DefaultLoadingManager;
  var DepthFormat = window.THREE.DepthFormat;
  var DepthStencilFormat = window.THREE.DepthStencilFormat;
  var DepthTexture = window.THREE.DepthTexture;
  var DirectionalLight = window.THREE.DirectionalLight;
  var DirectionalLightHelper = window.THREE.DirectionalLightHelper;
  var DiscreteInterpolant = window.THREE.DiscreteInterpolant;
  var DodecahedronBufferGeometry = window.THREE.DodecahedronBufferGeometry;
  var DodecahedronGeometry = window.THREE.DodecahedronGeometry;
  var DoubleSide = window.THREE.DoubleSide;
  var DstAlphaFactor = window.THREE.DstAlphaFactor;
  var DstColorFactor = window.THREE.DstColorFactor;
  var DynamicBufferAttribute = window.THREE.DynamicBufferAttribute;
  var DynamicCopyUsage = window.THREE.DynamicCopyUsage;
  var DynamicDrawUsage = window.THREE.DynamicDrawUsage;
  var DynamicReadUsage = window.THREE.DynamicReadUsage;
  var EdgesGeometry = window.THREE.EdgesGeometry;
  var EdgesHelper = window.THREE.EdgesHelper;
  var EllipseCurve = window.THREE.EllipseCurve;
  var EqualDepth = window.THREE.EqualDepth;
  var EqualStencilFunc = window.THREE.EqualStencilFunc;
  var EquirectangularReflectionMapping = window.THREE.EquirectangularReflectionMapping;
  var EquirectangularRefractionMapping = window.THREE.EquirectangularRefractionMapping;
  var Euler = window.THREE.Euler;
  var EventDispatcher = window.THREE.EventDispatcher;
  var ExtrudeBufferGeometry = window.THREE.ExtrudeBufferGeometry;
  var ExtrudeGeometry = window.THREE.ExtrudeGeometry;
  var Face3 = window.THREE.Face3;
  var Face4 = window.THREE.Face4;
  var FaceColors = window.THREE.FaceColors;
  var FileLoader = window.THREE.FileLoader;
  var FlatShading = window.THREE.FlatShading;
  var Float16BufferAttribute = window.THREE.Float16BufferAttribute;
  var Float32Attribute = window.THREE.Float32Attribute;
  var Float32BufferAttribute = window.THREE.Float32BufferAttribute;
  var Float64Attribute = window.THREE.Float64Attribute;
  var Float64BufferAttribute = window.THREE.Float64BufferAttribute;
  var FloatType = window.THREE.FloatType;
  var Fog = window.THREE.Fog;
  var FogExp2 = window.THREE.FogExp2;
  var Font = window.THREE.Font;
  var FontLoader = window.THREE.FontLoader;
  var FrontSide = window.THREE.FrontSide;
  var Frustum = window.THREE.Frustum;
  var GLBufferAttribute = window.THREE.GLBufferAttribute;
  var GLSL1 = window.THREE.GLSL1;
  var GLSL3 = window.THREE.GLSL3;
  var GammaEncoding = window.THREE.GammaEncoding;
  var Geometry = window.THREE.Geometry;
  var GeometryUtils = window.THREE.GeometryUtils;
  var GreaterDepth = window.THREE.GreaterDepth;
  var GreaterEqualDepth = window.THREE.GreaterEqualDepth;
  var GreaterEqualStencilFunc = window.THREE.GreaterEqualStencilFunc;
  var GreaterStencilFunc = window.THREE.GreaterStencilFunc;
  var GridHelper = window.THREE.GridHelper;
  var Group = window.THREE.Group;
  var HalfFloatType = window.THREE.HalfFloatType;
  var HemisphereLight = window.THREE.HemisphereLight;
  var HemisphereLightHelper = window.THREE.HemisphereLightHelper;
  var HemisphereLightProbe = window.THREE.HemisphereLightProbe;
  var IcosahedronBufferGeometry = window.THREE.IcosahedronBufferGeometry;
  var IcosahedronGeometry = window.THREE.IcosahedronGeometry;
  var ImageBitmapLoader = window.THREE.ImageBitmapLoader;
  var ImageLoader = window.THREE.ImageLoader;
  var ImageUtils = window.THREE.ImageUtils;
  var ImmediateRenderObject = window.THREE.ImmediateRenderObject;
  var IncrementStencilOp = window.THREE.IncrementStencilOp;
  var IncrementWrapStencilOp = window.THREE.IncrementWrapStencilOp;
  var InstancedBufferAttribute = window.THREE.InstancedBufferAttribute;
  var InstancedBufferGeometry = window.THREE.InstancedBufferGeometry;
  var InstancedInterleavedBuffer = window.THREE.InstancedInterleavedBuffer;
  var InstancedMesh = window.THREE.InstancedMesh;
  var Int16Attribute = window.THREE.Int16Attribute;
  var Int16BufferAttribute = window.THREE.Int16BufferAttribute;
  var Int32Attribute = window.THREE.Int32Attribute;
  var Int32BufferAttribute = window.THREE.Int32BufferAttribute;
  var Int8Attribute = window.THREE.Int8Attribute;
  var Int8BufferAttribute = window.THREE.Int8BufferAttribute;
  var IntType = window.THREE.IntType;
  var InterleavedBuffer = window.THREE.InterleavedBuffer;
  var InterleavedBufferAttribute = window.THREE.InterleavedBufferAttribute;
  var Interpolant = window.THREE.Interpolant;
  var InterpolateDiscrete = window.THREE.InterpolateDiscrete;
  var InterpolateLinear = window.THREE.InterpolateLinear;
  var InterpolateSmooth = window.THREE.InterpolateSmooth;
  var InvertStencilOp = window.THREE.InvertStencilOp;
  var JSONLoader = window.THREE.JSONLoader;
  var KeepStencilOp = window.THREE.KeepStencilOp;
  var KeyframeTrack = window.THREE.KeyframeTrack;
  var LOD = window.THREE.LOD;
  var LatheBufferGeometry = window.THREE.LatheBufferGeometry;
  var LatheGeometry = window.THREE.LatheGeometry;
  var Layers = window.THREE.Layers;
  var LensFlare = window.THREE.LensFlare;
  var LessDepth = window.THREE.LessDepth;
  var LessEqualDepth = window.THREE.LessEqualDepth;
  var LessEqualStencilFunc = window.THREE.LessEqualStencilFunc;
  var LessStencilFunc = window.THREE.LessStencilFunc;
  var Light = window.THREE.Light;
  var LightProbe = window.THREE.LightProbe;
  var Line = window.THREE.Line;
  var Line3 = window.THREE.Line3;
  var LineBasicMaterial = window.THREE.LineBasicMaterial;
  var LineCurve = window.THREE.LineCurve;
  var LineCurve3 = window.THREE.LineCurve3;
  var LineDashedMaterial = window.THREE.LineDashedMaterial;
  var LineLoop = window.THREE.LineLoop;
  var LinePieces = window.THREE.LinePieces;
  var LineSegments = window.THREE.LineSegments;
  var LineStrip = window.THREE.LineStrip;
  var LinearEncoding = window.THREE.LinearEncoding;
  var LinearFilter = window.THREE.LinearFilter;
  var LinearInterpolant = window.THREE.LinearInterpolant;
  var LinearMipMapLinearFilter = window.THREE.LinearMipMapLinearFilter;
  var LinearMipMapNearestFilter = window.THREE.LinearMipMapNearestFilter;
  var LinearMipmapLinearFilter = window.THREE.LinearMipmapLinearFilter;
  var LinearMipmapNearestFilter = window.THREE.LinearMipmapNearestFilter;
  var LinearToneMapping = window.THREE.LinearToneMapping;
  var Loader = window.THREE.Loader;
  var LoaderUtils = window.THREE.LoaderUtils;
  var LoadingManager = window.THREE.LoadingManager;
  var LogLuvEncoding = window.THREE.LogLuvEncoding;
  var LoopOnce = window.THREE.LoopOnce;
  var LoopPingPong = window.THREE.LoopPingPong;
  var LoopRepeat = window.THREE.LoopRepeat;
  var LuminanceAlphaFormat = window.THREE.LuminanceAlphaFormat;
  var LuminanceFormat = window.THREE.LuminanceFormat;
  var MOUSE = window.THREE.MOUSE;
  var Material = window.THREE.Material;
  var MaterialLoader = window.THREE.MaterialLoader;
  var Math2 = window.THREE.Math;
  var MathUtils = window.THREE.MathUtils;
  var Matrix3 = window.THREE.Matrix3;
  var Matrix4 = window.THREE.Matrix4;
  var MaxEquation = window.THREE.MaxEquation;
  var Mesh = window.THREE.Mesh;
  var MeshBasicMaterial = window.THREE.MeshBasicMaterial;
  var MeshDepthMaterial = window.THREE.MeshDepthMaterial;
  var MeshDistanceMaterial = window.THREE.MeshDistanceMaterial;
  var MeshFaceMaterial = window.THREE.MeshFaceMaterial;
  var MeshLambertMaterial = window.THREE.MeshLambertMaterial;
  var MeshMatcapMaterial = window.THREE.MeshMatcapMaterial;
  var MeshNormalMaterial = window.THREE.MeshNormalMaterial;
  var MeshPhongMaterial = window.THREE.MeshPhongMaterial;
  var MeshPhysicalMaterial = window.THREE.MeshPhysicalMaterial;
  var MeshStandardMaterial = window.THREE.MeshStandardMaterial;
  var MeshToonMaterial = window.THREE.MeshToonMaterial;
  var MinEquation = window.THREE.MinEquation;
  var MirroredRepeatWrapping = window.THREE.MirroredRepeatWrapping;
  var MixOperation = window.THREE.MixOperation;
  var MultiMaterial = window.THREE.MultiMaterial;
  var MultiplyBlending = window.THREE.MultiplyBlending;
  var MultiplyOperation = window.THREE.MultiplyOperation;
  var NearestFilter = window.THREE.NearestFilter;
  var NearestMipMapLinearFilter = window.THREE.NearestMipMapLinearFilter;
  var NearestMipMapNearestFilter = window.THREE.NearestMipMapNearestFilter;
  var NearestMipmapLinearFilter = window.THREE.NearestMipmapLinearFilter;
  var NearestMipmapNearestFilter = window.THREE.NearestMipmapNearestFilter;
  var NeverDepth = window.THREE.NeverDepth;
  var NeverStencilFunc = window.THREE.NeverStencilFunc;
  var NoBlending = window.THREE.NoBlending;
  var NoColors = window.THREE.NoColors;
  var NoToneMapping = window.THREE.NoToneMapping;
  var NormalAnimationBlendMode = window.THREE.NormalAnimationBlendMode;
  var NormalBlending = window.THREE.NormalBlending;
  var NotEqualDepth = window.THREE.NotEqualDepth;
  var NotEqualStencilFunc = window.THREE.NotEqualStencilFunc;
  var NumberKeyframeTrack = window.THREE.NumberKeyframeTrack;
  var Object3D = window.THREE.Object3D;
  var ObjectLoader = window.THREE.ObjectLoader;
  var ObjectSpaceNormalMap = window.THREE.ObjectSpaceNormalMap;
  var OctahedronBufferGeometry = window.THREE.OctahedronBufferGeometry;
  var OctahedronGeometry = window.THREE.OctahedronGeometry;
  var OneFactor = window.THREE.OneFactor;
  var OneMinusDstAlphaFactor = window.THREE.OneMinusDstAlphaFactor;
  var OneMinusDstColorFactor = window.THREE.OneMinusDstColorFactor;
  var OneMinusSrcAlphaFactor = window.THREE.OneMinusSrcAlphaFactor;
  var OneMinusSrcColorFactor = window.THREE.OneMinusSrcColorFactor;
  var OrthographicCamera = window.THREE.OrthographicCamera;
  var PCFShadowMap = window.THREE.PCFShadowMap;
  var PCFSoftShadowMap = window.THREE.PCFSoftShadowMap;
  var PMREMGenerator = window.THREE.PMREMGenerator;
  var ParametricBufferGeometry = window.THREE.ParametricBufferGeometry;
  var ParametricGeometry = window.THREE.ParametricGeometry;
  var Particle = window.THREE.Particle;
  var ParticleBasicMaterial = window.THREE.ParticleBasicMaterial;
  var ParticleSystem = window.THREE.ParticleSystem;
  var ParticleSystemMaterial = window.THREE.ParticleSystemMaterial;
  var Path = window.THREE.Path;
  var PerspectiveCamera = window.THREE.PerspectiveCamera;
  var Plane = window.THREE.Plane;
  var PlaneBufferGeometry = window.THREE.PlaneBufferGeometry;
  var PlaneGeometry = window.THREE.PlaneGeometry;
  var PlaneHelper = window.THREE.PlaneHelper;
  var PointCloud = window.THREE.PointCloud;
  var PointCloudMaterial = window.THREE.PointCloudMaterial;
  var PointLight = window.THREE.PointLight;
  var PointLightHelper = window.THREE.PointLightHelper;
  var Points = window.THREE.Points;
  var PointsMaterial = window.THREE.PointsMaterial;
  var PolarGridHelper = window.THREE.PolarGridHelper;
  var PolyhedronBufferGeometry = window.THREE.PolyhedronBufferGeometry;
  var PolyhedronGeometry = window.THREE.PolyhedronGeometry;
  var PositionalAudio = window.THREE.PositionalAudio;
  var PropertyBinding = window.THREE.PropertyBinding;
  var PropertyMixer = window.THREE.PropertyMixer;
  var QuadraticBezierCurve = window.THREE.QuadraticBezierCurve;
  var QuadraticBezierCurve3 = window.THREE.QuadraticBezierCurve3;
  var Quaternion = window.THREE.Quaternion;
  var QuaternionKeyframeTrack = window.THREE.QuaternionKeyframeTrack;
  var QuaternionLinearInterpolant = window.THREE.QuaternionLinearInterpolant;
  var REVISION = window.THREE.REVISION;
  var RGBADepthPacking = window.THREE.RGBADepthPacking;
  var RGBAFormat = window.THREE.RGBAFormat;
  var RGBAIntegerFormat = window.THREE.RGBAIntegerFormat;
  var RGBA_ASTC_10x10_Format = window.THREE.RGBA_ASTC_10x10_Format;
  var RGBA_ASTC_10x5_Format = window.THREE.RGBA_ASTC_10x5_Format;
  var RGBA_ASTC_10x6_Format = window.THREE.RGBA_ASTC_10x6_Format;
  var RGBA_ASTC_10x8_Format = window.THREE.RGBA_ASTC_10x8_Format;
  var RGBA_ASTC_12x10_Format = window.THREE.RGBA_ASTC_12x10_Format;
  var RGBA_ASTC_12x12_Format = window.THREE.RGBA_ASTC_12x12_Format;
  var RGBA_ASTC_4x4_Format = window.THREE.RGBA_ASTC_4x4_Format;
  var RGBA_ASTC_5x4_Format = window.THREE.RGBA_ASTC_5x4_Format;
  var RGBA_ASTC_5x5_Format = window.THREE.RGBA_ASTC_5x5_Format;
  var RGBA_ASTC_6x5_Format = window.THREE.RGBA_ASTC_6x5_Format;
  var RGBA_ASTC_6x6_Format = window.THREE.RGBA_ASTC_6x6_Format;
  var RGBA_ASTC_8x5_Format = window.THREE.RGBA_ASTC_8x5_Format;
  var RGBA_ASTC_8x6_Format = window.THREE.RGBA_ASTC_8x6_Format;
  var RGBA_ASTC_8x8_Format = window.THREE.RGBA_ASTC_8x8_Format;
  var RGBA_BPTC_Format = window.THREE.RGBA_BPTC_Format;
  var RGBA_ETC2_EAC_Format = window.THREE.RGBA_ETC2_EAC_Format;
  var RGBA_PVRTC_2BPPV1_Format = window.THREE.RGBA_PVRTC_2BPPV1_Format;
  var RGBA_PVRTC_4BPPV1_Format = window.THREE.RGBA_PVRTC_4BPPV1_Format;
  var RGBA_S3TC_DXT1_Format = window.THREE.RGBA_S3TC_DXT1_Format;
  var RGBA_S3TC_DXT3_Format = window.THREE.RGBA_S3TC_DXT3_Format;
  var RGBA_S3TC_DXT5_Format = window.THREE.RGBA_S3TC_DXT5_Format;
  var RGBDEncoding = window.THREE.RGBDEncoding;
  var RGBEEncoding = window.THREE.RGBEEncoding;
  var RGBEFormat = window.THREE.RGBEFormat;
  var RGBFormat = window.THREE.RGBFormat;
  var RGBIntegerFormat = window.THREE.RGBIntegerFormat;
  var RGBM16Encoding = window.THREE.RGBM16Encoding;
  var RGBM7Encoding = window.THREE.RGBM7Encoding;
  var RGB_ETC1_Format = window.THREE.RGB_ETC1_Format;
  var RGB_ETC2_Format = window.THREE.RGB_ETC2_Format;
  var RGB_PVRTC_2BPPV1_Format = window.THREE.RGB_PVRTC_2BPPV1_Format;
  var RGB_PVRTC_4BPPV1_Format = window.THREE.RGB_PVRTC_4BPPV1_Format;
  var RGB_S3TC_DXT1_Format = window.THREE.RGB_S3TC_DXT1_Format;
  var RGFormat = window.THREE.RGFormat;
  var RGIntegerFormat = window.THREE.RGIntegerFormat;
  var RawShaderMaterial = window.THREE.RawShaderMaterial;
  var Ray = window.THREE.Ray;
  var Raycaster = window.THREE.Raycaster;
  var RectAreaLight = window.THREE.RectAreaLight;
  var RedFormat = window.THREE.RedFormat;
  var RedIntegerFormat = window.THREE.RedIntegerFormat;
  var ReinhardToneMapping = window.THREE.ReinhardToneMapping;
  var RepeatWrapping = window.THREE.RepeatWrapping;
  var ReplaceStencilOp = window.THREE.ReplaceStencilOp;
  var ReverseSubtractEquation = window.THREE.ReverseSubtractEquation;
  var RingBufferGeometry = window.THREE.RingBufferGeometry;
  var RingGeometry = window.THREE.RingGeometry;
  var SRGB8_ALPHA8_ASTC_10x10_Format = window.THREE.SRGB8_ALPHA8_ASTC_10x10_Format;
  var SRGB8_ALPHA8_ASTC_10x5_Format = window.THREE.SRGB8_ALPHA8_ASTC_10x5_Format;
  var SRGB8_ALPHA8_ASTC_10x6_Format = window.THREE.SRGB8_ALPHA8_ASTC_10x6_Format;
  var SRGB8_ALPHA8_ASTC_10x8_Format = window.THREE.SRGB8_ALPHA8_ASTC_10x8_Format;
  var SRGB8_ALPHA8_ASTC_12x10_Format = window.THREE.SRGB8_ALPHA8_ASTC_12x10_Format;
  var SRGB8_ALPHA8_ASTC_12x12_Format = window.THREE.SRGB8_ALPHA8_ASTC_12x12_Format;
  var SRGB8_ALPHA8_ASTC_4x4_Format = window.THREE.SRGB8_ALPHA8_ASTC_4x4_Format;
  var SRGB8_ALPHA8_ASTC_5x4_Format = window.THREE.SRGB8_ALPHA8_ASTC_5x4_Format;
  var SRGB8_ALPHA8_ASTC_5x5_Format = window.THREE.SRGB8_ALPHA8_ASTC_5x5_Format;
  var SRGB8_ALPHA8_ASTC_6x5_Format = window.THREE.SRGB8_ALPHA8_ASTC_6x5_Format;
  var SRGB8_ALPHA8_ASTC_6x6_Format = window.THREE.SRGB8_ALPHA8_ASTC_6x6_Format;
  var SRGB8_ALPHA8_ASTC_8x5_Format = window.THREE.SRGB8_ALPHA8_ASTC_8x5_Format;
  var SRGB8_ALPHA8_ASTC_8x6_Format = window.THREE.SRGB8_ALPHA8_ASTC_8x6_Format;
  var SRGB8_ALPHA8_ASTC_8x8_Format = window.THREE.SRGB8_ALPHA8_ASTC_8x8_Format;
  var Scene = window.THREE.Scene;
  var SceneUtils = window.THREE.SceneUtils;
  var ShaderChunk = window.THREE.ShaderChunk;
  var ShaderLib = window.THREE.ShaderLib;
  var ShaderMaterial = window.THREE.ShaderMaterial;
  var ShadowMaterial = window.THREE.ShadowMaterial;
  var Shape = window.THREE.Shape;
  var ShapeBufferGeometry = window.THREE.ShapeBufferGeometry;
  var ShapeGeometry = window.THREE.ShapeGeometry;
  var ShapePath = window.THREE.ShapePath;
  var ShapeUtils = window.THREE.ShapeUtils;
  var ShortType = window.THREE.ShortType;
  var Skeleton = window.THREE.Skeleton;
  var SkeletonHelper = window.THREE.SkeletonHelper;
  var SkinnedMesh = window.THREE.SkinnedMesh;
  var SmoothShading = window.THREE.SmoothShading;
  var Sphere = window.THREE.Sphere;
  var SphereBufferGeometry = window.THREE.SphereBufferGeometry;
  var SphereGeometry = window.THREE.SphereGeometry;
  var Spherical = window.THREE.Spherical;
  var SphericalHarmonics3 = window.THREE.SphericalHarmonics3;
  var Spline = window.THREE.Spline;
  var SplineCurve = window.THREE.SplineCurve;
  var SplineCurve3 = window.THREE.SplineCurve3;
  var SpotLight = window.THREE.SpotLight;
  var SpotLightHelper = window.THREE.SpotLightHelper;
  var Sprite = window.THREE.Sprite;
  var SpriteMaterial = window.THREE.SpriteMaterial;
  var SrcAlphaFactor = window.THREE.SrcAlphaFactor;
  var SrcAlphaSaturateFactor = window.THREE.SrcAlphaSaturateFactor;
  var SrcColorFactor = window.THREE.SrcColorFactor;
  var StaticCopyUsage = window.THREE.StaticCopyUsage;
  var StaticDrawUsage = window.THREE.StaticDrawUsage;
  var StaticReadUsage = window.THREE.StaticReadUsage;
  var StereoCamera = window.THREE.StereoCamera;
  var StreamCopyUsage = window.THREE.StreamCopyUsage;
  var StreamDrawUsage = window.THREE.StreamDrawUsage;
  var StreamReadUsage = window.THREE.StreamReadUsage;
  var StringKeyframeTrack = window.THREE.StringKeyframeTrack;
  var SubtractEquation = window.THREE.SubtractEquation;
  var SubtractiveBlending = window.THREE.SubtractiveBlending;
  var TOUCH = window.THREE.TOUCH;
  var TangentSpaceNormalMap = window.THREE.TangentSpaceNormalMap;
  var TetrahedronBufferGeometry = window.THREE.TetrahedronBufferGeometry;
  var TetrahedronGeometry = window.THREE.TetrahedronGeometry;
  var TextBufferGeometry = window.THREE.TextBufferGeometry;
  var TextGeometry = window.THREE.TextGeometry;
  var Texture = window.THREE.Texture;
  var TextureLoader = window.THREE.TextureLoader;
  var TorusBufferGeometry = window.THREE.TorusBufferGeometry;
  var TorusGeometry = window.THREE.TorusGeometry;
  var TorusKnotBufferGeometry = window.THREE.TorusKnotBufferGeometry;
  var TorusKnotGeometry = window.THREE.TorusKnotGeometry;
  var Triangle = window.THREE.Triangle;
  var TriangleFanDrawMode = window.THREE.TriangleFanDrawMode;
  var TriangleStripDrawMode = window.THREE.TriangleStripDrawMode;
  var TrianglesDrawMode = window.THREE.TrianglesDrawMode;
  var TubeBufferGeometry = window.THREE.TubeBufferGeometry;
  var TubeGeometry = window.THREE.TubeGeometry;
  var UVMapping = window.THREE.UVMapping;
  var Uint16Attribute = window.THREE.Uint16Attribute;
  var Uint16BufferAttribute = window.THREE.Uint16BufferAttribute;
  var Uint32Attribute = window.THREE.Uint32Attribute;
  var Uint32BufferAttribute = window.THREE.Uint32BufferAttribute;
  var Uint8Attribute = window.THREE.Uint8Attribute;
  var Uint8BufferAttribute = window.THREE.Uint8BufferAttribute;
  var Uint8ClampedAttribute = window.THREE.Uint8ClampedAttribute;
  var Uint8ClampedBufferAttribute = window.THREE.Uint8ClampedBufferAttribute;
  var Uniform = window.THREE.Uniform;
  var UniformsLib = window.THREE.UniformsLib;
  var UniformsUtils = window.THREE.UniformsUtils;
  var UnsignedByteType = window.THREE.UnsignedByteType;
  var UnsignedInt248Type = window.THREE.UnsignedInt248Type;
  var UnsignedIntType = window.THREE.UnsignedIntType;
  var UnsignedShort4444Type = window.THREE.UnsignedShort4444Type;
  var UnsignedShort5551Type = window.THREE.UnsignedShort5551Type;
  var UnsignedShort565Type = window.THREE.UnsignedShort565Type;
  var UnsignedShortType = window.THREE.UnsignedShortType;
  var VSMShadowMap = window.THREE.VSMShadowMap;
  var Vector2 = window.THREE.Vector2;
  var Vector3 = window.THREE.Vector3;
  var Vector4 = window.THREE.Vector4;
  var VectorKeyframeTrack = window.THREE.VectorKeyframeTrack;
  var Vertex = window.THREE.Vertex;
  var VertexColors = window.THREE.VertexColors;
  var VideoTexture = window.THREE.VideoTexture;
  var WebGL1Renderer = window.THREE.WebGL1Renderer;
  var WebGLCubeRenderTarget = window.THREE.WebGLCubeRenderTarget;
  var WebGLMultisampleRenderTarget = window.THREE.WebGLMultisampleRenderTarget;
  var WebGLRenderTarget = window.THREE.WebGLRenderTarget;
  var WebGLRenderTargetCube = window.THREE.WebGLRenderTargetCube;
  var WebGLRenderer = window.THREE.WebGLRenderer;
  var WebGLUtils = window.THREE.WebGLUtils;
  var WireframeGeometry = window.THREE.WireframeGeometry;
  var WireframeHelper = window.THREE.WireframeHelper;
  var WrapAroundEnding = window.THREE.WrapAroundEnding;
  var XHRLoader = window.THREE.XHRLoader;
  var ZeroCurvatureEnding = window.THREE.ZeroCurvatureEnding;
  var ZeroFactor = window.THREE.ZeroFactor;
  var ZeroSlopeEnding = window.THREE.ZeroSlopeEnding;
  var ZeroStencilOp = window.THREE.ZeroStencilOp;
  var sRGBEncoding = window.THREE.sRGBEncoding;

  // node_modules/dat.gui/build/dat.gui.module.js
  function ___$insertStyle(css2) {
    if (!css2) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    var style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = css2;
    document.head.appendChild(style);
    return css2;
  }
  function colorToString(color, forceCSSHex) {
    var colorFormat = color.__state.conversionName.toString();
    var r = Math.round(color.r);
    var g = Math.round(color.g);
    var b = Math.round(color.b);
    var a = color.a;
    var h2 = Math.round(color.h);
    var s = color.s.toFixed(1);
    var v = color.v.toFixed(1);
    if (forceCSSHex || colorFormat === "THREE_CHAR_HEX" || colorFormat === "SIX_CHAR_HEX") {
      var str = color.hex.toString(16);
      while (str.length < 6) {
        str = "0" + str;
      }
      return "#" + str;
    } else if (colorFormat === "CSS_RGB") {
      return "rgb(" + r + "," + g + "," + b + ")";
    } else if (colorFormat === "CSS_RGBA") {
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    } else if (colorFormat === "HEX") {
      return "0x" + color.hex.toString(16);
    } else if (colorFormat === "RGB_ARRAY") {
      return "[" + r + "," + g + "," + b + "]";
    } else if (colorFormat === "RGBA_ARRAY") {
      return "[" + r + "," + g + "," + b + "," + a + "]";
    } else if (colorFormat === "RGB_OBJ") {
      return "{r:" + r + ",g:" + g + ",b:" + b + "}";
    } else if (colorFormat === "RGBA_OBJ") {
      return "{r:" + r + ",g:" + g + ",b:" + b + ",a:" + a + "}";
    } else if (colorFormat === "HSV_OBJ") {
      return "{h:" + h2 + ",s:" + s + ",v:" + v + "}";
    } else if (colorFormat === "HSVA_OBJ") {
      return "{h:" + h2 + ",s:" + s + ",v:" + v + ",a:" + a + "}";
    }
    return "unknown format";
  }
  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;
  var Common = {
    BREAK: {},
    extend: function extend(target) {
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function(key) {
          if (!this.isUndefined(obj[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    defaults: function defaults(target) {
      this.each(ARR_SLICE.call(arguments, 1), function(obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function(key) {
          if (this.isUndefined(target[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    compose: function compose() {
      var toCall = ARR_SLICE.call(arguments);
      return function() {
        var args = ARR_SLICE.call(arguments);
        for (var i = toCall.length - 1; i >= 0; i--) {
          args = [toCall[i].apply(this, args)];
        }
        return args[0];
      };
    },
    each: function each(obj, itr, scope) {
      if (!obj) {
        return;
      }
      if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
        obj.forEach(itr, scope);
      } else if (obj.length === obj.length + 0) {
        var key = void 0;
        var l = void 0;
        for (key = 0, l = obj.length; key < l; key++) {
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
            return;
          }
        }
      } else {
        for (var _key in obj) {
          if (itr.call(scope, obj[_key], _key) === this.BREAK) {
            return;
          }
        }
      }
    },
    defer: function defer(fnc) {
      setTimeout(fnc, 0);
    },
    debounce: function debounce(func, threshold, callImmediately) {
      var timeout = void 0;
      return function() {
        var obj = this;
        var args = arguments;
        function delayed() {
          timeout = null;
          if (!callImmediately)
            func.apply(obj, args);
        }
        var callNow = callImmediately || !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(delayed, threshold);
        if (callNow) {
          func.apply(obj, args);
        }
      };
    },
    toArray: function toArray(obj) {
      if (obj.toArray)
        return obj.toArray();
      return ARR_SLICE.call(obj);
    },
    isUndefined: function isUndefined(obj) {
      return obj === void 0;
    },
    isNull: function isNull(obj) {
      return obj === null;
    },
    isNaN: function(_isNaN) {
      function isNaN2(_x) {
        return _isNaN.apply(this, arguments);
      }
      isNaN2.toString = function() {
        return _isNaN.toString();
      };
      return isNaN2;
    }(function(obj) {
      return isNaN(obj);
    }),
    isArray: Array.isArray || function(obj) {
      return obj.constructor === Array;
    },
    isObject: function isObject(obj) {
      return obj === Object(obj);
    },
    isNumber: function isNumber(obj) {
      return obj === obj + 0;
    },
    isString: function isString(obj) {
      return obj === obj + "";
    },
    isBoolean: function isBoolean(obj) {
      return obj === false || obj === true;
    },
    isFunction: function isFunction(obj) {
      return obj instanceof Function;
    }
  };
  var INTERPRETATIONS = [
    {
      litmus: Common.isString,
      conversions: {
        THREE_CHAR_HEX: {
          read: function read(original) {
            var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
            if (test === null) {
              return false;
            }
            return {
              space: "HEX",
              hex: parseInt("0x" + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
            };
          },
          write: colorToString
        },
        SIX_CHAR_HEX: {
          read: function read2(original) {
            var test = original.match(/^#([A-F0-9]{6})$/i);
            if (test === null) {
              return false;
            }
            return {
              space: "HEX",
              hex: parseInt("0x" + test[1].toString(), 0)
            };
          },
          write: colorToString
        },
        CSS_RGB: {
          read: function read3(original) {
            var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) {
              return false;
            }
            return {
              space: "RGB",
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3])
            };
          },
          write: colorToString
        },
        CSS_RGBA: {
          read: function read4(original) {
            var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
            if (test === null) {
              return false;
            }
            return {
              space: "RGB",
              r: parseFloat(test[1]),
              g: parseFloat(test[2]),
              b: parseFloat(test[3]),
              a: parseFloat(test[4])
            };
          },
          write: colorToString
        }
      }
    },
    {
      litmus: Common.isNumber,
      conversions: {
        HEX: {
          read: function read5(original) {
            return {
              space: "HEX",
              hex: original,
              conversionName: "HEX"
            };
          },
          write: function write(color) {
            return color.hex;
          }
        }
      }
    },
    {
      litmus: Common.isArray,
      conversions: {
        RGB_ARRAY: {
          read: function read6(original) {
            if (original.length !== 3) {
              return false;
            }
            return {
              space: "RGB",
              r: original[0],
              g: original[1],
              b: original[2]
            };
          },
          write: function write2(color) {
            return [color.r, color.g, color.b];
          }
        },
        RGBA_ARRAY: {
          read: function read7(original) {
            if (original.length !== 4)
              return false;
            return {
              space: "RGB",
              r: original[0],
              g: original[1],
              b: original[2],
              a: original[3]
            };
          },
          write: function write3(color) {
            return [color.r, color.g, color.b, color.a];
          }
        }
      }
    },
    {
      litmus: Common.isObject,
      conversions: {
        RGBA_OBJ: {
          read: function read8(original) {
            if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
              return {
                space: "RGB",
                r: original.r,
                g: original.g,
                b: original.b,
                a: original.a
              };
            }
            return false;
          },
          write: function write4(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b,
              a: color.a
            };
          }
        },
        RGB_OBJ: {
          read: function read9(original) {
            if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
              return {
                space: "RGB",
                r: original.r,
                g: original.g,
                b: original.b
              };
            }
            return false;
          },
          write: function write5(color) {
            return {
              r: color.r,
              g: color.g,
              b: color.b
            };
          }
        },
        HSVA_OBJ: {
          read: function read10(original) {
            if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
              return {
                space: "HSV",
                h: original.h,
                s: original.s,
                v: original.v,
                a: original.a
              };
            }
            return false;
          },
          write: function write6(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v,
              a: color.a
            };
          }
        },
        HSV_OBJ: {
          read: function read11(original) {
            if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
              return {
                space: "HSV",
                h: original.h,
                s: original.s,
                v: original.v
              };
            }
            return false;
          },
          write: function write7(color) {
            return {
              h: color.h,
              s: color.s,
              v: color.v
            };
          }
        }
      }
    }
  ];
  var result = void 0;
  var toReturn = void 0;
  var interpret = function interpret2() {
    toReturn = false;
    var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
    Common.each(INTERPRETATIONS, function(family) {
      if (family.litmus(original)) {
        Common.each(family.conversions, function(conversion, conversionName) {
          result = conversion.read(original);
          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return Common.BREAK;
          }
        });
        return Common.BREAK;
      }
    });
    return toReturn;
  };
  var tmpComponent = void 0;
  var ColorMath = {
    hsv_to_rgb: function hsv_to_rgb(h2, s, v) {
      var hi = Math.floor(h2 / 60) % 6;
      var f = h2 / 60 - Math.floor(h2 / 60);
      var p = v * (1 - s);
      var q = v * (1 - f * s);
      var t = v * (1 - (1 - f) * s);
      var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };
    },
    rgb_to_hsv: function rgb_to_hsv(r, g, b) {
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var delta = max - min;
      var h2 = void 0;
      var s = void 0;
      if (max !== 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }
      if (r === max) {
        h2 = (g - b) / delta;
      } else if (g === max) {
        h2 = 2 + (b - r) / delta;
      } else {
        h2 = 4 + (r - g) / delta;
      }
      h2 /= 6;
      if (h2 < 0) {
        h2 += 1;
      }
      return {
        h: h2 * 360,
        s,
        v: max / 255
      };
    },
    rgb_to_hex: function rgb_to_hex(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },
    component_from_hex: function component_from_hex(hex, componentIndex) {
      return hex >> componentIndex * 8 & 255;
    },
    hex_with_component: function hex_with_component(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | hex & ~(255 << tmpComponent);
    }
  };
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  var classCallCheck = function(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };
  var createClass = function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor)
          descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps)
        defineProperties(Constructor.prototype, protoProps);
      if (staticProps)
        defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();
  var get = function get2(object, property, receiver) {
    if (object === null)
      object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);
    if (desc === void 0) {
      var parent = Object.getPrototypeOf(object);
      if (parent === null) {
        return void 0;
      } else {
        return get2(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;
      if (getter === void 0) {
        return void 0;
      }
      return getter.call(receiver);
    }
  };
  var inherits = function(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass)
      Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };
  var possibleConstructorReturn = function(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };
  var Color2 = function() {
    function Color3() {
      classCallCheck(this, Color3);
      this.__state = interpret.apply(this, arguments);
      if (this.__state === false) {
        throw new Error("Failed to interpret color arguments");
      }
      this.__state.a = this.__state.a || 1;
    }
    createClass(Color3, [{
      key: "toString",
      value: function toString() {
        return colorToString(this);
      }
    }, {
      key: "toHexString",
      value: function toHexString() {
        return colorToString(this, true);
      }
    }, {
      key: "toOriginal",
      value: function toOriginal() {
        return this.__state.conversion.write(this);
      }
    }]);
    return Color3;
  }();
  function defineRGBComponent(target, component, componentHexIndex) {
    Object.defineProperty(target, component, {
      get: function get$$13() {
        if (this.__state.space === "RGB") {
          return this.__state[component];
        }
        Color2.recalculateRGB(this, component, componentHexIndex);
        return this.__state[component];
      },
      set: function set$$13(v) {
        if (this.__state.space !== "RGB") {
          Color2.recalculateRGB(this, component, componentHexIndex);
          this.__state.space = "RGB";
        }
        this.__state[component] = v;
      }
    });
  }
  function defineHSVComponent(target, component) {
    Object.defineProperty(target, component, {
      get: function get$$13() {
        if (this.__state.space === "HSV") {
          return this.__state[component];
        }
        Color2.recalculateHSV(this);
        return this.__state[component];
      },
      set: function set$$13(v) {
        if (this.__state.space !== "HSV") {
          Color2.recalculateHSV(this);
          this.__state.space = "HSV";
        }
        this.__state[component] = v;
      }
    });
  }
  Color2.recalculateRGB = function(color, component, componentHexIndex) {
    if (color.__state.space === "HEX") {
      color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
    } else if (color.__state.space === "HSV") {
      Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
    } else {
      throw new Error("Corrupted color state");
    }
  };
  Color2.recalculateHSV = function(color) {
    var result2 = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
    Common.extend(color.__state, {
      s: result2.s,
      v: result2.v
    });
    if (!Common.isNaN(result2.h)) {
      color.__state.h = result2.h;
    } else if (Common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }
  };
  Color2.COMPONENTS = ["r", "g", "b", "h", "s", "v", "hex", "a"];
  defineRGBComponent(Color2.prototype, "r", 2);
  defineRGBComponent(Color2.prototype, "g", 1);
  defineRGBComponent(Color2.prototype, "b", 0);
  defineHSVComponent(Color2.prototype, "h");
  defineHSVComponent(Color2.prototype, "s");
  defineHSVComponent(Color2.prototype, "v");
  Object.defineProperty(Color2.prototype, "a", {
    get: function get$$1() {
      return this.__state.a;
    },
    set: function set$$1(v) {
      this.__state.a = v;
    }
  });
  Object.defineProperty(Color2.prototype, "hex", {
    get: function get$$12() {
      if (this.__state.space !== "HEX") {
        this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
        this.__state.space = "HEX";
      }
      return this.__state.hex;
    },
    set: function set$$12(v) {
      this.__state.space = "HEX";
      this.__state.hex = v;
    }
  });
  var Controller = function() {
    function Controller2(object, property) {
      classCallCheck(this, Controller2);
      this.initialValue = object[property];
      this.domElement = document.createElement("div");
      this.object = object;
      this.property = property;
      this.__onChange = void 0;
      this.__onFinishChange = void 0;
    }
    createClass(Controller2, [{
      key: "onChange",
      value: function onChange(fnc) {
        this.__onChange = fnc;
        return this;
      }
    }, {
      key: "onFinishChange",
      value: function onFinishChange(fnc) {
        this.__onFinishChange = fnc;
        return this;
      }
    }, {
      key: "setValue",
      value: function setValue(newValue) {
        this.object[this.property] = newValue;
        if (this.__onChange) {
          this.__onChange.call(this, newValue);
        }
        this.updateDisplay();
        return this;
      }
    }, {
      key: "getValue",
      value: function getValue() {
        return this.object[this.property];
      }
    }, {
      key: "updateDisplay",
      value: function updateDisplay2() {
        return this;
      }
    }, {
      key: "isModified",
      value: function isModified() {
        return this.initialValue !== this.getValue();
      }
    }]);
    return Controller2;
  }();
  var EVENT_MAP = {
    HTMLEvents: ["change"],
    MouseEvents: ["click", "mousemove", "mousedown", "mouseup", "mouseover"],
    KeyboardEvents: ["keydown"]
  };
  var EVENT_MAP_INV = {};
  Common.each(EVENT_MAP, function(v, k) {
    Common.each(v, function(e) {
      EVENT_MAP_INV[e] = k;
    });
  });
  var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
  function cssValueToPixels(val) {
    if (val === "0" || Common.isUndefined(val)) {
      return 0;
    }
    var match = val.match(CSS_VALUE_PIXELS);
    if (!Common.isNull(match)) {
      return parseFloat(match[1]);
    }
    return 0;
  }
  var dom = {
    makeSelectable: function makeSelectable(elem, selectable) {
      if (elem === void 0 || elem.style === void 0)
        return;
      elem.onselectstart = selectable ? function() {
        return false;
      } : function() {
      };
      elem.style.MozUserSelect = selectable ? "auto" : "none";
      elem.style.KhtmlUserSelect = selectable ? "auto" : "none";
      elem.unselectable = selectable ? "on" : "off";
    },
    makeFullscreen: function makeFullscreen(elem, hor, vert) {
      var vertical = vert;
      var horizontal = hor;
      if (Common.isUndefined(horizontal)) {
        horizontal = true;
      }
      if (Common.isUndefined(vertical)) {
        vertical = true;
      }
      elem.style.position = "absolute";
      if (horizontal) {
        elem.style.left = 0;
        elem.style.right = 0;
      }
      if (vertical) {
        elem.style.top = 0;
        elem.style.bottom = 0;
      }
    },
    fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
      var params2 = pars || {};
      var className = EVENT_MAP_INV[eventType];
      if (!className) {
        throw new Error("Event type " + eventType + " not supported.");
      }
      var evt = document.createEvent(className);
      switch (className) {
        case "MouseEvents": {
          var clientX = params2.x || params2.clientX || 0;
          var clientY = params2.y || params2.clientY || 0;
          evt.initMouseEvent(eventType, params2.bubbles || false, params2.cancelable || true, window, params2.clickCount || 1, 0, 0, clientX, clientY, false, false, false, false, 0, null);
          break;
        }
        case "KeyboardEvents": {
          var init = evt.initKeyboardEvent || evt.initKeyEvent;
          Common.defaults(params2, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: void 0,
            charCode: void 0
          });
          init(eventType, params2.bubbles || false, params2.cancelable, window, params2.ctrlKey, params2.altKey, params2.shiftKey, params2.metaKey, params2.keyCode, params2.charCode);
          break;
        }
        default: {
          evt.initEvent(eventType, params2.bubbles || false, params2.cancelable || true);
          break;
        }
      }
      Common.defaults(evt, aux);
      elem.dispatchEvent(evt);
    },
    bind: function bind(elem, event, func, newBool) {
      var bool = newBool || false;
      if (elem.addEventListener) {
        elem.addEventListener(event, func, bool);
      } else if (elem.attachEvent) {
        elem.attachEvent("on" + event, func);
      }
      return dom;
    },
    unbind: function unbind(elem, event, func, newBool) {
      var bool = newBool || false;
      if (elem.removeEventListener) {
        elem.removeEventListener(event, func, bool);
      } else if (elem.detachEvent) {
        elem.detachEvent("on" + event, func);
      }
      return dom;
    },
    addClass: function addClass(elem, className) {
      if (elem.className === void 0) {
        elem.className = className;
      } else if (elem.className !== className) {
        var classes = elem.className.split(/ +/);
        if (classes.indexOf(className) === -1) {
          classes.push(className);
          elem.className = classes.join(" ").replace(/^\s+/, "").replace(/\s+$/, "");
        }
      }
      return dom;
    },
    removeClass: function removeClass(elem, className) {
      if (className) {
        if (elem.className === className) {
          elem.removeAttribute("class");
        } else {
          var classes = elem.className.split(/ +/);
          var index = classes.indexOf(className);
          if (index !== -1) {
            classes.splice(index, 1);
            elem.className = classes.join(" ");
          }
        }
      } else {
        elem.className = void 0;
      }
      return dom;
    },
    hasClass: function hasClass(elem, className) {
      return new RegExp("(?:^|\\s+)" + className + "(?:\\s+|$)").test(elem.className) || false;
    },
    getWidth: function getWidth(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style["border-left-width"]) + cssValueToPixels(style["border-right-width"]) + cssValueToPixels(style["padding-left"]) + cssValueToPixels(style["padding-right"]) + cssValueToPixels(style.width);
    },
    getHeight: function getHeight(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style["border-top-width"]) + cssValueToPixels(style["border-bottom-width"]) + cssValueToPixels(style["padding-top"]) + cssValueToPixels(style["padding-bottom"]) + cssValueToPixels(style.height);
    },
    getOffset: function getOffset(el) {
      var elem = el;
      var offset = {left: 0, top: 0};
      if (elem.offsetParent) {
        do {
          offset.left += elem.offsetLeft;
          offset.top += elem.offsetTop;
          elem = elem.offsetParent;
        } while (elem);
      }
      return offset;
    },
    isActive: function isActive(elem) {
      return elem === document.activeElement && (elem.type || elem.href);
    }
  };
  var BooleanController = function(_Controller) {
    inherits(BooleanController2, _Controller);
    function BooleanController2(object, property) {
      classCallCheck(this, BooleanController2);
      var _this2 = possibleConstructorReturn(this, (BooleanController2.__proto__ || Object.getPrototypeOf(BooleanController2)).call(this, object, property));
      var _this = _this2;
      _this2.__prev = _this2.getValue();
      _this2.__checkbox = document.createElement("input");
      _this2.__checkbox.setAttribute("type", "checkbox");
      function onChange() {
        _this.setValue(!_this.__prev);
      }
      dom.bind(_this2.__checkbox, "change", onChange, false);
      _this2.domElement.appendChild(_this2.__checkbox);
      _this2.updateDisplay();
      return _this2;
    }
    createClass(BooleanController2, [{
      key: "setValue",
      value: function setValue(v) {
        var toReturn2 = get(BooleanController2.prototype.__proto__ || Object.getPrototypeOf(BooleanController2.prototype), "setValue", this).call(this, v);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
        this.__prev = this.getValue();
        return toReturn2;
      }
    }, {
      key: "updateDisplay",
      value: function updateDisplay2() {
        if (this.getValue() === true) {
          this.__checkbox.setAttribute("checked", "checked");
          this.__checkbox.checked = true;
          this.__prev = true;
        } else {
          this.__checkbox.checked = false;
          this.__prev = false;
        }
        return get(BooleanController2.prototype.__proto__ || Object.getPrototypeOf(BooleanController2.prototype), "updateDisplay", this).call(this);
      }
    }]);
    return BooleanController2;
  }(Controller);
  var OptionController = function(_Controller) {
    inherits(OptionController2, _Controller);
    function OptionController2(object, property, opts) {
      classCallCheck(this, OptionController2);
      var _this2 = possibleConstructorReturn(this, (OptionController2.__proto__ || Object.getPrototypeOf(OptionController2)).call(this, object, property));
      var options = opts;
      var _this = _this2;
      _this2.__select = document.createElement("select");
      if (Common.isArray(options)) {
        var map2 = {};
        Common.each(options, function(element) {
          map2[element] = element;
        });
        options = map2;
      }
      Common.each(options, function(value, key) {
        var opt = document.createElement("option");
        opt.innerHTML = key;
        opt.setAttribute("value", value);
        _this.__select.appendChild(opt);
      });
      _this2.updateDisplay();
      dom.bind(_this2.__select, "change", function() {
        var desiredValue = this.options[this.selectedIndex].value;
        _this.setValue(desiredValue);
      });
      _this2.domElement.appendChild(_this2.__select);
      return _this2;
    }
    createClass(OptionController2, [{
      key: "setValue",
      value: function setValue(v) {
        var toReturn2 = get(OptionController2.prototype.__proto__ || Object.getPrototypeOf(OptionController2.prototype), "setValue", this).call(this, v);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
        return toReturn2;
      }
    }, {
      key: "updateDisplay",
      value: function updateDisplay2() {
        if (dom.isActive(this.__select))
          return this;
        this.__select.value = this.getValue();
        return get(OptionController2.prototype.__proto__ || Object.getPrototypeOf(OptionController2.prototype), "updateDisplay", this).call(this);
      }
    }]);
    return OptionController2;
  }(Controller);
  var StringController = function(_Controller) {
    inherits(StringController2, _Controller);
    function StringController2(object, property) {
      classCallCheck(this, StringController2);
      var _this2 = possibleConstructorReturn(this, (StringController2.__proto__ || Object.getPrototypeOf(StringController2)).call(this, object, property));
      var _this = _this2;
      function onChange() {
        _this.setValue(_this.__input.value);
      }
      function onBlur() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      _this2.__input = document.createElement("input");
      _this2.__input.setAttribute("type", "text");
      dom.bind(_this2.__input, "keyup", onChange);
      dom.bind(_this2.__input, "change", onChange);
      dom.bind(_this2.__input, "blur", onBlur);
      dom.bind(_this2.__input, "keydown", function(e) {
        if (e.keyCode === 13) {
          this.blur();
        }
      });
      _this2.updateDisplay();
      _this2.domElement.appendChild(_this2.__input);
      return _this2;
    }
    createClass(StringController2, [{
      key: "updateDisplay",
      value: function updateDisplay2() {
        if (!dom.isActive(this.__input)) {
          this.__input.value = this.getValue();
        }
        return get(StringController2.prototype.__proto__ || Object.getPrototypeOf(StringController2.prototype), "updateDisplay", this).call(this);
      }
    }]);
    return StringController2;
  }(Controller);
  function numDecimals(x) {
    var _x = x.toString();
    if (_x.indexOf(".") > -1) {
      return _x.length - _x.indexOf(".") - 1;
    }
    return 0;
  }
  var NumberController = function(_Controller) {
    inherits(NumberController2, _Controller);
    function NumberController2(object, property, params2) {
      classCallCheck(this, NumberController2);
      var _this = possibleConstructorReturn(this, (NumberController2.__proto__ || Object.getPrototypeOf(NumberController2)).call(this, object, property));
      var _params = params2 || {};
      _this.__min = _params.min;
      _this.__max = _params.max;
      _this.__step = _params.step;
      if (Common.isUndefined(_this.__step)) {
        if (_this.initialValue === 0) {
          _this.__impliedStep = 1;
        } else {
          _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
        }
      } else {
        _this.__impliedStep = _this.__step;
      }
      _this.__precision = numDecimals(_this.__impliedStep);
      return _this;
    }
    createClass(NumberController2, [{
      key: "setValue",
      value: function setValue(v) {
        var _v = v;
        if (this.__min !== void 0 && _v < this.__min) {
          _v = this.__min;
        } else if (this.__max !== void 0 && _v > this.__max) {
          _v = this.__max;
        }
        if (this.__step !== void 0 && _v % this.__step !== 0) {
          _v = Math.round(_v / this.__step) * this.__step;
        }
        return get(NumberController2.prototype.__proto__ || Object.getPrototypeOf(NumberController2.prototype), "setValue", this).call(this, _v);
      }
    }, {
      key: "min",
      value: function min(minValue) {
        this.__min = minValue;
        return this;
      }
    }, {
      key: "max",
      value: function max(maxValue) {
        this.__max = maxValue;
        return this;
      }
    }, {
      key: "step",
      value: function step(stepValue) {
        this.__step = stepValue;
        this.__impliedStep = stepValue;
        this.__precision = numDecimals(stepValue);
        return this;
      }
    }]);
    return NumberController2;
  }(Controller);
  function roundToDecimal(value, decimals) {
    var tenTo = Math.pow(10, decimals);
    return Math.round(value * tenTo) / tenTo;
  }
  var NumberControllerBox = function(_NumberController) {
    inherits(NumberControllerBox2, _NumberController);
    function NumberControllerBox2(object, property, params2) {
      classCallCheck(this, NumberControllerBox2);
      var _this2 = possibleConstructorReturn(this, (NumberControllerBox2.__proto__ || Object.getPrototypeOf(NumberControllerBox2)).call(this, object, property, params2));
      _this2.__truncationSuspended = false;
      var _this = _this2;
      var prevY = void 0;
      function onChange() {
        var attempted = parseFloat(_this.__input.value);
        if (!Common.isNaN(attempted)) {
          _this.setValue(attempted);
        }
      }
      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      function onBlur() {
        onFinish();
      }
      function onMouseDrag(e) {
        var diff = prevY - e.clientY;
        _this.setValue(_this.getValue() + diff * _this.__impliedStep);
        prevY = e.clientY;
      }
      function onMouseUp() {
        dom.unbind(window, "mousemove", onMouseDrag);
        dom.unbind(window, "mouseup", onMouseUp);
        onFinish();
      }
      function onMouseDown(e) {
        dom.bind(window, "mousemove", onMouseDrag);
        dom.bind(window, "mouseup", onMouseUp);
        prevY = e.clientY;
      }
      _this2.__input = document.createElement("input");
      _this2.__input.setAttribute("type", "text");
      dom.bind(_this2.__input, "change", onChange);
      dom.bind(_this2.__input, "blur", onBlur);
      dom.bind(_this2.__input, "mousedown", onMouseDown);
      dom.bind(_this2.__input, "keydown", function(e) {
        if (e.keyCode === 13) {
          _this.__truncationSuspended = true;
          this.blur();
          _this.__truncationSuspended = false;
          onFinish();
        }
      });
      _this2.updateDisplay();
      _this2.domElement.appendChild(_this2.__input);
      return _this2;
    }
    createClass(NumberControllerBox2, [{
      key: "updateDisplay",
      value: function updateDisplay2() {
        this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
        return get(NumberControllerBox2.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox2.prototype), "updateDisplay", this).call(this);
      }
    }]);
    return NumberControllerBox2;
  }(NumberController);
  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }
  var NumberControllerSlider = function(_NumberController) {
    inherits(NumberControllerSlider2, _NumberController);
    function NumberControllerSlider2(object, property, min, max, step) {
      classCallCheck(this, NumberControllerSlider2);
      var _this2 = possibleConstructorReturn(this, (NumberControllerSlider2.__proto__ || Object.getPrototypeOf(NumberControllerSlider2)).call(this, object, property, {min, max, step}));
      var _this = _this2;
      _this2.__background = document.createElement("div");
      _this2.__foreground = document.createElement("div");
      dom.bind(_this2.__background, "mousedown", onMouseDown);
      dom.bind(_this2.__background, "touchstart", onTouchStart);
      dom.addClass(_this2.__background, "slider");
      dom.addClass(_this2.__foreground, "slider-fg");
      function onMouseDown(e) {
        document.activeElement.blur();
        dom.bind(window, "mousemove", onMouseDrag);
        dom.bind(window, "mouseup", onMouseUp);
        onMouseDrag(e);
      }
      function onMouseDrag(e) {
        e.preventDefault();
        var bgRect = _this.__background.getBoundingClientRect();
        _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
        return false;
      }
      function onMouseUp() {
        dom.unbind(window, "mousemove", onMouseDrag);
        dom.unbind(window, "mouseup", onMouseUp);
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      function onTouchStart(e) {
        if (e.touches.length !== 1) {
          return;
        }
        dom.bind(window, "touchmove", onTouchMove);
        dom.bind(window, "touchend", onTouchEnd);
        onTouchMove(e);
      }
      function onTouchMove(e) {
        var clientX = e.touches[0].clientX;
        var bgRect = _this.__background.getBoundingClientRect();
        _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      }
      function onTouchEnd() {
        dom.unbind(window, "touchmove", onTouchMove);
        dom.unbind(window, "touchend", onTouchEnd);
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      _this2.updateDisplay();
      _this2.__background.appendChild(_this2.__foreground);
      _this2.domElement.appendChild(_this2.__background);
      return _this2;
    }
    createClass(NumberControllerSlider2, [{
      key: "updateDisplay",
      value: function updateDisplay2() {
        var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
        this.__foreground.style.width = pct * 100 + "%";
        return get(NumberControllerSlider2.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider2.prototype), "updateDisplay", this).call(this);
      }
    }]);
    return NumberControllerSlider2;
  }(NumberController);
  var FunctionController = function(_Controller) {
    inherits(FunctionController2, _Controller);
    function FunctionController2(object, property, text) {
      classCallCheck(this, FunctionController2);
      var _this2 = possibleConstructorReturn(this, (FunctionController2.__proto__ || Object.getPrototypeOf(FunctionController2)).call(this, object, property));
      var _this = _this2;
      _this2.__button = document.createElement("div");
      _this2.__button.innerHTML = text === void 0 ? "Fire" : text;
      dom.bind(_this2.__button, "click", function(e) {
        e.preventDefault();
        _this.fire();
        return false;
      });
      dom.addClass(_this2.__button, "button");
      _this2.domElement.appendChild(_this2.__button);
      return _this2;
    }
    createClass(FunctionController2, [{
      key: "fire",
      value: function fire() {
        if (this.__onChange) {
          this.__onChange.call(this);
        }
        this.getValue().call(this.object);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
      }
    }]);
    return FunctionController2;
  }(Controller);
  var ColorController = function(_Controller) {
    inherits(ColorController2, _Controller);
    function ColorController2(object, property) {
      classCallCheck(this, ColorController2);
      var _this2 = possibleConstructorReturn(this, (ColorController2.__proto__ || Object.getPrototypeOf(ColorController2)).call(this, object, property));
      _this2.__color = new Color2(_this2.getValue());
      _this2.__temp = new Color2(0);
      var _this = _this2;
      _this2.domElement = document.createElement("div");
      dom.makeSelectable(_this2.domElement, false);
      _this2.__selector = document.createElement("div");
      _this2.__selector.className = "selector";
      _this2.__saturation_field = document.createElement("div");
      _this2.__saturation_field.className = "saturation-field";
      _this2.__field_knob = document.createElement("div");
      _this2.__field_knob.className = "field-knob";
      _this2.__field_knob_border = "2px solid ";
      _this2.__hue_knob = document.createElement("div");
      _this2.__hue_knob.className = "hue-knob";
      _this2.__hue_field = document.createElement("div");
      _this2.__hue_field.className = "hue-field";
      _this2.__input = document.createElement("input");
      _this2.__input.type = "text";
      _this2.__input_textShadow = "0 1px 1px ";
      dom.bind(_this2.__input, "keydown", function(e) {
        if (e.keyCode === 13) {
          onBlur.call(this);
        }
      });
      dom.bind(_this2.__input, "blur", onBlur);
      dom.bind(_this2.__selector, "mousedown", function() {
        dom.addClass(this, "drag").bind(window, "mouseup", function() {
          dom.removeClass(_this.__selector, "drag");
        });
      });
      dom.bind(_this2.__selector, "touchstart", function() {
        dom.addClass(this, "drag").bind(window, "touchend", function() {
          dom.removeClass(_this.__selector, "drag");
        });
      });
      var valueField = document.createElement("div");
      Common.extend(_this2.__selector.style, {
        width: "122px",
        height: "102px",
        padding: "3px",
        backgroundColor: "#222",
        boxShadow: "0px 1px 3px rgba(0,0,0,0.3)"
      });
      Common.extend(_this2.__field_knob.style, {
        position: "absolute",
        width: "12px",
        height: "12px",
        border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? "#fff" : "#000"),
        boxShadow: "0px 1px 3px rgba(0,0,0,0.5)",
        borderRadius: "12px",
        zIndex: 1
      });
      Common.extend(_this2.__hue_knob.style, {
        position: "absolute",
        width: "15px",
        height: "2px",
        borderRight: "4px solid #fff",
        zIndex: 1
      });
      Common.extend(_this2.__saturation_field.style, {
        width: "100px",
        height: "100px",
        border: "1px solid #555",
        marginRight: "3px",
        display: "inline-block",
        cursor: "pointer"
      });
      Common.extend(valueField.style, {
        width: "100%",
        height: "100%",
        background: "none"
      });
      linearGradient(valueField, "top", "rgba(0,0,0,0)", "#000");
      Common.extend(_this2.__hue_field.style, {
        width: "15px",
        height: "100px",
        border: "1px solid #555",
        cursor: "ns-resize",
        position: "absolute",
        top: "3px",
        right: "3px"
      });
      hueGradient(_this2.__hue_field);
      Common.extend(_this2.__input.style, {
        outline: "none",
        textAlign: "center",
        color: "#fff",
        border: 0,
        fontWeight: "bold",
        textShadow: _this2.__input_textShadow + "rgba(0,0,0,0.7)"
      });
      dom.bind(_this2.__saturation_field, "mousedown", fieldDown);
      dom.bind(_this2.__saturation_field, "touchstart", fieldDown);
      dom.bind(_this2.__field_knob, "mousedown", fieldDown);
      dom.bind(_this2.__field_knob, "touchstart", fieldDown);
      dom.bind(_this2.__hue_field, "mousedown", fieldDownH);
      dom.bind(_this2.__hue_field, "touchstart", fieldDownH);
      function fieldDown(e) {
        setSV(e);
        dom.bind(window, "mousemove", setSV);
        dom.bind(window, "touchmove", setSV);
        dom.bind(window, "mouseup", fieldUpSV);
        dom.bind(window, "touchend", fieldUpSV);
      }
      function fieldDownH(e) {
        setH(e);
        dom.bind(window, "mousemove", setH);
        dom.bind(window, "touchmove", setH);
        dom.bind(window, "mouseup", fieldUpH);
        dom.bind(window, "touchend", fieldUpH);
      }
      function fieldUpSV() {
        dom.unbind(window, "mousemove", setSV);
        dom.unbind(window, "touchmove", setSV);
        dom.unbind(window, "mouseup", fieldUpSV);
        dom.unbind(window, "touchend", fieldUpSV);
        onFinish();
      }
      function fieldUpH() {
        dom.unbind(window, "mousemove", setH);
        dom.unbind(window, "touchmove", setH);
        dom.unbind(window, "mouseup", fieldUpH);
        dom.unbind(window, "touchend", fieldUpH);
        onFinish();
      }
      function onBlur() {
        var i = interpret(this.value);
        if (i !== false) {
          _this.__color.__state = i;
          _this.setValue(_this.__color.toOriginal());
        } else {
          this.value = _this.__color.toString();
        }
      }
      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.__color.toOriginal());
        }
      }
      _this2.__saturation_field.appendChild(valueField);
      _this2.__selector.appendChild(_this2.__field_knob);
      _this2.__selector.appendChild(_this2.__saturation_field);
      _this2.__selector.appendChild(_this2.__hue_field);
      _this2.__hue_field.appendChild(_this2.__hue_knob);
      _this2.domElement.appendChild(_this2.__input);
      _this2.domElement.appendChild(_this2.__selector);
      _this2.updateDisplay();
      function setSV(e) {
        if (e.type.indexOf("touch") === -1) {
          e.preventDefault();
        }
        var fieldRect = _this.__saturation_field.getBoundingClientRect();
        var _ref = e.touches && e.touches[0] || e, clientX = _ref.clientX, clientY = _ref.clientY;
        var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
        var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
        if (v > 1) {
          v = 1;
        } else if (v < 0) {
          v = 0;
        }
        if (s > 1) {
          s = 1;
        } else if (s < 0) {
          s = 0;
        }
        _this.__color.v = v;
        _this.__color.s = s;
        _this.setValue(_this.__color.toOriginal());
        return false;
      }
      function setH(e) {
        if (e.type.indexOf("touch") === -1) {
          e.preventDefault();
        }
        var fieldRect = _this.__hue_field.getBoundingClientRect();
        var _ref2 = e.touches && e.touches[0] || e, clientY = _ref2.clientY;
        var h2 = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
        if (h2 > 1) {
          h2 = 1;
        } else if (h2 < 0) {
          h2 = 0;
        }
        _this.__color.h = h2 * 360;
        _this.setValue(_this.__color.toOriginal());
        return false;
      }
      return _this2;
    }
    createClass(ColorController2, [{
      key: "updateDisplay",
      value: function updateDisplay2() {
        var i = interpret(this.getValue());
        if (i !== false) {
          var mismatch = false;
          Common.each(Color2.COMPONENTS, function(component) {
            if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
              mismatch = true;
              return {};
            }
          }, this);
          if (mismatch) {
            Common.extend(this.__color.__state, i);
          }
        }
        Common.extend(this.__temp.__state, this.__color.__state);
        this.__temp.a = 1;
        var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
        var _flip = 255 - flip;
        Common.extend(this.__field_knob.style, {
          marginLeft: 100 * this.__color.s - 7 + "px",
          marginTop: 100 * (1 - this.__color.v) - 7 + "px",
          backgroundColor: this.__temp.toHexString(),
          border: this.__field_knob_border + "rgb(" + flip + "," + flip + "," + flip + ")"
        });
        this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + "px";
        this.__temp.s = 1;
        this.__temp.v = 1;
        linearGradient(this.__saturation_field, "left", "#fff", this.__temp.toHexString());
        this.__input.value = this.__color.toString();
        Common.extend(this.__input.style, {
          backgroundColor: this.__color.toHexString(),
          color: "rgb(" + flip + "," + flip + "," + flip + ")",
          textShadow: this.__input_textShadow + "rgba(" + _flip + "," + _flip + "," + _flip + ",.7)"
        });
      }
    }]);
    return ColorController2;
  }(Controller);
  var vendors = ["-moz-", "-o-", "-webkit-", "-ms-", ""];
  function linearGradient(elem, x, a, b) {
    elem.style.background = "";
    Common.each(vendors, function(vendor) {
      elem.style.cssText += "background: " + vendor + "linear-gradient(" + x + ", " + a + " 0%, " + b + " 100%); ";
    });
  }
  function hueGradient(elem) {
    elem.style.background = "";
    elem.style.cssText += "background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);";
    elem.style.cssText += "background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
    elem.style.cssText += "background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
    elem.style.cssText += "background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
    elem.style.cssText += "background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";
  }
  var css = {
    load: function load(url, indoc) {
      var doc = indoc || document;
      var link = doc.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.href = url;
      doc.getElementsByTagName("head")[0].appendChild(link);
    },
    inject: function inject(cssContent, indoc) {
      var doc = indoc || document;
      var injected = document.createElement("style");
      injected.type = "text/css";
      injected.innerHTML = cssContent;
      var head = doc.getElementsByTagName("head")[0];
      try {
        head.appendChild(injected);
      } catch (e) {
      }
    }
  };
  var saveDialogContents = `<div id="dg-save" class="dg dialogue">

  Here's the new load parameter for your <code>GUI</code>'s constructor:

  <textarea id="dg-new-constructor"></textarea>

  <div id="dg-save-locally">

    <input id="dg-local-storage" type="checkbox"/> Automatically save
    values to <code>localStorage</code> on exit.

    <div id="dg-local-explain">The values saved to <code>localStorage</code> will
      override those passed to <code>dat.GUI</code>'s constructor. This makes it
      easier to work incrementally, but <code>localStorage</code> is fragile,
      and your friends may not see the same values you do.

    </div>

  </div>

</div>`;
  var ControllerFactory = function ControllerFactory2(object, property) {
    var initialValue = object[property];
    if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
      return new OptionController(object, property, arguments[2]);
    }
    if (Common.isNumber(initialValue)) {
      if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
        if (Common.isNumber(arguments[4])) {
          return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
        }
        return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
      }
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerBox(object, property, {min: arguments[2], max: arguments[3], step: arguments[4]});
      }
      return new NumberControllerBox(object, property, {min: arguments[2], max: arguments[3]});
    }
    if (Common.isString(initialValue)) {
      return new StringController(object, property);
    }
    if (Common.isFunction(initialValue)) {
      return new FunctionController(object, property, "");
    }
    if (Common.isBoolean(initialValue)) {
      return new BooleanController(object, property);
    }
    return null;
  };
  function requestAnimationFrame2(callback) {
    setTimeout(callback, 1e3 / 60);
  }
  var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame2;
  var CenteredDiv = function() {
    function CenteredDiv2() {
      classCallCheck(this, CenteredDiv2);
      this.backgroundElement = document.createElement("div");
      Common.extend(this.backgroundElement.style, {
        backgroundColor: "rgba(0,0,0,0.8)",
        top: 0,
        left: 0,
        display: "none",
        zIndex: "1000",
        opacity: 0,
        WebkitTransition: "opacity 0.2s linear",
        transition: "opacity 0.2s linear"
      });
      dom.makeFullscreen(this.backgroundElement);
      this.backgroundElement.style.position = "fixed";
      this.domElement = document.createElement("div");
      Common.extend(this.domElement.style, {
        position: "fixed",
        display: "none",
        zIndex: "1001",
        opacity: 0,
        WebkitTransition: "-webkit-transform 0.2s ease-out, opacity 0.2s linear",
        transition: "transform 0.2s ease-out, opacity 0.2s linear"
      });
      document.body.appendChild(this.backgroundElement);
      document.body.appendChild(this.domElement);
      var _this = this;
      dom.bind(this.backgroundElement, "click", function() {
        _this.hide();
      });
    }
    createClass(CenteredDiv2, [{
      key: "show",
      value: function show2() {
        var _this = this;
        this.backgroundElement.style.display = "block";
        this.domElement.style.display = "block";
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = "scale(1.1)";
        this.layout();
        Common.defer(function() {
          _this.backgroundElement.style.opacity = 1;
          _this.domElement.style.opacity = 1;
          _this.domElement.style.webkitTransform = "scale(1)";
        });
      }
    }, {
      key: "hide",
      value: function hide3() {
        var _this = this;
        var hide4 = function hide5() {
          _this.domElement.style.display = "none";
          _this.backgroundElement.style.display = "none";
          dom.unbind(_this.domElement, "webkitTransitionEnd", hide5);
          dom.unbind(_this.domElement, "transitionend", hide5);
          dom.unbind(_this.domElement, "oTransitionEnd", hide5);
        };
        dom.bind(this.domElement, "webkitTransitionEnd", hide4);
        dom.bind(this.domElement, "transitionend", hide4);
        dom.bind(this.domElement, "oTransitionEnd", hide4);
        this.backgroundElement.style.opacity = 0;
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = "scale(1.1)";
      }
    }, {
      key: "layout",
      value: function layout() {
        this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + "px";
        this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + "px";
      }
    }]);
    return CenteredDiv2;
  }();
  var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");
  css.inject(styleSheet);
  var CSS_NAMESPACE = "dg";
  var HIDE_KEY_CODE = 72;
  var CLOSE_BUTTON_HEIGHT = 20;
  var DEFAULT_DEFAULT_PRESET_NAME = "Default";
  var SUPPORTS_LOCAL_STORAGE = function() {
    try {
      return !!window.localStorage;
    } catch (e) {
      return false;
    }
  }();
  var SAVE_DIALOGUE = void 0;
  var autoPlaceVirgin = true;
  var autoPlaceContainer = void 0;
  var hide = false;
  var hideableGuis = [];
  var GUI = function GUI2(pars) {
    var _this = this;
    var params2 = pars || {};
    this.domElement = document.createElement("div");
    this.__ul = document.createElement("ul");
    this.domElement.appendChild(this.__ul);
    dom.addClass(this.domElement, CSS_NAMESPACE);
    this.__folders = {};
    this.__controllers = [];
    this.__rememberedObjects = [];
    this.__rememberedObjectIndecesToControllers = [];
    this.__listening = [];
    params2 = Common.defaults(params2, {
      closeOnTop: false,
      autoPlace: true,
      width: GUI2.DEFAULT_WIDTH
    });
    params2 = Common.defaults(params2, {
      resizable: params2.autoPlace,
      hideable: params2.autoPlace
    });
    if (!Common.isUndefined(params2.load)) {
      if (params2.preset) {
        params2.load.preset = params2.preset;
      }
    } else {
      params2.load = {preset: DEFAULT_DEFAULT_PRESET_NAME};
    }
    if (Common.isUndefined(params2.parent) && params2.hideable) {
      hideableGuis.push(this);
    }
    params2.resizable = Common.isUndefined(params2.parent) && params2.resizable;
    if (params2.autoPlace && Common.isUndefined(params2.scrollable)) {
      params2.scrollable = true;
    }
    var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, "isLocal")) === "true";
    var saveToLocalStorage = void 0;
    var titleRow = void 0;
    Object.defineProperties(this, {
      parent: {
        get: function get$$13() {
          return params2.parent;
        }
      },
      scrollable: {
        get: function get$$13() {
          return params2.scrollable;
        }
      },
      autoPlace: {
        get: function get$$13() {
          return params2.autoPlace;
        }
      },
      closeOnTop: {
        get: function get$$13() {
          return params2.closeOnTop;
        }
      },
      preset: {
        get: function get$$13() {
          if (_this.parent) {
            return _this.getRoot().preset;
          }
          return params2.load.preset;
        },
        set: function set$$13(v) {
          if (_this.parent) {
            _this.getRoot().preset = v;
          } else {
            params2.load.preset = v;
          }
          setPresetSelectIndex(this);
          _this.revert();
        }
      },
      width: {
        get: function get$$13() {
          return params2.width;
        },
        set: function set$$13(v) {
          params2.width = v;
          setWidth(_this, v);
        }
      },
      name: {
        get: function get$$13() {
          return params2.name;
        },
        set: function set$$13(v) {
          params2.name = v;
          if (titleRow) {
            titleRow.innerHTML = params2.name;
          }
        }
      },
      closed: {
        get: function get$$13() {
          return params2.closed;
        },
        set: function set$$13(v) {
          params2.closed = v;
          if (params2.closed) {
            dom.addClass(_this.__ul, GUI2.CLASS_CLOSED);
          } else {
            dom.removeClass(_this.__ul, GUI2.CLASS_CLOSED);
          }
          this.onResize();
          if (_this.__closeButton) {
            _this.__closeButton.innerHTML = v ? GUI2.TEXT_OPEN : GUI2.TEXT_CLOSED;
          }
        }
      },
      load: {
        get: function get$$13() {
          return params2.load;
        }
      },
      useLocalStorage: {
        get: function get$$13() {
          return useLocalStorage;
        },
        set: function set$$13(bool) {
          if (SUPPORTS_LOCAL_STORAGE) {
            useLocalStorage = bool;
            if (bool) {
              dom.bind(window, "unload", saveToLocalStorage);
            } else {
              dom.unbind(window, "unload", saveToLocalStorage);
            }
            localStorage.setItem(getLocalStorageHash(_this, "isLocal"), bool);
          }
        }
      }
    });
    if (Common.isUndefined(params2.parent)) {
      this.closed = params2.closed || false;
      dom.addClass(this.domElement, GUI2.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);
      if (SUPPORTS_LOCAL_STORAGE) {
        if (useLocalStorage) {
          _this.useLocalStorage = true;
          var savedGui = localStorage.getItem(getLocalStorageHash(this, "gui"));
          if (savedGui) {
            params2.load = JSON.parse(savedGui);
          }
        }
      }
      this.__closeButton = document.createElement("div");
      this.__closeButton.innerHTML = GUI2.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI2.CLASS_CLOSE_BUTTON);
      if (params2.closeOnTop) {
        dom.addClass(this.__closeButton, GUI2.CLASS_CLOSE_TOP);
        this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
      } else {
        dom.addClass(this.__closeButton, GUI2.CLASS_CLOSE_BOTTOM);
        this.domElement.appendChild(this.__closeButton);
      }
      dom.bind(this.__closeButton, "click", function() {
        _this.closed = !_this.closed;
      });
    } else {
      if (params2.closed === void 0) {
        params2.closed = true;
      }
      var titleRowName = document.createTextNode(params2.name);
      dom.addClass(titleRowName, "controller-name");
      titleRow = addRow(_this, titleRowName);
      var onClickTitle = function onClickTitle2(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };
      dom.addClass(this.__ul, GUI2.CLASS_CLOSED);
      dom.addClass(titleRow, "title");
      dom.bind(titleRow, "click", onClickTitle);
      if (!params2.closed) {
        this.closed = false;
      }
    }
    if (params2.autoPlace) {
      if (Common.isUndefined(params2.parent)) {
        if (autoPlaceVirgin) {
          autoPlaceContainer = document.createElement("div");
          dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
          dom.addClass(autoPlaceContainer, GUI2.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(autoPlaceContainer);
          autoPlaceVirgin = false;
        }
        autoPlaceContainer.appendChild(this.domElement);
        dom.addClass(this.domElement, GUI2.CLASS_AUTO_PLACE);
      }
      if (!this.parent) {
        setWidth(_this, params2.width);
      }
    }
    this.__resizeHandler = function() {
      _this.onResizeDebounced();
    };
    dom.bind(window, "resize", this.__resizeHandler);
    dom.bind(this.__ul, "webkitTransitionEnd", this.__resizeHandler);
    dom.bind(this.__ul, "transitionend", this.__resizeHandler);
    dom.bind(this.__ul, "oTransitionEnd", this.__resizeHandler);
    this.onResize();
    if (params2.resizable) {
      addResizeHandle(this);
    }
    saveToLocalStorage = function saveToLocalStorage2() {
      if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, "isLocal")) === "true") {
        localStorage.setItem(getLocalStorageHash(_this, "gui"), JSON.stringify(_this.getSaveObject()));
      }
    };
    this.saveToLocalStorageIfPossible = saveToLocalStorage;
    function resetWidth() {
      var root = _this.getRoot();
      root.width += 1;
      Common.defer(function() {
        root.width -= 1;
      });
    }
    if (!params2.parent) {
      resetWidth();
    }
  };
  GUI.toggleHide = function() {
    hide = !hide;
    Common.each(hideableGuis, function(gui2) {
      gui2.domElement.style.display = hide ? "none" : "";
    });
  };
  GUI.CLASS_AUTO_PLACE = "a";
  GUI.CLASS_AUTO_PLACE_CONTAINER = "ac";
  GUI.CLASS_MAIN = "main";
  GUI.CLASS_CONTROLLER_ROW = "cr";
  GUI.CLASS_TOO_TALL = "taller-than-window";
  GUI.CLASS_CLOSED = "closed";
  GUI.CLASS_CLOSE_BUTTON = "close-button";
  GUI.CLASS_CLOSE_TOP = "close-top";
  GUI.CLASS_CLOSE_BOTTOM = "close-bottom";
  GUI.CLASS_DRAG = "drag";
  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = "Close Controls";
  GUI.TEXT_OPEN = "Open Controls";
  GUI._keydownHandler = function(e) {
    if (document.activeElement.type !== "text" && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }
  };
  dom.bind(window, "keydown", GUI._keydownHandler, false);
  Common.extend(GUI.prototype, {
    add: function add(object, property) {
      return _add(this, object, property, {
        factoryArgs: Array.prototype.slice.call(arguments, 2)
      });
    },
    addColor: function addColor(object, property) {
      return _add(this, object, property, {
        color: true
      });
    },
    remove: function remove(controller) {
      this.__ul.removeChild(controller.__li);
      this.__controllers.splice(this.__controllers.indexOf(controller), 1);
      var _this = this;
      Common.defer(function() {
        _this.onResize();
      });
    },
    destroy: function destroy() {
      if (this.parent) {
        throw new Error("Only the root GUI should be removed with .destroy(). For subfolders, use gui.removeFolder(folder) instead.");
      }
      if (this.autoPlace) {
        autoPlaceContainer.removeChild(this.domElement);
      }
      var _this = this;
      Common.each(this.__folders, function(subfolder) {
        _this.removeFolder(subfolder);
      });
      dom.unbind(window, "keydown", GUI._keydownHandler, false);
      removeListeners(this);
    },
    addFolder: function addFolder(name) {
      if (this.__folders[name] !== void 0) {
        throw new Error('You already have a folder in this GUI by the name "' + name + '"');
      }
      var newGuiParams = {name, parent: this};
      newGuiParams.autoPlace = this.autoPlace;
      if (this.load && this.load.folders && this.load.folders[name]) {
        newGuiParams.closed = this.load.folders[name].closed;
        newGuiParams.load = this.load.folders[name];
      }
      var gui2 = new GUI(newGuiParams);
      this.__folders[name] = gui2;
      var li = addRow(this, gui2.domElement);
      dom.addClass(li, "folder");
      return gui2;
    },
    removeFolder: function removeFolder(folder) {
      this.__ul.removeChild(folder.domElement.parentElement);
      delete this.__folders[folder.name];
      if (this.load && this.load.folders && this.load.folders[folder.name]) {
        delete this.load.folders[folder.name];
      }
      removeListeners(folder);
      var _this = this;
      Common.each(folder.__folders, function(subfolder) {
        folder.removeFolder(subfolder);
      });
      Common.defer(function() {
        _this.onResize();
      });
    },
    open: function open() {
      this.closed = false;
    },
    close: function close() {
      this.closed = true;
    },
    hide: function hide2() {
      this.domElement.style.display = "none";
    },
    show: function show() {
      this.domElement.style.display = "";
    },
    onResize: function onResize() {
      var root = this.getRoot();
      if (root.scrollable) {
        var top = dom.getOffset(root.__ul).top;
        var h2 = 0;
        Common.each(root.__ul.childNodes, function(node) {
          if (!(root.autoPlace && node === root.__save_row)) {
            h2 += dom.getHeight(node);
          }
        });
        if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h2) {
          dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + "px";
        } else {
          dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = "auto";
        }
      }
      if (root.__resize_handle) {
        Common.defer(function() {
          root.__resize_handle.style.height = root.__ul.offsetHeight + "px";
        });
      }
      if (root.__closeButton) {
        root.__closeButton.style.width = root.width + "px";
      }
    },
    onResizeDebounced: Common.debounce(function() {
      this.onResize();
    }, 50),
    remember: function remember() {
      if (Common.isUndefined(SAVE_DIALOGUE)) {
        SAVE_DIALOGUE = new CenteredDiv();
        SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
      }
      if (this.parent) {
        throw new Error("You can only call remember on a top level GUI.");
      }
      var _this = this;
      Common.each(Array.prototype.slice.call(arguments), function(object) {
        if (_this.__rememberedObjects.length === 0) {
          addSaveMenu(_this);
        }
        if (_this.__rememberedObjects.indexOf(object) === -1) {
          _this.__rememberedObjects.push(object);
        }
      });
      if (this.autoPlace) {
        setWidth(this, this.width);
      }
    },
    getRoot: function getRoot() {
      var gui2 = this;
      while (gui2.parent) {
        gui2 = gui2.parent;
      }
      return gui2;
    },
    getSaveObject: function getSaveObject() {
      var toReturn2 = this.load;
      toReturn2.closed = this.closed;
      if (this.__rememberedObjects.length > 0) {
        toReturn2.preset = this.preset;
        if (!toReturn2.remembered) {
          toReturn2.remembered = {};
        }
        toReturn2.remembered[this.preset] = getCurrentPreset(this);
      }
      toReturn2.folders = {};
      Common.each(this.__folders, function(element, key) {
        toReturn2.folders[key] = element.getSaveObject();
      });
      return toReturn2;
    },
    save: function save() {
      if (!this.load.remembered) {
        this.load.remembered = {};
      }
      this.load.remembered[this.preset] = getCurrentPreset(this);
      markPresetModified(this, false);
      this.saveToLocalStorageIfPossible();
    },
    saveAs: function saveAs(presetName) {
      if (!this.load.remembered) {
        this.load.remembered = {};
        this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
      }
      this.load.remembered[presetName] = getCurrentPreset(this);
      this.preset = presetName;
      addPresetOption(this, presetName, true);
      this.saveToLocalStorageIfPossible();
    },
    revert: function revert(gui2) {
      Common.each(this.__controllers, function(controller) {
        if (!this.getRoot().load.remembered) {
          controller.setValue(controller.initialValue);
        } else {
          recallSavedValue(gui2 || this.getRoot(), controller);
        }
        if (controller.__onFinishChange) {
          controller.__onFinishChange.call(controller, controller.getValue());
        }
      }, this);
      Common.each(this.__folders, function(folder) {
        folder.revert(folder);
      });
      if (!gui2) {
        markPresetModified(this.getRoot(), false);
      }
    },
    listen: function listen(controller) {
      var init = this.__listening.length === 0;
      this.__listening.push(controller);
      if (init) {
        updateDisplays(this.__listening);
      }
    },
    updateDisplay: function updateDisplay() {
      Common.each(this.__controllers, function(controller) {
        controller.updateDisplay();
      });
      Common.each(this.__folders, function(folder) {
        folder.updateDisplay();
      });
    }
  });
  function addRow(gui2, newDom, liBefore) {
    var li = document.createElement("li");
    if (newDom) {
      li.appendChild(newDom);
    }
    if (liBefore) {
      gui2.__ul.insertBefore(li, liBefore);
    } else {
      gui2.__ul.appendChild(li);
    }
    gui2.onResize();
    return li;
  }
  function removeListeners(gui2) {
    dom.unbind(window, "resize", gui2.__resizeHandler);
    if (gui2.saveToLocalStorageIfPossible) {
      dom.unbind(window, "unload", gui2.saveToLocalStorageIfPossible);
    }
  }
  function markPresetModified(gui2, modified) {
    var opt = gui2.__preset_select[gui2.__preset_select.selectedIndex];
    if (modified) {
      opt.innerHTML = opt.value + "*";
    } else {
      opt.innerHTML = opt.value;
    }
  }
  function augmentController(gui2, li, controller) {
    controller.__li = li;
    controller.__gui = gui2;
    Common.extend(controller, {
      options: function options(_options) {
        if (arguments.length > 1) {
          var nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui2, controller.object, controller.property, {
            before: nextSibling,
            factoryArgs: [Common.toArray(arguments)]
          });
        }
        if (Common.isArray(_options) || Common.isObject(_options)) {
          var _nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui2, controller.object, controller.property, {
            before: _nextSibling,
            factoryArgs: [_options]
          });
        }
      },
      name: function name(_name) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
        return controller;
      },
      listen: function listen2() {
        controller.__gui.listen(controller);
        return controller;
      },
      remove: function remove2() {
        controller.__gui.remove(controller);
        return controller;
      }
    });
    if (controller instanceof NumberControllerSlider) {
      var box = new NumberControllerBox(controller.object, controller.property, {min: controller.__min, max: controller.__max, step: controller.__step});
      Common.each(["updateDisplay", "onChange", "onFinishChange", "step", "min", "max"], function(method) {
        var pc = controller[method];
        var pb = box[method];
        controller[method] = box[method] = function() {
          var args = Array.prototype.slice.call(arguments);
          pb.apply(box, args);
          return pc.apply(controller, args);
        };
      });
      dom.addClass(li, "has-slider");
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
    } else if (controller instanceof NumberControllerBox) {
      var r = function r2(returned) {
        if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
          var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
          var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
          controller.remove();
          var newController = _add(gui2, controller.object, controller.property, {
            before: controller.__li.nextElementSibling,
            factoryArgs: [controller.__min, controller.__max, controller.__step]
          });
          newController.name(oldName);
          if (wasListening)
            newController.listen();
          return newController;
        }
        return returned;
      };
      controller.min = Common.compose(r, controller.min);
      controller.max = Common.compose(r, controller.max);
    } else if (controller instanceof BooleanController) {
      dom.bind(li, "click", function() {
        dom.fakeEvent(controller.__checkbox, "click");
      });
      dom.bind(controller.__checkbox, "click", function(e) {
        e.stopPropagation();
      });
    } else if (controller instanceof FunctionController) {
      dom.bind(li, "click", function() {
        dom.fakeEvent(controller.__button, "click");
      });
      dom.bind(li, "mouseover", function() {
        dom.addClass(controller.__button, "hover");
      });
      dom.bind(li, "mouseout", function() {
        dom.removeClass(controller.__button, "hover");
      });
    } else if (controller instanceof ColorController) {
      dom.addClass(li, "color");
      controller.updateDisplay = Common.compose(function(val) {
        li.style.borderLeftColor = controller.__color.toString();
        return val;
      }, controller.updateDisplay);
      controller.updateDisplay();
    }
    controller.setValue = Common.compose(function(val) {
      if (gui2.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui2.getRoot(), true);
      }
      return val;
    }, controller.setValue);
  }
  function recallSavedValue(gui2, controller) {
    var root = gui2.getRoot();
    var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
    if (matchedIndex !== -1) {
      var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
      if (controllerMap === void 0) {
        controllerMap = {};
        root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
      }
      controllerMap[controller.property] = controller;
      if (root.load && root.load.remembered) {
        var presetMap = root.load.remembered;
        var preset = void 0;
        if (presetMap[gui2.preset]) {
          preset = presetMap[gui2.preset];
        } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
          preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
        } else {
          return;
        }
        if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== void 0) {
          var value = preset[matchedIndex][controller.property];
          controller.initialValue = value;
          controller.setValue(value);
        }
      }
    }
  }
  function _add(gui2, object, property, params2) {
    if (object[property] === void 0) {
      throw new Error('Object "' + object + '" has no property "' + property + '"');
    }
    var controller = void 0;
    if (params2.color) {
      controller = new ColorController(object, property);
    } else {
      var factoryArgs = [object, property].concat(params2.factoryArgs);
      controller = ControllerFactory.apply(gui2, factoryArgs);
    }
    if (params2.before instanceof Controller) {
      params2.before = params2.before.__li;
    }
    recallSavedValue(gui2, controller);
    dom.addClass(controller.domElement, "c");
    var name = document.createElement("span");
    dom.addClass(name, "property-name");
    name.innerHTML = controller.property;
    var container = document.createElement("div");
    container.appendChild(name);
    container.appendChild(controller.domElement);
    var li = addRow(gui2, container, params2.before);
    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
    if (controller instanceof ColorController) {
      dom.addClass(li, "color");
    } else {
      dom.addClass(li, _typeof(controller.getValue()));
    }
    augmentController(gui2, li, controller);
    gui2.__controllers.push(controller);
    return controller;
  }
  function getLocalStorageHash(gui2, key) {
    return document.location.href + "." + key;
  }
  function addPresetOption(gui2, name, setSelected) {
    var opt = document.createElement("option");
    opt.innerHTML = name;
    opt.value = name;
    gui2.__preset_select.appendChild(opt);
    if (setSelected) {
      gui2.__preset_select.selectedIndex = gui2.__preset_select.length - 1;
    }
  }
  function showHideExplain(gui2, explain) {
    explain.style.display = gui2.useLocalStorage ? "block" : "none";
  }
  function addSaveMenu(gui2) {
    var div = gui2.__save_row = document.createElement("li");
    dom.addClass(gui2.domElement, "has-save");
    gui2.__ul.insertBefore(div, gui2.__ul.firstChild);
    dom.addClass(div, "save-row");
    var gears = document.createElement("span");
    gears.innerHTML = "&nbsp;";
    dom.addClass(gears, "button gears");
    var button = document.createElement("span");
    button.innerHTML = "Save";
    dom.addClass(button, "button");
    dom.addClass(button, "save");
    var button2 = document.createElement("span");
    button2.innerHTML = "New";
    dom.addClass(button2, "button");
    dom.addClass(button2, "save-as");
    var button3 = document.createElement("span");
    button3.innerHTML = "Revert";
    dom.addClass(button3, "button");
    dom.addClass(button3, "revert");
    var select = gui2.__preset_select = document.createElement("select");
    if (gui2.load && gui2.load.remembered) {
      Common.each(gui2.load.remembered, function(value, key) {
        addPresetOption(gui2, key, key === gui2.preset);
      });
    } else {
      addPresetOption(gui2, DEFAULT_DEFAULT_PRESET_NAME, false);
    }
    dom.bind(select, "change", function() {
      for (var index = 0; index < gui2.__preset_select.length; index++) {
        gui2.__preset_select[index].innerHTML = gui2.__preset_select[index].value;
      }
      gui2.preset = this.value;
    });
    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);
    if (SUPPORTS_LOCAL_STORAGE) {
      var explain = document.getElementById("dg-local-explain");
      var localStorageCheckBox = document.getElementById("dg-local-storage");
      var saveLocally = document.getElementById("dg-save-locally");
      saveLocally.style.display = "block";
      if (localStorage.getItem(getLocalStorageHash(gui2, "isLocal")) === "true") {
        localStorageCheckBox.setAttribute("checked", "checked");
      }
      showHideExplain(gui2, explain);
      dom.bind(localStorageCheckBox, "change", function() {
        gui2.useLocalStorage = !gui2.useLocalStorage;
        showHideExplain(gui2, explain);
      });
    }
    var newConstructorTextArea = document.getElementById("dg-new-constructor");
    dom.bind(newConstructorTextArea, "keydown", function(e) {
      if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
        SAVE_DIALOGUE.hide();
      }
    });
    dom.bind(gears, "click", function() {
      newConstructorTextArea.innerHTML = JSON.stringify(gui2.getSaveObject(), void 0, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });
    dom.bind(button, "click", function() {
      gui2.save();
    });
    dom.bind(button2, "click", function() {
      var presetName = prompt("Enter a new preset name.");
      if (presetName) {
        gui2.saveAs(presetName);
      }
    });
    dom.bind(button3, "click", function() {
      gui2.revert();
    });
  }
  function addResizeHandle(gui2) {
    var pmouseX = void 0;
    gui2.__resize_handle = document.createElement("div");
    Common.extend(gui2.__resize_handle.style, {
      width: "6px",
      marginLeft: "-3px",
      height: "200px",
      cursor: "ew-resize",
      position: "absolute"
    });
    function drag(e) {
      e.preventDefault();
      gui2.width += pmouseX - e.clientX;
      gui2.onResize();
      pmouseX = e.clientX;
      return false;
    }
    function dragStop() {
      dom.removeClass(gui2.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, "mousemove", drag);
      dom.unbind(window, "mouseup", dragStop);
    }
    function dragStart(e) {
      e.preventDefault();
      pmouseX = e.clientX;
      dom.addClass(gui2.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, "mousemove", drag);
      dom.bind(window, "mouseup", dragStop);
      return false;
    }
    dom.bind(gui2.__resize_handle, "mousedown", dragStart);
    dom.bind(gui2.__closeButton, "mousedown", dragStart);
    gui2.domElement.insertBefore(gui2.__resize_handle, gui2.domElement.firstElementChild);
  }
  function setWidth(gui2, w2) {
    gui2.domElement.style.width = w2 + "px";
    if (gui2.__save_row && gui2.autoPlace) {
      gui2.__save_row.style.width = w2 + "px";
    }
    if (gui2.__closeButton) {
      gui2.__closeButton.style.width = w2 + "px";
    }
  }
  function getCurrentPreset(gui2, useInitialValues) {
    var toReturn2 = {};
    Common.each(gui2.__rememberedObjects, function(val, index) {
      var savedValues = {};
      var controllerMap = gui2.__rememberedObjectIndecesToControllers[index];
      Common.each(controllerMap, function(controller, property) {
        savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });
      toReturn2[index] = savedValues;
    });
    return toReturn2;
  }
  function setPresetSelectIndex(gui2) {
    for (var index = 0; index < gui2.__preset_select.length; index++) {
      if (gui2.__preset_select[index].value === gui2.preset) {
        gui2.__preset_select.selectedIndex = index;
      }
    }
  }
  function updateDisplays(controllerArray) {
    if (controllerArray.length !== 0) {
      requestAnimationFrame$1.call(window, function() {
        updateDisplays(controllerArray);
      });
    }
    Common.each(controllerArray, function(c) {
      c.updateDisplay();
    });
  }
  var GUI$1 = GUI;

  // src/common/tweakables.ts
  var MovementType;
  (function(MovementType2) {
    MovementType2[MovementType2["Fixed"] = 0] = "Fixed";
    MovementType2[MovementType2["Modulatable"] = 1] = "Modulatable";
  })(MovementType || (MovementType = {}));
  function isNum(v) {
    return typeof v === "number";
  }
  function isVec2(v) {
    return v !== null;
  }

  // src/common/constants.ts
  var port = 8321;
  var rendererStarted = "/rendererStarted";

  // src/renderer/params.ts
  function lerp(s, t, a) {
    if (a < 0)
      return s;
    if (a > 1)
      return t;
    return s + a * (t - s);
  }
  var LagNum = class {
    constructor(val, lagTime) {
      this.curVal = this.targVal = val;
      this.lagTime = lagTime;
    }
    update(dt) {
      if (dt <= 0)
        return this.curVal;
      const a = 1 - Math.pow(1e-4, dt / this.lagTime);
      return this.curVal = lerp(this.curVal, this.targVal, a);
    }
  };
  var LagVec2 = class {
    constructor(controlVec, lagTime) {
      this.controlVec = controlVec;
      this.outputVec = controlVec.clone();
      this.lagX = new LagNum(controlVec.x, lagTime);
      this.lagY = new LagNum(controlVec.y, lagTime);
      this._lagTime = lagTime;
    }
    update(dt) {
      this.lagX.targVal = this.controlVec.x;
      this.lagY.targVal = this.controlVec.y;
      this.outputVec.x = this.lagX.update(dt);
      this.outputVec.y = this.lagY.update(dt);
      return this.outputVec;
    }
    get lagTime() {
      return this._lagTime;
    }
    set lagTime(t) {
      this._lagTime = t;
      this.lagX.lagTime = t;
      this.lagY.lagTime = t;
    }
  };
  function getLagger(v, lagTime) {
    if (isNum(v)) {
      return new LagNum(v, lagTime);
    }
    if (isVec2(v)) {
      return new LagVec2(v, lagTime);
    }
  }
  var gui = new GUI$1();
  gui.hide();
  var guiHidden = true;
  document.onkeypress = (ev) => {
    if (ev.key === "/") {
      if (guiHidden)
        gui.show();
      else
        gui.hide();
      guiHidden = !guiHidden;
    }
  };
  var makeGUI = (specs, uniforms2 = {}) => {
    specs.forEach((s) => s.movement = MovementType.Modulatable);
    Object.keys(uniforms2).forEach((k) => uniforms2[k].movement = MovementType.Fixed);
    const parms2 = new ParamGroup(specs, uniforms2);
    const params2 = new URLSearchParams(location.search);
    if (params2.has("id")) {
      const id = Number.parseInt(params2.get("id"));
      const model = {
        id,
        filename: "todo",
        tweakables: specs
      };
      const body = JSON.stringify(model);
      console.log(`sending ${rendererStarted} ${body}`);
      fetch(`http://localhost:${port}${rendererStarted}`, {
        method: "POST",
        body,
        headers: {"Content-Type": "application/json"}
      });
    }
    return parms2;
  };
  var ParamGroup = class {
    constructor(specs, uniforms2 = {}) {
      this.parms = [];
      this.lagTime = 1e3;
      const parms2 = this.parms;
      gui.add(this, "lagTime", 0, 2e4);
      specs.forEach((s) => {
        const v = s.value;
        if (v === void 0)
          return;
        if (typeof v === "number") {
          const p = new ShaderParam(uniforms2, s.name, v, s.min, s.max);
          parms2.push(p);
          gui.add(p.val, "targVal", s.min, s.max, s.step).name(s.name);
        } else if (isVec2(v)) {
          const p = new ShaderParam(uniforms2, s.name, v, s.min, s.max);
          parms2.push(p);
          gui.add(v, "x", s.min, s.max, s.step).name(s.name + ".x");
          gui.add(v, "y", s.min, s.max, s.step).name(s.name + ".y");
        }
      });
    }
    update(dt) {
      this.parms.forEach((p) => {
        p.val.lagTime = this.lagTime;
        p.update(dt);
      });
    }
  };
  var ShaderParam = class {
    constructor(uniforms2, name, init = 0.5, min = 0, max = 1, lagTime = 1e4) {
      this.uniforms = uniforms2;
      this.uniformObj = this.uniforms[name] = {value: init};
      this.name = name;
      this.min = min;
      this.max = max;
      this.val = getLagger(init, lagTime);
    }
    update(dt) {
      this.uniformObj.value = this.val.update(dt);
    }
  };

  // src/renderer/video_state.ts
  var vidEl = document.getElementById("vid1");
  var vidUrl = "bashed.mp4";
  console.log(vidUrl);
  vidEl.src = vidUrl;
  setTimeout(() => vidEl.play(), 3e3);
  var vidTex = new VideoTexture(vidEl);
  function setTextureParams(t) {
    t.wrapS = t.wrapT = ClampToEdgeWrapping;
    t.minFilter = t.magFilter = LinearFilter;
  }
  setTextureParams(vidTex);
  function setup(renderer2, uniforms2) {
    renderer2.domElement.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    renderer2.domElement.ondrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.items) {
        const item = e.dataTransfer.items[0];
        if (item.kind === "file") {
          const t = Date.now();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.readAsDataURL(file);
          console.log(`readAsDataURL took ${Date.now() - t}`);
          reader.onload = (readEvent) => {
            console.log(`onload took ${Date.now() - t}`);
            const result2 = readEvent.target.result;
            if (file.type.startsWith("video/")) {
              vidEl.src = result2;
              vidEl.onloadeddata = () => {
                console.log(`onloadeddata took ${Date.now() - t}`);
                vidEl.play();
              };
            } else if (file.type.startsWith("image/")) {
              const t2 = uniforms2.texture1.value = new TextureLoader().load(readEvent.target.result);
              setTextureParams(t2);
            }
          };
        }
      }
    };
  }

  // src/renderer/index.tsx
  var scene = new Scene();
  var camera = new OrthographicCamera(0, 1, 1, 0, 0, 10);
  camera.position.set(0.5, 0.5, -1);
  camera.lookAt(0.5, 0.5, 0);
  var renderer = new WebGLRenderer({
    antialias: true,
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);
  var w = window.innerWidth;
  var h = window.innerHeight;
  var Vector22 = Vector2;
  var uniforms = {
    ScreenAspect: {value: w / h},
    Leaves: {value: 3},
    Angle: {value: 1.05},
    OutAngle: {value: 0},
    Zoom: {value: 1.3},
    MozMix: {value: 1},
    Centre: {value: new Vector22(0.5, 0.5)},
    ImageCentre: {value: new Vector22(0.5, 0)},
    UVLimit: {value: new Vector22(1920 / 2048, 1080 / 2048)},
    texture1: {value: vidTex}
  };
  var parms = makeGUI([
    {name: "Leaves", value: 3, min: 1, max: 8, step: 1},
    {name: "Angle", value: 1.05, min: -Math.PI, max: Math.PI},
    {name: "AngleGain", value: 0.5, min: 0, max: 1},
    {name: "OutAngle", value: 0, min: -1, max: 1},
    {name: "Zoom", value: 1.3, min: 0, max: 10},
    {name: "KaleidMix", value: 0.999, min: 0, max: 1},
    {name: "Mozaic", value: 4, min: 1, max: 40},
    {name: "MozGain", value: 0.5, min: 0, max: 1},
    {name: "ContrastPreBias", value: 0.5, min: 0, max: 1},
    {name: "ContrastGain", value: 0.5, min: 0, max: 1},
    {name: "ContrastPostBias", value: 0.5, min: 0, max: 1},
    {name: "SaturationBias", value: 0.5, min: 0, max: 1},
    {name: "SaturationGain", value: 0.5, min: 0, max: 1},
    {name: "ImageCentre", value: new Vector22(0.5, 0), min: -1, max: 1},
    {name: "Centre", value: new Vector22(0.5, 0.5), min: 0, max: 1},
    {name: "Vignette", value: new Vector22(0.1, 0.1), min: 0, max: 0.2}
  ], uniforms);
  setup(renderer, uniforms);
  var geo = new PlaneGeometry(2, 2);
  var mat = new ShaderMaterial({vertexShader: kaleid_vert_default, fragmentShader: kaleid_frag_default, uniforms, transparent: true});
  var mesh = new Mesh(geo, mat);
  mesh.position.x = 0.5;
  mesh.position.y = 0.5;
  scene.add(mesh);
  var t0 = Date.now();
  function animate(time) {
    requestAnimationFrame(animate);
    let w2 = window.innerWidth, h2 = window.innerHeight;
    uniforms.ScreenAspect.value = w2 / h2;
    const img = uniforms.texture1.value;
    uniforms.UVLimit.value = img.repeat;
    const dt = time - t0;
    t0 = time;
    parms.update(dt);
    renderer.render(scene, camera);
  }
  animate(t0);
  window.onresize = (_) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
  };
})();
//# sourceMappingURL=renderer.js.map
