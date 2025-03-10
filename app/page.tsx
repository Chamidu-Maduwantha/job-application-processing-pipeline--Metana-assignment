import ApplicationForm from "@/components/application-form"
import ThemeProvider from "@/components/theme-provider"
import ThemeToggle from "@/components/theme-toggle"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { SparklesCore } from "@/components/ui/sparkles"



export default function Home() {
  return (
    <ThemeProvider>
      
      <main className="min-h-screen relative flex items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 w-full h-full bg-background dark:bg-[#0d0d0d]">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={50}
            className="w-full h-full"
            particleColor="#888"
          />
          <BackgroundBeams className="opacity-20" />
        </div>

        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary dark:to-blue-400">
              Join Our Team
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">We're looking for exceptional talent</p>
          </div>
          <ApplicationForm />
        </div>
      </main>
    </ThemeProvider>
  )
}

