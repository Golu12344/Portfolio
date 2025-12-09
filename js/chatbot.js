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
  const voiceBtn = document.getElementById('voice-btn');

  // ----------------------------
  // Load chat history
  // ----------------------------
//   let history = JSON.parse(localStorage.getItem("chat-history")) || [];
//   history.forEach(m => addMessage(m.text, m.sender));
    let history = []; // in-memory only
    history.forEach(m => addMessage(m.text, m.sender));

  // ----------------------------
  // Load portfolio knowledge base
  // ----------------------------
  let knowledge = {};
  let knowledgeLoaded = false;

  fetch("portfolio-data.json")
    .then(res => res.json())
    .then(data => { knowledge = data; knowledgeLoaded = true; console.log("Knowledge loaded:", knowledge); })
    .catch(err => console.error("Failed to load knowledge:", err));

  // ----------------------------
  // Chat window toggle
  // ----------------------------
  chatBtn.addEventListener('click', () => {
    chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
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
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

//   function saveHistory(text, sender) {
//     history.push({ text, sender });
//     localStorage.setItem("chat-history", JSON.stringify(history));
//   }
  function saveHistory(text, sender) {
  history.push({ text, sender }); // only in-memory
}

  function getTrainedReply(userMsg) {
    if (!knowledgeLoaded) return null;
    const msg = userMsg.toLowerCase().trim();
    for (const key in knowledge) {
      const k = key.toLowerCase().trim();
      if (msg === k || msg.includes(k) || k.includes(msg)) return knowledge[key];
    }
    return null;
  }

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

    // 1️⃣ JSON-trained reply
    const trainedReply = getTrainedReply(text);
    if (trainedReply) {
      setTimeout(() => {
        typing.style.display = "none";
        addMessage(trainedReply, "bot");
        saveHistory(trainedReply, "bot");
      }, 600);
      return;
    }

    // 2️⃣ Fallback backend API
    try {
      const res = await fetch("http://localhost:5000/api/chat", {
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

  if (voiceBtn) {
    voiceBtn.addEventListener("click", () => {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "en-US";
      recognition.start();
      recognition.onresult = e => { input.value = e.results[0][0].transcript; sendMessage(); };
      recognition.onerror = e => console.error("Voice recognition error:", e);
    });
  }
});
