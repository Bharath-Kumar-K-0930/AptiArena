"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, PlayCircle, BarChart3, Upload, BrainCircuit, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-teal/30">

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-4 overflow-hidden">
        {/* Abstract Background Image */}
        <div className="absolute inset-0 z-0 opacity-40">
          <Image
            src="/images/hero-bg.png"
            alt="Background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black" />
        </div>

        <div className="container mx-auto text-center relative z-10 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-teal/10 text-teal ring-1 ring-teal/30 mb-8 backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 mr-2" /> AI-Powered Quiz Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight"
          >
            Gamify Learning with <br />
            <span className="bg-gradient-to-r from-teal via-white to-gold bg-clip-text text-transparent drop-shadow-2xl">
              Artificial Intelligence
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Create generated quizzes in seconds from any text, host live events, and compete globally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Link href={isAuthenticated ? "/dashboard" : "/register"}>
              <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-teal hover:bg-teal/80 text-white shadow-[0_0_30px_-5px_rgba(27,160,152,0.4)] transition-all duration-300 transform hover:scale-105">
                {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
              </Button>
            </Link>
          </motion.div>

          {/* Join Game Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 max-w-4xl mx-auto relative group overflow-hidden rounded-xl"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80 z-10 mix-blend-multiply" />
              <motion.img
                src="/images/home-join-bg.png"
                alt="Background"
                className="w-full h-full object-cover opacity-50"
                initial={{ scale: 1 }}
                animate={{ scale: 1.15 }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "mirror" }}
              />
            </div>

            <div className="relative z-20 p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 rounded-xl">
              <div className="text-left space-y-2 flex-1">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <PlayCircle className="text-pink-500 h-6 w-6" />
                  Has a Game Code?
                </h3>
                <p className="text-gray-400">Join a live quiz session instantly. No account needed.</p>
              </div>

              <div className="flex w-full md:w-auto gap-2">
                <input
                  type="text"
                  placeholder="ENTER PIN"
                  maxLength={6}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-white focus:outline-none focus:border-pink-500 transition-colors w-full md:w-48 placeholder-gray-600"
                />
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold px-6"
                  onClick={() => {
                    const pin = (document.querySelector('input[placeholder="ENTER PIN"]') as HTMLInputElement)?.value;
                    if (pin) window.location.href = `/play?code=${pin}`;
                  }}
                >
                  JOIN
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-background relative">
        <div className="container mx-auto px-4 z-10 relative">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Experience the Future</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              AptiArena combines cutting-edge AI with real-time engagement tools.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                img: "/images/feature-ai.png",
                icon: <BrainCircuit className="h-6 w-6 text-teal" />,
                title: "AI Generation",
                desc: "Convert PDFs, Docs, or Topics into interactive quizzes instantly.",
                color: "from-cyan-500/20 to-blue-500/5",
                border: "group-hover:border-cyan-500/50",
                link: "/quiz/create"
              },
              {
                img: "/images/feature-hosting.png",
                icon: <Users className="h-6 w-6 text-gold" />,
                title: "Live Hosting",
                desc: "Host live events with thousands of participants with zero latency.",
                color: "from-purple-500/20 to-pink-500/5",
                border: "group-hover:border-purple-500/50",
                link: "/dashboard/quizzes"
              },
              {
                img: "/images/feature-analytics.png",
                icon: <BarChart3 className="h-6 w-6 text-teal" />,
                title: "Deep Analytics",
                desc: "Track performance with detailed insights and leaderboards.",
                color: "from-yellow-500/20 to-orange-500/5",
                border: "group-hover:border-yellow-500/50",
                link: "/dashboard"
              },
            ].map((feature, i) => (
              <Link href={feature.link} key={i} className="block h-full">
                <motion.div
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className={`group p-1 rounded-3xl bg-gradient-to-b from-card to-background border border-border hover:border-teal transition-all duration-300 relative overflow-hidden h-full cursor-pointer`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${feature.color}`} />

                  <div className="bg-card rounded-[22px] p-8 h-full relative z-10 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-6">
                      <Image src={feature.img} alt={feature.title} fill className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                    <div className="mb-4 inline-flex p-3 rounded-xl bg-background border border-border group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How it Works</h2>
            <div className="h-1 w-20 bg-teal mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", icon: <Upload className="h-6 w-6" />, title: "Upload", desc: "Upload PDF, PPT or paste text." },
              { step: "02", icon: <BrainCircuit className="h-6 w-6" />, title: "AI Process", desc: "Our AI extracts Q&A instantly." },
              { step: "03", icon: <PlayCircle className="h-6 w-6" />, title: "Host", desc: "Start a Live or Slide mode quiz." },
              { step: "04", icon: <Trophy className="h-6 w-6" />, title: "Analyze", desc: "Get detailed reports & certificates." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-black text-card absolute -top-8 -left-4 z-0">{item.step}</div>
                <div className="relative z-10 bg-card border border-border p-8 rounded-2xl hover:bg-card/80 transition duration-300">
                  <div className="mb-4 text-teal">{item.icon}</div>
                  <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



    </div>
  );
}
