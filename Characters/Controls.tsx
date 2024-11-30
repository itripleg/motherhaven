export {};
// import React, { useEffect, useState } from "react";
// import { useGameContext } from "@/contexts/game-context";
// import {
//   // getCurrentPositionAndTarget,
//   // setCamera,
//   // zoomCamera,
// } from "@/hooks/CamTools";
// import { motion } from "framer-motion";
// import StartButton from "./StartButton";
// import OuijaInput from "@/components-3d/-Ouija/OuijaInput";

// type Position = {
//   offset: number[];
//   target: number[];
//   duration?: number;
//   zoomLevel?: number;
//   background?: string;
// };

// type PredefinedPositions = {
//   [key: string]: Position; // Index signature
// };

// export const predefinedPositions: PredefinedPositions = {
//   default: {
//     offset: [0, 0, 10],
//     target: [-4, -13, 0],
//     zoomLevel: 1,
//   },
//   // Ouija: {
//   //   offset: [6.48, 1, -47.23],
//   //   target: [-14.24, -9.59, 12],
//   //   zoomLevel: 3,
//   //   background: "/ai-concept-art/bar1.webp",
//   // },
//   Ouija: {
//     offset: [-6.55, -8.75, -42.09],
//     target: [-16.62, -10.63, 12.27],
//     zoomLevel: 3,
//     duration: 5,
//     background: "/wallpaper/ouija.webp",
//   },
//   LookUp: {
//     offset: [0, 150, 100],
//     target: [0, 100, 0],
//   },
//   Eye: {
//     offset: [0, 200, 180],
//     target: [0, 115, 0],
//     background: "/mountain.png",
//   },
//   Eye2: {
//     offset: [-54.68, 176.67, 128.16],
//     target: [10.67, 95.68, 8.38],
//     zoomLevel: 1.5,
//     background: "/mountain.png",
//   },
//   // Asheville: {
//   //   offset: [-2.6, -2.4, 7.65],
//   //   target: [-1.7, 0, 4.45],
//   //   zoomLevel: 2.7,
//   // },
//   Moon: {
//     offset: [-555.13, 757.06, -89.84],
//     target: [109.87, 452.51, 24.62],
//     duration: 5,
//     zoomLevel: 1.4,
//   },
//   Moon2: {
//     offset: [216.14, 487.48, 234.92],
//     target: [212, 486, 230],
//     zoomLevel: 0.5,
//   },
// };

// function Controls() {
//   const {
//     gameTimer,
//     cameraRef,
//     controlRef,
//     animationControls,
//     setWallpaper,
//     view,
//     setView,
//   } = useGameContext();
//   const [coordinates, setCoordinates] = useState("Coordinates");
//   const [baseCameraPosition, setBaseCameraPosition] = useState([0, 0, 10]);

//   async function handleKeyPress(key: string) {
//     const lastKey = key[key.length - 1];
//     if (lastKey) {
//       await animationControls.start(lastKey);
//     }
//   }

//   const handleCameraChange = (key: string) => {
//     const { offset, target, duration, zoomLevel, background } =
//       predefinedPositions[key];
//     const newPosition = baseCameraPosition.map((pos, i) => pos + offset[i]);
//     if (background) {
//       setWallpaper(background);
//     } else {
//       setWallpaper("");
//     }
//     setCamera(cameraRef, controlRef, newPosition, target, duration);
//     if (zoomLevel !== undefined) {
//       zoomCamera(cameraRef, zoomLevel, duration);
//     }
//     setView(key);
//   };

//   useEffect(() => {
//     const updateBaseCameraPosition = () => {
//       const screenWidth = window.innerWidth;
//       // Example dynamic base position calculation
//       const newZ = screenWidth > 768 ? 10 : 30;
//       setBaseCameraPosition([0, 0, newZ]);
//     };

//     updateBaseCameraPosition();
//     window.addEventListener("resize", updateBaseCameraPosition);
//     return () => window.removeEventListener("resize", updateBaseCameraPosition);
//   }, []);

//   return (
//     <div className="z-40 flex flex-col gap-2 bg-black/50 text-center p-2 rounded-md m-2 max-h-[400px]">
//       <p>{view}</p>
//       <p>Game Timer: {gameTimer}</p>
//       <StartButton />
//       <div className="flex flex-col gap-2 scrollbar scrollbar-thumb-slate-100 overflow-y-scroll">
//         {Object.entries(predefinedPositions).map(([key, _]) => (
//           <button
//             key={key}
//             onClick={() => handleCameraChange(key)}
//             className="m-1 p-1 bg-blue-500/50 text-white rounded"
//           >
//             {key}
//           </button>
//         ))}
//       </div>
//       <div>
//         <button
//           className="border border-purple-900 p-2 rounded-md m-2 bg-pink-800/20"
//           onClick={() => {
//             getCurrentPositionAndTarget(cameraRef, controlRef, setCoordinates);
//           }}
//         >
//           Get Coordinates
//         </button>
//         <div>{coordinates}</div>
//       </div>
//       <div className="flex flex-col hidden">
//         <button
//           className="border p-2"
//           onClick={() => {
//             zoomCamera(cameraRef, 2);
//           }}
//         >
//           Zoom In
//         </button>
//         <button
//           className="border p-2"
//           onClick={() => {
//             zoomCamera(cameraRef, 0.2, 1);
//           }}
//         >
//           Zoom Out
//         </button>
//         {/* <OuijaInput /> */}
//       </div>
//     </div>
//   );
// }

// export default Controls;
