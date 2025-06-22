"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("platform_settings").select("*").single()
      if (error) {
        toast({ title: "Error", description: "Could not load settings", variant: "destructive" })
      } else {
        setSettings(data)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("platform_settings")
        .update(settings)
        .eq("id", settings.id)
      if (error) throw error
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "An error occurred while saving settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your platform settings and configurations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" value={settings.platform_name || ""} onChange={e => handleChange("platform_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input id="support-email" type="email" value={settings.support_email || ""} onChange={e => handleChange("support_email", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-description">Platform Description</Label>
                <Textarea
                  id="platform-description"
                  value={settings.platform_description || ""}
                  onChange={e => handleChange("platform_description", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Put the platform in maintenance mode</p>
                </div>
                <Switch id="maintenance-mode" checked={!!settings.maintenance_mode} onCheckedChange={val => handleChange("maintenance_mode", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Settings</CardTitle>
              <CardDescription>Configure user registration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-registration">Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable new user registrations</p>
                </div>
                <Switch id="allow-registration" checked={!!settings.allow_registration} onCheckedChange={val => handleChange("allow_registration", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-email-verification">Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require users to verify their email before accessing the platform
                  </p>
                </div>
                <Switch id="require-email-verification" checked={!!settings.require_email_verification} onCheckedChange={val => handleChange("require_email_verification", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-social-login">Allow Social Login</Label>
                  <p className="text-sm text-muted-foreground">Allow users to sign in with social media accounts</p>
                </div>
                <Switch id="allow-social-login" checked={!!settings.allow_social_login} onCheckedChange={val => handleChange("allow_social_login", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure email notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="welcome-email">Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                </div>
                <Switch id="welcome-email" checked={!!settings.welcome_email} onCheckedChange={val => handleChange("welcome_email", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="challenge-completion-email">Challenge Completion</Label>
                  <p className="text-sm text-muted-foreground">Send email when a user completes a challenge</p>
                </div>
                <Switch id="challenge-completion-email" checked={!!settings.challenge_completion_email} onCheckedChange={val => handleChange("challenge_completion_email", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="team-invitation-email">Team Invitations</Label>
                  <p className="text-sm text-muted-foreground">Send email for team invitations</p>
                </div>
                <Switch id="team-invitation-email" checked={!!settings.team_invitation_email} onCheckedChange={val => handleChange("team_invitation_email", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest-email">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Send weekly digest of platform activity</p>
                </div>
                <Switch id="weekly-digest-email" checked={!!settings.weekly_digest_email} onCheckedChange={val => handleChange("weekly_digest_email", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Configure push notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="challenge-push">Challenge Updates</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications for challenge updates</p>
                </div>
                <Switch id="challenge-push" checked={!!settings.challenge_push} onCheckedChange={val => handleChange("challenge_push", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="team-push">Team Updates</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications for team updates</p>
                </div>
                <Switch id="team-push" checked={!!settings.team_push} onCheckedChange={val => handleChange("team_push", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="community-push">Community Activity</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications for community activity</p>
                </div>
                <Switch id="community-push" checked={!!settings.community_push} onCheckedChange={val => handleChange("community_push", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Settings</CardTitle>
              <CardDescription>Configure challenge-related settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-points">Default Challenge Points</Label>
                  <Input id="default-points" type="number" value={settings.default_points || ""} onChange={e => handleChange("default_points", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-duration">Default Duration (days)</Label>
                  <Input id="default-duration" type="number" value={settings.default_duration || ""} onChange={e => handleChange("default_duration", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-method">Default Verification Method</Label>
                <Select value={settings.verification_method || "photo"} onValueChange={val => handleChange("verification_method", val)}>
                  <SelectTrigger id="verification-method">
                    <SelectValue placeholder="Select verification method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">Photo Proof</SelectItem>
                    <SelectItem value="location">Location Check-in</SelectItem>
                    <SelectItem value="both">Both Photo and Location</SelectItem>
                    <SelectItem value="manual">Manual Verification Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-verification">Enable AI Auto-Verification</Label>
                  <p className="text-sm text-muted-foreground">Use AI to automatically verify challenge submissions</p>
                </div>
                <Switch id="auto-verification" checked={!!settings.auto_verification} onCheckedChange={val => handleChange("auto_verification", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="user-challenges">Allow User-Created Challenges</Label>
                  <p className="text-sm text-muted-foreground">Allow users to create their own challenges</p>
                </div>
                <Switch id="user-challenges" checked={!!settings.user_challenges} onCheckedChange={val => handleChange("user_challenges", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reward Settings</CardTitle>
              <CardDescription>Configure reward-related settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="points-to-currency">Points to Currency Conversion</Label>
                <div className="flex items-center space-x-2">
                  <Input id="points-to-currency" type="number" value={settings.points_to_currency || ""} onChange={e => handleChange("points_to_currency", e.target.value)} />
                  <span className="text-sm text-muted-foreground">points = $1.00</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-rewards">Enable Rewards System</Label>
                  <p className="text-sm text-muted-foreground">Allow users to redeem points for rewards</p>
                </div>
                <Switch id="enable-rewards" checked={!!settings.enable_rewards} onCheckedChange={val => handleChange("enable_rewards", val)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-badges">Enable Achievement Badges</Label>
                  <p className="text-sm text-muted-foreground">Award badges for completing challenges</p>
                </div>
                <Switch id="enable-badges" checked={!!settings.enable_badges} onCheckedChange={val => handleChange("enable_badges", val)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Configure API access and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-api">Enable API Access</Label>
                  <p className="text-sm text-muted-foreground">Allow external applications to access the API</p>
                </div>
                <Switch id="enable-api" checked={!!settings.enable_api} onCheckedChange={val => handleChange("enable_api", val)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-key"
                    value={settings.api_key || ""}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" value={settings.webhook_url || ""} onChange={e => handleChange("webhook_url", e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>Configure integrations with third-party services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Google Maps</p>
                    <p className="text-sm text-muted-foreground">Integration for location services</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-sm text-muted-foreground">Payment processing for rewards</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SendGrid</p>
                    <p className="text-sm text-muted-foreground">Email delivery service</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">OpenAI</p>
                    <p className="text-sm text-muted-foreground">AI verification services</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
