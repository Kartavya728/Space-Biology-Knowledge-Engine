# 🛰️ Astrogenesis
Website link: https://space-apps-frontend-black.vercel.app/

> **AI-Powered Analysis Platform for NASA Bioscience Research**  
> *Transforming 608 NASA publications into actionable insights through advanced AI, knowledge graphs, and interactive exploration*

---

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Django](https://img.shields.io/badge/Django-5.2.7-092E20?style=for-the-badge&logo=django&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.3.27-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-1.1.0-FF6B6B?style=for-the-badge&logo=chromadb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Hackathon](https://img.shields.io/badge/NASA_Hackathon-2024-FF6B35?style=for-the-badge&logo=nasa&logoColor=white)](https://www.nasa.gov)

</div>

---

## 🚀 Overview

The **Space Biology Knowledge Engine** is a cutting-edge web application that leverages artificial intelligence, knowledge graphs, and advanced retrieval-augmented generation (RAG) to analyze and summarize 608 NASA bioscience publications. Built for the NASA hackathon challenge, this platform transforms complex scientific literature into actionable insights through role-based analysis tailored for scientists, investors, and mission architects.

### 🎯 **Problem Statement**
NASA's extensive collection of bioscience research publications contains invaluable insights for space exploration, but accessing and synthesizing this information is challenging. Our solution addresses this by creating an intelligent platform that:

- **📚 Summarizes** complex research findings across 608 publications using **Retrieval-Augmented Generation (RAG)** with Google Gemini 2.0 Flash, processing PDFs, tables, and images into structured knowledge
- **🔍 Enables** interactive exploration through **ChromaDB vector search** and **semantic embeddings**, allowing users to query research data with natural language and get contextually relevant results
- **📊 Organizes** all research data in a comprehensive **Data Gallery** with categorized visualizations, publication timelines, and interactive charts for easy discovery and analysis
- **🎭 Provides** role-based analysis through **custom AI agents** that generate specialized insights for scientists (technical analysis), investors (market opportunities), and mission architects (implementation strategies)
- **🤖 Identifies** areas of scientific progress and knowledge gaps using **LangChain ReAct agents** that combine knowledge base retrieval with real-time web search for comprehensive analysis
- **⚡ Delivers** actionable insights through **streaming AI responses** with structured 200-300 word sections, automatically referencing relevant figures, tables, and data points from the original publications

---

## 🧩 Tech Stack

### **Frontend**
- **React 18.3.1** with TypeScript
- **Vite** for fast development and building
- **Framer Motion** for smooth animations
- **Tailwind CSS** for modern styling
- **Radix UI** for accessible components
- **Three.js** & **React Three Fiber** for 3D visualizations
- **Recharts** for data visualization

### **Backend**
- **Django 5.2.7** REST API
- **SQLite** database with Django ORM
- **CORS** enabled for cross-origin requests
- **Streaming responses** for real-time AI generation

### **AI & ML**
- **Google Gemini 2.0 Flash** for advanced language processing
- **LangChain 0.3.27** for AI agent orchestration
- **ChromaDB 1.1.0** for vector storage and similarity search
- **Google Generative AI Embeddings** for semantic search
- **Tavily Search** for real-time web information

### **Data Processing**
- **BeautifulSoup4** for web scraping and data extraction
- **Pandas** for data manipulation
- **NumPy** for numerical computations
- **Custom RAG pipeline** for document processing

---

## ⚙️ Setup Instructions

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- Git

### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/space-biology-knowledge-engine.git
cd space-biology-knowledge-engine
```

### **2. Backend Setup**
```bash
# Navigate to backend directory
cd Backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# GOOGLE_API_KEY=your_gemini_api_key
# TAVILY_API_KEY=your_tavily_api_key

# Run database migrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

### **3. Frontend Setup**
```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### **4. Data Setup**
```bash
# Process NASA publications (run from project root)
cd "Model Tunning"
python nasa_biodb_pipeline.py
python genrate_embeddings.py
```

### **5. Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

---

## 🧠 Features

### **🎭 Role-Based Analysis**
- **Scientist Mode**: Technical breakdowns, methodology analysis, and research insights
- **Investor Mode**: Market opportunities, commercial applications, and ROI analysis  
- **Mission Architect Mode**: Implementation strategies, technical requirements, and mission roadmaps

### **🔍 Advanced Search & Retrieval**
- **Semantic Search** across 608 NASA publications using vector embeddings
- **Multi-modal Retrieval** with images, tables, and text references
- **Context-Aware Queries** optimized for different user roles
- **Real-time Web Search** integration for current information

### **🤖 AI-Powered Intelligence**
- **ReAct Agent** with reasoning and tool usage capabilities
- **Streaming Responses** for real-time analysis generation
- **Structured Output** with 200-300 word sections per analysis area
- **Media Integration** with automatic figure and table references

### **📊 Interactive Dashboard**
- **3D Starfield Background** with immersive space theme
- **Dynamic Theming** based on user role (scientist/investor/mission-architect)
- **Real-time Chat Interface** with streaming AI responses
- **Data Gallery** for exploring research visualizations
- **History Management** for previous analysis sessions

### **📈 Data Visualization**
- **Interactive Charts** and graphs for research trends
- **Publication Timeline** visualization
- **Knowledge Graph** representation of research relationships
- **Media Gallery** with images and tables from publications

### **🔧 Technical Features**
- **Responsive Design** for desktop and mobile devices
- **Progressive Web App** capabilities
- **Real-time Streaming** with Server-Sent Events (SSE)
- **Error Handling** and graceful degradation
- **CORS Support** for cross-origin requests

---

## 📁 Project Structure

```
space-biology-knowledge-engine/
├── 🎨 Frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── auth/              # Authentication context
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # CSS and styling
│   └── package.json
├── ⚙️ Backend/                 # Django REST API
│   ├── config/                # Django settings
│   ├── core/                  # Main app logic
│   ├── llm_functions/         # AI service layer
│   └── manage.py
├── 🧠 Model Tunning/           # AI model training and data processing
│   ├── RAG.py                 # Retrieval-Augmented Generation
│   ├── nasa_biodb_pipeline.py # Data processing pipeline
│   └── tools/                 # Custom tools and utilities
├── 📊 Research Data set/       # NASA publications and processed data
│   ├── pdf-set-608/           # Original PDF publications
│   ├── text/                  # Extracted text files
│   ├── tables_data/           # Processed table data
│   └── images_data.json       # Image metadata
└── 📄 requirements.txt        # Python dependencies
```

---

## 🚀 Getting Started

### **Quick Start**
1. **Clone** the repository
2. **Set up** environment variables with your API keys
3. **Run** the backend and frontend servers
4. **Process** the NASA dataset using the provided scripts
5. **Start exploring** the knowledge engine!

### **API Endpoints**
- `POST /api/chat/` - Main chat endpoint with streaming responses
- `GET /api/health/` - Health check endpoint
- `GET /admin/` - Django admin interface

### **Environment Variables**
```env
GOOGLE_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
DEBUG=True
SECRET_KEY=your_django_secret_key
```

---

## 🎯 Use Cases

### **For Scientists**
- Analyze experimental methodologies and results
- Compare findings across multiple studies
- Identify research gaps and future directions
- Access technical specifications and data

### **For Investors**
- Evaluate commercial potential of space biology research
- Assess market opportunities and ROI projections
- Understand funding requirements and timelines
- Analyze competitive landscape and risks

### **For Mission Architects**
- Plan mission requirements and technical specifications
- Assess feasibility and implementation strategies
- Identify critical risks and mitigation approaches
- Design system integration and deployment roadmaps

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **NASA** for providing the extensive bioscience research dataset
- **Google** for the Gemini AI models and embeddings
- **LangChain** community for the powerful AI orchestration framework
- **Open source contributors** who made this project possible

---


---

<div align="center">

### 🌟 **Built with ❤️ for NASA Hackathon 2025** 🌟

*Transforming space biology research into actionable intelligence*

[![Star this repo](https://img.shields.io/github/stars/yourusername/space-biology-knowledge-engine?style=social)](https://github.com/yourusername/space-biology-knowledge-engine)
[![Fork this repo](https://img.shields.io/github/forks/yourusername/space-biology-knowledge-engine?style=social)](https://github.com/yourusername/space-biology-knowledge-engine/fork)

</div>
