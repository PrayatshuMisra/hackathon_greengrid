import { Leaf, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-green-900 via-green-800 to-emerald-800 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-300 float-animation" />
              <span className="text-2xl font-bold">GreenGrid</span>
            </div>
            <p className="text-green-200 text-sm leading-relaxed">
              Unite, Act, Compete — For a Greener Future. Join thousands of eco-warriors making a real difference.
            </p>
            <div className="flex items-center space-x-1 text-green-300">
              <span className="text-sm">Made with</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-sm">by team cOdeSNiPers</span>
            </div>
            <div className="flex items-center space-x-1 text-green-300">
              <span className="text-sm">for our planet</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-200">Platform</h4>
            <ul className="space-y-3 text-sm">
              {["How it Works", "Challenges", "Teams", "Rewards", "Leaderboard"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-green-300 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-200">Community</h4>
            <ul className="space-y-3 text-sm">
              {["Forum", "Events", "Success Stories", "Blog", "Newsletter"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-green-300 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-green-200">Support</h4>
            <ul className="space-y-3 text-sm">
              {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service", "API Docs"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-green-300 hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-green-700 mt-8 pt-8 text-center">
          <p className="text-sm text-green-300">
            &copy; 2025 GreenGrid. All rights reserved. Making the world greener, one challenge at a time.
          </p>
        </div>
      </div>
    </footer>
  )
}
