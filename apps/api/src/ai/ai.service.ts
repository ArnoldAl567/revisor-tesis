import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async analyzeThesis(docText: string, templateSchema: any) {
    const prompt = `
      Actúa como un revisor académico experto. Compara el siguiente avance de tesis contra el patrón institucional.
      
      PATRÓN (Estructura requerida):
      ${JSON.stringify(templateSchema)}

      TEXTO DE LA TESIS:
      ${docText.substring(0, 15000)} // Limitación de tokens

      Genera un análisis en formato JSON con:
      1. Puntaje de 0-100.
      2. Nota decimal (0-20).
      3. Resumen ejecutivo.
      4. Lista de 'findings' (cada uno con: sección, severidad [CRITICAL, MAJOR, MINOR], descripción y cómo corregirlo).
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }
}