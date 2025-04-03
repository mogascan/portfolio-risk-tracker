
from app.prompts.contextual_prompts import BASE_SYSTEM_PROMPT
from app.services.context_loader import load_all_research

def build_ai_messages(user_query: str, portfolio_context: str = "", market_context: str = ""):
    research_context = load_all_research()
    planning_context = research_context.get("Planning", "")
    research_notes = research_context.get("Research", "")

    user_block = f"""
Portfolio Context:
{portfolio_context}

Market Context:
{market_context}

Planning Context:
{planning_context}

Research Insights:
{research_notes}

User Query:
{user_query}
"""

    messages = [
        {"role": "system", "content": BASE_SYSTEM_PROMPT},
        {"role": "user", "content": user_block.strip()}
    ]
    
    return messages
