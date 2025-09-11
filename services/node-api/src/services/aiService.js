const OpenAI = require('openai');

const OPENAI_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Emociones soportadas por el frontend
const EMOTIONS = ['excited', 'helpful', 'thoughtful', 'calm', 'confident'];

function buildSystemPrompt(language) {
  const lang = (language || 'es').startsWith('es') ? 'es' : 'en';
  const instruction = lang === 'es'
    ? 'Eres STEPVOICE AI, un asistente experto en modelos 3D y AR. Responde SIEMPRE en JSON estrictamente válido, NADA de texto adicional.'
    : 'You are STEPVOICE AI, an assistant expert in 3D models and AR. ALWAYS respond with strictly valid JSON, NO extra text.';

  const schema = {
    text: lang === 'es'
      ? 'Texto de respuesta para el usuario en su idioma.'
      : 'Response text for the user in their language.',
    emotion: `One of: ${EMOTIONS.join(', ')}`,
    action: {
      type: 'optional',
      allowed: [
        'explosion',
        'reset_view',
        'navigation'
      ],
      details: {
        explosion: '{ "type": "explosion", "factor": number }',
        reset_view: '{ "type": "reset_view", "factor": 0 }',
        navigation: '{ "type": "navigation", "target": string }'
      }
    }
  };

  return `${instruction}\n\nFormato JSON requerido:\n{\n  "text": string,\n  "emotion": "excited"|"helpful"|"thoughtful"|"calm"|"confident",\n  "action"?: {\n    "type": "explosion"|"reset_view"|"navigation",\n    // para explosion: include "factor" (number)\n    // para reset_view: include "factor": 0\n    // para navigation: include "target" (string)\n  }\n}\n\nNo agregues comentarios ni explicaciones fuera del JSON.`;
}

function buildUserPrompt(text, language) {
  const lang = (language || 'es').startsWith('es') ? 'es' : 'en';
  const base = lang === 'es'
    ? `Instrucciones:\n- Responde en español natural y breve.\n- Si el usuario pide "explotar" o similar, sugiere action explosion con factor razonable (3-7).\n- Si pide "normal" o "ensamblar", sugiere reset_view.\n- Si pide ir a una pantalla conocida (MainScreen, ModelosScreen, CatalogoScreen, DashExplorer), usa action navigation con target.\n- Si no aplica acción, omite el campo action.`
    : `Instructions:\n- Reply in short, natural English.\n- If user asks to "explode" model, propose action explosion with a reasonable factor (3-7).\n- If user asks for normal/assemble, use reset_view.\n- If user requests navigation to a known screen (MainScreen, ModelosScreen, CatalogoScreen, DashExplorer), use action navigation with target.\n- If no action applies, omit the action field.`;
  return `${base}\n\nUsuario dice: ${text}`;
}

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch (_) {
    // Intento de extracción simple si el modelo envolvió en bloques
    const match = s.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) {}
    }
    return null;
  }
}

async function processChat(text, language) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada. Define la variable en .env');
  }

  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(text, language);

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.4,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' }
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  const parsed = safeParseJSON(content) || {};

  // Normalización y defaults seguros
  let { text: replyText, emotion, action } = parsed;
  if (typeof replyText !== 'string' || replyText.trim() === '') {
    replyText = (language || 'es').startsWith('es')
      ? 'Listo. ¿Qué más te gustaría hacer con el modelo 3D?'
      : 'Done. What else would you like to do with the 3D model?';
  }

  if (!EMOTIONS.includes(emotion)) {
    emotion = 'calm';
  }

  // Validar action si viene
  if (action && typeof action === 'object') {
    if (action.type === 'explosion') {
      const factor = Number(action.factor);
      action.factor = Number.isFinite(factor) ? Math.max(0, Math.min(factor, 10)) : 5.0;
    } else if (action.type === 'reset_view') {
      action.factor = 0;
    } else if (action.type === 'navigation') {
      if (typeof action.target !== 'string') {
        action = undefined;
      }
    } else {
      action = undefined;
    }
  }

  return {
    text: replyText,
    emotion,
    ...(action ? { action } : {})
  };
}

module.exports = { processChat };

