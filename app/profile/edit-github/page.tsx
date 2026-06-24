"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CheckIcon, Loader2, Github, Twitter, Linkedin, Globe, Mail } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

export default function EditGithubProfilePage() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // State for all the options
  const [basics, setBasics] = useState({
    title: "Hi, I'm",
    name: "",
    subtitle: "A passionate software developer from Earth.",
  })

  const [work, setWork] = useState({
    currentWork: "",
    currentWorkLink: "",
    collaboratingOn: "",
    collaboratingOnLink: "",
    learning: "",
    askMeAbout: "",
    portfolioLink: "",
    email: "",
  })

  const [socials, setSocials] = useState({
    github: "",
    twitter: "",
    linkedin: "",
    website: "",
    devto: "",
    hashnode: "",
  })

  const [skills, setSkills] = useState<string[]>([])
  const [addons, setAddons] = useState({
    stats: true,
    languages: true,
    streak: false,
    trophies: false,
  })

  const [pat, setPat] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState<"rendered" | "markdown">("rendered")

  useEffect(() => {
    if (session?.user?.name && !basics.name) {
      setBasics(prev => ({ ...prev, name: session.user.name || "" }))
    }
    if (session?.user?.githubUsername && !socials.github) {
      setSocials(prev => ({ ...prev, github: session.user.githubUsername || "" }))
    }
  }, [session])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setIsSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  if (status === "loading") {
    return (
      <div className="layout-container py-8">
        <h1 className="text-3xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  if (!session?.user?.githubUsername) {
    redirect("/sign-in")
    return null
  }

  const githubUsername = session.user.githubUsername

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const generateReadmeContent = () => {
    let content = `# ${basics.title} ${basics.name || githubUsername}! 👋\n\n`
    
    if (basics.subtitle) {
      content += `### ${basics.subtitle}\n\n`
    }

    content += `---\n\n`

    // Work section
    if (work.currentWork || work.learning || work.collaboratingOn || work.askMeAbout || work.portfolioLink || work.email) {
      content += `### 🔭 I’m currently working on\n`
      if (work.currentWork) {
        content += `- 🔭 I’m currently working on ${work.currentWorkLink ? `[${work.currentWork}](${work.currentWorkLink})` : work.currentWork}\n`
      }
      if (work.collaboratingOn) {
        content += `- 🤝 I’m looking to collaborate on ${work.collaboratingOnLink ? `[${work.collaboratingOn}](${work.collaboratingOnLink})` : work.collaboratingOn}\n`
      }
      if (work.learning) {
        content += `- 🌱 I’m currently learning **${work.learning}**\n`
      }
      if (work.askMeAbout) {
        content += `- 💬 Ask me about **${work.askMeAbout}**\n`
      }
      if (work.portfolioLink) {
        content += `- 👨‍💻 All of my projects are available at [${work.portfolioLink}](${work.portfolioLink})\n`
      }
      if (work.email) {
        content += `- 📫 How to reach me **${work.email}**\n`
      }
      content += `\n`
    }

    // Skills section
    if (skills.length > 0) {
      content += `### 🛠 Languages and Tools\n\n`
      content += `<p align="left">\n`
      skills.forEach(skill => {
        const skillLower = skill.toLowerCase().replace(/ /g, "")
        content += `  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/${skillLower}/${skillLower}-original.svg" alt="${skillLower}" width="40" height="40"/>\n`
      })
      content += `</p>\n\n`
    }

    // Socials section
    const hasSocials = Object.values(socials).some(v => !!v)
    if (hasSocials) {
      content += `### 🤝 Connect with me:\n\n`
      content += `<p align="left">\n`
      if (socials.twitter) {
        content += `  <a href="https://twitter.com/${socials.twitter}" target="blank"><img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="${socials.twitter}" /></a>\n`
      }
      if (socials.linkedin) {
        content += `  <a href="https://linkedin.com/in/${socials.linkedin}" target="blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="${socials.linkedin}" /></a>\n`
      }
      if (socials.hashnode) {
        content += `  <a href="https://${socials.hashnode}.hashnode.dev" target="blank"><img src="https://img.shields.io/badge/Hashnode-2962FF?style=for-the-badge&logo=hashnode&logoColor=white" alt="${socials.hashnode}" /></a>\n`
      }
      if (socials.devto) {
        content += `  <a href="https://dev.to/${socials.devto}" target="blank"><img src="https://img.shields.io/badge/dev.to-0A0A0A?style=for-the-badge&logo=dev.to&logoColor=white" alt="${socials.devto}" /></a>\n`
      }
      content += `</p>\n\n`
    }

    // Addons section
    if (addons.stats || addons.languages || addons.streak || addons.trophies) {
      content += `---\n\n### 📊 GitHub Stats\n\n`
      content += `<p align="center">\n`
      if (addons.stats) {
        content += `  <img src="https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=radical" alt="${githubUsername}" />\n`
      }
      if (addons.languages) {
        content += `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=radical" alt="${githubUsername}" />\n`
      }
      if (addons.streak) {
        content += `  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${githubUsername}&theme=radical" alt="${githubUsername}" />\n`
      }
      if (addons.trophies) {
        content += `  <img src="https://github-profile-trophy.vercel.app/?username=${githubUsername}&theme=radical" alt="${githubUsername}" />\n`
      }
      content += `</p>\n\n`
    }

    return content
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setIsSuccess(false)
    const readmeContent = generateReadmeContent()

    try {
      const response = await fetch("/api/github/readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readmeContent, pat }),
      })

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: "Success!",
          description: (
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span>GitHub Profile README updated and pushed!</span>
            </div>
          ),
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.message || "Failed to update GitHub Profile README.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to push README:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const commonSkills = ["JavaScript", "TypeScript", "React", "Nodejs", "Python", "HTML", "CSS", "NextJS", "Docker", "Git", "MongoDB", "PostgreSQL", "TailwindCSS"]

  return (
    <div className="layout-container py-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-4">GitHub README Generator</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="socials">Socials</TabsTrigger>
              <TabsTrigger value="addons">Addons</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basics" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input value={basics.title} onChange={e => setBasics({...basics, title: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input value={basics.name} onChange={e => setBasics({...basics, name: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subtitle">Subtitle / Bio</Label>
                <Input value={basics.subtitle} onChange={e => setBasics({...basics, subtitle: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pat">Personal Access Token (Optional)</Label>
                <Input 
                  id="pat" type="password" placeholder="ghp_xxxxxxxxxxxx" value={pat}
                  onChange={(e) => setPat(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="work" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Currently working on</Label>
                  <Input value={work.currentWork} onChange={e => setWork({...work, currentWork: e.target.value})} placeholder="Project name" />
                </div>
                <div className="grid gap-2">
                  <Label>Project Link</Label>
                  <Input value={work.currentWorkLink} onChange={e => setWork({...work, currentWorkLink: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Currently learning</Label>
                <Input value={work.learning} onChange={e => setWork({...work, learning: e.target.value})} placeholder="Frameworks, languages..." />
              </div>
              <div className="grid gap-2">
                <Label>Portfolio Link</Label>
                <Input value={work.portfolioLink} onChange={e => setWork({...work, portfolioLink: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label>How to reach me (Email)</Label>
                <Input value={work.email} onChange={e => setWork({...work, email: e.target.value})} placeholder="your@email.com" />
              </div>
            </TabsContent>

            <TabsContent value="skills" className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {commonSkills.map(skill => (
                  <div key={skill} className="flex items-center space-x-2 border p-2 rounded hover:bg-accent cursor-pointer" onClick={() => toggleSkill(skill)}>
                    <Checkbox checked={skills.includes(skill)} />
                    <Label className="cursor-pointer">{skill}</Label>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="socials" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2"><Twitter className="w-4 h-4"/> Twitter Username</Label>
                  <Input value={socials.twitter} onChange={e => setSocials({...socials, twitter: e.target.value})} placeholder="username" />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2"><Linkedin className="w-4 h-4"/> LinkedIn Username</Label>
                  <Input value={socials.linkedin} onChange={e => setSocials({...socials, linkedin: e.target.value})} placeholder="username" />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2"><Globe className="w-4 h-4"/> Portfolio Website</Label>
                  <Input value={socials.website} onChange={e => setSocials({...socials, website: e.target.value})} placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">Dev.to Username</Label>
                  <Input value={socials.devto} onChange={e => setSocials({...socials, devto: e.target.value})} placeholder="username" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="addons" className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={addons.stats} onCheckedChange={(v) => setAddons({...addons, stats: !!v})} id="stats" />
                  <Label htmlFor="stats">Show GitHub Stats</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={addons.languages} onCheckedChange={(v) => setAddons({...addons, languages: !!v})} id="langs" />
                  <Label htmlFor="langs">Show Top Languages</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={addons.streak} onCheckedChange={(v) => setAddons({...addons, streak: !!v})} id="streak" />
                  <Label htmlFor="streak">Show GitHub Streak</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={addons.trophies} onCheckedChange={(v) => setAddons({...addons, trophies: !!v})} id="trophies" />
                  <Label htmlFor="trophies">Show GitHub Trophies</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isSuccess}
            className={`w-full ${isSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
            ) : isSuccess ? (
              <><CheckIcon className="mr-2 h-4 w-4" /> Pushed to GitHub!</>
            ) : (
              "Generate and Push to GitHub"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Preview</h2>
            <div className="inline-flex rounded-md border p-0.5 bg-muted">
              <button
                type="button"
                onClick={() => setPreviewMode("rendered")}
                className={`px-3 py-1 text-sm rounded-sm transition-colors ${
                  previewMode === "rendered"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("markdown")}
                className={`px-3 py-1 text-sm rounded-sm transition-colors ${
                  previewMode === "markdown"
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Markdown
              </button>
            </div>
          </div>

          {previewMode === "markdown" ? (
            <div className="p-4 bg-muted rounded-md border border-dashed border-foreground/30 overflow-auto max-h-[600px]">
              <pre className="whitespace-pre-wrap text-xs font-mono">
                {generateReadmeContent()}
              </pre>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden bg-white">
              <div className="flex items-center gap-2 border-b bg-[#f6f8fa] px-4 py-2 text-sm text-[#57606a]">
                <Github className="w-4 h-4" />
                <span className="font-mono">
                  {githubUsername}/{githubUsername}
                </span>
                <span className="ml-auto font-mono text-xs">README.md</span>
              </div>
              <div className="github-readme-preview overflow-auto max-h-[560px] px-6 py-5">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {generateReadmeContent()}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
