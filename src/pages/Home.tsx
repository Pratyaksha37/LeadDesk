import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Sparkles, Zap, Shield } from "lucide-react";
import { useCreateLead } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  budgetRange: z.enum(["Under $1,000", "$1,000–$3,000", "$3,000–$5,000", "$5,000+"], {
    required_error: "Please select a budget range",
  }),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const features = [
  {
    icon: Sparkles,
    title: "Strategic Design",
    desc: "Interfaces that feel as good as they look. No fluff, just what works.",
  },
  {
    icon: Zap,
    title: "Technical Excellence",
    desc: "Built to scale. Fast, accessible, and easily maintainable codebases.",
  },
  {
    icon: Shield,
    title: "Delivery You Can Count On",
    desc: "Transparent timelines, clear communication, and zero surprises.",
  },
];

export default function Home() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const createLead = useCreateLead();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", budgetRange: undefined, message: "" },
  });

  const onSubmit = (data: FormValues) => {
    createLead.mutate({ data }, { onSuccess: () => setIsSubmitted(true) });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative overflow-x-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -left-64 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm shadow-primary/30">
              <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
            </div>
            <span className="font-bold text-lg tracking-tight">LeadDesk</span>
          </div>
          <Link
            href="/admin"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin Login →
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-6 py-20 md:py-32 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

            {/* Left: Hero */}
            <div className="max-w-xl lg:pt-4">
              {/* Status badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Available for new projects
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
                Let's build something{" "}
                <span className="text-primary">exceptional</span>{" "}
                together.
              </h1>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                We craft precision tools, elegant interfaces, and high-performance
                applications for teams that care about the details.
              </p>

              {/* Feature list */}
              <div className="space-y-5">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 items-start">
                    <div className="mt-0.5 bg-primary/10 text-primary p-2 rounded-lg flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                      <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div className="mt-10 pt-8 border-t border-border/60 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["A", "B", "C"].map((l, i) => (
                    <div
                      key={l}
                      className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary"
                      style={{ zIndex: 3 - i }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">12 clients</span> served this year
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="relative">
              {/* Subtle glow behind card */}
              <div className="absolute inset-0 translate-y-4 bg-primary/10 blur-2xl rounded-3xl" />

              <div className="relative bg-card border border-border rounded-2xl shadow-xl shadow-foreground/5 overflow-hidden">
                {/* Gradient top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-violet-500 to-indigo-400" />

                <div className="p-8">
                  {isSubmitted ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 shadow-sm">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Inquiry Received!</h2>
                      <p className="text-muted-foreground mb-8 max-w-[280px] text-sm leading-relaxed">
                        Thanks! We've got your project details and will be in touch within 24 hours.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => { setIsSubmitted(false); form.reset(); }}
                      >
                        Submit another inquiry
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-1">Project Inquiry</h2>
                        <p className="text-muted-foreground text-sm">
                          Fill out the details below and we'll get back to you within 24 hours.
                        </p>
                      </div>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                          <div className="grid md:grid-cols-2 gap-5">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Jane Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="jane@example.com" type="email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="budgetRange"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget Range</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a budget range" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Under $1,000">Under $1,000</SelectItem>
                                    <SelectItem value="$1,000–$3,000">$1,000–$3,000</SelectItem>
                                    <SelectItem value="$3,000–$5,000">$3,000–$5,000</SelectItem>
                                    <SelectItem value="$5,000+">$5,000+</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Details</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Tell us about your goals, timeline, and what you're looking to build…"
                                    className="min-h-[120px] resize-y"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold group shadow-sm shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                            disabled={createLead.isPending}
                          >
                            {createLead.isPending ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Sending…
                              </span>
                            ) : (
                              <>
                                Send Inquiry
                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Button>

                          <p className="text-center text-xs text-muted-foreground">
                            No spam, ever. We respond within 24 hours.
                          </p>
                        </form>
                      </Form>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8 bg-background/60">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
            </div>
            <span className="font-semibold text-foreground">LeadDesk</span>
          </div>
          <span className="flex items-center gap-1">
            &copy; {new Date().getFullYear()}{' '}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Built for Digital Heroes Training Task
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
