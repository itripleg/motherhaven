import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { moveCamPosition } from "@/hooks/CamTools";

interface CameraSearchProps {
  cameraRef: React.RefObject<any>;
}

export const CameraSearch = ({ cameraRef }: CameraSearchProps) => {
  const [position, setPosition] = useState("");

  const handleCameraPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const [x, y, z] = position.split(",").map(Number);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && cameraRef?.current) {
      moveCamPosition({ cameraRef, x, y, z, scale: 3 });
    }
  };

  const getCurrentPosition = () => {
    if (cameraRef?.current) {
      const camera = cameraRef.current;
      setPosition(
        `${Math.round(camera.position.x)},${Math.round(
          camera.position.y
        )},${Math.round(camera.position.z)}`
      );
    }
  };

  return (
    <motion.form
      onSubmit={handleCameraPosition}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center space-x-4 mb-8"
    >
      <Input
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        type="text"
        placeholder="x,y,z (e.g. 1,2,3)"
        className="flex-grow z-40 bg-white/15 text-black border-blue-500"
      />
      <Button type="button" onClick={getCurrentPosition} className="z-40">
        Current
      </Button>
      <Button type="submit" className="z-40">
        Look
      </Button>
    </motion.form>
  );
};
