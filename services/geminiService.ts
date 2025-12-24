
import { GoogleGenAI, Type } from "@google/genai";
import { Challenge, Difficulty, Feedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateChallenge = async (difficulty: Difficulty, previousTopics: string[]): Promise<Challenge> => {
  const prompt = `
    Act as a Django and SQL expert educator. 
    Generate a new database challenge for a user at the ${difficulty} level.
    
    Rules:
    1. Provide a realistic Django model definition (Python code). 
       - For BEGINNER: Use 1 simple model.
       - For INTERMEDIATE/ADVANCED: MUST use 2 or 3 related models (ForeignKey, ManyToMany) to test JOINs and relationships.
    2. The models string MUST include actual newlines (\n) for proper code formatting.
    3. Define a practical question that requires writing a query.
    4. The question should focus on ${difficulty} concepts:
       - Beginner: Basic filtering (filter, exclude), ordering (order_by), and simple field selection.
       - Intermediate: Relationships (select_related, prefetch_related), Aggregations (Count, Sum, Avg), and Annotations.
       - Advanced: Complex subqueries, F expressions, Q objects, Window functions, or raw SQL equivalent for optimization.
    5. Ensure the topic is different from: ${previousTopics.join(', ')}.
    
    Output the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          models: { type: Type.STRING, description: "Formatted multi-line Django model code" },
          tableName: { type: Type.STRING },
          question: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          topic: { type: Type.STRING }
        },
        required: ["id", "models", "tableName", "question", "difficulty", "topic"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const validateSingleAnswer = async (
  challenge: Challenge,
  answer: string,
  type: 'sql' | 'orm'
): Promise<Feedback> => {
  const prompt = `
    Challenge Question: ${challenge.question}
    Models:
    ${challenge.models}
    
    User ${type.toUpperCase()} Answer:
    ${answer}
    
    Validate this ${type.toUpperCase()} solution.
    1. Check for syntax correctness for ${type === 'sql' ? 'PostgreSQL/Standard SQL' : 'Django ORM'}.
    2. Check if it logically solves the question based on the provided models.
    3. Provide clear explanations.
    4. If incorrect, provide the corrected version (formatted with newlines).
    5. If correct, provide a best practice tip or improvement.
    
    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN },
          explanation: { type: Type.STRING },
          correctVersion: { type: Type.STRING },
          improvement: { type: Type.STRING }
        },
        required: ["isCorrect", "explanation"]
      }
    }
  });

  return JSON.parse(response.text.trim());
};
