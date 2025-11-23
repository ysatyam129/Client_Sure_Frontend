"use client";

import React, { useState } from "react";

interface AiComposeProps {
  channel: string;
}

const AiCompose: React.FC<AiComposeProps> = ({ channel }) => {
  const [formData, setFormData] = useState({
    industry: "",
    tone: "friendly",
    goal: "book a call",
    language: "en",
    details: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 200;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "details") {
      let words = value.trim().split(/\s+/);

      if (!value.trim()) {
        setWordCount(0);
        setFormData((p) => ({ ...p, details: "" }));
        return;
      }

      if (words.length > MAX_WORDS) {
        const limited = words.slice(0, MAX_WORDS).join(" ");
        setFormData((p) => ({ ...p, details: limited }));
        setWordCount(MAX_WORDS);
        return;
      }

      setFormData((p) => ({ ...p, details: value }));
      setWordCount(words.length);
      return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://localhost:5000/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          ...formData,
          details: { content: formData.details },
        }),
      });

      const data = await res.json();
      setResponse(data.text || "No response received");

      // ⭐ AUTO RESET FORM AFTER RESPONSE
      setFormData({
        industry: "",
        tone: "",
        goal: "",
        language: "",
        details: "",
      });

      setWordCount(0);

    } catch (err) {
      setResponse("Error connecting to AI server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full flex px-8 py-4 transition-all duration-300 ${
        response ? "gap-6" : "justify-center"
      }`}
    >
      {/* LEFT: FORM */}
      <div
        className={`bg-white rounded-xl shadow-md p-6 border border-indigo-100 transition-all duration-300 ${
          response ? "w-1/2" : "w-2/3"
        }`}
      >
        <h2 className="text-2xl font-semibold mb-5 text-indigo-600 capitalize">
          {channel} Bot
        </h2>

        <form onSubmit={handleGenerate} className="space-y-3">

          {/* Industry */}
          <select
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg appearance-auto 
                       text-gray-700 placeholder-gray-400"
          >
            <option value="">Select Industry</option>
            <option value="IT">IT</option>
            <option value="Marketing">Marketing</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Education">Education</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Restaurant">Restaurant</option>
          </select>

          {/* Tone */}
          <select
            name="tone"
            value={formData.tone}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg appearance-auto 
                       text-gray-700 placeholder-gray-400"
          >
            <option value="">Select Tone</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="sales">Sales</option>
            <option value="excited">Excited</option>
          </select>

          {/* Goal */}
          <input
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            placeholder="Goal…"
            className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg 
                       text-gray-700 placeholder-gray-400"
          />

          {/* Language */}
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg appearance-auto 
                       text-gray-700 placeholder-gray-400"
          >
            <option value="">Select Language</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="pa">Punjabi</option>
            <option value="bn">Bengali</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="kn">Kannada</option>
          </select>

          {/* Details */}
          <div>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows={3}
              className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg resize-none 
                         text-gray-700 placeholder-gray-400"
              placeholder="Extra details (max 200 words)…"
            />
            <p className="text-right text-xs text-gray-500 mt-1">
              {MAX_WORDS - wordCount} words left
            </p>
          </div>

          {/* Button */}
          <div className="pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg text-white font-semibold"
            >
              {loading ? "Generating…" : "Generate Message"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT: RESPONSE */}
      {response && (
        <div className="w-1/2 bg-gray-900 text-white p-6 rounded-xl border border-gray-700 overflow-y-auto">
          <h3 className="text-xl font-semibold mb-3 text-indigo-400">
            AI Response
          </h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
};

export default AiCompose;