# UPS Warehouse Management System (WMS)

Enterprise-grade, AI-powered warehouse management system for inbound, outbound, inventory, and task operations.

---

## Overview

UPS WMS automates warehouse workflows using role-based access, real-time tracking, and OCR-based verification.  
Designed for scalability, auditability, and operational efficiency.

---

## Architecture

Frontend → Backend → OCR Service.

- **Frontend**: React + Vite  
- **Backend**: Spring Boot (REST + WebSocket)  
- **AI/OCR**: FastAPI + PaddleOCR  
- **Database**: MySQL  

---

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security + JWT
- JPA / Hibernate
- Maven
- WebSocket (STOMP)

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- SockJS + STOMP

### OCR Service
- Python 3.8+
- FastAPI
- PaddleOCR
- OpenCV
- Uvicorn

---

## Core Features

### Inbound Management
- Shipment & item creation
- OCR-based label verification
- Auto bin allocation
- Supervisor approval for mismatches

### Outbound Management
- Picking & dispatch workflow
- Worker task assignment

### Inventory
- Real-time stock tracking
- Zone → Rack → Bin hierarchy
- SKU-based inventory

### Task Management
- Picking tasks
- Putaway tasks
- Status tracking

### AI Verification
- OCR extraction
- Field-level validation
- Confidence scoring
- Approval workflow

### User & Role Management
- ADMIN
- SUPERVISOR
- WORKER

### Notifications
- Real-time updates via WebSocket

---

## Prerequisites

- Java 17+
- Node.js 18+
- Python 3.8+
- MySQL 8+
- Maven
- pnpm

---

## Installation

### Clone
```bash
git clone <repo-url>
cd upsproj
