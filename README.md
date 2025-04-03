# 🧠 AI-Powered Crypto Portfolio Tracker

A unified dashboard and intelligent assistant for tracking your crypto assets across exchanges and wallets. This project combines real-time market data, News, Social, Research, AI-driven insights, tax flagging, and performance analytics—all in one platform.

![image](https://github.com/user-attachments/assets/8b07ceb2-4a57-4d5d-91c9-5a13448b59d2)
![image](https://github.com/user-attachments/assets/6cbe384c-dc7c-4b9c-bb57-325dd5c9249a)

![image](https://github.com/user-attachments/assets/9d189ddf-b555-4365-8323-ff1c21d98146)

---

## 🚀 Features

- **Connect Accounts**: Supports Binance, Coinbase, and Ethereum wallets - Future feature (MVP add account feature for manual entry of assets)
- **Unified Portfolio View**: Track total value, P&L, and asset allocation  
- **AI Assistant**: Ask questions like "How is my performance this month?" , "Summarize my portfolio risk" , "Give me headlines with Bitcoin"
- **Market & News Feed**: Real-time crypto and macro news, including Reddit sentiment  
- **Smart Tax Flags**: Detect taxable events like large trades or airdrops  (Tax dashboard - total taxable trades, total tax liability, year-over-year tax summary report) - Future Feature
- **Historical Graphs**: View performane trends over time  
- **Expandable Layout**: Customize with resizable columns and a searchable prompt history  - Future enhancement

---

## 🧱 Tech Stack

| Layer     | Technology                      |
|-----------|----------------------------------|
| Frontend  | React.js + Mantine + Chart.js    |
| Backend   | FastAPI (Python 3)               |
| APIs      | CoinGecko, OpenAI, CCXT, Web3.py |
| Auth      | Wallet-based auth (in progress)  |
| Database  | SQLite (planned) or JSON flat files |
| Scripts   | Shell (`scripts/`)               |

---

## 📁 Project Structure

```
/frontend/            # React dashboard
/backend/             # FastAPI backend + AI services
/backend/app/         # Core logic and services
/backend/scripts/     # Startup and maintenance scripts
/data/                # News, market, and portfolio JSON
/tests/               # (planned) unit and integration tests
```

---

## 🧠 AI Assistant Capabilities

The AI assistant supports natural language queries about:

- Market price: `"What's the price of PEPE?"`
- Portfolio analysis: `"How is my portfolio doing?"`
- Risk detection: `"What is the riskiest asset I hold?"`
- Tax queries: `"Did I trigger any taxable events?"`
- News summarization: `"Show me news about Solana and Ethereum"`

### Context-Aware Processing

The assistant uses:

- **Intent classification** to determine user intent
- **Context providers** to pull only relevant data (market, news, portfolio)
- **Token budgeting** to stay within OpenAI limits
- **Custom prompt templates** for precise answers

---

## ⚙️ Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt

cd ../frontend
npm install
```

### 2. Environment Variables

Create a `.env` file in `backend/` with:

```env
OPENAI_API_KEY=your_openai_key
COINGECKO_API_KEY=your_coingecko_key
```

✅ `.env` is ignored by Git (`.gitignore` covers it)

---

## 🚀 Running the App

### Backend

```bash
cd backend
./scripts/start_services.sh
```

This will:
- Refresh market and news data
- Start the FastAPI server on `http://localhost:8000`

### Frontend

```bash
cd frontend
npm run dev
```

Opens the dashboard at `http://localhost:3000`

---

## 🧪 Testing Queries

```bash
cd backend
python test_query.py "What is the price of Bitcoin?"
```

---

## 🛡 Security

- All API keys are stored in `.env` and loaded via `load_dotenv()`
- No API keys are committed to the repo
- Future enhancement: encrypt `.env` in production

---

## 📌 Roadmap

- [ ] Token-based wallet auth
- [ ] User-specific portfolio storage
- [ ] Multi-model LLM routing
- [ ] Docker deployment scripts
- [ ] CI/CD GitHub Actions

---
## Screenshots
![image](https://github.com/user-attachments/assets/6cbc7b6d-023e-477f-8197-42f561f08175)

![image](https://github.com/user-attachments/assets/b6489d1a-ca64-46ac-bf0c-c4a36759579c)

![image](https://github.com/user-attachments/assets/3acd6c32-9eb3-4cf6-9c63-3f8435be410a)

![image](https://github.com/user-attachments/assets/cacfe1ad-a8eb-4f77-be64-44c76b7c8bd8)

![image](https://github.com/user-attachments/assets/0284b4d8-2a7b-45aa-bb74-129f08c3056b)



---
## 👩‍💻 Contributors

- **Mogas** – Core Developer & AI Architect  
- **ChatGPT** – Assistant Developer, Prompt Engineer, QA  

---

## 📄 License

MIT License © 2025

⚠️ Disclaimer
This project is for educational use only. Nothing in this application constitutes financial advice. Use at your own risk.
