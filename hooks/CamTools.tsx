import gsap from "gsap";
import { Tsukimi_Rounded } from "next/font/google";

export const defaultCam = (controlRef: any, cameraRef: any) => {
  // console.log(controlRef.current.target)
  gsap.to(controlRef.current.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 2.5,
  });
  moveCamPosition({ cameraRef, x: 0, y: 0, z: 10, scale: 1 });
};

export const moveCamPosition = ({
  // @ts-expect-error always get this ref error
  cameraRef,
  x = cameraRef?.current?.position.x,
  y = cameraRef?.current?.position.y,
  z = cameraRef?.current?.position.z,
  scale = cameraRef?.current?.scale.z,
  duration = 2.5,
}) => {
  gsap.to(cameraRef?.current?.position, { x, y, z, duration });
  gsap.to(cameraRef?.current?.scale, {
    z: scale,
    duration,
  });
};

export const zoom = (cameraRef: any, scale: any) => {
  moveCamPosition({ cameraRef, scale: scale });
};

export const moveTarget = (
  // @ts-expect-error always get this ref error
  controlRef,
  x = controlRef?.current?.target.x,
  y = controlRef?.current?.target.y,
  z = controlRef?.current?.target.z,
  duration = 2.5
) => {
  gsap.to(controlRef?.current?.target, {
    x,
    y,
    z,
    duration,
    // ease: 'slow(0.01, 0.07, false)',
  });
};

// const dayNight = () => {
//   setTime(time == times.day ? times.night : times.day)

//   const newIntensity = time == times.day ? 0.3 : 1
//   gsap.to(lightRef.current, {
//     intensity: newIntensity,
//     duration: 2.5,
//   })
// }
