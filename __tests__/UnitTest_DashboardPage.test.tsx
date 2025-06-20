import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/layout/Navigation", () => ({
  Navigation: () => <nav data-testid="nav">Mock Navigation</nav>,
}));

jest.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer data-testid="footer">Mock Footer</footer>,
}));

jest.mock("@/components/dashboard/Dashboard", () => ({
  Dashboard: () => <section data-testid="dashboard">Mock Dashboard</section>,
}));

describe("DashboardPage", () => {
  it("renders the dashboard page with Navigation, Dashboard, and Footer", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("nav")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});
