// @ts-nocheck
/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";

export default function Card4(props: any) {
  const { nodes, materials } = useGLTF("/card_model4.glb");
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CardBack.geometry}
        material={materials.gothai}
        position={[0, 1.11, 0]}
        scale={[0.57, 0.94, 0.1]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.CardFront.geometry}
        material={materials.image24}
        position={[0, 1.11, -0.07]}
        scale={[0.57, 0.94, 0.1]}
      />
    </group>
  );
}

useGLTF.preload("/card_model4.glb");