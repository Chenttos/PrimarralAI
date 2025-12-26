
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StudyImage, StudyContent, QuizQuestion, Flashcard, Language } from "../types";

// Fix: Always use process.env.API_KEY directly in the constructor
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const prepareParts = (content: StudyContent) => {
  const parts: any[] = [];
  if (content.images && content.images.length > 0) {
    content.images.forEach(img => {
      parts.push({
        inlineData: {
          data: img.base64.split(',')[1],
          mimeType: img.mimeType
        }
      });
    });
  }
  if (content.text) {
    parts.push({ text: `CONTEÚDO DE TEXTO FORNECIDO:\n${content.text}` });
  }
  return parts;
};

const getLangInstruction = (lang: Language) => 
  lang === 'pt' ? "Responda em Português do Brasil." : "Respond in English.";

export const analyzeContent = async (content: StudyContent): Promise<AnalysisResult> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const prompt = `Analise este material. Determine se ele contém material de estudo (páginas de livros, notas de aula, diagramas, exercícios ou texto explicativo acadêmico). ${getLangInstruction(content.language)} Responda estritamente em JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isStudyMaterial: { type: Type.BOOLEAN },
          topic: { type: Type.STRING },
          description: { type: Type.STRING },
          language: { type: Type.STRING },
          suggestion: { type: Type.STRING }
        },
        required: ["isStudyMaterial", "topic", "description", "language", "suggestion"]
      }
    }
  });

  // Fix: Access response.text directly (property, not method)
  return JSON.parse(response.text || "{}");
};

export const generateSummary = async (content: StudyContent): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Crie um resumo detalhado e estruturado do conteúdo presente. Use Markdown para formatação. ${getLangInstruction(content.language)}` }] }
  });
  // Fix: Access response.text directly
  return response.text || "";
};

export const generateQuiz = async (content: StudyContent): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Crie um quiz com 5 questões de múltipla escolha baseadas neste material. ${getLangInstruction(content.language)} Responda em JSON.` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER, description: "Índice da opção correta (0-3)" },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  // Fix: Access response.text directly
  return JSON.parse(response.text || "[]");
};

export const generateFlashcards = async (content: StudyContent): Promise<Flashcard[]> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Extraia os conceitos-chave e crie 8 flashcards (termo na frente, explicação no verso). ${getLangInstruction(content.language)} Responda em JSON.` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });
  // Fix: Access response.text directly
  return JSON.parse(response.text || "[]");
};

export const generateExplanation = async (content: StudyContent): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Explique o conteúdo de forma muito simples, como se estivesse explicando para uma criança de 10 anos (ELI5). Use analogias divertidas. ${getLangInstruction(content.language)}` }] }
  });
  // Fix: Access response.text directly
  return response.text || "";
};
