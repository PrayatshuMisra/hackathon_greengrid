export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">GreenGrid</h1>
        <p className="text-gray-600 mb-4">Welcome to GreenGrid!</p>
        <a 
          href="/auth/login" 
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Go to Login
        </a>
      </div>
    </div>
  )
}
