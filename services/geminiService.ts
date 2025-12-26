
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StudyFile, StudyContent, QuizQuestion, Flashcard, Language } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const prepareParts = (content: StudyContent) => {
  const parts: any[] = [];
  if (content.files && content.files.length > 0) {
    content.files.forEach(file => {
      parts.push({
        inlineData: {
          data: file.base64.split(',')[1],
          mimeType: file.mimeType
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

const getPreferenceInstruction = (prefs?: string) => 
  prefs ? `\nIMPORTANTE: Siga estas preferências do usuário para o estilo do conteúdo: "${prefs}".` : "";

export const analyzeContent = async (content: StudyContent): Promise<AnalysisResult> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const prompt = `Analise este material (pode ser imagem ou PDF). Determine se ele contém material de estudo acadêmico ou técnico. ${getLangInstruction(content.language)} ${getPreferenceInstruction(content.userPreferences)} Responda estritamente em JSON.`;

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

  return JSON.parse(response.text || "{}");
};

export const generateSummary = async (content: StudyContent): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Crie um resumo detalhado e estruturado com base nos arquivos e textos enviados. Use Markdown. ${getLangInstruction(content.language)} ${getPreferenceInstruction(content.userPreferences)}` }] }
  });
  return response.text || "";
};

export const generateQuiz = async (content: StudyContent): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Crie um quiz com 5 questões de múltipla escolha baseado no material. ${getLangInstruction(content.language)} ${getPreferenceInstruction(content.userPreferences)} Responda em JSON.` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateFlashcards = async (content: StudyContent): Promise<Flashcard[]> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Extraia conceitos-chave do material e crie 8 flashcards. ${getLangInstruction(content.language)} ${getPreferenceInstruction(content.userPreferences)} Responda em JSON.` }] },
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
  return JSON.parse(response.text || "[]");
};

export const generateExplanation = async (content: StudyContent): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const parts = prepareParts(content);
  
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...parts, { text: `Explique este conteúdo de forma didática. ${getLangInstruction(content.language)} ${getPreferenceInstruction(content.userPreferences)}` }] }
  });
  return response.text || "";
};
