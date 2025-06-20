import { render, screen } from "@testing-library/react";
import { CertificatePreview } from "@/components/certificate/CertificatePreview";

test("renders CertificatePreview with data", () => {
  render(
    <CertificatePreview
      userName="Rahul Sharma"
      challengeTitle="Plastic-Free Challenge"
      points={100}
    />
  );
  expect(screen.getByText(/rahul sharma/i)).toBeInTheDocument();
  expect(screen.getByText(/plastic-free challenge/i)).toBeInTheDocument();
});
