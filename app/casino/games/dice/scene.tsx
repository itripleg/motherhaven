"use client";
import { Box } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

export default function Scene() {
  const cube1Ref = useRef<THREE.Mesh>(null);
  const cube2Ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (cube1Ref.current && cube2Ref.current) {
      cube1Ref.current.rotation.x += 0.01;
      cube1Ref.current.rotation.y += 0.01;
      cube2Ref.current.rotation.x -= 0.01;
      cube2Ref.current.rotation.y -= 0.01;
    }
  });
  return (
    <>
      {/* <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 10]} />
      <pointLight position={[10, 10, 10]} />
      <Box ref={cube1Ref} position={[-1.5, 0, 0]}>
        <meshStandardMaterial color="hotpink" />
      </Box>
      <Box ref={cube2Ref} position={[1.5, 0, 0]}>
        <meshStandardMaterial color="lightblue" />
      </Box> */}
    </>
  );
}
