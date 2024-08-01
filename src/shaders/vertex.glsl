precision mediump float;
attribute vec3 instancePosition;
attribute vec3 instanceColor;
varying vec3 vColor;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {
    vColor = instanceColor;
    vec4 mvPosition = modelViewMatrix * vec4(instancePosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 5.0;
}