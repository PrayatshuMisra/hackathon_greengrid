"use client"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function AdminChart({ data }) {
  // Process data for chart
  const processChartData = () => {
    // Group by date and count activities
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split("T")[0]
      })
      .reverse()

    const activityCounts = last7Days.reduce((acc, date) => {
      acc[date] = {
        challenges: 0,
        users: 0,
        teams: 0,
      }
      return acc
    }, {})

    // Count activities by type and date
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0]
      if (activityCounts[date]) {
        if (item.activity_type === "challenge_joined") {
          activityCounts[date].challenges++
        } else if (item.activity_type === "user_registered") {
          activityCounts[date].users++
        } else if (item.activity_type === "team_created" || item.activity_type === "team_joined") {
          activityCounts[date].teams++
        }
      }
    })

    return {
      labels: Object.keys(activityCounts),
      datasets: [
        {
          label: "Challenge Activity",
          data: Object.values(activityCounts).map((v) => v.challenges),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.5)",
        },
        {
          label: "User Activity",
          data: Object.values(activityCounts).map((v) => v.users),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.5)",
        },
        {
          label: "Team Activity",
          data: Object.values(activityCounts).map((v) => v.teams),
          borderColor: "rgb(249, 115, 22)",
          backgroundColor: "rgba(249, 115, 22, 0.5)",
        },
      ],
    }
  }

  const chartData = processChartData()

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  }

  return (
    <div className="h-[350px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
