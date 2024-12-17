export {};
// "use client";

// import { useState, useEffect } from "react";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useGlobalFinance } from "../contexts/GlobalFinanceContext";
// import { DayProps } from "react-day-picker";

// type FinancialEvent = {
//   id?: string;
//   amount: number;
//   description: string;
//   date: Date;
//   type: "income" | "expense";
//   isReceived: boolean;
// };

// type DailyEvents = {
//   [date: string]: FinancialEvent[];
// };

// export function CalendarComponent() {
//   const { financialEvents, addFinancialEvent, loading } = useGlobalFinance();
//   const [date, setDate] = useState<Date | undefined>(new Date());
//   const [events, setEvents] = useState<DailyEvents>({});
//   const [newEvent, setNewEvent] = useState<FinancialEvent>({
//     amount: 0,
//     description: "",
//     date: new Date(),
//     type: "expense",
//     isReceived: false,
//   });

//   useEffect(() => {
//     if (financialEvents.length > 0) {
//       const groupedEvents = financialEvents.reduce((acc, event) => {
//         const dateString = event.date.toISOString().split("T")[0];
//         if (!acc[dateString]) {
//           acc[dateString] = [];
//         }
//         acc[dateString].push(event);
//         return acc;
//       }, {} as DailyEvents);

//       setEvents(groupedEvents);
//     }
//   }, [financialEvents]);

//   const addEvent = async () => {
//     if (date) {
//       await addFinancialEvent({
//         ...newEvent,
//         date: date,
//         isReceived: newEvent.isReceived ?? false,
//       });
//     }
//   };

//   const modifiers = {
//     hasEvents: (day: Date) => {
//       const dateString = day.toISOString().split("T")[0];
//       return !!events[dateString];
//     },
//   };

//   const modifiersClassNames = {
//     hasEvents: "has-events",
//   };

//   const CustomDay = (props: DayProps) => {
//     const dateString = props.day.toISOString().split("T")[0];
//     const dailyEvents = events[dateString];

//     const dayClassNames = `w-8 h-8 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center ${
//       dailyEvents && dailyEvents.length > 0
//         ? dailyEvents.reduce(
//             (sum, event) =>
//               sum + (event.type === "income" ? event.amount : -event.amount),
//             0
//           ) >= 0
//           ? "bg-green-400 hover:bg-green-500 rounded-full"
//           : "bg-red-400 hover:bg-red-500 rounded-full"
//         : ""
//     }`;

//     if (dailyEvents && dailyEvents.length > 0) {
//       return (
//         <TooltipProvider>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <div role="button" className={dayClassNames}>
//                 {props.day.getDate()}
//               </div>
//             </TooltipTrigger>
//             <TooltipContent className="bg-primary text-white shadow-md relative">
//               <div className="text-sm">
//                 <p className="font-bold">
//                   Net: $
//                   {dailyEvents
//                     .reduce(
//                       (sum, event) =>
//                         sum + (event.type === "income" ? event.amount : -event.amount),
//                       0
//                     )
//                     .toFixed(2)}
//                 </p>
//                 <ul className="list-disc list-inside">
//                   {dailyEvents.map((event, index) => (
//                     <li
//                       key={index}
//                       className={event.type === "income" ? "text-green-600" : "text-red-600"}
//                     >
//                       {event.description}: ${event.amount.toFixed(2)}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//       );
//     }

//     return (
//       <div role="button" className="w-8 h-8 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center">
//         {props.day.getDate()}
//       </div>
//     );
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="space-y-4">
//       <Calendar
//         mode="single"
//         selected={date}
//         onSelect={setDate}
//         className="rounded-md flex justify-center"
//         modifiers={modifiers}
//         modifiersClassNames={modifiersClassNames}
//         components={{
//           Day: CustomDay
//         }}
//       />
//       <Dialog>
//         <DialogTrigger asChild>
//           <Button>Add Event</Button>
//         </DialogTrigger>
//         <DialogContent className="text-muted-foreground">
//           <DialogHeader className="text-primary">
//             <DialogTitle>
//               {date ? `Record Financial Event for ${date.toDateString()}` : "No date selected"}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <Input
//               type="number"
//               placeholder="Amount"
//               value={newEvent.amount || ""}
//               onChange={(e) =>
//                 setNewEvent((prev) => ({
//                   ...prev,
//                   amount: parseFloat(e.target.value) || 0,
//                 }))
//               }
//             />
//             <Input
//               placeholder="Description"
//               value={newEvent.description}
//               onChange={(e) =>
//                 setNewEvent((prev) => ({
//                   ...prev,
//                   description: e.target.value,
//                 }))
//               }
//             />
//             <Select
//               value={newEvent.type}
//               onValueChange={(value: "income" | "expense") =>
//                 setNewEvent((prev) => ({ ...prev, type: value }))
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="income">Income</SelectItem>
//                 <SelectItem value="expense">Expense</SelectItem>
//               </SelectContent>
//             </Select>
//             <Button onClick={addEvent}>Add Event</Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
