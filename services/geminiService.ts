import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptAnalysisResult } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key not found. Ensure process.env.API_KEY is set.");
        // In a real scenario, we might throw an error, but for the demo UI we handle gracefully
    }
    return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
};

export const analyzeReceiptImage = async (base64Image: string): Promise<ReceiptAnalysisResult> => {
    try {
        const ai = getClient();
        
        // Remove header if present (data:image/jpeg;base64,)
        const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg", 
                            data: cleanBase64
                        }
                    },
                    {
                        text: "Analyze this receipt image. Extract the merchant name, date (YYYY-MM-DD format), subtotal, tax, total, and suggest a category (Restaurant, Hotel, Transport, Supplies, Miscellaneous). If a value is not found, return 0 or empty string."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        merchant: { type: Type.STRING },
                        date: { type: Type.STRING },
                        subtotal: { type: Type.NUMBER },
                        tax: { type: Type.NUMBER },
                        total: { type: Type.NUMBER },
                        category: { type: Type.STRING }
                    },
                    required: ["merchant", "total", "category"]
                }
            }
        });

        const text = response.text;
        if (!text) {
             throw new Error("No response from Gemini");
        }

        const data = JSON.parse(text);
        return data as ReceiptAnalysisResult;

    } catch (error) {
        console.error("Error analyzing receipt:", error);
        // Fallback for demo if API key is missing or fails
        return {
            merchant: "",
            date: new Date().toISOString().split('T')[0],
            subtotal: 0,
            tax: 0,
            total: 0,
            category: "Miscellaneous"
        };
    }
};
