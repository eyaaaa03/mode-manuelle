# Robot Arm Control System - Backend

A comprehensive Spring Boot-based backend system for controlling a 4DOF (Degree of Freedom) robotic arm. This system provides REST APIs, MQTT communication, vision integration, and user authentication for both web and mobile clients.

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [MQTT Communication](#mqtt-communication)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│              (Web Browser / Mobile Application)                      │
└────────────────┬──────────────────────────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Spring Boot Backend API Layer                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  REST Controllers                                            │   │
│  │  - AuthController (Login/Signup)                            │   │
│  │  - RobotController (Robot Commands)                         │   │
│  │  - VisionController (Vision Results)                        │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  Service Layer                                               │   │
│  │  - AuthService (JWT/Authentication)                         │   │
│  │  - RobotService (Command Processing)                        │   │
│  │  - MQTT Message Handler & Publisher                         │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
│                               │                                     │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  Data Access Layer                                           │   │
│  │  - UserRepository (JPA)                                      │   │
│  │  - RobotCommandRepository (JPA)                             │   │
│  │  - VisionPresetRepository (JPA)                             │   │
│  └────────────────────────────┬─────────────────────────────────┘   │
└────────────────────────────────┼──────────────────────────────────────┘
                                 │
                ┌────────────────┼───────────────┐
                │                │               │
                ▼                ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
        │   MySQL      │  │    MQTT      │  │  FastAPI Vision  │
        │  Database    │  │   Broker     │  │   Service        │
        │              │  │ (Mosquitto)  │  │  (Python)        │
        └──────────────┘  └──────┬───────┘  └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  4DOF Robot Arm  │
                        │  (Hardware)      │
                        └──────────────────┘
```

---

## 🛠️ Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Spring Boot | 3.2.0 |
| **Language** | Java | 17 |
| **Database** | MySQL | 8.0+ |
| **Messaging** | MQTT (Eclipse Mosquitto) | 2.0+ |
| **ORM** | JPA/Hibernate | 6.3+ |
| **Build Tool** | Maven | 3.9+ |
| **Vision Service** | FastAPI (Python) | 0.104+ |
| **Containerization** | Docker & Docker Compose | Latest |

---

## 📁 Project Structure

```
robotarm_backend_web_mobile/
│
├── src/main/java/com/robotarm/
│   │
│   ├── RobotarmApplication.java          # Spring Boot entry point
│   │
│   ├── config/
│   │   ├── MqttConfig.java              # MQTT broker configuration
│   │   ├── MqttGateway.java             # MQTT gateway interface
│   │   └── WebConfig.java               # CORS & web configuration
│   │
│   ├── controller/                       # REST API Controllers
│   │   ├── AuthController.java          # Authentication endpoints
│   │   ├── RobotController.java         # Robot command endpoints
│   │   └── VisionController.java        # Vision result endpoints
│   │
│   ├── service/                          # Business Logic
│   │   ├── AuthService.java             # User authentication & JWT
│   │   └── RobotService.java            # Robot control logic
│   │
│   ├── mqtt/                             # MQTT Integration
│   │   ├── MqttMessageHandler.java      # Inbound message handler
│   │   └── MqttPublishService.java      # Outbound message publisher
│   │
│   ├── repository/                       # Data Access (JPA)
│   │   ├── UserRepository.java
│   │   ├── RobotCommandRepository.java
│   │   └── VisionPresetRepository.java
│   │
│   ├── model/                            # Entity Classes
│   │   ├── User.java                    # User entity
│   │   ├── RobotCommand.java            # Robot command history
│   │   └── VisionPreset.java            # Vision presets
│   │
│   └── dto/                              # Data Transfer Objects
│       ├── AuthResponse.java
│       ├── LoginRequest.java
│       ├── SignupRequest.java
│       ├── RobotCommandRequest.java
│       └── VisionResult.java
│
├── src/main/resources/
│   └── application.properties            # Application configuration
│
├── pom.xml                              # Maven dependencies
├── Dockerfile                           # Docker image config
├── docker-compose.yml                   # Multi-container setup
└── README.md                           # This file
```

---

## 🔧 Core Components

### 1. **Authentication & Authorization (AuthController & AuthService)**
- User registration and login
- JWT token generation and validation
- Password encryption (Spring Security)
- Role-based access control

### 2. **Robot Control System (RobotController & RobotService)**
- Execute robot commands (base, shoulder, elbow, gripper angles)
- Get current robot state
- Reset robot to home position
- Command history tracking per user

### 3. **MQTT Communication Layer**
- **MqttConfig**: Configures connection to Mosquitto broker
- **MqttGateway**: Interface for sending messages to robot
- **MqttMessageHandler**: Receives status updates and sensor data
- **MqttPublishService**: Publishes commands to robot

### 4. **Vision System Integration**
- Communicates with FastAPI service on port 5050
- Processes vision-based object detection
- Stores vision presets in database

### 5. **Database Persistence (JPA/Hibernate)**
- **Users**: User accounts and credentials
- **RobotCommands**: Command history and logs
- **VisionPresets**: Saved vision configurations

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup          # User registration
POST   /api/auth/login           # User login (returns JWT)
```

### Robot Control
```
GET    /api/robot/state          # Get current robot state
POST   /api/robot/command        # Execute robot command
POST   /api/robot/reset          # Reset robot to home
GET    /api/robot/history/{userId} # Get command history
```

### Vision System
```
POST   /api/vision/capture       # Capture vision data
GET    /api/vision/presets       # Get saved presets
POST   /api/vision/presets       # Save new preset
```

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Robot Commands Table
```sql
CREATE TABLE robot_commands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    base_angle INT DEFAULT 90,
    shoulder_angle INT DEFAULT 90,
    elbow_angle INT DEFAULT 90,
    gripper_angle INT DEFAULT 0,
    command_name VARCHAR(255),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Vision Presets Table
```sql
CREATE TABLE vision_presets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    preset_name VARCHAR(255),
    configuration JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📡 MQTT Communication

### Inbound Topics (Spring Subscribes)
- **`robot/arm/command`**: Receives manual commands
- **`robot/arm/reset`**: Receives reset commands

### Outbound Topics (Spring Publishes)
- **`robot/arm/status`**: Publishes current robot status
- **`robot/arm/angles`**: Publishes current joint angles

### Message Format
```json
{
    "baseAngle": 90,
    "shoulderAngle": 90,
    "elbowAngle": 90,
    "gripperAngle": 0,
    "timestamp": "2024-04-22T10:30:00Z"
}
```

---

## 🚀 Setup & Installation

### Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8.0+
- Docker & Docker Compose (optional)
- Eclipse Mosquitto MQTT Broker
- Python 3.8+ (for Vision Service)

### Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd robotarm_backend_web_mobile

# Build with Maven
mvn clean install
```

### Database Setup

```bash
# Create database (auto-created by Spring with `createDatabaseIfNotExist=true`)
# Or manually:
mysql -u root -p
CREATE DATABASE robot_arm_db;
```

### MQTT Broker Setup

```bash
# Install Mosquitto (Windows - using WSL or Docker)
docker run -d -p 1883:1883 -p 9001:9001 eclipse-mosquitto

# Or install locally on Windows
# Download from: https://mosquitto.org/download/
```

### Vision Service Setup (Python)

```bash
# Navigate to vision service directory
cd vision_service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI service
uvicorn vision_bridge_fastapi:app --port 5050
```

---

## ⚙️ Configuration

### application.properties

Key configuration properties:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/robot_arm_db
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# MQTT
mqtt.broker.url=tcp://localhost:1883
mqtt.broker.username=
mqtt.broker.password=
mqtt.client.id=robot-arm-springboot

# Vision Service
vision.service.url=http://localhost:5050

# CORS
spring.web.cors.allowed-origin-patterns=*
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
```

---

## ▶️ Running the Application

### Option 1: Direct Java Execution

```bash
# Build
mvn clean package

# Run
java -jar target/robot-arm-control-1.0.0.jar
```

### Option 2: Maven

```bash
mvn spring-boot:run
```

### Option 3: Docker Compose

```bash
# Ensure all services are configured
docker-compose up -d

# View logs
docker-compose logs -f robot-arm-backend
```

### Option 4: IDE (IntelliJ/Eclipse)

1. Import project as Maven project
2. Run `RobotarmApplication.java` as Spring Boot Application

---

## 📊 Data Flow Examples

### Command Execution Flow
```
Client (Web/Mobile)
    ↓ HTTP POST /api/robot/command
Spring REST Controller
    ↓ RobotService.executeCommand()
MQTT Publisher
    ↓ Publish to robot/arm/command
MQTT Broker (Mosquitto)
    ↓
4DOF Robot Arm (Hardware)
    ↓ Executes command
MQTT Broker (Mosquitto)
    ↓ Publish to robot/arm/status
MQTT Message Handler
    ↓ Update state in service
Database (Store in robot_commands table)
    ↓
Client (Receive response)
```

### Vision Integration Flow
```
Client captures image
    ↓ HTTP POST /api/vision/capture
Spring Vision Controller
    ↓
FastAPI Vision Service (Python)
    ↓
Object Detection/Processing
    ↓
Return vision results
    ↓
Spring stores in VisionPresets
    ↓
Client receives analysis
```

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing (Spring Security)
- CORS configuration for cross-origin requests
- MQTT message validation
- Database transaction management

---

## 📝 Additional Notes

- Ensure MySQL service is running before starting the application
- MQTT broker must be accessible at configured URL
- Vision service should be running if vision features are used
- Database auto-migration is enabled (`hibernate.ddl-auto=update`)
- All sensitive credentials should be stored in environment variables for production

---

## 🤝 Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

---

## 📄 License

This project is proprietary software for robotic arm control.

---

## 📧 Support

For issues or questions, please contact the development team or submit an issue in the repository.
