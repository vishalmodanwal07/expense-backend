import { GoogleGenerativeAI } from "@google/generative-ai";


console.log(process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getInsights = async (spendingData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Act as a financial advisor. Here is my spending for the last 30 days: ${JSON.stringify(spendingData)}. 
  Give me 3 short, actionable tips to save money. Keep it under 100 words.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}