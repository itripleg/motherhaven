import { useState, useEffect } from "react";
import Character from "./Character";
import { useGameContext } from "@/contexts/game-context";

function Jax({}: any) {
  const name = "Jax";

  const {
    gameTimer,
    heroHealth,
    applyDamage,
    gameStatus,
    gameRestart,
    battle,
    jaxMessage,
  } = useGameContext();

  const [attackLevel, setAttackLevel] = useState(0);
  const [healLevel, setHealLevel] = useState(0);
  const [ultLevel, setUltLevel] = useState(0);
  const [message, setMessage] = useState("");

  const attackMessages = [
    "I'm coming for you.",
    "I'm right behind you.",
    "Let's go punk!",
    "You're mine now.",
    "You're dead meat.",
    "You're going to die.",
  ];

  const healMessages = [
    "Hold on, I'm healing.",
    "I'm going to be fine.",
    "Restoring my strength.",
    "Healing in progress.",
    "I'll feel better soon.",
    "I've got to stay strong.",
  ];

  function attack(damageDealt: number) {
    if (gameStatus !== "running" || attackLevel < 100) {
      return;
    }
    // const randomIndex = Math.floor(Math.random() * 8);
    const randomIndex = Math.floor(Math.random() * attackMessages.length);
    const damageAmount = randomIndex * 5;
    let message = "";
    if (!randomIndex) {
      message = "Missed!";
    } else {
      // message = `${name} attacks for ${damageAmount} damage!`;
      message = `${attackMessages[randomIndex]}`;
      applyDamage("enemy", damageAmount);
      setAttackLevel(0);
    }
    console.log(message);
    setMessage(message);
    return randomIndex;
  }

  function heal() {
    if (healLevel >= 100) {
      const randomIndex = Math.floor(Math.random() * healMessages.length);
      const healAmount = heroHealth + randomIndex * 2;
      setMessage(healMessages[randomIndex]);
      console.log(name + " heals for " + healAmount + "!");
      applyDamage("hero", healAmount * -1);
      setHealLevel(100);
    }
  }

  function ult() {
    if (gameStatus != "running") {
      return;
    }
    console.log(name + " ults!");
    applyDamage("enemy", 75);
  }

  // Sync with game timer
  useEffect(() => {
    if (gameRestart) {
      setAttackLevel(0);
      setHealLevel(0);
      setUltLevel(0);
      return;
    }
    if (gameStatus === "running") {
      setAttackLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 30 : prevProgress
      );
      setHealLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 10 : prevProgress
      );
      setUltLevel((prevProgress) =>
        prevProgress < 100 ? prevProgress + 35 : prevProgress
      );
    }

    // Include any additional logic that needs to be run on each timer tick
  }, [gameTimer, gameStatus, gameRestart]); // Dependency on gameTimer and gameStatus

  return (
    <Character
      name={name}
      message={message}
      image={"/Jax.png"}
      width={100}
      health={heroHealth}
      attack={attack}
      heal={heal}
      ult={ult}
      attackLevel={attackLevel}
      healLevel={healLevel}
      ultLevel={ultLevel}
      battle={battle}
      characterMessage={jaxMessage}
    />
  );
}

export default Jax;
