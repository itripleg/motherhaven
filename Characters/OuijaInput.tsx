export {};
// import { useGameContext } from "@/contexts/game-context";
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { positions } from "../components-3d/Ouija/Flecha";
// import { predefinedPositions } from "./Controls";
// import { handleCameraChange, setCamera, zoomCamera } from "@/hooks/CamTools";

// type Props = {};
// export default function OuijaInput({}: Props) {
//   const [questionInput, setQuestionInput] = useState("");
//   const [result, setResult] = useState("");
//   const [summary, setSummary] = useState("");
//   const [displaySummary, setDisplaySummary] = useState("");
//   const [baseCameraPosition, setBaseCameraPosition] = useState([0, 0, 10]);
//   const [isSpelling, setIsSpelling] = useState(false);

//   const {
//     animationControls,
//     setJaxMessage,
//     setOuijaMessage,
//     cameraRef,
//     controlRef,
//   } = useGameContext();

//   async function handleKeyPress(key: any) {
//     // get the last key pressed and move ouija arrow
//     let lastKey = key[key.length - 1];
//     if (lastKey) {
//       await animationControls.start(lastKey);
//     }
//   }

//   let buffer = "";

//   async function moveFlechaToWord(word: string) {
//     setIsSpelling(true);
//     // This now includes every character in the string
//     const characters = word.split("");
//     for (let i = 0; i < characters.length; i++) {
//       const character = characters[i];
//       buffer += character;
//       setDisplaySummary(buffer);
//       setOuijaMessage(buffer);

//       const position =
//         // @ts-ignore
//         positions[character.toLowerCase()] || positions["default"]; // Add a 'default' position for unsupported characters

//       // Assuming you have a default position or a way to handle unsupported characters
//       if (position) {
//         animationControls.start(character); // This might need adjusting based on how you've set up your animation controls for non-letter characters
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait time between moves
//       } else {
//         console.error(`Position for character "${character}" not defined.`);
//       }
//     }
//     animationControls.start("default"); // Return to default position after spelling out the word
//     setIsSpelling(false);
//   }

//   async function onSubmit(event: any) {
//     event.preventDefault();
//     if (isSpelling) {
//       console.log("The board is currently spelling. Please wait.");
//       return; // Prevent form submission if currently spelling
//     }
//     if (questionInput === "") {
//       handleCameraChange("Eye", cameraRef, controlRef);
//       return;
//     }
//     setIsSpelling(true); // Indicate that spelling is starting
//     animationControls.start("default");
//     const response = await fetch("/api/generate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ question: questionInput }),
//     });
//     const data = await response.json();
//     if (response.status !== 200) {
//       throw (
//         data.error || new Error(`Request failed with status ${response.status}`)
//       );
//     }

//     // Extract the word within brackets, if present
//     const regex = /\[([^\]]+)\]/;
//     const matched = data.result.match(regex);
//     if (matched && matched[1]) {
//       const bracketedWord = matched[1].substring(0, 20); // Trim the bracketed word to 20 characters

//       setSummary(bracketedWord);
//       await moveFlechaToWord(bracketedWord); // Use await to ensure spelling completes before proceeding
//       const reply = data.result.replace(regex, "").trim().substring(0, 20); // Trim the remaining text to 20 characters as well
//       setResult(reply);
//     } else {
//       // If no bracketed word is found, handle accordingly, possibly with a default action or message
//       console.log("No bracketed word found in the response.");
//     }

//     setIsSpelling(false); // Reset the spelling indicator after completion

//     const ouijaBoardResponses = [
//       // "This is giving me the creeps.",
//       "You sure about this?",
//       "I have a bad feeling about this.",
//       "This is just a game, right?",
//       // "Shouldn't we be careful with stuff like this?",
//       "I don't know about this thing...",
//       "Let's see if anything happens...",
//       "If anything weird happens, I'm out.",
//       "Fine, ask it something...",
//       "Ask it something.",
//     ];
//     const randomIndex = Math.floor(Math.random() * ouijaBoardResponses.length);
//     const randomResponse = ouijaBoardResponses[randomIndex];
//     setJaxMessage(randomResponse);
//   }

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ delay: 1, duration: 1 }}
//       >
//         {/* <h1 className="text-white text-center text-2xl tracking-[20px] uppercase">
//           <span className="text-red-800">O</span>
//           uija
//         </h1> */}
//         <form onSubmit={onSubmit}>
//           <div className="lg:px-0 w-full flex justify-center">
//             <input
//               type="text"
//               value={questionInput}
//               placeholder={"Ask the Ouija Board..."}
//               className="text-black w-full max-w-4xl p-1 rounded-md border border-red-800"
//               onChange={(e) => {
//                 setQuestionInput(e.target.value);
//                 handleKeyPress(e.target.value.toLowerCase());
//               }}
//             />
//             <button className="bg-red-800/80 p-2 rounded-md ml-2 md:hidden">
//               ▶
//             </button>
//           </div>
//         </form>
//       </motion.div>
//       {/* <div className="text-center px-6 italic">
//         <p>{result}</p>
//         <p className="text-red-800 text-lg uppercase p4">{displaySummary}</p>
//       </div> */}
//     </>
//   );
// }
