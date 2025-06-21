// // components/FactoryGuard.tsx
// "use client";

// import { useEffect } from "react";
// import { FACTORY_ADDRESS } from "@/types";

// export function FactoryGuard({ children }: { children: React.ReactNode }) {
//   useEffect(() => {
//     if (
//       !FACTORY_ADDRESS ||
//       FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000"
//     ) {
//       throw new Error("Factory address not configured. Check .env.local file.");
//     }
//   }, []);

//   return <>{children}</>;
// }
