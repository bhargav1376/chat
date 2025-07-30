const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");
let recognition;

// --- Load Chat History ---
window.onload = () => {
    let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
    history.forEach(msg => addMessage(msg.text, msg.type, false));
    // Show animated welcome if chat is empty
    if (chatBody.childElementCount === 0) {
        const welcome = "Hello! How can I assist you today?";
        showAnimatedLetterMessage(welcome, "bot", 1000);
    }
};

// --- Save History ---
function saveHistory(text, type) {
    let history = JSON.parse(localStorage.getItem("chatHistory")) || [];
    history.push({ text, type });
    localStorage.setItem("chatHistory", JSON.stringify(history));
}

// --- Toggle Chatbot ---
function toggleChatbot() {
    const container = document.getElementById("chatbot-container");
    const wasClosed = container.style.display !== "flex";
    container.style.display = wasClosed ? "flex" : "none";
    // If opening, send welcome message if chat is empty
    if (wasClosed && chatBody.childElementCount === 0) {
        const welcome = "Hello! How can I assist you today?";
        showAnimatedLetterMessage(welcome, "bot", 1000);
    }
}

// Show message letter by letter, completing in totalDuration ms
function showAnimatedLetterMessage(text, type = "bot", totalDuration = 1000) {
    const letters = text.split("");
    let current = "";
    let i = 0;
    const msg = document.createElement("div");
    msg.classList.add("message", type === "user" ? "user-message" : "bot-message");
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
    const delay = totalDuration / letters.length;

    function showNextLetter() {
        if (i < letters.length) {
            current += letters[i];
            msg.innerText = current;
            chatBody.scrollTop = chatBody.scrollHeight;
            i++;
            setTimeout(showNextLetter, delay);
        } else {
            // Local storage saving disabled as requested
            //saveHistory(text, type);
            //speak(text);
        }
    }
    showNextLetter();
}

// Show message word by word with delay
function showAnimatedMessage(text, type = "bot", delay = 2000) {
    const words = text.split(" ");
    let current = "";
    let i = 0;
    const msg = document.createElement("div");
    msg.classList.add("message", type === "user" ? "user-message" : "bot-message");
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;

    function showNextWord() {
        if (i < words.length) {
            current += (i === 0 ? "" : " ") + words[i];
            msg.innerText = current;
            chatBody.scrollTop = chatBody.scrollHeight;
            i++;
            setTimeout(showNextWord, delay);
        } else {
            // Local storage saving disabled as requested
            //saveHistory(text, type);
          //  speak(text);
        }
    }
    showNextWord();

    }


// --- Add Message to Chat UI ---
function addMessage(text, type, save = true) {
    if (type === 'bot') {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        const avatar = document.createElement('img');
        avatar.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
        avatar.className = "avatar";
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'bot-message');
        msgDiv.innerText = text;
        wrapper.appendChild(avatar);
        wrapper.appendChild(msgDiv);
        chatBody.appendChild(wrapper);
    } else {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', 'user-message');
        msgDiv.innerText = text;
        chatBody.appendChild(msgDiv);
    }
    chatBody.scrollTop = chatBody.scrollHeight;
    // Local storage saving disabled as requested
    // if (save) saveHistory(text, type);
}

// --- Send Message ---
function sendMessage() {
    let message = chatInput.value.trim();
    if (!message) return;
    addMessage(message, "user");
    chatInput.value = "";
    // Option logic first
    const lower = message.toLowerCase();
    if (goBackWords.some(word => lower.includes(word))) {
        goBackToMenu(lastTopic);
        return;
    }
    for (const option of mainOptions) {
        // Match if the message contains the whole option (case-insensitive, word boundary)
        const regex = new RegExp(`\\b${option.toLowerCase()}\\b`);
        if (regex.test(lower)) {
            selectOption(option);
            return;
        }
    }
    // If not matched, fallback to AI (if available)
    if (typeof getAIResponse === 'function') getAIResponse(message);
    else addMessage("I didn't understand that. Please choose from options or say 'Go back to main menu'.", "bot");
}

// --- Handle Enter Key ---
function handleKey(e) {
    if (e.key === "Enter") sendMessage();
}

// --- Voice Input (Speech-to-Text) ---
function startVoice() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech Recognition not supported!");
        return;
    }
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
        chatInput.value = event.results[0][0].transcript;
        sendMessage();
    };
    recognition.start();
}

// --- Text-to-Speech ---
function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speechSynthesis.speak(speech);
}

// --- Call OpenAI API (gpt-4o-mini) ---
async function getAIResponse(userText) {
    // Animated Typing... dots
    let typingMsg = document.createElement("div");
    typingMsg.classList.add("message", "bot-message");
    chatBody.appendChild(typingMsg);
    chatBody.scrollTop = chatBody.scrollHeight;
    let dotCount = 0;
    let increasing = true;
    let typingInterval = setInterval(() => {
        let dots = ".".repeat(dotCount);
        typingMsg.innerText = `Typing${dots}`;
        if (increasing) {
            dotCount++;
            if (dotCount > 3) {
                dotCount = 2;
                increasing = false;
            }
        } else {
            dotCount--;
            if (dotCount < 1) {
                dotCount = 1;
                increasing = true;
            }
        }
    }, 400);

    // Name and custom info storage and recall logic
    // Update name
    const updateNameMatch = userText.match(/update my name to ([a-zA-Z ]+)/i);
    if (updateNameMatch) {
        const userName = updateNameMatch[1].trim();
        localStorage.setItem("userName", userName);
        clearInterval(typingInterval);
        chatBody.lastChild.remove();
        addMessage(`Your name has been updated to ${userName}.`, "bot");
        return;
    }
    // Set name
    const nameMatch = userText.match(/my name is ([a-zA-Z ]+)/i);
    if (nameMatch) {
        const userName = nameMatch[1].trim();
        localStorage.setItem("userName", userName);
        clearInterval(typingInterval);
        chatBody.lastChild.remove();
        addMessage(`Nice to meet you, ${userName}! I'll remember your name.`, "bot");
        return;
    }
    // Recall name
    if (/what('?s| is) my name\b/i.test(userText)) {
        clearInterval(typingInterval);
        chatBody.lastChild.remove();
        const userName = localStorage.getItem("userName");
        if (userName) {
            addMessage(`Your name is ${userName}.`, "bot");
        } else {
            addMessage("I don't know your name yet. Please tell me by saying 'My name is ...' or 'Update my name to ...'", "bot");
        }
        return;
    }
    // Update any custom thing
    const updateThingMatch = userText.match(/update my ([a-zA-Z0-9_ ]+) to ([^\.\!\?]+)/i);
    if (updateThingMatch) {
        const key = updateThingMatch[1].trim().replace(/ /g, "_");
        const value = updateThingMatch[2].trim();
        localStorage.setItem(key, value);
        chatBody.lastChild.remove();
        addMessage(`Your ${updateThingMatch[1].trim()} has been updated to ${value}.`, "bot");
        return;
    }
    // Recall any custom thing
    const whatThingMatch = userText.match(/what('?s| is) my ([a-zA-Z0-9_ ]+)/i);
    if (whatThingMatch) {
        const key = whatThingMatch[2].trim().replace(/ /g, "_");
        const value = localStorage.getItem(key);
        chatBody.lastChild.remove();
        if (value) {
            addMessage(`Your ${whatThingMatch[2].trim()} is ${value}.`, "bot");
        } else {
            addMessage(`I don't know your ${whatThingMatch[2].trim()} yet. Please tell me by saying 'Update my ${whatThingMatch[2].trim()} to ...'`, "bot");
        }
        return;
    }

    try {
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
               "Authorization": `Bearer ${OPENAI_API_KEY}`

            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: userText,
                store: true
            })
        });

        const data = await response.json();
        clearInterval(typingInterval);
        chatBody.lastChild.remove(); // remove "Typing..."

        let reply = data.output && data.output[0]?.content[0]?.text 
                    ? data.output[0].content[0].text 
                    : "Sorry, I could not fetch an answer.";
        addMessage(reply, "bot");
       // speak(reply);

    } catch (error) {
        clearInterval(typingInterval);
        chatBody.lastChild.remove();
        addMessage("Error connecting to AI API", "bot");
    }
}

// --- Show Main Options ---
function showMainOptions(excludeTopic = null) {
    const chatBody = document.getElementById('chat-body');
    // Remove any previous options
    const prevOptions = chatBody.querySelectorAll('.options-container');
    prevOptions.forEach(el => el.remove());
    // Always create a new options container
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options-container';
    mainOptions.filter(option => option !== excludeTopic).forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.className = 'option-btn';
        btn.onclick = () => selectOption(option);
        optionsDiv.appendChild(btn);
    });
    chatBody.appendChild(optionsDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}
