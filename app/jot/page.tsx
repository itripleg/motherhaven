"use client";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { VennDiagram } from "./VennDiagram";

const ThoughtJotter = () => {
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [thought, setThought] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/transform-thought", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pros, cons, thought }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError("Failed to generate analysis. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Thought Jotter</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Pros:</label>
            <textarea
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              className="w-full h-32 p-2 border rounded-md"
              placeholder="Enter the pros..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Cons:</label>
            <textarea
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              className="w-full h-32 p-2 border rounded-md"
              placeholder="Enter the cons..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Thought:</label>
            <textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              className="w-full h-32 p-2 border rounded-md"
              placeholder="Enter your thought..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Diagram"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {analysis && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Analysis</h3>
            {/* @ts-expect-error type */}
            <p className="mb-6 text-gray-700">{analysis.summary}</p>
            <VennDiagram data={analysis} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ThoughtJotter;
