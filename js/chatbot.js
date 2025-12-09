document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // UI elements
  // ----------------------------
  const chatBtn = document.getElementById('chatbot-btn');
  const chatBox = document.getElementById('chatbot-box');
  const chatClose = document.getElementById('chatbot-close');
  const messages = document.getElementById('chatbot-messages');
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const typing = document.getElementById('typing-indicator');
  //const voiceBtn = document.getElementById('voice-btn');

  // ----------------------------
  // Load chat history (in-memory)
  // ----------------------------
  let history = [];
  history.forEach(m => addMessage(m.text, m.sender));

  // ----------------------------
  // Load portfolio knowledge base
  // ----------------------------
  let knowledge = {};
  let knowledgeLoaded = false;

  let greeted = false; // flag to ensure greeting only once

  function greetUser() {
    if (!greeted && knowledgeLoaded) {
      const greetingIntent = knowledge.intents?.find(i => i.tag === "greeting");
      const greetingMsg = greetingIntent ? greetingIntent.response : "Hello! 👋 How can I help you?";
      addMessage(greetingMsg, "bot");
      saveHistory(greetingMsg, "bot");
      greeted = true;
      typing.style.display = "none"
    }
  }

  fetch("portfolio-data.json")
    .then(res => res.json())
    .then(data => { knowledge = data; knowledgeLoaded = true; console.log("Knowledge loaded:", knowledge); })
    .catch(err => console.error("Failed to load knowledge:", err));

  // ----------------------------
  // Chat window toggle
  // ----------------------------
  chatBtn.addEventListener('click', () => {
    chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
    greetUser();
  });
  chatClose.addEventListener('click', () => {
    chatBox.style.display = 'none';
  });

  // ----------------------------
  // Add message to UI
  // ----------------------------
  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = sender === "user" ? "user-msg" : "bot-msg";

    // Handle array or object dynamically
    if (Array.isArray(text)) {
      div.innerHTML = text.map(item => `• ${item}`).join("<br>");
    } else if (typeof text === "object" && text !== null) {
      div.innerHTML = Object.entries(text)
        .map(([k, v]) => Array.isArray(v) ? `<strong>${k}:</strong><br>• ${v.join("<br>• ")}` : `<strong>${k}:</strong> ${v}`)
        .join("<br>");
    } else {
      div.textContent = text;
    }

    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function saveHistory(text, sender) {
    history.push({ text, sender }); // in-memory
  }

  // ----------------------------
  // Fuzzy keyword matching helper
  // ----------------------------
  function matchKeywords(msg, keywords) {
    msg = msg.toLowerCase();
    for (const kw of keywords) {
      if (msg.includes(kw.toLowerCase())) return true;
    }
    return false;
  }

  // ----------------------------
  // Dynamic JSON-trained reply (fuzzy + intents)
  // ----------------------------
  function getTrainedReply(msg) {
    if (!knowledgeLoaded) return null;
    msg = msg.toLowerCase().trim();

    // 1️⃣ Match intents
    if (knowledge.intents) {
      for (const intent of knowledge.intents) {
        if (matchKeywords(msg, intent.patterns)) return intent.response;
      }
    }

    // 2️⃣ Match main knowledge keys dynamically
    for (const key in knowledge) {
      const value = knowledge[key];
      const k = key.toLowerCase();
      if (msg.includes(k) || k.includes(msg)) return value;
    }

    // 3️⃣ Fuzzy keyword mapping for common sections
    if (matchKeywords(msg, ["skill", "technology", "tech stack"])) return knowledge.skills;
    if (matchKeywords(msg, ["project", "work", "portfolio", "built"])) return knowledge.projects || knowledge.achievements;
    if (matchKeywords(msg, ["achievement", "success", "accomplishment"])) return knowledge.achievements;
    if (matchKeywords(msg, ["contact", "reach", "email", "linkedin", "github"])) return knowledge.contact;
    if (matchKeywords(msg, ["about", "who", "experience", "bio"])) return knowledge.about;
    if (matchKeywords(msg, ["faq", "question"])) return knowledge.faqs;

    // 4️⃣ Search recursively in nested objects/arrays
    for (const key in knowledge) {
      const value = knowledge[key];
      if (typeof value === "object") {
        const found = getTrainedReplyRecursive(msg, value);
        if (found) return found;
      }
    }

    // 5️⃣ Default fallback
    return null;
  }

  function getTrainedReplyRecursive(msg, obj) {
    if (!obj) return null;
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === "object") {
        const found = getTrainedReplyRecursive(msg, value);
        if (found) return found;
      } else if (typeof value === "string" && value.toLowerCase().includes(msg)) {
        return value;
      }
    }
    return null;
  }

  // ----------------------------
  // Send message
  // ----------------------------
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    saveHistory(text, "user");
    input.value = "";
    typing.style.display = "block";

    if (!knowledgeLoaded) {
      await new Promise(resolve => {
        const check = setInterval(() => {
          if (knowledgeLoaded) { clearInterval(check); resolve(); }
        }, 100);
      });
    }

    const trainedReply = getTrainedReply(text);

    if (trainedReply) {
      setTimeout(() => {
        typing.style.display = "none";
        addMessage(trainedReply, "bot");
        saveHistory(trainedReply, "bot");
      }, 600);
      return;
    }

    // Fallback backend API
    try {
      const res = await fetch("https://portfolio-augt.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const botReply = data.reply || "I couldn't understand that.";
      typing.style.display = "none";
      addMessage(botReply, "bot");
      saveHistory(botReply, "bot");
    } catch (err) {
      typing.style.display = "none";
      const errorMsg = "⚠️ Server error. Try again later.";
      addMessage(errorMsg, "bot");
      saveHistory(errorMsg, "bot");
      console.error(err);
    }
  }

  input.addEventListener("keypress", e => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });
  sendBtn.addEventListener("click", sendMessage);

  // if (voiceBtn) {
  //   voiceBtn.addEventListener("click", () => {
  //     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  //     recognition.lang = "en-US";
  //     recognition.start();
  //     recognition.onresult = e => { input.value = e.results[0][0].transcript; sendMessage(); };
  //     recognition.onerror = e => console.error("Voice recognition error:", e);
  //   });
  // }
});
