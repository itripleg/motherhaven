import { useGameContext } from "@/contexts/game-context";

type Props = {};

function StartButton({}: Props) {
  const { gameStatus, stopGame, startGame } = useGameContext();

  const isGameInactive =
    gameStatus === "stopped" || gameStatus === "won" || gameStatus === "lost";

  return (
    <>
      <p>
        🏃🏾‍♀️
        {gameStatus === "running" && (
          <button className="text-red-800" onClick={stopGame}>
            Stop
          </button>
        )}
        {isGameInactive && (
          <button className="text-green-800" onClick={startGame}>
            Battle
          </button>
        )}
      </p>
    </>
  );
}

export default StartButton;
