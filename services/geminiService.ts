
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptAnalysisResult } from '../types';

const getClient = () => {
    // Helper to safely get API Key from multiple potential sources (Vite env, Vercel, Node)
    let key = '';
    
    try {
        // 1. Try Vite/Vercel Environment Variable (Standard for frontend)
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
            // @ts-ignore
            key = import.meta.env.VITE_GEMINI_API_KEY;
        }
        
        // 2. Fallback to process.env (Legacy/Node/System) - Guidelines preference
        // @ts-ignore
        else if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            // @ts-ignore
            key = process.env.API_KEY;
        }
    } catch (e) {
        console.warn("API Key retrieval failed");
    }
    
    return new GoogleGenAI({ apiKey: key });
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
                        text: `Analyze this receipt image. Extract the merchant name, date, subtotal, tax, total, and suggest a category (Restaurant, Hotel, Transport, Supplies, Miscellaneous). 
                        
                        CRITICAL DATE PARSING RULES:
                        1. Look for the currency symbol. 
                        2. If the currency is EURO (€) or the language is Spanish/French/German, you MUST interpret the date format on the paper as DD/MM/YYYY (Day first).
                           Example: "05/04/2025" in a Euro receipt is April 5th (2025-04-05).
                        3. If the currency is Dollar ($) or US-based, interpret as MM/DD/YYYY (Month first).
                        4. ALWAYS return the final extracted date strictly in ISO 8601 format: YYYY-MM-DD.
                        
                        If the year is 2 digits (e.g., /25), assume 2025. If a value is not found, return 0 or empty string.`
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
