import React from "react";

type Props = { win: boolean };

function GameOver({ win }: Props) {
  return (
    <>
      <div className=" absolute z-30 flex h-screen top-0 w-full items-center justify-center text-center bg-black/70 text-[100px] lg:text-[200px]">
        {win ? <p>You Win!</p> : <p>u die</p>}
      </div>
    </>
  );
}

export default GameOver;
