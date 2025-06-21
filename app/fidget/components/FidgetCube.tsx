"use client";
import React, { useRef, useState } from "react"; // fidget/components/FidgetCube.tsx
import { useFrame } from "@react-three/fiber";
import { Text, Html } from "@react-three/drei";
import * as THREE from "three";
import RandomTypingGame from "./RandomTypingGame";

const CUBE_SIZE = 3;
const BUTTON_RADIUS = 0.6;

interface FidgetCubeProps {
  onSelectGame: (gameName: string) => void;
  activeGame: string | null;
}

export default function FidgetCube({
  onSelectGame,
  activeGame,
}: FidgetCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);

  // Apply subtle animation when no game is active
  useFrame((state) => {
    if (!groupRef.current || activeGame) return;

    // Very subtle floating motion when not playing a game
    groupRef.current.position.y =
      Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;

    // Continue very slow rotation when no game is active
    groupRef.current.rotation.y += 0.0005;
  });

  return (
    <group ref={groupRef}>
      {/* Front face - Typing Game */}
      <CubeFace
        position={[0, 0, CUBE_SIZE / 2]}
        color="#4f46e5"
        hoverColor="#6366f1"
        gameName="typing"
        label="Typing Game"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "typing"}
        isActive={activeGame === "typing"}
      />

      {/* Back face */}
      <CubeFace
        position={[0, 0, -CUBE_SIZE / 2]}
        rotation={[0, Math.PI, 0]}
        color="#16a34a"
        hoverColor="#22c55e"
        gameName="future2"
        label="Coming Soon"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "future2"}
        isActive={activeGame === "future2"}
      />

      {/* Right face */}
      <CubeFace
        position={[CUBE_SIZE / 2, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        color="#ea580c"
        hoverColor="#f97316"
        gameName="future3"
        label="Coming Soon"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "future3"}
        isActive={activeGame === "future3"}
      />

      {/* Left face */}
      <CubeFace
        position={[-CUBE_SIZE / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#0284c7"
        hoverColor="#0ea5e9"
        gameName="future4"
        label="Coming Soon"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "future4"}
        isActive={activeGame === "future4"}
      />

      {/* Top face */}
      <CubeFace
        position={[0, CUBE_SIZE / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#7c3aed"
        hoverColor="#8b5cf6"
        gameName="future5"
        label="Coming Soon"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "future5"}
        isActive={activeGame === "future5"}
      />

      {/* Bottom face */}
      <CubeFace
        position={[0, -CUBE_SIZE / 2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#be123c"
        hoverColor="#e11d48"
        gameName="future6"
        label="Coming Soon"
        onSelect={onSelectGame}
        onHover={setHoveredFace}
        isHovered={hoveredFace === "future6"}
        isActive={activeGame === "future6"}
      />
    </group>
  );
}

interface CubeFaceProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  hoverColor: string;
  gameName: string;
  label: string;
  onSelect: (gameName: string) => void;
  onHover: (gameName: string | null) => void;
  isHovered: boolean;
  isActive: boolean;
}

// Individual interactive face of the cube
const CubeFace: React.FC<CubeFaceProps> = ({
  position,
  rotation = [0, 0, 0],
  color,
  hoverColor,
  gameName,
  label,
  onSelect,
  onHover,
  isHovered,
  isActive,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const buttonRef = useRef<THREE.Mesh>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handlePointerOver = () => {
    onHover(gameName);
  };

  const handlePointerOut = () => {
    onHover(null);
  };

  const handleClick = (e: any) => {
    // Prevent event from bubbling to avoid orbit controls handling it
    e.stopPropagation();
    onSelect(gameName);
  };

  const handleButtonOver = () => {
    setIsButtonHovered(true);
  };

  const handleButtonOut = () => {
    setIsButtonHovered(false);
  };

  useFrame(() => {
    if (buttonRef.current) {
      if (isButtonHovered || isActive) {
        // Button pops out when hovered
        buttonRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
      } else {
        // Return to normal size
        buttonRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  // Determine colors based on state
  const faceColor = isActive ? "#000000" : isHovered ? hoverColor : color;
  const buttonColor = isButtonHovered ? hoverColor : color;

  return (
    <group position={position} rotation={rotation as any}>
      {/* Face */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, 0.2]} />
        <meshStandardMaterial
          color={faceColor}
          transparent={isActive}
          opacity={isActive ? 0.7 : 1}
        />
      </mesh>

      {/* Button - center interactive element */}
      <mesh
        ref={buttonRef}
        position={[0, 0, 0.2]}
        onPointerOver={handleButtonOver}
        onPointerOut={handleButtonOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[BUTTON_RADIUS, 32, 16]} />
        <meshStandardMaterial
          color={buttonColor}
          emissive={isButtonHovered ? hoverColor : "#000000"}
          emissiveIntensity={isButtonHovered ? 0.3 : 0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Label - only show when not active */}
      {!isActive && (
        <Text
          position={[0, 0, 0.6]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}

      {/* Game interface - rendered on the face when active */}
      {isActive && (
        <Html
          transform
          distanceFactor={1.5}
          position={[0, 0, 0.3]}
          rotation={[0, 0, 0]}
          style={{
            width: `${CUBE_SIZE * 1.3}px`,
            height: `${CUBE_SIZE * 1.3}px`,
          }}
        >
          <div className="w-full h-full bg-black/80 backdrop-blur-sm rounded-md p-4 overflow-hidden">
            {gameName === "typing" && <RandomTypingGame embedded={true} />}
            {gameName !== "typing" && (
              <div className="flex items-center justify-center h-full">
                <p className="text-white">Coming Soon</p>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
