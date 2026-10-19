from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.task import Task
from backend.app.models.goal import Goal, GoalMilestone
from backend.app.models.habit import Habit, HabitLog
from backend.app.models.focus import FocusSession
from backend.app.models.reflection import DailyReview, Blocker


def _to_utc(dt: Any) -> Optional[datetime]:
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            return None
    if isinstance(dt, datetime):
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    return None


class ProductivitySnapshot:
    """Extracts verified factual metrics and evidence from local SQLite database."""

    @staticmethod
    def gather_workspace_evidence(db: Session, workspace_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today = date.today()
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        # 1. Task Metrics
        tasks_query = db.query(Task).filter(Task.workspace_id == workspace_id)
        all_tasks: List[Task] = tasks_query.all()

        completed_tasks = [t for t in all_tasks if t.status == "completed"]
        active_tasks = [t for t in all_tasks if t.status in ("todo", "in_progress")]
        
        # Overdue tasks
        overdue_tasks = []
        for t in active_tasks:
            due_dt = _to_utc(t.due_date)
            if due_dt and due_dt < now:
                overdue_tasks.append(t)

        # Estimation vs Actual calculation
        tasks_with_estimation_data = [
            t for t in completed_tasks
            if (t.estimated_minutes or 0) > 0 and (t.actual_minutes or 0) > 0
        ]

        total_est = sum(t.estimated_minutes for t in tasks_with_estimation_data)
        total_act = sum(t.actual_minutes for t in tasks_with_estimation_data)
        estimation_ratio = round(total_act / total_est, 2) if total_est > 0 else 1.0

        underestimated_tasks = [
            t for t in tasks_with_estimation_data
            if t.actual_minutes > (t.estimated_minutes * 1.3)
        ]

        # 2. Goal & Milestone Metrics
        goals_query = db.query(Goal).filter(Goal.workspace_id == workspace_id)
        all_goals = goals_query.all()
        active_goals = [g for g in all_goals if g.status == "active"]
        completed_goals = [g for g in all_goals if g.status == "completed"]

        milestones_query = db.query(GoalMilestone).join(Goal).filter(Goal.workspace_id == workspace_id)
        all_milestones = milestones_query.all()
        completed_milestones = [m for m in all_milestones if m.is_completed]

        avg_goal_progress = 0
        if active_goals:
            avg_goal_progress = round(sum(g.progress_percentage for g in active_goals) / len(active_goals))

        # 3. Habit Metrics
        habits_query = db.query(Habit).filter(Habit.workspace_id == workspace_id)
        all_habits = habits_query.all()
        active_habits = [h for h in all_habits if getattr(h, "is_active", True) is not False]
        avg_streak = 0
        if active_habits:
            avg_streak = round(sum(h.current_streak for h in active_habits) / len(active_habits), 1)

        # Habit logs in last 7 days
        recent_habit_logs = db.query(HabitLog).join(Habit).filter(
            Habit.workspace_id == workspace_id,
            HabitLog.log_date >= (today - timedelta(days=7))
        ).all()

        # 4. Focus Session Metrics
        focus_query = db.query(FocusSession).filter(
            FocusSession.workspace_id == workspace_id
        )
        all_focus_sessions = focus_query.all()
        completed_focus = [f for f in all_focus_sessions if f.is_completed]
        total_focus_minutes = sum(round((f.duration_seconds or 0) / 60) for f in completed_focus)
        recent_focus_minutes = sum(
            round((f.duration_seconds or 0) / 60) for f in completed_focus
            if f.started_at and (_to_utc(f.started_at) or now) >= seven_days_ago
        )

        # 5. Blockers
        blockers_query = db.query(Blocker).filter(
            Blocker.workspace_id == workspace_id,
            Blocker.status == "active"
        )
        active_blockers = blockers_query.all()

        # 6. Daily Reviews
        reviews_query = db.query(DailyReview).filter(
            DailyReview.workspace_id == workspace_id
        ).order_by(DailyReview.review_date.desc()).limit(7)
        recent_reviews = reviews_query.all()

        # Build evidence facts array
        facts: List[str] = []
        facts.append(f"Recorded {len(completed_tasks)} completed tasks and {len(active_tasks)} active tasks in workspace.")
        
        if overdue_tasks:
            facts.append(f"{len(overdue_tasks)} active tasks are past their scheduled due dates.")
        else:
            facts.append("Zero active tasks are currently overdue.")

        if tasks_with_estimation_data:
            facts.append(
                f"Historical task duration: across {len(tasks_with_estimation_data)} completed tasks, "
                f"actual time averaged {round(total_act/len(tasks_with_estimation_data))}m vs "
                f"estimated {round(total_est/len(tasks_with_estimation_data))}m (Ratio: {estimation_ratio}x)."
            )
            if underestimated_tasks:
                facts.append(f"{len(underestimated_tasks)} tasks took >30% longer than originally planned.")
        else:
            facts.append("Insufficient estimate vs actual task duration history recorded so far.")

        if active_goals:
            facts.append(f"{len(active_goals)} active strategic goals tracked with {len(completed_milestones)}/{len(all_milestones)} milestones completed ({avg_goal_progress}% average goal progress).")
        else:
            facts.append("No active long-term or short-term goals currently registered.")

        if active_habits:
            facts.append(f"{len(active_habits)} active habits tracked with an average streak of {avg_streak} days and {len(recent_habit_logs)} check-ins in the last 7 days.")

        if completed_focus:
            facts.append(f"{len(completed_focus)} focus sessions completed ({round(recent_focus_minutes/60, 1)} hours in the last 7 days).")
        else:
            facts.append("Zero completed focus timer sessions recorded.")

        if active_blockers:
            blocker_titles = [b.title for b in active_blockers[:3]]
            facts.append(f"{len(active_blockers)} active blockers reported: {', '.join(blocker_titles)}.")

        # Identify primary planning mistake
        planning_mistake = None
        if estimation_ratio >= 1.4 and len(tasks_with_estimation_data) >= 2:
            planning_mistake = f"Severe underestimation: tasks take {round((estimation_ratio - 1.0) * 100)}% longer in practice than estimated ({estimation_ratio}x multiplier)."
        elif len(overdue_tasks) >= 3:
            planning_mistake = f"Deadline congestion: {len(overdue_tasks)} tasks have missed deadlines due to unrealistic scheduling."
        elif len(active_tasks) > 15 and avg_goal_progress < 25:
            planning_mistake = "WIP fragmentation: too many tasks in-flight simultaneously without finishing milestones."
        elif not active_goals and len(active_tasks) > 5:
            planning_mistake = "Tactical disconnect: tasks are being created without being anchored to explicit goals or milestones."

        return {
            "facts": facts,
            "metrics": {
                "total_tasks": len(all_tasks),
                "completed_tasks": len(completed_tasks),
                "active_tasks": len(active_tasks),
                "overdue_tasks": len(overdue_tasks),
                "estimation_accuracy_ratio": estimation_ratio,
                "tasks_with_estimate_data": len(tasks_with_estimation_data),
                "active_goals_count": len(active_goals),
                "completed_goals_count": len(completed_goals),
                "milestones_total": len(all_milestones),
                "milestones_completed": len(completed_milestones),
                "active_habits_count": len(active_habits),
                "average_habit_streak": avg_streak,
                "focus_minutes_last_7d": recent_focus_minutes,
                "active_blockers_count": len(active_blockers),
                "recent_reviews_count": len(recent_reviews),
            },
            "planning_mistake": planning_mistake,
            "sample_active_tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "priority": t.priority,
                    "energy_level": t.energy_level,
                    "estimated_minutes": t.estimated_minutes,
                    "status": t.status,
                    "due_date": t.due_date.isoformat() if hasattr(t.due_date, 'isoformat') else str(t.due_date or ''),
                }
                for t in active_tasks[:6]
            ],
            "sample_active_goals": [
                {
                    "id": g.id,
                    "title": g.title,
                    "goal_type": g.goal_type,
                    "progress_percentage": g.progress_percentage,
                }
                for g in active_goals[:3]
            ],
            "active_blockers": [
                {"id": b.id, "title": b.title, "impact_level": b.impact_level}
                for b in active_blockers[:3]
            ]
        }
