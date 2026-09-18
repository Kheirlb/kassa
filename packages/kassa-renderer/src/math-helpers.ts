import { vec3, mat4, quat } from 'gl-matrix';

// Returns a connection point with respect to the symbol frame.
// Critical to knowing how to place the next component in the layout oriented to the previous one.
export function getPointTransform(
  x: number,
  y: number,
  rot?: number
): mat4 {
  const position = vec3.fromValues(x, y, 0);
  const rotation = quat.create();
  // Applying a negative rotation somehow makes the math work and ensures we layer on the rotation correctly (I think).
  quat.fromEuler(rotation, 0, 0, (rot ?? 0));
  const transform = mat4.create();
  mat4.fromRotationTranslation(transform, rotation, position);
  return transform;
}

// Rotate about the center (width & height / 2)
export function getPointTransformCentered(
  x: number,
  y: number,
  rot: number,
  width: number = 120,
  height: number = 120
): mat4 {
  const transform = mat4.create();
  // 0. Translate to the desired position.
  mat4.translate(transform, transform, vec3.fromValues(x, y, 0));

  // Translate to center, rotate, translate back.
  // 1. Translate to center.
  mat4.translate(transform, transform, vec3.fromValues(width / 2, height / 2, 0));
  
  // 2. Rotate around the center.
  const rotationTransform = mat4.create();
  mat4.fromRotationTranslation(rotationTransform, quat.fromEuler(quat.create(), 0, 0, rot), vec3.fromValues(0, 0, 0));
  mat4.multiply(transform, transform, rotationTransform);

  // 3. Translate back to the position.
  mat4.translate(transform, transform, vec3.fromValues(-width / 2, -height / 2, 0));

  return transform;
}

function getYawFromQuat(q: quat): number {
  // yaw (z-axis rotation) using 3-2-1 (Z-Y-X)
  // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
  const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
  const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
  return Math.atan2(siny_cosp, cosy_cosp); // radians
}

// Calculate angle in degrees.
function getAngle(input: mat4): number {
  const quatResult = quat.create();
  mat4.getRotation(quatResult, input);
  return getYawFromQuat(quatResult) * (180 / Math.PI);
}

// TODO: Make more reusable and readable.
export type Point = {
  x: number;
  y: number;
  rot?: number; // degrees
}

export function getPointTransformFromMat4(input: mat4): Point {
  const position = vec3.create();
  mat4.getTranslation(position, input);
  const rotation = getAngle(input);
  return {
    x: position[0],
    y: position[1],
    rot: rotation
  };
}
