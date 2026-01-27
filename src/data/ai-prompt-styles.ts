// 100+ AI prompt styles for generating BGMI character images
// Each style is randomly selected when generating a prompt
// NOTE: Poses describe ONLY the action/stance - no clothing, gear, or weapons mentioned
// The user's BGMI character screenshot will determine the outfit

export interface PromptStyle {
    name: string;
    style: string;
    pose: string;
    environment: string;
}

export const AI_PROMPT_STYLES: PromptStyle[] = [
    // Cinematic Styles
    { name: "Hollywood Hero", style: "cinematic Hollywood blockbuster", pose: "standing heroically with arms crossed", environment: "an explosive battlefield at sunset" },
    { name: "Film Noir", style: "dramatic film noir black and white", pose: "leaning against a wall in shadows", environment: "a rain-soaked city alley at night" },
    { name: "Action Movie", style: "high-octane action movie", pose: "mid-combat stance with intense focus", environment: "a collapsing building with debris flying" },
    { name: "War Epic", style: "gritty war film", pose: "walking through smoke with determination", environment: "a destroyed village with fires burning" },
    { name: "Spy Thriller", style: "sleek spy thriller", pose: "confident stance looking over shoulder", environment: "a high-tech facility with blue lighting" },

    // Anime/Manga Styles
    { name: "Shonen Anime", style: "vibrant shonen anime", pose: "powering up with energy aura glowing", environment: "a dramatic sky with speed lines" },
    { name: "Dark Anime", style: "dark seinen anime", pose: "standing in rain looking menacing", environment: "a blood moon rising over ruins" },
    { name: "Mecha Pilot", style: "mecha anime", pose: "confident pilot stance", environment: "a giant robot hangar with sparks" },
    { name: "Cyberpunk Anime", style: "cyberpunk anime like Akira", pose: "leaning forward intensely", environment: "neon-lit Neo Tokyo streets" },
    { name: "Samurai Anime", style: "samurai anime", pose: "ready stance with focused eyes", environment: "cherry blossoms falling in a temple" },

    // Gaming/Esports
    { name: "Esports Champion", style: "professional esports", pose: "celebrating victory with fist raised", environment: "a massive stadium with cheering crowd" },
    { name: "Battle Royale", style: "intense battle royale", pose: "focused aiming stance", environment: "an airdrop zone with parachutes" },
    { name: "Victory Royale", style: "triumphant winner", pose: "victorious pose with arms spread", environment: "the final circle with storm closing" },
    { name: "Loot Drop", style: "treasure hunter", pose: "excited discovery pose", environment: "a glowing airdrop location" },
    { name: "Squad Leader", style: "tactical squad leader", pose: "giving hand signals confidently", environment: "a military compound at dawn" },

    // Neon/Cyberpunk
    { name: "Neon Warrior", style: "neon-soaked cyberpunk", pose: "walking confidently forward", environment: "rain-drenched neon city streets" },
    { name: "Synthwave Hero", style: "retro synthwave", pose: "silhouetted against sunset", environment: "a purple and pink horizon with palm trees" },
    { name: "Digital Glitch", style: "glitchy digital art", pose: "fragmenting and reforming pose", environment: "a corrupted virtual reality space" },
    { name: "Hologram", style: "holographic projection", pose: "emerging from digital particles", environment: "a dark room with blue holograms" },
    { name: "Tron Legacy", style: "Tron-inspired", pose: "ready action stance", environment: "a glowing grid world" },

    // Fantasy
    { name: "Dark Knight", style: "dark fantasy", pose: "powerful stance", environment: "a stormy castle battleground" },
    { name: "Dragon Slayer", style: "epic fantasy", pose: "brave heroic pose", environment: "a volcanic mountain lair" },
    { name: "Shadow Assassin", style: "dark assassin", pose: "emerging from shadows mysteriously", environment: "a moonlit rooftop" },
    { name: "Elemental Mage", style: "magical fantasy", pose: "casting pose with glowing hands", environment: "swirling fire and ice vortex" },
    { name: "Viking Warrior", style: "Norse mythology", pose: "battle cry expression", environment: "a frozen battlefield with northern lights" },

    // Sci-Fi
    { name: "Space Marine", style: "sci-fi space marine", pose: "ready for battle stance", environment: "an alien planet with two moons" },
    { name: "Bounty Hunter", style: "intergalactic bounty hunter", pose: "checking holographic display", environment: "a dusty spaceport cantina" },
    { name: "Mech Warrior", style: "giant mech pilot", pose: "commanding pose", environment: "a city under siege" },
    { name: "Starship Captain", style: "space opera", pose: "giving orders confidently", environment: "starship cockpit with space battle" },
    { name: "Alien Planet", style: "extraterrestrial", pose: "exploring unknown terrain", environment: "a bizarre alien landscape with strange flora" },

    // Military/Tactical
    { name: "Special Forces", style: "elite special forces", pose: "tactical ready stance", environment: "a stealth mission at night" },
    { name: "Sniper Elite", style: "precision sniper", pose: "focused concentration pose", environment: "a hilltop overlooking enemy base" },
    { name: "Commando", style: "action commando", pose: "action hero stance", environment: "an exploding enemy compound" },
    { name: "Paratrooper", style: "airborne soldier", pose: "freefall pose", environment: "clouds and planes in formation" },
    { name: "Urban Warfare", style: "modern urban combat", pose: "corner clearing stance", environment: "a destroyed city block" },

    // Art Styles
    { name: "Oil Painting", style: "classical oil painting", pose: "noble portrait pose", environment: "dark Renaissance background" },
    { name: "Watercolor", style: "beautiful watercolor", pose: "serene meditative stance", environment: "flowing abstract colors" },
    { name: "Comic Book", style: "Marvel/DC comic book", pose: "superhero landing pose", environment: "dramatic action lines and explosions" },
    { name: "Graphic Novel", style: "dark graphic novel", pose: "brooding in shadows", environment: "gritty urban noir setting" },
    { name: "Pop Art", style: "Andy Warhol pop art", pose: "iconic portrait pose", environment: "bold colored background panels" },

    // Environment-Based
    { name: "Desert Storm", style: "desert warfare", pose: "walking through sandstorm", environment: "endless dunes with military convoy" },
    { name: "Arctic Ops", style: "frozen tundra", pose: "braving the cold stance", environment: "blizzard with aurora borealis" },
    { name: "Jungle Hunter", style: "jungle warfare", pose: "stalking prey pose", environment: "dense rainforest with mist" },
    { name: "Mountain Peak", style: "alpine warrior", pose: "standing victorious on summit", environment: "snowy mountain peak at sunrise" },
    { name: "Underground", style: "subterranean", pose: "exploring in darkness", environment: "dark tunnel with mysterious glow" },

    // Time Periods
    { name: "Feudal Japan", style: "feudal Japanese", pose: "disciplined warrior stance", environment: "ancient Japanese castle" },
    { name: "Medieval Knight", style: "medieval", pose: "honorable salute pose", environment: "castle tournament grounds" },
    { name: "Wild West", style: "western gunslinger", pose: "quick draw stance", environment: "dusty frontier town at high noon" },
    { name: "Steampunk", style: "Victorian steampunk", pose: "inventor pose", environment: "clockwork city with airships" },
    { name: "Post-Apocalypse", style: "post-apocalyptic", pose: "survivor stance", environment: "ruined civilization overgrown with plants" },

    // Mood-Based
    { name: "Rage Mode", style: "intense rage", pose: "screaming battle cry", environment: "everything on fire around them" },
    { name: "Cool Calm", style: "ice cold composure", pose: "casually walking away from explosion", environment: "chaos behind, unfazed" },
    { name: "Mysterious", style: "enigmatic mystery", pose: "face partially hidden in shadows", environment: "fog and dim lighting" },
    { name: "Triumphant", style: "glorious victory", pose: "arms raised in triumph", environment: "golden light and confetti" },
    { name: "Determined", style: "unwavering determination", pose: "marching forward unstoppable", environment: "obstacles crumbling before them" },

    // Lighting Styles
    { name: "Golden Hour", style: "golden hour photography", pose: "backlit silhouette pose", environment: "stunning sunset with lens flare" },
    { name: "Blue Hour", style: "twilight blue hour", pose: "contemplative stance", environment: "city skyline at dusk" },
    { name: "Dramatic Rim Light", style: "dramatic rim lighting", pose: "edge-lit from behind", environment: "dark background with single light source" },
    { name: "Neon Glow", style: "neon-lit", pose: "face illuminated by colored lights", environment: "signs and screens glowing" },
    { name: "Lightning Strike", style: "lightning illuminated", pose: "frozen in action", environment: "stormy sky with lightning" },

    // Unique Concepts
    { name: "Mirror Reflection", style: "reflection art", pose: "looking at mirror", environment: "shattered mirrors floating" },
    { name: "Time Freeze", style: "frozen time", pose: "frozen mid-action", environment: "everything suspended mid-action" },
    { name: "Double Exposure", style: "double exposure photography", pose: "profile merged with landscape", environment: "city skyline within silhouette" },
    { name: "Smoke and Mirrors", style: "smoke art", pose: "emerging from thick smoke", environment: "colored smoke swirling dramatically" },
    { name: "Ink Splash", style: "ink splatter art", pose: "dynamic action pose", environment: "black ink explosions" },

    // Character Types
    { name: "Lone Wolf", style: "solo operator", pose: "walking alone into battle", environment: "empty battlefield ahead" },
    { name: "Team Leader", style: "squad commander", pose: "leading team forward", environment: "teammates following behind" },
    { name: "Silent Assassin", style: "stealth killer", pose: "crouched in shadows", environment: "enemy unaware nearby" },
    { name: "Heavy Gunner", style: "heavy weapons specialist", pose: "powerful stance", environment: "destruction from firepower" },
    { name: "Medic Hero", style: "combat medic", pose: "heroic rescue pose", environment: "battlefield triage" },

    // Cultural Fusion
    { name: "K-Pop Warrior", style: "Korean pop culture", pose: "stylish idol pose", environment: "flashy stage with lights" },
    { name: "Bollywood Action", style: "Bollywood action", pose: "dramatic slow-motion mid-air", environment: "colorful explosion background" },
    { name: "Hong Kong Action", style: "John Woo style", pose: "diving action pose", environment: "doves and dramatic lighting" },
    { name: "Afrofuturism", style: "afrofuturist", pose: "regal warrior stance", environment: "advanced African-inspired city" },
    { name: "Aztec Warrior", style: "ancient Aztec", pose: "fierce warrior pose", environment: "pyramid temple with jungle" },

    // Weather/Atmosphere
    { name: "Rainy Night", style: "rain-soaked", pose: "looking up at the rain", environment: "city streets with reflections" },
    { name: "Foggy Morning", style: "misty atmosphere", pose: "emerging from thick fog", environment: "haunted forest at dawn" },
    { name: "Dust Storm", style: "sandstorm survivor", pose: "shielding face from wind", environment: "apocalyptic orange sky" },
    { name: "Snowy Night", style: "winter snowfall", pose: "breath visible in cold", environment: "peaceful snow-covered landscape" },
    { name: "Volcanic Ash", style: "volcanic destruction", pose: "silhouetted against lava", environment: "erupting volcano behind" },

    // Abstract/Artistic
    { name: "Vaporwave", style: "vaporwave aesthetic", pose: "surrounded by Greek statues", environment: "pink and blue grid with palms" },
    { name: "Glitch Art", style: "corrupted digital", pose: "pixelating and reforming", environment: "broken reality glitches" },
    { name: "Minimalist", style: "minimalist design", pose: "simple clean pose", environment: "single color gradient background" },
    { name: "Fractal", style: "fractal geometry", pose: "within infinite patterns", environment: "mathematical fractal world" },
    { name: "Surrealist", style: "Salvador Dali surrealism", pose: "in impossible pose", environment: "melting clocks and floating objects" },

    // Legend/Mythic
    { name: "God of War", style: "Greek god of war", pose: "divine wrath stance", environment: "Mount Olympus battleground" },
    { name: "Demon Hunter", style: "demon hunting", pose: "facing demonic horde", environment: "hell gates opening" },
    { name: "Angel Warrior", style: "divine warrior", pose: "wings spread wide", environment: "heavenly light beams" },
    { name: "Phoenix Rising", style: "rebirth imagery", pose: "rising from flames", environment: "fire transforming to life" },
    { name: "Dragon Spirit", style: "dragon energy", pose: "channeling power", environment: "spectral dragon behind" },
];

// Generate a random prompt (no player name, no clothing/gear references)
export function generateRandomPrompt(): { prompt: string; styleName: string } {
    const style = AI_PROMPT_STYLES[Math.floor(Math.random() * AI_PROMPT_STYLES.length)];

    // Random hand gestures
    const handGestures = [
        "arms crossed confidently",
        "one hand on chin thoughtfully",
        "fist raised in victory",
        "hands in a ready combat stance",
        "pointing forward with determination",
        "arms folded behind back",
        "one hand gesturing forward",
        "hands clasped together",
        "making a peace sign",
        "thumbs up gesture",
    ];
    const randomHand = handGestures[Math.floor(Math.random() * handGestures.length)];

    // Random body angles (but always facing camera for eye contact)
    const bodyAngles = [
        "body slightly turned left, face towards camera",
        "body slightly turned right, face towards camera",
        "body facing straight at camera",
        "three-quarter view from left, eyes on camera",
        "three-quarter view from right, eyes on camera",
        "slight lean to the left, looking at camera",
        "slight lean to the right, looking at camera",
    ];
    const randomAngle = bodyAngles[Math.floor(Math.random() * bodyAngles.length)];

    const prompt = `A vertical 9:16 ${style.style} portrait of a legendary BGMI warrior, ${style.pose}, ${randomHand}. Background: ${style.environment}. COMPOSITION: ${randomAngle}, character centered in frame, maintaining direct eye contact with the camera. FRAMING: Tight chest-up portrait only, showing head, shoulders, and upper chest. Do NOT show waist, hips, thighs, or legs. Cinematic lighting, depth of field, sharp focus on the face, 8k, photorealistic, highly detailed. IMPORTANT: Do NOT add any text, names, titles, watermarks, logos, or UI elements. Do NOT modify the character's outfit. --no text, overlays, UI, watermarks, legs, thighs, waist --ar 9:16`;

    return { prompt, styleName: style.name };
}
