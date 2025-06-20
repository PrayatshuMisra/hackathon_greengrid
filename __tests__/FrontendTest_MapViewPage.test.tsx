import { render, screen } from "@testing-library/react";
import MapPage from "@/app/map/page";
import { ThemeProvider } from "@/contexts/theme-context";
import { GeolocationProvider } from "@/lib/geolocation";

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

jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: jest.fn(),
  }),
}));

describe("MapViewPage", () => {
  it("renders map with providers", () => {
    render(
      <ThemeProvider>
        <GeolocationProvider>
          <MapPage />
        </GeolocationProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();
  });
});
