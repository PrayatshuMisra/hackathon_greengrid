module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(jose|@supabase|lucide-react|leaflet|react-leaflet|(next))/)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
