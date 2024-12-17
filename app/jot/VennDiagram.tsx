import React, { useState } from "react";
import { Card } from "@/components/ui/card";

export const VennDiagram = ({ data }: any) => {
  if (!data?.circles) return null;

  // Calculate text positions for the points
  const prosTextX = data.circles.pros.cx - data.circles.pros.r * 0.8;
  const consTextX = data.circles.cons.cx + data.circles.cons.r * 0.2;
  const intersectTextX = (data.circles.pros.cx + data.circles.cons.cx) / 2;

  return (
    <div className="space-y-8">
      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          <defs>
            <clipPath id="intersectionClip">
              <circle
                cx={data.circles.pros.cx}
                cy={data.circles.pros.cy}
                r={data.circles.pros.r}
              />
              <circle
                cx={data.circles.cons.cx}
                cy={data.circles.cons.cy}
                r={data.circles.cons.r}
              />
            </clipPath>
          </defs>

          {/* Pros Circle */}
          <circle
            cx={data.circles.pros.cx}
            cy={data.circles.pros.cy}
            r={data.circles.pros.r}
            className="fill-green-200 stroke-green-600"
            strokeWidth="2"
          />

          {/* Cons Circle */}
          <circle
            cx={data.circles.cons.cx}
            cy={data.circles.cons.cy}
            r={data.circles.cons.r}
            className="fill-red-200 stroke-red-600"
            strokeWidth="2"
          />

          {/* Labels */}
          <text
            x={data.circles.pros.cx - 60}
            y={data.circles.pros.cy - data.circles.pros.r - 10}
            className="text-base font-semibold fill-green-700"
          >
            Pros
          </text>
          <text
            x={data.circles.cons.cx - 60}
            y={data.circles.cons.cy - data.circles.cons.r - 10}
            className="text-base font-semibold fill-red-700"
          >
            Cons
          </text>

          {/* Intersection Label */}
          <text
            x={(data.circles.pros.cx + data.circles.cons.cx) / 2 - 40}
            y={data.circles.pros.cy}
            className="text-base font-semibold fill-purple-700"
          >
            Both
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pros Section */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">Pros</h4>
          <ul className="space-y-2">
            {data.prosPoints.map((point: any, i: any) => (
              <li
                key={i}
                className="text-sm text-green-700 pl-4 relative before:content-['•'] before:absolute before:left-0"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Intersection Section */}
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3">
            Balanced Points
          </h4>
          <ul className="space-y-2">
            {data.intersectionPoints.map((point: any, i: any) => (
              <li
                key={i}
                className="text-sm text-purple-700 pl-4 relative before:content-['•'] before:absolute before:left-0"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Cons Section */}
        <div className="p-4 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-3">Cons</h4>
          <ul className="space-y-2">
            {data.consPoints.map((point: any, i: any) => (
              <li
                key={i}
                className="text-sm text-red-700 pl-4 relative before:content-['•'] before:absolute before:left-0"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
