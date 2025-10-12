// adaptive_core.js

// Global flags
export const HAVE_TRANSFORMERS = true; 
export const HAVE_FER = false; // Set to false because we are using a simple internal simulation

// --- Perplexity API Configuration ---
const PPLX_API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
// !!! USER'S API KEY INTEGRATED !!!
const PPLX_API_KEY = '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'; 
const IS_API_CONFIGURED = PPLX_API_KEY !== 'YOUR_API_KEY'; 
// ------------------------------------


// --- NLP Utilities ---

async function getSummary(text, profile) {
    if (!IS_API_CONFIGURED) {
        // Fallback if the user has not configured the key
        return null;
    }
    
    const focusSpan = profile.focus_span || "medium (20-35 min)";
    const isShort = focusSpan.toLowerCase().includes("short");
    
    const systemPrompt = "You are an Adaptive AI Assistant specializing in creating precise, concise, and structured summaries for neurodivergent learners. Adapt your tone to be helpful and direct.";
    
    let userPrompt = `Please simplify and summarize the following text based on this profile: Focus Span is '${focusSpan}'.`;
    
    if (profile.task_preference === "structured (step-by-step)") {
        userPrompt += " The learner prefers a structured, step-by-step format for the summary. Use bullet points or numbered lists if possible.";
    } else {
        userPrompt += " The learner prefers a high-level, big-picture summary.";
    }
    
    if (isShort) {
        userPrompt += " Make the summary very concise (max 2-3 key points/short sentences) to match the short focus span.";
    } else {
        userPrompt += " Provide a comprehensive summary (4-5 key points/sentences).";
    }
    
    userPrompt += "\n\nTEXT TO SUMMARIZE:\n" + text;

    const data = {
        model: "mistral-7b-instruct",
        messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": userPrompt }
        ],
    };

    try {
        const response = await fetch(PPLX_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PPLX_API_KEY}`,
                'accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API error: ${response.status} - ${errorBody}`);
        }

        const jsonResponse = await response.json();
        return jsonResponse.choices[0].message.content;
        
    } catch (error) {
        console.error("Perplexity API call failed:", error);
        return null; 
    }
}

function simpleFallbackSummary(text, maxSentences = 2) {
    if (!text || text.trim().length < 20) return text;
    const sentences = text.trim().match(/[^.!?]+[.!?]/g) || [text];
    return sentences.slice(0, maxSentences).join(' ').trim();
}

function applyTextStructure(text, taskPreference) {
    // This is used for the fallback structure if the API fails
    const sentences = text.match(/[^.!?]+[.!?]/g) || [text];
    
    if (taskPreference === "structured (step-by-step)") {
        const structuredText = sentences
            .filter(s => s.trim())
            .map((s, i) => `- <b>STEP ${i + 1}</b>: ${s.trim()}`)
            .join('\n');
        return `<h4>🧩 Structured Breakdown (Fallback)</h4>\n${structuredText}`;
    } else {
        return `<h4>🧠 Simplified Insight (Fallback)</h4>${text}`;
    }
}

export async function simplifyText(text, profile) {
    if (!text || text.trim().length < 20) {
        return "Text too short to simplify.";
    }

    const apiSummary = await getSummary(text, profile);

    if (apiSummary !== null && apiSummary.length > 0) {
        return apiSummary;
    } else {
        // Fallback to simple sentence extraction if API call fails
        const focusSpan = profile.focus_span || "short (10-20 min)";
        const isShort = focusSpan.toLowerCase().includes("short");
        const maxSentences = isShort ? 1 : 2;
        const fallbackText = simpleFallbackSummary(text, maxSentences);
        
        return applyTextStructure(fallbackText, profile.task_preference);
    }
}


export function renderOutput(text, profile) {
    const visualPreference = profile.visual_preference || "standard";
    let style = "";
    
    if (visualPreference === "high_contrast") {
        style = "background-color:#1a1a1a; color: #ffffff; padding: 15px; border-radius: 8px; border: 2px solid #555;";
    } else if (visualPreference === "low_saturation") {
        style = "background-color:#e8f5e9; color: #333333; padding: 15px; border-radius: 8px; border: 1px solid #c8e6c9;";
    }
    
    return `
        <div style="${style}">
            ${text}
        </div>
        ${(profile.learning_style === 'auditory' || profile.learning_style === 'mixed') 
            ? '<button id="tts-button" class="btn btn-secondary mt-3">🔊 Play Audio (Auditory Preference)</button>' 
            : ''}
    `;
}

export function playTts(text) {
    if ('speechSynthesis' in window) {
        const cleanText = text.replace(/<[^>]*>?/gm, '').replace(/#+\s*/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Audio failed (Web Speech API not supported in this browser).");
    }
}

// --- Visual File Analysis (Conceptual Mock) ---
export function analyzeVisualFile(file) {
    if (!file) return "No file provided."; 

    const type = file.type || '';
    const name = file.name || '';
    
    const lowerType = type.toLowerCase();
    const lowerName = name.toLowerCase();

    // 1. Image/Video
    if (lowerType.includes('image')) {
        return "Keywords extracted: Diagrams, charts, concepts, visual structure.";
    } else if (lowerType.includes('video')) {
        return "Keywords extracted: Key timestamps, main speaker, lecture slides.";
    } 
    
    // 2. Text File (.txt)
    else if (lowerType.startsWith('text/') || lowerName.endsWith('.txt')) {
        return "Keywords extracted: Detailed notes, linear structure, key phrases."; 
    } 
    
    // 3. PDF
    else if (lowerType === 'application/pdf') {
        return "Keywords extracted: Section titles, figures, complex data, formal definitions."; 
    } 
    
    // 4. Word (.doc, .docx)
    else if (lowerType.includes('word') || lowerType.includes('msword') || lowerType.includes('officedocument.wordprocessingml.document')) {
        return "Keywords extracted: Document structure, formal writing style, section headings, detailed arguments.";
    } 
    
    // 5. PowerPoint (.ppt, .pptx)
    else if (lowerType.includes('powerpoint') || lowerType.includes('presentationml.presentation')) {
        return "Keywords extracted: Slide titles, high-level overview, visual cues, key data points.";
    }
    
    return `Keywords: General study concepts. (File type: ${lowerType || 'Unknown'} not specifically analyzed)`;
}


// --- Focus/Timer Utilities ---

// This function now uses simple internal simulation
export async function detectLiveEmotion(videoElement) {
    // Random Simulated detection
    const emotions = ["neutral", "happy", "sad", "angry", "fear", "surprise"];
    return emotions[Math.floor(Math.random() * emotions.length)];
}


export function adjustFocusDuration(profile, dominantEmotion) {
    let base = 25;
    const fs = profile.focus_span || "medium (20-35 min)";
    if (fs.includes("short")) base = 15;
    else if (fs.includes("long")) base = 35;
    
    let adj = 0;
    let message = "";
    
    if (["sad", "angry", "fear"].includes(dominantEmotion)) {
        adj -= 5;
        message = "You seem stressed. The session is shortened for cognitive load reduction.";
    } else if (["happy", "surprise"].includes(dominantEmotion)) {
        adj += 5;
        message = "You are in a good state! The session is slightly lengthened.";
    } else {
        message = "Neutral emotion detected. Using your base focus time.";
    }

    const sens = profile.sensitivity || "medium";
    if (sens === "high") {
        adj -= 5;
        message += "\n*High sensitivity adjusted: further reduction applied.*";
    } else if (sens === "low") {
        adj += 2;
        message += "\n*Low sensitivity adjusted: slight time boost applied.*";
    }

    let focusMinutes = Math.max(5, base + adj); 
    
    let microBreakMessage = "";
    const isMicroBreakMode = (fs.includes("short") && sens === "high");
    
    if (isMicroBreakMode) {
        microBreakMessage = "\n\n<b>ADAPTIVE STRATEGY</b>: The timer will include a short <i>micro-break</i> due to your profile (Short span + High sensitivity).";
    }
    
    return { focusMinutes, message: message + microBreakMessage, isMicroBreakMode };
}