import { useGLTF } from "@react-three/drei";
import { motion } from "framer-motion-3d";
import React, { useRef } from "react";

export function OuijaBoard(props: any) {
  const { nodes, materials } = useGLTF("/models/ouija_board.glb");
  return (
    <motion.group {...props} dispose={null}>
      <motion.mesh
        // geometry={nodes["ouija(vender)"].geometry}
        material={materials.defaultMat}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </motion.group>
  );
}

useGLTF.preload("/ouija_board.glb");