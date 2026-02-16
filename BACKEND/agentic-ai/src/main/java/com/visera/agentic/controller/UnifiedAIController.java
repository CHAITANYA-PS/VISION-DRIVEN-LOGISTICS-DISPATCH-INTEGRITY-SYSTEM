package com.visera.agentic.controller;

import com.visera.agentic.service.UnifiedAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UnifiedAIController {

	private final UnifiedAIService unifiedAIService;

	@PostMapping("/chat")
	public Object chat(@RequestBody Map<String, String> body) {
		if (body == null || !body.containsKey("question") || body.get("question") == null || body.get("question").trim().isEmpty()) {
			return Map.of("error", "Request body must contain 'question' field with a non-empty value");
		}

		String question = body.get("question").trim();
		return unifiedAIService.askQuestion(question);
	}

	// Backward compatibility endpoint - delegates to unified service
	@PostMapping("/products/chat")
	public Object productChat(@RequestBody Map<String, String> body) {
		// Same validation and logic as /chat
		return chat(body);
	}
}




