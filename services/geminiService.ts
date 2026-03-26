
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";
import { Action, TradeCategory, MaterialsProvidedBy, RoomDimensions } from '../types';
import { ACTIONS, ROOMS, ITEMS, TRADE_MAP, MATERIALS_PROVIDED_BY } from '../constants';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: apiKey as string });

export interface ParsedItem {
  room: string;
  item: string;
  action: Action;
  trade: TradeCategory;
  quantity?: number;
  unit?: string;
  specs?: string;
  notes?: string;
  materialsNeeded?: string;
  materialsProvidedBy?: MaterialsProvidedBy;
}

export interface ParsedWalkthrough {
  items: ParsedItem[];
  dimensions: RoomDimensions[];
  transcript?: string;
}

// Added MarketIntel interface for project dashboard market insights
export interface MarketIntel {
  summary: string;
  permitLinks: { title: string; uri: string }[];
}

const SYSTEM_INSTRUCTION = `
    ACT AS THE REAL-TIME LOGIC ENGINE FOR A CONSTRUCTION WALKTHROUGH.
    
    MISSION: 
    Listen to the user walking a property and extract construction tasks.
    
    RULES:
    1. Identify the current room immediately.
    2. Match items to: ${ITEMS.slice(0, 20).join(', ')}... (and the rest of the trade map).
    3. If the user mentions dimensions, note them.
    4. Provide audio feedback acknowledging items found.
`;

export async function connectLiveWalkthrough(callbacks: {
    onItemFound: (item: ParsedItem) => void;
    onDimensionsFound: (dim: RoomDimensions) => void;
    onTranscript: (text: string, role: 'user' | 'model') => void;
    onAudioChunk: (base64: string) => void;
}) {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: SYSTEM_INSTRUCTION,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
        },
        callbacks: {
            onopen: () => console.log("Live Walkthrough Connected"),
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                    callbacks.onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
                }
                
                // Process transcriptions if available
                if (message.serverContent?.modelTurn?.parts[0]?.text) {
                    callbacks.onTranscript(message.serverContent.modelTurn.parts[0].text, 'model');
                }
            },
            onerror: (e) => console.error("Live Error", e),
            onclose: () => console.log("Live Closed")
        }
    });
}

export async function parseSmartEntry(note: string): Promise<ParsedWalkthrough | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: note,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING, enum: ROOMS },
                    item: { type: Type.STRING, enum: ITEMS },
                    action: { type: Type.STRING, enum: [...ACTIONS] },
                    quantity: { type: Type.NUMBER },
                    specs: { type: Type.STRING },
                    notes: { type: Type.STRING },
                    materialsNeeded: { type: Type.STRING },
                    materialsProvidedBy: { type: Type.STRING, enum: [...MATERIALS_PROVIDED_BY] },
                  },
                  required: ["room", "item", "action"],
                }
              },
              roomDimensions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING, enum: ROOMS },
                    length: { type: Type.NUMBER },
                    width: { type: Type.NUMBER }
                  },
                  required: ["room", "length", "width"]
                }
              }
            }
          }
        },
      });
  
      const jsonText = response.text.trim();
      const parsedResult = JSON.parse(jsonText);
      
      return { 
          items: (parsedResult.lineItems || []).map((p: any) => ({
              ...p,
              trade: TRADE_MAP[p.item]?.trade || 'Misc',
              unit: TRADE_MAP[p.item]?.defaultUnit || 'each',
              quantity: p.quantity || 0,
              materialsProvidedBy: p.materialsProvidedBy || 'Contractor'
          })), 
          dimensions: parsedResult.roomDimensions || [] 
      };
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return null;
    }
}

export async function processAudioWalkthrough(base64Audio: string, mimeType: string): Promise<ParsedWalkthrough | null> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            },
            {
                text: "Transcribe this construction walkthrough audio and extract the precise scope of work and dimensions using Triple-Match Logic."
            }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              lineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING, enum: ROOMS },
                    item: { type: Type.STRING, enum: ITEMS },
                    action: { type: Type.STRING, enum: [...ACTIONS] },
                    quantity: { type: Type.NUMBER },
                    specs: { type: Type.STRING },
                    notes: { type: Type.STRING },
                    materialsNeeded: { type: Type.STRING },
                    materialsProvidedBy: { type: Type.STRING, enum: [...MATERIALS_PROVIDED_BY] },
                  },
                  required: ["room", "item", "action"],
                }
              },
              roomDimensions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING, enum: ROOMS },
                    length: { type: Type.NUMBER },
                    width: { type: Type.NUMBER }
                  },
                  required: ["room", "length", "width"]
                }
              }
            }
          },
        },
      });
  
      const jsonText = response.text.trim();
      const parsedResult = JSON.parse(jsonText);
      
      return { 
          transcript: parsedResult.transcript,
          items: (parsedResult.lineItems || []).map((p: any) => ({
              ...p,
              trade: TRADE_MAP[p.item]?.trade || 'Misc',
              unit: TRADE_MAP[p.item]?.defaultUnit || 'each',
              quantity: p.quantity || 0,
              materialsProvidedBy: p.materialsProvidedBy || 'Contractor'
          })), 
          dimensions: parsedResult.roomDimensions || [] 
      };
    } catch (error) {
      console.error("Error calling Gemini Audio API:", error);
      return null;
    }
}

export async function generateProjectNarrative(address: string, items: any[]): Promise<string> {
    try {
        const tradeSummary = items.reduce((acc: any, item: any) => {
            acc[item.trade] = (acc[item.trade] || 0) + 1;
            return acc;
        }, {});
        
        const summaryText = Object.entries(tradeSummary)
            .map(([trade, count]) => `${count} items in ${trade}`)
            .join(', ');

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate a professional, high-level Project Narrative for a real estate renovation bid. 
            Address: ${address}. 
            Scope Summary: ${summaryText}. 
            The narrative should be concise, professional, and suitable for a contractor bid document. 
            Focus on the primary objectives of the renovation.`,
        });
        
        return response.text || "Project narrative generation failed.";
    } catch (error) {
        console.error("Narrative generation error:", error);
        return "Narrative generation error.";
    }
}

// Added getMarketIntelligence function to support project dashboard with Google Search grounding
export async function getMarketIntelligence(address: string): Promise<MarketIntel | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: `Search for real estate market trends and local building permit offices for ${address}. Provide a 2-sentence market summary.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text || "No summary available.";
        // Extracting URLs from groundingChunks as required for web references
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const permitLinks = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
                title: chunk.web.title || "Market Reference",
                uri: chunk.web.uri
            }))
            .slice(0, 3); // Limit to top 3 links for dashboard display

        return {
            summary,
            permitLinks
        };
    } catch (error) {
        console.error("Market intelligence fetch error:", error);
        return null;
    }
}
