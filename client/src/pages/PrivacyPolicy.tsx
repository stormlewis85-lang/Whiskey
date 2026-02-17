import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="bg-card border-border/50">
          <CardContent className="pt-8 pb-10 px-8 prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: February 17, 2026</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-2">
                When you create an account, we collect your username, email address (optional), and display name.
                If you sign in with Google, we receive your Google profile name, email, and profile picture.
              </p>
              <p className="text-muted-foreground">
                We also collect data you voluntarily provide: whiskey collection details, tasting reviews,
                bottle images, and any other content you add to your profile.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>To provide and maintain your WhiskeyPedia account and collection</li>
                <li>To authenticate your identity and secure your account</li>
                <li>To generate AI-powered tasting notes when you request them</li>
                <li>To enable community features like shared reviews and public profiles</li>
                <li>To send password reset emails when requested</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Third-Party Services</h2>
              <p className="text-muted-foreground mb-2">We use the following third-party services:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong className="text-foreground">Anthropic (Claude AI)</strong> — Generates AI tasting notes. Whiskey details you submit for AI suggestions are sent to Anthropic's API.</li>
                <li><strong className="text-foreground">Google OAuth</strong> — Optional sign-in method. We receive your name, email, and profile picture from Google.</li>
                <li><strong className="text-foreground">DigitalOcean Spaces</strong> — Stores bottle images you upload.</li>
                <li><strong className="text-foreground">Resend</strong> — Sends transactional emails (password resets).</li>
                <li><strong className="text-foreground">ElevenLabs</strong> — Optional text-to-speech for tasting notes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Cookies</h2>
              <p className="text-muted-foreground">
                We use a single session cookie (<code className="text-xs bg-muted px-1 py-0.5 rounded">whiskeypedia.sid</code>) to
                keep you logged in. This cookie is httpOnly, uses SameSite=Lax, and is secured with HTTPS in production.
                We do not use tracking cookies or third-party analytics cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground">
                Your account data and collection are retained as long as your account is active.
                Login sessions expire after 30 days of inactivity. Rate limiting data and expired
                password reset tokens are automatically cleaned up hourly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Account Deletion</h2>
              <p className="text-muted-foreground">
                You can delete your account at any time from your account settings. Deleting your account
                permanently removes all your data including your collection, reviews, images, and profile
                information. This action cannot be undone.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Data Security</h2>
              <p className="text-muted-foreground">
                Passwords are hashed using scrypt with unique salts. Sessions are stored server-side in PostgreSQL.
                OAuth tokens are encrypted at rest using AES-256-GCM. All traffic is served over HTTPS with
                HSTS enabled. We implement rate limiting and account lockout to protect against brute-force attacks.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Access and export your collection data (Excel/PDF export available)</li>
                <li>Update your profile information at any time</li>
                <li>Delete your account and all associated data</li>
                <li>Unlink third-party OAuth providers from your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy or your data, please reach out via the
                contact information on our website.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
