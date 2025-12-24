import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { getGeminiClient } from "./aiClients";

export interface ImageAnalysisResult {
  analysis: string;
  confidence: number;
  extractedText?: string;
  complianceRelevance?: {
    framework?: string;
    controls?: string[];
    risks?: string[];
    recommendations?: string[];
  };
  diagramElements?: {
    type: string;
    description: string;
  }[];
}

export interface MultimodalAnalysisOptions {
  prompt?: string;
  framework?: string;
  analysisType?: 'compliance' | 'diagram' | 'document' | 'general';
}

export async function analyzeImage(
  imageData: string,
  options: MultimodalAnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  const { prompt, framework, analysisType = 'general' } = options;
  
  try {
    const genAI = getGeminiClient();
    
    const systemPrompts: Record<string, string> = {
      compliance: `You are a compliance analyst expert. Analyze this image in the context of ${framework || 'general compliance'} requirements. 
        Identify any compliance-relevant information, potential risks, controls mentioned, and provide recommendations.
        Format your response as structured analysis with clear sections.`,
      diagram: `You are a systems architect. Analyze this diagram or flowchart.
        Identify components, relationships, data flows, and provide a structured breakdown.
        Note any security or compliance implications visible in the architecture.`,
      document: `You are a document analyst. Extract and analyze all text and content from this image.
        If it's a compliance document, identify the framework, controls, and requirements mentioned.
        Provide a structured summary of the document contents.`,
      general: `Analyze this image in detail. ${prompt || 'Describe what you see and extract any relevant information.'}
        If there's text, extract it. If there's a diagram, explain it. Provide comprehensive analysis.`
    };

    const analysisPrompt = systemPrompts[analysisType] + (prompt ? `\n\nAdditional context: ${prompt}` : '');
    
    let imageContent: { inlineData: { data: string; mimeType: string } };
    
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        imageContent = {
          inlineData: {
            data: matches[2],
            mimeType: matches[1]
          }
        };
      } else {
        throw new Error('Invalid base64 image format');
      }
    } else {
      imageContent = {
        inlineData: {
          data: imageData,
          mimeType: 'image/png'
        }
      };
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: analysisPrompt },
            imageContent
          ]
        }
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    });

    const textContent = response.text || '';
    
    const result: ImageAnalysisResult = {
      analysis: textContent,
      confidence: 85,
    };

    if (analysisType === 'compliance' && framework) {
      result.complianceRelevance = {
        framework,
        controls: extractControls(textContent),
        risks: extractRisks(textContent),
        recommendations: extractRecommendations(textContent)
      };
    }

    if (analysisType === 'diagram') {
      result.diagramElements = extractDiagramElements(textContent);
    }

    if (analysisType === 'document') {
      result.extractedText = textContent;
    }

    logger.info('Image analysis completed', { 
      analysisType, 
      framework,
      resultLength: textContent.length 
    });

    return result;
  } catch (error) {
    logger.error('Gemini vision analysis failed', { error, analysisType });
    throw error;
  }
}

function extractControls(text: string): string[] {
  const controls: string[] = [];
  const controlPatterns = [
    /(?:control|requirement|clause)[:\s]+([A-Z0-9.-]+)/gi,
    /(?:ISO|NIST|SOC|FedRAMP)[:\s]*([0-9A-Z.-]+)/gi
  ];
  
  for (const pattern of controlPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && !controls.includes(match[1])) {
        controls.push(match[1]);
      }
    }
  }
  
  return controls.slice(0, 10);
}

function extractRisks(text: string): string[] {
  const risks: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (/risk|vulnerability|threat|gap|issue|concern/i.test(line) && line.length > 10 && line.length < 200) {
      risks.push(line.trim());
    }
  }
  
  return risks.slice(0, 5);
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (/recommend|suggest|should|must|implement|consider/i.test(line) && line.length > 10 && line.length < 200) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 5);
}

function extractDiagramElements(text: string): { type: string; description: string }[] {
  const elements: { type: string; description: string }[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (/component|service|database|server|user|client|api|gateway/i.test(line) && line.length > 5 && line.length < 150) {
      elements.push({
        type: 'component',
        description: line.trim()
      });
    }
  }
  
  return elements.slice(0, 10);
}

export async function analyzeMultipleImages(
  images: { data: string; name?: string }[],
  options: MultimodalAnalysisOptions = {}
): Promise<ImageAnalysisResult[]> {
  const results: ImageAnalysisResult[] = [];
  
  for (const image of images) {
    try {
      const result = await analyzeImage(image.data, options);
      results.push(result);
    } catch (error) {
      logger.error('Failed to analyze image', { imageName: image.name, error });
      results.push({
        analysis: `Failed to analyze image: ${image.name || 'unknown'}`,
        confidence: 0
      });
    }
  }
  
  return results;
}
