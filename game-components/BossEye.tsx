// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";
import Eye from "@/components-3d/Eye";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import Image from "next/image";
import ProgressBar from "./ProgressBar";
import { useGameContext } from "../contexts/game-context";
import { motion } from "framer-motion-3d";
import { moveTarget } from "@/hooks/CamTools";
import ShakeWord from "./ShakeWord";
import { Rotate3D } from "lucide-react";

type Props = {};

function BossEye({}: Props) {
  const {
    gameTimer,
    bossHealth,
    applyDamage,
    cameraRef,
    controlRef,
    setBossHealth,
  } = useGameContext();
  const [bossAttackLevel, setBossAttackLevel] = useState(0);
  const [bossHealLevel, setBossHealLevel] = useState(0);
  const [bossUltLevel, setBossUltLevel] = useState(0);
  const [bossMessage, setBossMessage] = useState("");
  const [lastActionTime, setLastActionTime] = useState(0);
  const actionCooldown = 3;

  const canPerformAction = () => {
    return gameTimer - lastActionTime >= actionCooldown;
  };

  const attackMessages = [
    "Behold my wrath!",
    "You cannot escape my gaze!",
    "Feel the power of the abyss!",
    "Your end is near, mortal!",
    "I see your fears!",
    "I'm right behind you!",
    "Tremble before my might!",
    "Your courage is futile!",
    "I am your doom!",
    "Gaze into the eye of terror!",
  ];

  const healMessages = [
    "I rejuvenate!",
    "Vision restored!",
    "Darkness heals me!",
    "Futile effort, I'm healed!",
    "Unbroken gaze!",
    "I blink, I mend!",
    "My watch endures!",
    "You can't blind me!",
    "Eternal sight!",
    "I refocus!",
  ];

  // Boss Attack
  const bossAttack = () => {
    if (!canPerformAction()) return;
    setLastActionTime(gameTimer); // Update the last action time
    console.log("Boss attacks!");
    const randomIndex = Math.floor(Math.random() * attackMessages.length);
    setBossMessage(attackMessages[randomIndex]);
    applyDamage("hero", randomIndex * 5);
    // applyDamage("hero", randomIndex * 15);
    setBossAttackLevel(0);
  };

  // Boss Heal
  const bossHeal = () => {
    if (!canPerformAction()) return;
    setLastActionTime(gameTimer);
    const randomIndex = Math.floor(Math.random() * healMessages.length);
    console.log("Boss heals for ", bossHealth + randomIndex * 9, " health!");
    setBossMessage(healMessages[randomIndex]);
    setBossHealth(bossHealth + randomIndex * 9);
    setBossHealLevel(0);
  };

  // Boss Ultimate
  const bossUlt = () => {
    if (!canPerformAction()) return;
    setLastActionTime(gameTimer);
    console.log("Boss uses ultimate!");
    const randomIndex = Math.floor(Math.random() * attackMessages.length);
    setBossMessage(attackMessages[randomIndex]);
    applyDamage("hero", randomIndex * 7);
    setBossUltLevel(0);
  };

  useEffect(() => {
    setBossAttackLevel((prev) => (prev < 100 ? prev + 15 : prev));
    setBossHealLevel((prev) => (prev < 100 ? prev + 35 : prev));
    setBossUltLevel((prev) => (prev < 100 ? prev + 10 : prev));

    if (bossUltLevel >= 100) {
      bossUlt();
    } else if (bossHealth < 50 && bossHealLevel >= 100) {
      bossHeal();
    } else if (bossAttackLevel >= 100) {
      bossAttack();
    }
  }, [gameTimer]);

  return (
    <motion.mesh
      initial={{ rotateY: Math.PI }}
      animate={{ rotateY: 1, rotateX: 0.2, rotateZ: -0.2 }}
      transition={{ delay: 0 }}
    >
      <Html className="w-[100px]" position={[0, 150, 0]}>
        <ProgressBar style="bg-green-800" progress={bossHealth} />
      </Html>
      <Html className="w-[100px]" position={[-40, 100, 0]}>
        <ShakeWord word={bossMessage} />
      </Html>
      <Eye position={[-20, -175, -100]} scale={0.2} />
    </motion.mesh>
  );
}

export default BossEye;
