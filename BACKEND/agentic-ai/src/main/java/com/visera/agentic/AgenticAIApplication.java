package com.visera.agentic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@SpringBootApplication
public class AgenticAIApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgenticAIApplication.class, args);
		log.info("Agentic AI Application Started on port 8082");
	}

}

