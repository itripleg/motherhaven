// fidget/components/FidgetCubeScene.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import FidgetCube from "./FidgetCube";
import { Vector3 } from "three";

interface FidgetCubeSceneProps {
  onSelectGame: (gameName: string) => void;
  activeGame: string | null;
}

export default function FidgetCubeScene({
  onSelectGame,
  activeGame,
}: FidgetCubeSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={["#050505"]} />
      <ambientLight intensity={0.5} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1.5}
        castShadow
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Apply gentle pulse animation to lighting for more interest */}
      <hemisphereLight intensity={0.4} color="#ffffff" groundColor="#000000" />

      {/* Scene content with controls */}
      <SceneContent onSelectGame={onSelectGame} activeGame={activeGame} />
    </Canvas>
  );
}

interface SceneContentProps {
  onSelectGame: (gameName: string) => void;
  activeGame: string | null;
}

function SceneContent({ onSelectGame, activeGame }: SceneContentProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const [isZooming, setIsZooming] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);

  // Handle zooming to a face
  const handleZoomToFace = (direction: Vector3) => {
    if (controlsRef.current) {
      setIsZooming(true);

      // Calculate target position based on direction
      const zoomDistance = 5; // How close to zoom to the face
      const newPosition = direction.clone().multiplyScalar(zoomDistance);
      setTargetPosition(newPosition);

      // Disable controls during animation
      controlsRef.current.enabled = false;
    }
  };

  // Reset camera position when game is deactivated
  useEffect(() => {
    if (!activeGame) {
      setIsZooming(false);
      setTargetPosition(null);

      // Re-enable controls if game is deactivated
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  }, [activeGame]);

  // Handle camera animation
  useEffect(() => {
    if (isZooming && targetPosition) {
      const animateCamera = () => {
        // Move camera smoothly towards target
        camera.position.lerp(targetPosition, 0.05);

        // If we're close enough to the target, stop animating
        if (camera.position.distanceTo(targetPosition) < 0.1) {
          setIsZooming(false);

          // Re-enable controls after animation
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
        } else {
          requestAnimationFrame(animateCamera);
        }
      };

      animateCamera();
    }
  }, [isZooming, targetPosition, camera]);

  return (
    <>
      {/* Cube with interactive faces */}
      <FidgetCube
        onSelectGame={onSelectGame}
        activeGame={activeGame}
        onZoomToFace={handleZoomToFace}
      />

      {/* Controls with different behaviors based on active game */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        enableRotate={!activeGame}
        rotateSpeed={0.8}
        autoRotate={!activeGame}
        autoRotateSpeed={0.5}
        minDistance={4}
        maxDistance={12}
      />
    </>
  );
}
