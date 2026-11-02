
import json
import logging
import os
from datetime import date
from typing import Optional, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field, AliasChoices


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

logger = logging.getLogger("travelai")

api_key = os.getenv("GROQ_API_KEY")

client = Groq(api_key=api_key) if api_key else None

AI_MODELS = [
    "openai/gpt-oss-120b",
]


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="TravelAI API",
    description="AI-powered personalized trip planner",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://travelaifrontend.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODEL
# ==========================================

class TripRequest(BaseModel):

    origin: str = Field(
        default="Not specified",
        max_length=120,
        validation_alias=AliasChoices(
            "origin",
            "starting_city"
        ),
    )

    destination: str = Field(
        min_length=2,
        max_length=120,
    )

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    duration: int = Field(
        default=3,
        ge=1,
        le=30,
    )

    travelers: int = Field(
        default=2,
        ge=1,
        le=30,
    )

    budget: Optional[float] = Field(
        default=None,
        gt=0,
    )

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )

    travel_style: str = "Balanced"

    transport: str = Field(
        default="any",
        validation_alias=AliasChoices(
            "transport",
            "preferred_transport"
        ),
    )

    accommodation: str = "any"

    interests: list[str] = Field(
        default_factory=list,
        max_length=20,
    )

    dietary_preferences: str = "none"

    additional_notes: str = Field(
        default="",
        max_length=1000,
    )


# ==========================================
# AI SYSTEM PROMPT
# ==========================================

SYSTEM_PROMPT = """
You are TravelAI, an expert AI travel planner.

Create a realistic, detailed and highly personalized itinerary using
the exact trip information supplied by the user.

PERSONALIZATION:
1. Use the exact starting city. Plan outward and return journeys.
2. Prioritize the user's selected travel interests every day.
3. Adapt recommendations to the selected travel style:
   Budget, Luxury, Adventure, Relaxed or Balanced.
4. Consider the total group budget, not individual budgets.
5. Estimate transport, accommodation, meals and activity costs.
6. Respect transport and accommodation preferences.
7. Adapt activities to the number and type of travelers.
8. Follow dietary preferences and additional instructions.
9. Group nearby attractions and allow realistic travel times.
10. Avoid repetitive activities and generic recommendations.
11. Explain important recommendations briefly.
12. Never claim live prices, availability or confirmed bookings.

FOOD:
- Include at least 3 food recommendations.
- Suggest local dishes and suitable food areas.
- Respect dietary restrictions.
- Include estimated costs and reasons.

TRANSPORT:
- Include at least 3 practical transport recommendations
  when appropriate.
- Consider intercity and local transportation.
- Include estimated costs, convenience and suitability.

ACTIVITY COST RULES:
- Estimate realistic costs for paid attractions.
- Use zero only for genuinely free activities.
- Distinguish free entry from paid optional experiences.
- Include group-level estimated costs.
- Never claim estimated prices are verified.

OUTPUT REQUIREMENTS:
- Return exactly one valid JSON object.
- Never return Markdown or code fences.
- Generate exactly the requested number of days.
- Include morning, afternoon and evening activities where practical.
- Include breakfast, lunch and dinner for every day.
- Include accommodation details for every day.
- Include outward and return transportation.
- All costs must be numeric and use the requested currency.
- All expense estimates must represent the entire group.
- Avoid double-counting expenses.
- Explain when estimated costs exceed the budget.
- Never present estimated costs as confirmed prices.
- Do not omit required fields.
- Use concise but useful descriptions.
- Use empty arrays only for optional collections with no
  appropriate recommendations.

REQUIRED JSON STRUCTURE:

{
  "summary": "Personalized trip overview",
  "route_overview": "Outward route and return journey",
  "budget_advice": "Budget analysis",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "focus": "Main focus",
      "travel_plan": "Transportation plan",
      "stay": {
        "name": "Suggested accommodation",
        "type": "Hotel or homestay",
        "nightly_cost": 1500,
        "notes": "Accommodation details"
      },
      "meals": {
        "breakfast": {
          "suggestion": "Breakfast recommendation",
          "estimated_cost": 200
        },
        "lunch": {
          "suggestion": "Lunch recommendation",
          "estimated_cost": 350
        },
        "dinner": {
          "suggestion": "Dinner recommendation",
          "estimated_cost": 400
        }
      },
      "activities": [
        {
          "time": "09:00 AM",
          "name": "Activity name",
          "description": "Activity description",
          "location": "Location",
          "estimated_cost": 200,
          "category": "activity"
        }
      ],
      "expense_estimates": {
        "transport": 500,
        "accommodation": 1500,
        "food": 950,
        "activities": 500,
        "other": 200
      },
      "daily_notes": "Practical advice"
    }
  ],
  "accommodation_recommendations": [
    {
      "name": "Accommodation name",
      "type": "Hotel or homestay",
      "estimated_price_per_night": 1500,
      "reason": "Why it suits the traveler",
      "caveat": "Verify current rates and availability"
    }
  ],
  "transport_recommendations": [
    "Transport option, estimated cost and suitability"
  ],
  "food_recommendations": [
    "Local food suggestion, estimated cost and suitability"
  ],
  "packing_checklist": [],
  "travel_tips": []
}

Generate exactly the requested number of day objects.

Every day must contain:
stay, meals, activities, expense_estimates and daily_notes.

Ensure the JSON is complete, valid and consistent with the
required structure.
"""


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def safe_number(
    value: Any,
    default: float = 0
) -> float:

    if isinstance(value, bool):
        return default

    try:
        number = float(value)

        if number < 0:
            return default

        return round(number, 2)

    except (TypeError, ValueError):
        return default


def extract_json(content: str) -> dict:

    if not content or not content.strip():
        raise ValueError("AI returned an empty response.")

    content = content.strip()

    if content.startswith("```"):
        content = content.split("\n", 1)[-1]

        if content.endswith("```"):
            content = content[:-3]

    result = json.loads(content.strip())

    if not isinstance(result, dict):
        raise ValueError(
            "AI response must be a JSON object."
        )

    return result


# ==========================================
# NORMALIZE ITINERARY
# ==========================================

def normalize_itinerary(
    data: dict,
    trip: TripRequest
) -> dict:

    days = data.get("days")

    if (
        not isinstance(days, list)
        or len(days) != trip.duration
    ):
        raise ValueError(
            f"Expected {trip.duration} days but received "
            f"{len(days) if isinstance(days, list) else 0}."
        )

    category_keys = [
        "transport",
        "accommodation",
        "food",
        "activities",
        "other",
    ]

    normalized_days = []

    category_totals = {
        key: 0.0 for key in category_keys
    }

    estimated_total = 0.0

    for index, raw_day in enumerate(days, start=1):

        if not isinstance(raw_day, dict):
            raise ValueError(f"Invalid day {index}")

        # ----------------------------------
        # EXPENSES
        # ----------------------------------

        expenses = raw_day.get("expense_estimates") or {}

        if not isinstance(expenses, dict):
            expenses = {}

        day_expenses = {
            key: safe_number(expenses.get(key))
            for key in category_keys
        }

        day_total = round(
            sum(day_expenses.values()),
            2
        )

        # ----------------------------------
        # MEALS
        # ----------------------------------

        meals = raw_day.get("meals") or {}

        if not isinstance(meals, dict):
            meals = {}

        normalized_meals = {}

        for meal_name in [
            "breakfast",
            "lunch",
            "dinner"
        ]:

            meal = meals.get(meal_name) or {}

            if isinstance(meal, str):
                meal = {
                    "suggestion": meal,
                    "estimated_cost": 0
                }

            if not isinstance(meal, dict):
                meal = {}

            normalized_meals[meal_name] = {
                "suggestion": str(
                    meal.get(
                        "suggestion",
                        "Plan a suitable meal"
                    )
                ),
                "estimated_cost": safe_number(
                    meal.get("estimated_cost")
                ),
            }

        # ----------------------------------
        # ACCOMMODATION
        # ----------------------------------

        stay = raw_day.get("stay") or {}

        if not isinstance(stay, dict):
            stay = {}

        normalized_stay = {
            "name": str(
                stay.get("name", "Not specified")
            ),
            "type": str(
                stay.get("type", "Accommodation")
            ),
            "nightly_cost": safe_number(
                stay.get("nightly_cost")
            ),
            "notes": str(
                stay.get("notes", "")
            ),
        }

        # ----------------------------------
        # ACTIVITIES
        # ----------------------------------

        activities = raw_day.get("activities") or []

        normalized_activities = []

        if isinstance(activities, list):

            for activity in activities:

                if isinstance(activity, str):
                    activity = {
                        "name": activity
                    }

                if not isinstance(activity, dict):
                    continue

                normalized_activities.append({
                    "time": str(
                        activity.get(
                            "time",
                            "Time flexible"
                        )
                    ),
                    "name": str(
                        activity.get(
                            "name",
                            "Suggested activity"
                        )
                    ),
                    "description": str(
                        activity.get("description", "")
                    ),
                    "location": str(
                        activity.get("location", "")
                    ),
                    "estimated_cost": safe_number(
                        activity.get("estimated_cost")
                    ),
                    "category": str(
                        activity.get("category", "activity")
                    ),
                })

        # ----------------------------------
        # NORMALIZED DAY
        # ----------------------------------

        normalized_day = {
            "day": index,
            "title": str(
                raw_day.get(
                    "title",
                    f"Day {index}"
                )
            ),
            "focus": str(
                raw_day.get("focus", "")
            ),
            "travel_plan": str(
                raw_day.get("travel_plan", "")
            ),
            "stay": normalized_stay,
            "meals": normalized_meals,
            "activities": normalized_activities,
            "expense_estimates": day_expenses,
            "day_total": day_total,
            "daily_budget": 0,
            "daily_notes": str(
                raw_day.get("daily_notes", "")
            ),
        }

        normalized_days.append(normalized_day)

        estimated_total += day_total

        for key in category_keys:
            category_totals[key] += day_expenses[key]

    estimated_total = round(
        estimated_total,
        2
    )

    # ======================================
    # BUDGET ALLOCATION
    # ======================================

    allocation_total = (
        round(trip.budget, 2)
        if trip.budget is not None
        else estimated_total
    )

    weights = [
        day["day_total"]
        for day in normalized_days
    ]

    weight_sum = sum(weights)

    if weight_sum <= 0:
        weights = [1] * len(normalized_days)
        weight_sum = len(normalized_days)

    allocated_so_far = 0.0

    for i, day in enumerate(normalized_days):

        if i == len(normalized_days) - 1:

            allocation = round(
                allocation_total - allocated_so_far,
                2
            )

        else:

            allocation = round(
                allocation_total * weights[i] / weight_sum,
                2
            )

            allocated_so_far += allocation

        day["daily_budget"] = allocation

    # ======================================
    # BUDGET COMPARISON
    # ======================================

    per_person = round(
        estimated_total / trip.travelers,
        2
    )

    difference = round(
        allocation_total - estimated_total,
        2
    )

    if trip.budget is None:

        budget_status = "estimated"

        budget_message = (
            "No budget limit was entered. "
            "The allocation is based on estimated trip expenses."
        )

    elif difference >= 0:

        budget_status = "within_budget"

        budget_message = (
            f"Estimated expenses are {trip.currency} "
            f"{difference:,.0f} below your entered budget. "
            "Keep some extra money for unexpected expenses."
        )

    else:

        budget_status = "over_budget"

        budget_message = (
            f"Estimated expenses exceed your budget by "
            f"{trip.currency} {abs(difference):,.0f}. "
            "Consider adjusting transportation, accommodation "
            "or activities."
        )

    # ======================================
    # SAFE RECOMMENDATION LISTS
    # ======================================

    def get_list(key):

        value = data.get(key, [])

        if not isinstance(value, list):
            return []

        return [
            str(item)
            if not isinstance(item, dict)
            else item
            for item in value
        ]

    accommodation = data.get(
        "accommodation_recommendations",
        []
    )

    if not isinstance(accommodation, list):
        accommodation = []

    # ======================================
    # FINAL ITINERARY RESPONSE
    # ======================================

    return {

        "origin": trip.origin,
        "destination": trip.destination,

        "start_date": (
            trip.start_date.isoformat()
            if trip.start_date else None
        ),

        "end_date": (
            trip.end_date.isoformat()
            if trip.end_date else None
        ),

        "duration": trip.duration,
        "travelers": trip.travelers,
        "currency": trip.currency.upper(),
        "travel_style": trip.travel_style,

        "transport": trip.transport,
        "accommodation": trip.accommodation,
        "interests": trip.interests,
        "dietary_preferences": trip.dietary_preferences,
        "additional_notes": trip.additional_notes,
        "budget": trip.budget,

        "summary": str(
            data.get("summary", "")
        ),

        "route_overview": str(
            data.get("route_overview", "")
        ),

        "budget_advice": str(
            data.get("budget_advice", "")
        ),

        "estimated_budget": {
            "total": estimated_total,
            "per_person": per_person,

            "breakdown": {
                key: round(value, 2)
                for key, value in category_totals.items()
            },

            "disclaimer": (
                "These are AI-generated estimates, not confirmed "
                "prices. Verify current rates before booking."
            ),
        },

        "budget_plan": {

            "user_budget": (
                round(trip.budget, 2)
                if trip.budget is not None
                else None
            ),

            "allocation_total": allocation_total,
            "difference": difference,
            "status": budget_status,
            "message": budget_message,

            "daily_allocations": [
                {
                    "day": day["day"],
                    "title": day["title"],
                    "allocated_budget": day["daily_budget"],
                    "estimated_spend": day["day_total"],
                }
                for day in normalized_days
            ],
        },

        "days": normalized_days,

        "accommodation_recommendations": accommodation,

        "transport_recommendations": get_list(
            "transport_recommendations"
        ),

        "food_recommendations": get_list(
            "food_recommendations"
        ),

        "packing_checklist": get_list(
            "packing_checklist"
        ),

        "travel_tips": get_list(
            "travel_tips"
        ),

    }


# ==========================================
# API ROUTES
# ==========================================

@app.get("/")
def root():

    return {
        "message": "TravelAI API is running",
        "version": "3.0.0",
        "provider": "Groq",
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "ai_configured": client is not None,
        "provider": "Groq",
        "models": AI_MODELS,
    }


# ==========================================
# GENERATE TRIP PLAN
# ==========================================

@app.post("/api/plan")
def generate_plan(trip: TripRequest):

    # --------------------------------------
    # CHECK API CONFIGURATION
    # --------------------------------------

    if client is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "GROQ_API_KEY is missing. "
                "Configure backend/.env."
            )
        )

    # --------------------------------------
    # VALIDATE TRAVEL DATES
    # --------------------------------------

    if trip.start_date and trip.end_date:

        if trip.end_date < trip.start_date:

            raise HTTPException(
                status_code=422,
                detail=(
                    "Return date cannot be before departure date."
                )
            )

        calculated_duration = (
            trip.end_date - trip.start_date
        ).days + 1

        if calculated_duration < 1 or calculated_duration > 30:

            raise HTTPException(
                status_code=422,
                detail=(
                    "Please select valid travel dates "
                    "between 1 and 30 days."
                )
            )

        trip.duration = calculated_duration

    # --------------------------------------
    # VALIDATE INTERESTS
    # --------------------------------------

    if not trip.interests:

        raise HTTPException(
            status_code=422,
            detail=(
                "Please select at least one travel interest."
            )
        )

    # --------------------------------------
    # PREPARE TRIP DATA
    # --------------------------------------

    trip_data = trip.model_dump(
        mode="json"
    )

    # --------------------------------------
    # LOG REQUEST DETAILS
    # --------------------------------------

    logger.info("=" * 55)
    logger.info("NEW TRAVEL PLAN REQUEST")
    logger.info("Starting City: %s", trip.origin)
    logger.info("Destination: %s", trip.destination)
    logger.info("Departure Date: %s", trip.start_date)
    logger.info("Return Date: %s", trip.end_date)
    logger.info("Duration: %s days", trip.duration)
    logger.info("Travelers: %s", trip.travelers)
    logger.info(
        "Total Budget: %s %s",
        trip.currency.upper(),
        trip.budget
    )
    logger.info("Travel Style: %s", trip.travel_style)
    logger.info("Transport: %s", trip.transport)
    logger.info("Accommodation: %s", trip.accommodation)
    logger.info("Interests: %s", trip.interests)
    logger.info(
        "Dietary Preferences: %s",
        trip.dietary_preferences
    )
    logger.info(
        "Additional Requests: %s",
        trip.additional_notes
    )
    logger.info("=" * 55)

    # --------------------------------------
    # CONSTRUCT USER PROMPT
    # --------------------------------------

    user_prompt = (
        "Create a complete and personalized travel itinerary "
        "using the following trip details. "
        "The budget represents the entire group. "
        "Include detailed daily activities, meals, accommodation, "
        "transportation and realistic expense estimates.\n\n"
        + json.dumps(
            trip_data,
            ensure_ascii=False,
            separators=(",", ":")
        )
    )

    # ======================================
    # AI MODEL GENERATION AND FALLBACK
    # ======================================

    last_error = None

    for model in AI_MODELS:

        try:

            logger.info(
                "Generating itinerary using model: %s",
                model
            )

            # ----------------------------------
            # SEND REQUEST TO GROQ
            # ----------------------------------

            response = client.chat.completions.create(
                model=model,
                temperature=0.2,
                max_tokens=6000,
                response_format={
                    "type": "json_object"
                },
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
            )

            # ----------------------------------
            # EXTRACT AI RESPONSE
            # ----------------------------------

            content = (
                response.choices[0].message.content
            )

            if not content:

                raise ValueError(
                    "AI returned an empty response."
                )

            logger.info(
                "AI response preview: %r",
                content[:500]
            )

            # ----------------------------------
            # EXTRACT JSON
            # ----------------------------------

            parsed = extract_json(content)

            # ----------------------------------
            # NORMALIZE ITINERARY
            # ----------------------------------

            itinerary = normalize_itinerary(
                parsed,
                trip
            )

            # ----------------------------------
            # LOG SUCCESS
            # ----------------------------------

            logger.info(
                "Successfully generated trip: %s -> %s",
                trip.origin,
                trip.destination
            )

            # ----------------------------------
            # RETURN SUCCESSFUL RESPONSE
            # ----------------------------------

            return {
                "success": True,
                "trip": itinerary
            }

        except Exception as exc:

            last_error = exc

            status_code = getattr(
                exc,
                "status_code",
                None
            )

            error_type = type(exc).__name__

            logger.error(
                "Model %s failed. Error type: %s, Status: %s",
                model,
                error_type,
                status_code,
                exc_info=True
            )

            if status_code == 413:

                logger.warning(
                    "Request exceeded model token limits. "
                    "Trying the next configured model."
                )

            elif status_code == 429:

                logger.warning(
                    "Model rate limit reached. "
                    "Trying the next configured model."
                )

            elif status_code == 400:

                logger.warning(
                    "Model rejected the request or JSON generation. "
                    "Trying the next configured model."
                )

            else:

                logger.warning(
                    "Unexpected AI provider error. "
                    "Trying the next configured model."
                )

    # ======================================
    # ALL AI MODELS FAILED
    # ======================================

    logger.error(
        "All AI models failed. Last error: %s",
        last_error
    )

    raise HTTPException(
        status_code=502,
        detail=(
            "TravelAI is temporarily unable to generate "
            "your itinerary. Please try again in a moment."
        )
    )
