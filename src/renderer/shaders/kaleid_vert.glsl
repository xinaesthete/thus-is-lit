uniform float Leaves;
varying float vsegAng;
varying vec2 vertTexCoord;
#define PI 3.14159265359

void main() {
  vertTexCoord = uv;
  vsegAng = 2. * PI / Leaves;
  //XXX: not entirely sure why 2.*position, but don't want to faff too much just now.
  gl_Position = modelViewMatrix * vec4(2.*position, 1.0);
}
