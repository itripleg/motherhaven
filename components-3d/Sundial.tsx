/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import { useGLTF } from "@react-three/drei";
import React, { useRef } from "react";

export default function Model(props: any) {
  const { nodes, materials } = useGLTF("/models/sundial.glb") as any;
  return (
    <group {...props} dispose={null}>
      <group rotation={[2.52, 0, 0]} scale={0.09}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_2.geometry}
          material={materials.material}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/models/sundial.glb");