// import Image from "next/image";
// import SkillBar from "./SkillBar";
// import OuijaInput from "./OuijaInput";
// import { useGameContext } from "@/contexts/game-context";
// import Controls from "./Controls";

// type Props = {
//   name: string;
//   message: string | null;
//   image: string;
//   width?: number;
//   height?: number;
//   style?: React.CSSProperties;
//   imageStyle?: React.CSSProperties;
//   health: number;
//   attackLevel?: number;
//   healLevel?: number;
//   ultLevel?: number;
//   attack: Function;
//   heal: Function;
//   ult: Function;
//   battle: Boolean;
//   characterMessage?: string;
// };

// function Character({
//   name,
//   message = "Just what are you looking at?",
//   image,
//   width = 60,
//   height = 100,
//   style,
//   imageStyle,
//   health,
//   attack,
//   ult,
//   attackLevel,
//   healLevel,
//   ultLevel,
//   heal,
//   battle,
//   characterMessage,
// }: Props) {
//   const { view } = useGameContext();
//   return (
//     <div className="relative max-w-[350px] lg:max-w-[750px] p-2  rounded-full bg-black/80 border">
//       <div className="absolute -bottom-16 text-center h-20 min-w-[100px] max-w-[200px] w-full">
//         {view != "Ouija" && (
//           <p className="bg-black border rounded-md mt-2">
//             {message ? message : name}
//           </p>
//         )}
//         {/* <input className="rounded-md" /> */}
//         {view == "Ouija" && (
//           <div className="">
//             <OuijaInput />
//           </div>
//         )}
//       </div>
//       <div>
//         <div className="flex">
//           {/* Avatar */}
//           <Image
//             alt="avatar"
//             src={image}
//             width={width}
//             height={height}
//             className=" rounded-full"
//             style={imageStyle}
//           />

//           {/* Actions */}
//           {battle ? (
//             <SkillBar
//               battle={battle}
//               health={health}
//               attackLevel={attackLevel}
//               healLevel={healLevel}
//               ultLevel={ultLevel}
//               attack={attack}
//               heal={heal}
//               ult={ult}
//             />
//           ) : (
//             <>
//               <div className="h-[200px] w-[100px] text-center flex justify-center items-center scrollbar overflow-y-scroll">
//                 <p>{characterMessage}</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Character;
export {};
