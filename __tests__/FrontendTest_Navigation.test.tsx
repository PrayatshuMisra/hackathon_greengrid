import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/contexts/theme-context"; // adjust path
import { Navigation } from "@/components/layout/Navigation";

jest.mock("next/navigation", () => ({
  usePathname: () => "/map",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(""),
  useParams: () => ({}),
}));

describe("Navigation", () => {
  it("renders with active tab", () => {
    const mockSetActiveTab = jest.fn();

    render(
      <ThemeProvider>
        <Navigation activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </ThemeProvider>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
