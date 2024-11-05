"use client";
import { useState } from "react";

export default function ThoughtJotter() {
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [thought, setThought] = useState("");
  const [generatedDiagram, setGeneratedDiagram] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // LLM API logic here: transform pros/cons/thought into a diagram representation
    const response = await fetch("/api/transform-thought", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pros, cons, thought }),
    });
    const diagram = await response.json();
    setGeneratedDiagram(diagram);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Pro:</label>
          <textarea value={pros} onChange={(e) => setPros(e.target.value)} />
        </div>
        <div>
          <label>Con:</label>
          <textarea value={cons} onChange={(e) => setCons(e.target.value)} />
        </div>
        <div>
          <label>Thought:</label>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
          />
        </div>
        <button type="submit">Generate Diagram</button>
      </form>

      {generatedDiagram && (
        <div>
          <h3>Generated Venn Diagram</h3>
          {/* Render the diagram */}
          {/* <img src={generatedDiagram.url} alt="Venn Diagram" /> */}
        </div>
      )}
    </div>
  );
}
