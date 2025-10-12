// profile_manager.js

const PROFILE_KEY = "neurolearn_profile";

const DEFAULT_PROFILE = {
    name: "User",
    focus_span: "short (10-20 min)",
    task_preference: "structured (step-by-step)",
    learning_style: "visual",
    visual_preference: "standard",
    sensitivity: "medium",
    background_noise: "none_required",
};

/**
 * Loads the cognitive profile from localStorage.
 */
export function loadProfile() {
    try {
        const storedProfile = localStorage.getItem(PROFILE_KEY);
        if (storedProfile) {
            return { ...DEFAULT_PROFILE, ...JSON.parse(storedProfile) };
        }
    } catch (e) {
        console.error("Error loading profile from localStorage:", e);
    }
    return DEFAULT_PROFILE;
}

/**
 * Saves the current profile dictionary to localStorage.
 */
export function saveProfile(p) {
    try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } catch (e) {
        console.error("Error saving profile to localStorage:", e);
    }
}

/**
 * Returns a formatted summary of the loaded profile (using HTML/Markdown equivalent).
 */
export function getProfileSummary(profile) {
    return `
        <p>Profile for <b>${profile.name || 'User'}</b></p>
        <ul>
            <li><b>Focus Span</b>: <i>${profile.focus_span}</i> | <b>Task Style</b>: <i>${profile.task_preference}</i></li>
            <li><b>Learning Style</b>: <i>${profile.learning_style}</i> | <b>Visual Preference</b>: <i>${profile.visual_preference}</i></li>
            <li><b>Sensitivity</b>: <i>${profile.sensitivity}</i> | <b>Noise</b>: <i>${profile.background_noise}</i></li>
        </ul>
    `;
}