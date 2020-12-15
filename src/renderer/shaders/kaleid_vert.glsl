uniform float Leaves;
varying float segAng;
varying vec2 vertTexCoord;
#define PI 3.14159265359

void main() {
  vertTexCoord = uv;
  segAng = 2. * PI / Leaves;
  gl_Position = vec4(position, 1.0);
}
