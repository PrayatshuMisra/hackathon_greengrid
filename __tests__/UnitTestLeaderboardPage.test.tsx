import { render, screen } from "@testing-library/react"
import LeaderboardPage from "@/app/leaderboard/page"

jest.mock("@/components/leaderboard/Leaderboard", () => ({
  Leaderboard: () => <div data-testid="leaderboard">Mock Leaderboard</div>
}))
jest.mock("@/components/layout/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Mock Navigation</nav>
}))
jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Mock Footer</footer>
}))

describe("LeaderboardPage", () => {
  it("renders mock leaderboard page with navigation and footer", () => {
    render(<LeaderboardPage />)

    expect(screen.getByTestId("leaderboard")).toBeInTheDocument()
    expect(screen.getByTestId("navigation")).toBeInTheDocument()
    expect(screen.getByTestId("footer")).toBeInTheDocument()
  })
})
