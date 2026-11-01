

import { useEffect, useMemo, useState } from "react";

import {

  ArrowRight, Sparkles, MapPin, CalendarDays, Users, Wallet,

  Compass, Plane, Hotel, Utensils, Clock3, Sun, Moon,

  CheckCircle2, AlertCircle, LoaderCircle, RotateCcw,

  IndianRupee, Navigation, Coffee, SunMedium, MoonStar,

  Lightbulb, Luggage, Bus, ChevronDown, ChevronUp

} from "lucide-react";

import "./App.css";

const API_URL =

  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const initialForm = {

  starting_city: "",

  destination: "",

  start_date: "",

  end_date: "",

  travelers: 2,

  budget: "",

  currency: "INR",

  travel_style: "Balanced",

  preferred_transport: "Recommend the best option",

  accommodation: "Comfortable hotels",

  interests: [],

  additional_notes: "",

};

const interestOptions = [

  "Nature", "Adventure", "Food", "Culture", "Shopping",

  "History", "Relaxation", "Nightlife", "Photography"

];

function money(value, currency = "INR") {

  if (value === null || value === undefined || value === "") {

    return "Not specified";

  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {

    return String(value);

  }

  try {

    return new Intl.NumberFormat("en-IN", {

      style: "currency",

      currency,

      maximumFractionDigits: 0,

    }).format(amount);

  } catch {

    return `${currency} ${amount.toLocaleString("en-IN")}`;

  }

}

function prettyDate(value) {

  if (!value) return "Flexible dates";

  return new Date(`${value}T00:00:00`).toLocaleDateString(

    "en-IN",

    {

      day: "numeric",

      month: "short",

      year: "numeric",

    }

  );

}

function SectionHeading({ icon: Icon, title, subtitle }) {

  return (

    <div className="result-heading">

      <div className="result-heading-icon">

        <Icon size={19} />

      </div>

      <div>

        <h3>{title}</h3>

        {subtitle && <p>{subtitle}</p>}

      </div>

    </div>

  );

}

function InfoCard({ icon: Icon, label, value }) {

  return (

    <div className="info-card glass-panel">

      <div className="info-card-icon">

        <Icon size={18} />

      </div>

      <span>{label}</span>

      <strong>{value}</strong>

    </div>

  );

}

function RecommendationList({ items, icon: Icon }) {

  if (!items?.length) return null;

  return (

    <ul className="recommendation-list">

      {items.map((item, index) => {

        const isObject =

          typeof item === "object" && item !== null;

        return (

          <li key={index}>

            <Icon size={16} />

            <div>

              {isObject ? (

                <>

                  <strong>{item.name || "Recommendation"}</strong>

                  {item.type && <p>{item.type}</p>}

                  {item.reason && <p>{item.reason}</p>}

                  {item.estimated_price_per_night !== undefined && (

                    <p>

                      Estimated per night:{" "}

                      {item.estimated_price_per_night}

                    </p>

                  )}

                  {item.caveat && <small>{item.caveat}</small>}

                </>

              ) : (

                <span>{String(item)}</span>

              )}

            </div>

          </li>

        );

      })}

    </ul>

  );

}

function MealCard({ title, meal, icon: Icon, currency }) {

  if (!meal) return null;

  return (

    <div className="meal-card">

      <div className="meal-card-top">

        <Icon size={17} />

        <span>{title}</span>

      </div>

      <p>{meal.suggestion || "No suggestion available"}</p>

      <strong>

        {money(meal.estimated_cost, currency)}

      </strong>

    </div>

  );

}

function ActivityCard({ activity, index, currency }) {

  const time = (activity.time || "").toLowerCase();

  let PeriodIcon = SunMedium;

  if (

    time.includes("pm") &&

    !time.includes("12:")

  ) {

    PeriodIcon = MoonStar;

  }

  return (

    <div className="activity-item">

      <div className="activity-timeline">

        <span className="activity-dot" />

        {index !== 999 && <span className="activity-line" />}

      </div>

      <div className="activity-content">

        <div className="activity-time">

          <PeriodIcon size={15} />

          {activity.time || "Flexible time"}

        </div>

        <h4>{activity.name}</h4>

        {activity.description && (

          <p>{activity.description}</p>

        )}

        {activity.location && (

          <div className="activity-location">

            <MapPin size={13} />

            {activity.location}

          </div>

        )}

        <div className="activity-bottom">

          <span className="activity-category">

            {activity.category || "Activity"}

          </span>

          <strong>

            {money(activity.estimated_cost, currency)}

          </strong>

        </div>

      </div>

    </div>

  );

}

function DayCard({ day, currency }) {

  const [expanded, setExpanded] = useState(true);

  const expenses = day.expense_estimates || {};

  return (

    <article className="day-card glass-panel">

      <button

        type="button"

        className="day-card-header"

        onClick={() => setExpanded(value => !value)}

      >

        <div className="day-number">

          DAY

          <strong>{String(day.day).padStart(2, "0")}</strong>

        </div>

        <div className="day-header-text">

          <h3>{day.title}</h3>

          <p>{day.focus}</p>

        </div>

        <div className="day-header-right">

          <strong>

            {money(day.day_total, currency)}

          </strong>

          {expanded

            ? <ChevronUp size={19} />

            : <ChevronDown size={19} />

          }

        </div>

      </button>

      {expanded && (

        <div className="day-card-body">

          {day.travel_plan && (

            <div className="day-travel-plan">

              <Navigation size={17} />

              <div>

                <strong>Travel & transportation</strong>

                <p>{day.travel_plan}</p>

              </div>

            </div>

          )}

          <div className="day-content-grid">

            {/* Activities */}

            <div className="day-main-content">

              <SectionHeading

                icon={Clock3}

                title="Daily activities"

                subtitle="Your planned experiences throughout the day"

              />

              <div className="activity-list">

                {day.activities?.length ? (

                  day.activities.map((activity, index) => (

                    <ActivityCard

                      key={index}

                      activity={activity}

                      index={index}

                      currency={currency}

                    />

                  ))

                ) : (

                  <p className="empty-result">

                    No activities provided.

                  </p>

                )}

              </div>

              {/* Meals */}

              <div className="day-subsection">

                <SectionHeading

                  icon={Utensils}

                  title="Meals & dining"

                  subtitle="Food recommendations for your day"

                />

                <div className="meals-grid">

                  <MealCard

                    title="Breakfast"

                    meal={day.meals?.breakfast}

                    icon={Coffee}

                    currency={currency}

                  />

                  <MealCard

                    title="Lunch"

                    meal={day.meals?.lunch}

                    icon={SunMedium}

                    currency={currency}

                  />

                  <MealCard

                    title="Dinner"

                    meal={day.meals?.dinner}

                    icon={MoonStar}

                    currency={currency}

                  />

                </div>

              </div>

            </div>

            {/* Stay and expenses */}

            <aside className="day-sidebar">

              <div className="stay-card">

                <SectionHeading

                  icon={Hotel}

                  title="Accommodation"

                />

                <h4>{day.stay?.name || "Not specified"}</h4>

                <span className="stay-type">

                  {day.stay?.type || "Stay option"}

                </span>

                <p>{day.stay?.notes}</p>

                <div className="stay-price">

                  <span>Estimated nightly cost</span>

                  <strong>

                    {money(

                      day.stay?.nightly_cost,

                      currency

                    )}

                  </strong>

                </div>

              </div>

              <div className="expense-card">

                <SectionHeading

                  icon={Wallet}

                  title="Daily expenses"

                />

                {Object.entries(expenses).map(

                  ([key, value]) => (

                    <div className="expense-row" key={key}>

                      <span>

                        {key.charAt(0).toUpperCase() + key.slice(1)}

                      </span>

                      <strong>

                        {money(value, currency)}

                      </strong>

                    </div>

                  )

                )}

                <div className="expense-total">

                  <span>Total estimated</span>

                  <strong>

                    {money(day.day_total, currency)}

                  </strong>

                </div>

                <div className="daily-allocation">

                  <span>Suggested budget allocation</span>

                  <strong>

                    {money(day.daily_budget, currency)}

                  </strong>

                </div>

              </div>

            </aside>

          </div>

          {day.daily_notes && (

            <div className="daily-note">

              <Lightbulb size={18} />

              <div>

                <strong>Travel tip for this day</strong>

                <p>{day.daily_notes}</p>

              </div>

            </div>

          )}

        </div>

      )}

    </article>

  );

}

function TripResults({ trip, currency }) {

  if (!trip) return null;

  const budget = trip.estimated_budget || {};

  const budgetPlan = trip.budget_plan || {};

  const breakdown = budget.breakdown || {};

  return (

    <div className="trip-results">

      {/* Trip overview */}

      <section className="overview-card glass-panel">

        <div className="overview-top">

          <div>

            <div className="eyebrow">

              YOUR PERSONALIZED JOURNEY

            </div>

            <h2>

              Your trip to{" "}

              <span>{trip.destination}</span>

            </h2>

            <p>{trip.summary}</p>

          </div>

          <div className="overview-icon">

            <Plane size={27} />

          </div>

        </div>

        <div className="overview-meta">

          <span>

            <CalendarDays size={15} />

            {prettyDate(trip.start_date)}

          </span>

          <span>

            <Clock3 size={15} />

            {trip.duration} days

          </span>

          <span>

            <Users size={15} />

            {trip.travelers} travelers

          </span>

          <span>

            <Compass size={15} />

            {trip.travel_style || "Balanced"}

          </span>

        </div>

      </section>

      {/* Statistics */}

      <div className="info-grid">

        <InfoCard

          icon={Wallet}

          label="Estimated total cost"

          value={money(budget.total, currency)}

        />

        <InfoCard

          icon={Users}

          label="Estimated per person"

          value={money(budget.per_person, currency)}

        />

        <InfoCard

          icon={CalendarDays}

          label="Trip duration"

          value={`${trip.duration} Days`}

        />

        <InfoCard

          icon={Users}

          label="Travelers"

          value={trip.travelers}

        />

      </div>

      {/* Route */}

      {trip.route_overview && (

        <section className="result-panel glass-panel">

          <SectionHeading

            icon={Navigation}

            title="Your travel route"

            subtitle="Journey overview and transportation"

          />

          <p className="result-description">

            {trip.route_overview}

          </p>

        </section>

      )}

      {/* Budget */}

      <section className="result-panel glass-panel">

        <SectionHeading

          icon={Wallet}

          title="Budget overview"

          subtitle="Understand your estimated trip expenses"

        />

        <div className="budget-status">

          <div>

            <span>Budget status</span>

            <strong className={`status-${budgetPlan.status}`}>

              {budgetPlan.status === "within_budget"

                ? "Within budget"

                : budgetPlan.status === "over_budget"

                  ? "Over budget"

                  : "Estimated"}

            </strong>

          </div>

          <div>

            <span>Your total budget</span>

            <strong>

              {money(budgetPlan.user_budget, currency)}

            </strong>

          </div>

        </div>

        <p className="budget-message">

          {budgetPlan.message || trip.budget_advice}

        </p>

        <div className="budget-breakdown">

          {Object.entries(breakdown).map(([key, value]) => {

            const percentage = budget.total > 0

              ? Math.min((Number(value) / budget.total) * 100, 100)

              : 0;

            return (

              <div className="budget-row" key={key}>

                <div className="budget-row-info">

                  <span>

                    {key.charAt(0).toUpperCase() + key.slice(1)}

                  </span>

                  <strong>

                    {money(value, currency)}

                  </strong>

                </div>

                <div className="budget-track">

                  <div

                    className="budget-fill"

                    style={{ width: `${percentage}%` }}

                  />

                </div>

              </div>

            );

          })}

        </div>

        {budget.disclaimer && (

          <p className="disclaimer">{budget.disclaimer}</p>

        )}

      </section>

      {/* Day by day itinerary */}

      <section className="itinerary-section">

        <div className="itinerary-heading">

          <div>

            <div className="eyebrow">YOUR DAILY ADVENTURE</div>

            <h2>

              Day-by-day <span>itinerary.</span>

            </h2>

            <p>

              Every day planned around your interests,

              travel style and budget.

            </p>

          </div>

          <span className="day-count">

            {trip.days?.length || 0} DAYS

          </span>

        </div>

        <div className="days-list">

          {trip.days?.map(day => (

            <DayCard

              key={day.day}

              day={day}

              currency={currency}

            />

          ))}

        </div>

      </section>

      {/* Additional recommendations */}

      <section className="recommendations-grid">

        {trip.accommodation_recommendations?.length > 0 && (

          <div className="result-panel glass-panel">

            <SectionHeading

              icon={Hotel}

              title="Accommodation recommendations"

            />

            <RecommendationList

              items={trip.accommodation_recommendations}

              icon={Hotel}

            />

          </div>

        )}

        {trip.transport_recommendations?.length > 0 && (

          <div className="result-panel glass-panel">

            <SectionHeading

              icon={Bus}

              title="Transportation recommendations"

            />

            <RecommendationList

              items={trip.transport_recommendations}

              icon={Bus}

            />

          </div>

        )}

        {trip.food_recommendations?.length > 0 && (

          <div className="result-panel glass-panel">

            <SectionHeading

              icon={Utensils}

              title="Food recommendations"

            />

            <RecommendationList

              items={trip.food_recommendations}

              icon={Utensils}

            />

          </div>

        )}

        {trip.packing_checklist?.length > 0 && (

          <div className="result-panel glass-panel">

            <SectionHeading

              icon={Luggage}

              title="Packing checklist"

            />

            <RecommendationList

              items={trip.packing_checklist}

              icon={CheckCircle2}

            />

          </div>

        )}

        {trip.travel_tips?.length > 0 && (

          <div className="result-panel glass-panel">

            <SectionHeading

              icon={Lightbulb}

              title="Important travel tips"

            />

            <RecommendationList

              items={trip.travel_tips}

              icon={Sparkles}

            />

          </div>

        )}

      </section>

    </div>

  );

}

export default function App() {

  const [form, setForm] = useState(initialForm);

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [dark, setDark] = useState(() => {

    const saved = localStorage.getItem("travelai-theme");

    return saved ? saved === "dark" : true;

  });

  useEffect(() => {

    localStorage.setItem(

      "travelai-theme",

      dark ? "dark" : "light"

    );

  }, [dark]);

  const selectedDays = useMemo(() => {

    if (!form.start_date || !form.end_date) {

      return null;

    }

    const start = new Date(`${form.start_date}T00:00:00`);

    const end = new Date(`${form.end_date}T00:00:00`);

    const diff = Math.round(

      (end - start) / 86400000

    ) + 1;

    return diff > 0 ? diff : null;

  }, [form.start_date, form.end_date]);

  const update = (key, value) => {

    setForm(prev => ({

      ...prev,

      [key]: value

    }));

  };

  const toggleInterest = (interest) => {

    setForm(prev => ({

      ...prev,

      interests: prev.interests.includes(interest)

        ? prev.interests.filter(item => item !== interest)

        : [...prev.interests, interest],

    }));

  };

  async function generatePlan(event) {

    event.preventDefault();

    setError("");

    setResult(null);

    if (!form.destination.trim()) {

      setError("Please enter your destination.");

      return;

    }

    if (!form.start_date || !form.end_date) {

      setError("Please select your travel dates.");

      return;

    }

    if (new Date(form.end_date) < new Date(form.start_date)) {

      setError("Your return date must be after your start date.");

      return;

    }

    if (!selectedDays || selectedDays > 30) {

      setError("Your trip must be between 1 and 30 days.");

      return;

    }

    if (!form.budget || Number(form.budget) <= 0) {

      setError("Please enter a valid total trip budget.");

      return;

    }

    if (form.interests.length === 0) {

      setError("Please select at least one travel interest.");

      return;

    }

    const payload = {

      ...form,

      duration: selectedDays,

      starting_city: form.starting_city.trim(),

      preferred_transport: form.preferred_transport,

      accommodation: form.accommodation,

      travelers: Number(form.travelers),

      budget: Number(form.budget),

      interests: form.interests,

    };

    setLoading(true);

    try {

      const response = await fetch(

        `${API_URL}/api/plan`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify(payload),

        }

      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {

        throw new Error(

          data.detail ||

          data.message ||

          `Request failed (${response.status})`

        );

      }

      if (!data.success || !data.trip) {

        throw new Error(

          "The server returned an unexpected itinerary format."

        );

      }

      setResult(data.trip);

      setTimeout(() => {

        document

          .getElementById("itinerary-results")

          ?.scrollIntoView({

            behavior: "smooth",

            block: "start"

          });

      }, 150);

    } catch (err) {

      setError(

        err.message ||

        "Unable to generate your itinerary. Please try again."

      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>

      <div className="ambient ambient-one" />

      <div className="ambient ambient-two" />

      <div className="ambient ambient-three" />

      {/* Header */}

      <header className="topbar">

        <a className="brand" href="#" aria-label="TravelAI home">

          <span className="brand-mark">

            <Compass size={21} />

          </span>

          <span>

            travel<span className="brand-highlight">ai</span>

          </span>

        </a>

        <nav className="nav-links">

          <a href="#planner">Trip planner</a>

          <a href="#how-it-works">How it works</a>

        </nav>

        <button

          className="theme-toggle"

          onClick={() => setDark(value => !value)}

          aria-label="Toggle theme"

        >

          {dark ? <Sun size={17} /> : <Moon size={17} />}

          <span>

            {dark ? "Light mode" : "Dark mode"}

          </span>

        </button>

      </header>

      <main>

        {/* Hero */}

        <section className="hero">

          <div className="hero-copy">

            <div className="eyebrow">

              <span className="eyebrow-dot" />

              YOUR PERSONAL AI TRAVEL COMPANION

            </div>

            <h1>

              Travel better.

              <br />

              <span>Discover more.</span>

            </h1>

            <p className="hero-description">

              Tell us what your perfect trip looks like.

              TravelAI turns your dates, interests and budget

              into a thoughtful, day-by-day travel plan.

            </p>

            <div className="hero-points">

              <span>

                <CheckCircle2 size={15} />

                Personalized itineraries

              </span>

              <span>

                <CheckCircle2 size={15} />

                Budget-aware planning

              </span>

              <span>

                <CheckCircle2 size={15} />

                Made around you

              </span>

            </div>

          </div>

          <div className="hero-visual">

            <div className="orbit orbit-one" />

            <div className="orbit orbit-two" />

            <div className="destination-card glass-panel">

              <div className="destination-image">

                <div className="image-overlay" />

                <span className="image-tag">

                  <Sparkles size={13} />

                  AI CURATED

                </span>

                <div className="destination-caption">

                  <span>YOUR NEXT ADVENTURE</span>

                  <strong>Somewhere wonderful.</strong>

                </div>

              </div>

              <div className="destination-meta">

                <div>

                  <MapPin size={15} />

                  <span>Made for your journey</span>

                </div>

                <span className="meta-status">

                  <span />

                  Ready to explore

                </span>

              </div>

            </div>

            <div className="floating-chip chip-top">

              <Sparkles size={15} />

              Smart trip planning

            </div>

            <div className="floating-chip chip-bottom">

              <Wallet size={15} />

              Budget conscious

            </div>

          </div>

        </section>

        {/* Planner */}

        <section className="planner-section" id="planner">

          <div className="section-intro">

            <div>

              <div className="eyebrow">

                LET'S PLAN YOUR ESCAPE

              </div>

              <h2>

                Your trip, <span>your way.</span>

              </h2>

              <p>

                A few details are all we need to build your travel blueprint.

              </p>

            </div>

            <div className="step-indicator">

              <span>01</span>

              <i />

              <span>02</span>

              <i />

              <span>03</span>

            </div>

          </div>

          <form

            className="planner-card glass-panel"

            onSubmit={generatePlan}

          >

            <div className="form-section-title">

              <span className="form-title-icon">

                <MapPin size={18} />

              </span>

              <div>

                <h3>Where are you headed?</h3>

                <p>Start with the basics of your journey.</p>

              </div>

            </div>

            <div className="form-grid">

              <label className="field">

                <span>Starting city</span>

                <div className="input-wrap">

                  <Navigation size={17} />

                  <input
                    value={form.starting_city}
                    onChange={e => update("starting_city", e.target.value)}
                    placeholder="e.g. Nagpur, Mumbai..."
                    autoComplete="address-level2"
                  />

                </div>

              </label>

              <label className="field">

                <span>Where to?</span>

                <div className="input-wrap">

                  <MapPin size={17} />

                  <input

                    value={form.destination}

                    onChange={e => update("destination", e.target.value)}

                    placeholder="e.g. Manali, Goa, Kyoto..."

                    required

                  />

                </div>

              </label>

              <label className="field">

                <span>Departure date</span>

                <div className="input-wrap">

                  <CalendarDays size={17} />

                  <input

                    type="date"

                    min={new Date().toISOString().split("T")[0]}

                    value={form.start_date}

                    onChange={e => update("start_date", e.target.value)}

                    required

                  />

                </div>

              </label>

              <label className="field">

                <span>Return date</span>

                <div className="input-wrap">

                  <CalendarDays size={17} />

                  <input

                    type="date"

                    min={form.start_date || undefined}

                    value={form.end_date}

                    onChange={e => update("end_date", e.target.value)}

                    required

                  />

                </div>

              </label>

              <label className="field">

                <span>Number of travelers</span>

                <div className="input-wrap">

                  <Users size={17} />

                  <select
                    value={form.travelers}
                    onChange={e => update("travelers", e.target.value)}
                  >
                    <option value="1">1 · Solo traveler</option>
                    <option value="2">2 · Couple / friends</option>
                    <option value="3">3 travelers</option>
                    <option value="4">4 travelers</option>
                    <option value="5">5 travelers</option>
                    <option value="6">6 travelers</option>
                    <option value="7">7 travelers</option>
                    <option value="8">8 travelers</option>
                    <option value="9">9 travelers</option>
                    <option value="10">10 travelers</option>
                  </select>

                </div>

              </label>

              <label className="field">

                <span>Total trip budget</span>

                <div className="input-wrap">

                  <Wallet size={17} />

                  <input

                    type="number"

                    min="1"

                    value={form.budget}

                    onChange={e => update("budget", e.target.value)}

                    placeholder="e.g. 30000"

                    required

                  />

                  <select

                    value={form.currency}

                    onChange={e => update("currency", e.target.value)}

                    aria-label="Currency"

                  >

                    <option value="INR">INR</option>

                    <option value="USD">USD</option>

                    <option value="EUR">EUR</option>

                  </select>

                </div>

                <small>Enter the total budget for all travelers.</small>

              </label>

              <div className="field field-wide travel-style-field">

                <span>What kind of trip do you prefer?</span>

                <div className="travel-style-grid">

                  {[
                    { value: "Budget", title: "Budget-friendly", caption: "Spend wisely" },
                    { value: "Balanced", title: "Balanced", caption: "Comfort & value" },
                    { value: "Luxury", title: "Luxury", caption: "Premium comfort" },
                  ].map(option => (
                    <button
                      type="button"
                      key={option.value}
                      className={`travel-style-card ${form.travel_style === option.value ? "selected" : ""}`}
                      onClick={() => update("travel_style", option.value)}
                      aria-pressed={form.travel_style === option.value}
                    >
                      <span className="style-check">
                        {form.travel_style === option.value ? <CheckCircle2 size={15} /> : null}
                      </span>
                      <strong>{option.title}</strong>
                      <small>{option.caption}</small>
                    </button>
                  ))}

                </div>

              </div>

              <label className="field">

                <span>Preferred transport</span>

                <div className="input-wrap">

                  <Bus size={17} />

                  <select
                    value={form.preferred_transport}
                    onChange={e => update("preferred_transport", e.target.value)}
                  >
                    <option>Recommend the best option</option>
                    <option>Flight</option>
                    <option>Train</option>
                    <option>Bus</option>
                    <option>Car / Self drive</option>
                    <option>Local transport</option>
                  </select>

                </div>

              </label>

              <label className="field">

                <span>Accommodation</span>

                <div className="input-wrap">

                  <Hotel size={17} />

                  <select
                    value={form.accommodation}
                    onChange={e => update("accommodation", e.target.value)}
                  >
                    <option>Budget stays</option>
                    <option>Comfortable hotels</option>
                    <option>Luxury hotels</option>
                    <option>Hostels</option>
                    <option>Homestays</option>
                    <option>Resorts</option>
                  </select>

                </div>

              </label>

            </div>

            <div className="form-divider" />

            <div className="form-section-title compact-title">

              <span className="form-title-icon">

                <Sparkles size={18} />

              </span>

              <div>

                <h3>What do you love doing?</h3>

                <p>Choose the experiences you want to include.</p>

              </div>

            </div>

            <div className="interest-list">

              {interestOptions.map(item => (

                <button

                  type="button"

                  key={item}

                  className={`interest-chip ${

                    form.interests.includes(item) ? "selected" : ""

                  }`}

                  onClick={() => toggleInterest(item)}

                >

                  {form.interests.includes(item) && (

                    <CheckCircle2 size={14} />

                  )}

                  {item}

                </button>

              ))}

            </div>

            <label className="field notes-field">

              <span>

                Anything else we should know?

                <em>Optional</em>

              </span>

              <textarea

                rows="3"

                value={form.additional_notes}

                onChange={e => update("additional_notes", e.target.value)}

                placeholder="e.g. Prefer scenic routes, vegetarian food, avoid crowded places..."

              />

            </label>

            {selectedDays && (

              <div className="trip-summary">

                <Clock3 size={15} />

                {selectedDays} days planned · {form.travelers} travelers ·

                {money(form.budget, form.currency)}

              </div>

            )}

            {error && (

              <div className="error-message">

                <AlertCircle size={17} />

                {error}

              </div>

            )}

            <button

              className="generate-button"

              type="submit"

              disabled={loading}

            >

              {loading ? (

                <>

                  <LoaderCircle className="spin" size={18} />

                  Creating your itinerary...

                </>

              ) : (

                <>

                  Generate my trip plan

                  <ArrowRight size={18} />

                </>

              )}

            </button>

            <p className="privacy-note">

              <Sparkles size={13} />

              Your journey is unique. Your itinerary should be too.

            </p>

          </form>

        </section>

        {/* Results */}

        {result && (

          <section

            className="results-section"

            id="itinerary-results"

          >

            <div className="section-intro results-intro">

              <div>

                <div className="eyebrow">

                  YOUR PERSONALIZED JOURNEY

                </div>

                <h2>

                  Your trip is <span>taking shape.</span>

                </h2>

                <p>

                  Explore your complete AI-generated travel blueprint.

                </p>

              </div>

              <button

                className="secondary-button"

                onClick={() => {

                  setResult(null);

                  document

                    .getElementById("planner")

                    ?.scrollIntoView({ behavior: "smooth" });

                }}

              >

                <RotateCcw size={15} />

                Edit details

              </button>

            </div>

            <TripResults

              trip={result}

              currency={result.currency || form.currency}

            />

          </section>

        )}

        {/* How it works */}

        <section className="how-section" id="how-it-works">

          <div className="eyebrow">SIMPLE BY DESIGN</div>

          <h2>

            From idea to <span>itinerary.</span>

          </h2>

          <div className="how-grid">

            <div className="how-card glass-panel">

              <span>01</span>

              <div className="how-icon"><Compass /></div>

              <h3>Share your vision</h3>

              <p>

                Tell us where you want to go, when, with whom

                and what you enjoy.

              </p>

            </div>

            <div className="how-card glass-panel">

              <span>02</span>

              <div className="how-icon"><Sparkles /></div>

              <h3>Let AI plan</h3>

              <p>

                Your details guide an itinerary designed around

                your travel style and budget.

              </p>

            </div>

            <div className="how-card glass-panel">

              <span>03</span>

              <div className="how-icon"><Plane /></div>

              <h3>Explore with confidence</h3>

              <p>

                Get a structured starting point for your next

                memorable journey.

              </p>

            </div>

          </div>

        </section>

      </main>

      <footer className="footer">

        <a className="brand" href="#">

          <span className="brand-mark">

            <Compass size={18} />

          </span>

          <span>

            travel<span className="brand-highlight">ai</span>

          </span>

        </a>

        <span>Thoughtful trips start here.</span>

        <span>

          © {new Date().getFullYear()} TravelAI

        </span>

      </footer>

    </div>

  );

}
