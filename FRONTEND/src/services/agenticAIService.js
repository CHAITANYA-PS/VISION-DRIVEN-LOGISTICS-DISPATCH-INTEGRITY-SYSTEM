import axios from "axios";
import { env } from "../config/env";

// Create a separate axios instance for agentic-ai (no JWT required)
const agenticApi = axios.create({
  baseURL: env.AGENTIC_AI_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Ask a question to the AI assistant
 * @param {string} question - The user's question
 * @returns {Promise<string>} - The AI's response as a string
 */
export const askQuestion = async (question) => {
  try {
    const response = await agenticApi.post("/api/ai/chat", {
      question: question.trim(),
    });
    
    // The backend returns the response directly as a string or in response.data
    if (typeof response.data === "string") {
      return response.data;
    }
    
    // Handle case where response might be wrapped in an object
    if (response.data && typeof response.data === "object") {
      // Check for error in response
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      // If response has a message or answer field
      return response.data.message || response.data.answer || JSON.stringify(response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error calling agentic AI:", error);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || 
                          error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error("Unable to connect to AI service. Please check your connection.");
    } else {
      // Something else happened
      throw new Error(error.message || "An unexpected error occurred");
    }
  }
};








