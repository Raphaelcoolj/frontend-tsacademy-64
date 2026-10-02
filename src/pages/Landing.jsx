import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const WHO = [
  {
    title: "Employees",
    text: "Submit transport, meal and supply costs in seconds, then follow each report from pending to its final decision. No more spreadsheets or chat threads.",
    points: ["Create and edit your own expenses", "Track status and rejection reasons", "Delete anything still awaiting review"],
  },
  {
    title: "Managers",
    text: "Review every expense the team submits in one queue and leave a decision that is documented, timestamped and impossible to misread.",
    points: ["See all expenses in one list", "Approve with one click", "Reject with a required reason"],
  },
];

const STEPS = [
  {
    title: "Register your account",
    text: "Pick a role when you sign up: employee to submit expenses, manager to review them.",
  },
  {
    title: "Submit an expense",
    text: "Add a title, amount, category, date and any receipt details. It is created as “awaiting review”.",
  },
  {
    title: "A manager decides",
    text: "The manager approves it, or rejects it with a reason of at least three characters.",
  },
  {
    title: "Everyone sees the outcome",
    text: "Approved and rejected expenses become final. The employee sees the status and the reason.",
  },
];

const FEATURES = [
  { title: "Role-based access", text: "Employees only ever see their own expenses; managers see everything." },
  { title: "Enforced workflow", text: "Nothing can skip review: every new expense starts as pending." },
  { title: "Final decisions", text: "Approved or rejected expenses can no longer be edited or deleted." },
  { title: "Documented rejections", text: "A rejection always carries a reason, shown to the employee." },
  { title: "Filters and search", text: "Filter by status and category, sort by date or amount, page through results." },
  { title: "Loading and errors", text: "Every screen shows progress, field-level validation errors and feedback." },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="page landing">
      <section className="hero">
        <span className="hero-kicker">Expense Approval System</span>
        <h1>Expenses in, decisions out, nothing lost in between.</h1>
        <p>
          A small approval workflow for teams: employees file what they spent,
          managers approve or reject it with a reason, and everyone can see
          exactly where each report stands.
        </p>

        <div className="hero-actions">
          {user ? (
            <Link className="btn primary" to="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link className="btn primary" to="/register">
                Get started
              </Link>
              <Link className="btn" to="/login">
                I already have an account
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <h2>What is this?</h2>
        <p className="lead">
          Reimbursements usually live in chat messages, spreadsheets and email
          threads, so nobody knows what was submitted, who has to act, or what
          was decided. This app turns that into a single queue with a clear
          lifecycle: every expense is <strong>pending</strong> until a manager
          approves or rejects it, and once decided it is final.
        </p>
      </section>

      <section className="section">
        <h2>Who is it for?</h2>
        <div className="grid-2">
          {WHO.map((role) => (
            <article className="feature-card" key={role.title}>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
              <ul className="ticks">
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How do I use it?</h2>
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.title}>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>What can it do?</h2>
        <div className="grid-3">
          {FEATURES.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Try it end to end</h2>
        <p className="lead">
          Register an employee and a manager, submit an expense, then approve
          or reject it. The whole workflow takes about a minute.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="btn primary" to="/expenses">
              Go to expenses
            </Link>
          ) : (
            <>
              <Link className="btn primary" to="/register">
                Create an account
              </Link>
              <Link className="btn" to="/login">
                Login
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Landing;
