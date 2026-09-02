// app/api/groq/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    console.log('📨 [Groq API] Requête reçue');
    try {
        const body = await request.json();
        const { prompt, model } = body;

        console.log('📝 Prompt reçu, longueur:', prompt?.length || 0);

        if (!prompt) {
            return NextResponse.json(
                { success: false, error: 'Prompt manquant' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('❌ GROQ_API_KEY manquante');
            return NextResponse.json(
                { success: false, error: 'Clé API manquante' },
                { status: 500 }
            );
        }

        const modelToUse = model || 'llama3-8b-8192';
        console.log(`🤖 Modèle: ${modelToUse}`);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un analyste financier expert. Réponds UNIQUEMENT en JSON valide.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1024,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur Groq:', data);
            return NextResponse.json(
                { success: false, error: data.error?.message || 'Erreur API Groq' },
                { status: response.status }
            );
        }

        const text = data.choices?.[0]?.message?.content || '';
        console.log('✅ Réponse reçue, longueur:', text.length);

        if (!text) {
            return NextResponse.json(
                { success: false, error: 'Réponse vide' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, text });

    } catch (error) {
        console.error('❌ Erreur:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}