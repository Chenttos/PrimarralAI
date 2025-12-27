
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, StudyContent, QuizQuestion, Flashcard, Language } from "../types";

const getAI = () => {
  const windowKey = (window as any).GEMINI_API_KEY;
  const envKey = process.env.API_KEY;
  
  // Prioridade absoluta para a chave injetada via window se ela tiver o formato básico de uma chave Google
  const apiKey = (windowKey && typeof windowKey === 'string' && windowKey.startsWith("AIza")) 
    ? windowKey 
    : envKey;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const prepareParts = (content: StudyContent) => {
  const parts: any[] = [];
  
  if (content.files && content.files.length > 0) {
    content.files.forEach(file => {
      const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType
        }
      });
    });
  }
  
  if (content.text) {
    parts.push({ text: `CONTEÚDO ADICIONAL/TEXTO:\n${content.text}` });
  }
  
  return parts;
};

const getLangInstruction = (lang: Language) => 
  lang === 'pt' ? "Responda sempre em Português do Brasil." : "Always respond in English.";

export const analyzeContent = async (content: StudyContent): Promise<AnalysisResult> => {
  const ai = getAI();
  const parts = prepareParts(content);
  
  const prompt = `Analise este material de estudo e determine o tópico principal e uma descrição curta e convidativa.
  Se o material não for relacionado a estudos acadêmicos ou aprendizado, defina isStudyMaterial as false.
  
  Retorne EXCLUSIVAMENTE um JSON:
  {
    "isStudyMaterial": true,
    "topic": "Nome do Assunto",
    "description": "Explicação breve do que foi identificado",
    "language": "${content.language}",
    "suggestion": "Uma dica de como estudar este material específico"
  }
  ${getLangInstruction(content.language)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: prompt }] }],
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
  const parts = prepareParts(content);
  const prompt = `Gere um resumo didático, organizado e completo sobre este material. 
  Use formatação Markdown (títulos ##, negrito **, listas -).
  Foque nos conceitos chave e fórmulas, se houver.
  ${getLangInstruction(content.language)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: prompt }] }]
  });
  return response.text || "";
};

export const generateQuiz = async (content: StudyContent): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const parts = prepareParts(content);
  const prompt = `Gere um simulado com 5 questões de múltipla escolha baseadas neste conteúdo.
  Cada questão deve ter 4 opções e uma explicação do porquê a resposta está correta.
  ${getLangInstruction(content.language)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: prompt }] }],
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
  const parts = prepareParts(content);
  const prompt = `Crie 6 flashcards (pergunta/frente e resposta/verso) para memorização rápida deste conteúdo.
  Seja conciso nas respostas.
  ${getLangInstruction(content.language)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: prompt }] }],
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
  const parts = prepareParts(content);
  const prompt = `Explique este conteúdo como se eu tivesse 5 anos de idade (ELI5).
  Use analogias simples do dia a dia.
  ${getLangInstruction(content.language)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: prompt }] }]
  });
  return response.text || "";
};

export const verifyPixReceipt = async (base64Image: string, expectedAmount: number): Promise<{ verified: boolean; reason?: string }> => {
  try {
    const ai = getAI();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `Analise este comprovante de PIX. 
    Verifique estritamente:
    1. O valor é R$ ${expectedAmount.toFixed(2)}?
    2. A chave ou conta de destino é relacionada a "5562982166200", "+55 (62) 98216-6200" ou "Samuel Ribeiro"?
    3. O status da transação é "Concluído", "Sucesso", "Efetivado" ou similar?
    4. A data é de hoje (ou muito recente)?

    Retorne EXCLUSIVAMENTE um JSON:
    {
      "verified": boolean,
      "reason": "Explicação curta do porquê foi ou não verificado"
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verified: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["verified", "reason"]
        }
      }
    });

    return JSON.parse(response.text || '{"verified": false, "reason": "Erro ao ler comprovante"}');
  } catch (error) {
    console.error("Erro na verificação de comprovante:", error);
    return { verified: false, reason: "Falha na conexão com o sistema de segurança." };
  }
};
