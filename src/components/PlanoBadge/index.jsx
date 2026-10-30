import "./index.css";

export default function PlanoBadge({ premium }) {
  return <span className={`plan-badge ${premium ? "plan-badge-premium" : "plan-badge-free"}`}>
    <span aria-hidden="true">{premium ? "✦" : "◇"}</span>
    {premium ? "Premium" : "Gratuito"}
  </span>;
}
