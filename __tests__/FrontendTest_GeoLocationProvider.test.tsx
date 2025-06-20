import { render, waitFor } from "@testing-library/react"
import { GeolocationProvider, useGeolocation } from "@/lib/geolocation"
import React from "react"

const mockGeolocation = {
  getCurrentPosition: jest.fn((success) =>
    success({
      coords: { latitude: 28.6139, longitude: 77.209 },
    }),
  ),
}

Object.defineProperty(global.navigator, "geolocation", {
  value: mockGeolocation,
})

function TestComponent() {
  const { location, nearbyEvents, localChallenges, getLocationBasedContent } = useGeolocation()

  return (
    <div>
      <p data-testid="city">{location?.city}</p>
      <p data-testid="events-count">{nearbyEvents.length}</p>
      <p data-testid="challenges-count">{localChallenges.length}</p>
      <button onClick={() => getLocationBasedContent(28.6139, 77.209)}>Update</button>
    </div>
  )
}

describe("GeolocationProvider", () => {
  it("fetches user location and populates events/challenges", async () => {
    const { getByTestId } = render(
      <GeolocationProvider>
        <TestComponent />
      </GeolocationProvider>,
    )

    await waitFor(() => {
      expect(getByTestId("city").textContent).toBe("Delhi")
      expect(getByTestId("events-count").textContent).toBe("1")
      expect(getByTestId("challenges-count").textContent).toBe("1")
    })
  })

  it("manually triggers getLocationBasedContent", async () => {
    const { getByText, getByTestId } = render(
      <GeolocationProvider>
        <TestComponent />
      </GeolocationProvider>,
    )

    await waitFor(() => getByText("Update"))
    getByText("Update").click()

    await waitFor(() => {
      expect(getByTestId("events-count").textContent).toBe("1")
      expect(getByTestId("challenges-count").textContent).toBe("1")
    })
  })
})
