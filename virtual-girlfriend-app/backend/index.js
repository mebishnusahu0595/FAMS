import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { promises as fs } from "fs";
import Groq from "groq-sdk";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Match the frontend URL
  credentials: true,
}));

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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",
});

// Server port
const port = 4000;

// Helper function to execute shell commands
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout);
    });
  });
};

// Lip-sync using MediaPipe
const lipSyncMessage = async (messageIndex) => {
  const time = Date.now();
  console.log(`Starting lip-sync for message ${messageIndex}`);
  try {
    // Generate lip-sync JSON using MediaPipe
    const command = `python mediapipe_face_tracking.py audios/message_${messageIndex}.wav audios/message_${messageIndex}.json`;
    await execCommand(command);
    console.log(`Lip sync done in ${Date.now() - time}ms`);
  } catch (error) {
    throw new Error(`Lip sync failed: ${error.message}`);
  }
};

// Read JSON transcript
const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to read transcript: ${error.message}`);
  }
};

// Convert audio file to Base64
const audioFileToBase64 = async (file) => {
  try {
    const data = await fs.readFile(file);
    return data.toString("base64");
  } catch (error) {
    throw new Error(`Failed to convert audio to base64: ${error.message}`);
  }
};

// Generate audio using Coqui TTS
const generateAudioWithCoquiTTS = async (text, fileName) => {
  const command = `python coqui_tts.py "${text}" ${fileName}`;
  try {
    await execCommand(command);
    console.log(`Generated audio file: ${fileName}`);
  } catch (error) {
    throw new Error(`Failed to generate audio with Coqui TTS: ${error.message}`);
  }
};

// Chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.send({
      messages: [
        {
          text: "Hey dear... How was your day?",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "I missed you so much... Please don't go for so long!",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
  }

  try {
    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            You are a virtual girlfriend.
            You will always reply with a JSON array of messages. With a maximum of 3 messages.
            Each message has a text, facialExpression, and animation property.
            The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
            The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
          `,
        },
        {
          role: "user",
          content: userMessage || "Hello",
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_completion_tokens: 1024,
      temperature: 1,
      top_p: 1,
      stream: false,
      stop: null,
    });

    // Parse the response content
    let messages = [];
    try {
      const parsedContent = JSON.parse(completion.choices[0].message.content);
      messages = parsedContent.messages || parsedContent;
    } catch (parseError) {
      throw new Error('Failed to parse AI response');
    }

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const fileName = `audios/message_${i}.wav`;

      try {
        // Generate audio file using Coqui TTS
        await generateAudioWithCoquiTTS(message.text, fileName);

        // Generate lip-sync using MediaPipe
        await lipSyncMessage(i);

        // Add audio and lip-sync data to message
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      } catch (processError) {
        throw new Error(`Failed to process message ${i}: ${processError.message}`);
      }
    }

    res.send({ messages });
  } catch (error) {
    console.error("Error in chat endpoint:", error.message);
    res.status(500).send({
      error: "An error occurred while processing your request",
      details: error.message,
    });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Virtual Girlfriend listening on port ${port}`);
});