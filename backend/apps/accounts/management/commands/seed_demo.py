"""Management command to seed demo data for hackathon demos."""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.profiles.models import ClientProfile, FreelancerProfile, SocialLink
from apps.tags.models import Tag
from apps.portfolio.models import PortfolioItem
from apps.deals.models import Deal, DealSnapshot
from apps.signatures.models import DealSignature
from apps.reputation.models import ReputationRecord, UserReputation
from apps.audit.models import AuditLog

User = get_user_model()

TAGS_DATA = [
    ("React", "react"), ("Python", "python"), ("Django", "django"),
    ("TypeScript", "typescript"), ("Node.js", "nodejs"), ("UI/UX Design", "ui-ux-design"),
    ("Graphic Design", "graphic-design"), ("Video Editing", "video-editing"),
    ("Copywriting", "copywriting"), ("Solidity", "solidity"),
    ("AI", "ai"), ("Machine Learning", "machine-learning"), ("PostgreSQL", "postgresql"),
    ("Tailwind CSS", "tailwind-css"), ("Next.js", "next-js"), ("Flutter", "flutter"),
    ("Swift", "swift"), ("Java", "java"), ("Go", "go"), ("Rust", "rust"),
]

FREELANCERS_DATA = [
    {
        "email": "aisha@demo.com", "username": "aisha_dev",
        "first_name": "Aisha", "last_name": "Patel",
        "display_name": "Aisha Patel",
        "headline": "Full-Stack Developer | React & Django Specialist",
        "bio": "Passionate full-stack developer with 5+ years of experience building scalable web applications. I specialize in React frontends and Django backends.",
        "location": "Mumbai, India", "timezone": "Asia/Kolkata",
        "hourly_rate": 35, "currency": "USD",
        "availability_status": "AVAILABLE",
        "working_hours": "Mon-Fri 9AM-6PM IST",
        "tags": ["react", "python", "django", "typescript", "tailwind-css"],
    },
    {
        "email": "marco@demo.com", "username": "marco_design",
        "first_name": "Marco", "last_name": "Rossi",
        "display_name": "Marco Rossi",
        "headline": "UI/UX Designer & Brand Strategist",
        "bio": "Creative designer with a keen eye for detail. I create beautiful, intuitive interfaces that users love.",
        "location": "Milan, Italy", "timezone": "Europe/Rome",
        "hourly_rate": 45, "currency": "USD",
        "availability_status": "BUSY",
        "working_hours": "Mon-Fri 10AM-7PM CET",
        "tags": ["ui-ux-design", "graphic-design"],
    },
    {
        "email": "yuki@demo.com", "username": "yuki_ml",
        "first_name": "Yuki", "last_name": "Tanaka",
        "display_name": "Yuki Tanaka",
        "headline": "ML Engineer & Data Scientist",
        "bio": "Building intelligent systems with machine learning. Specializing in NLP, computer vision, and recommendation systems.",
        "location": "Tokyo, Japan", "timezone": "Asia/Tokyo",
        "hourly_rate": 60, "currency": "USD",
        "availability_status": "AVAILABLE",
        "working_hours": "Mon-Fri 10AM-6PM JST",
        "tags": ["python", "ai", "machine-learning"],
    },
    {
        "email": "sarah@demo.com", "username": "sarah_content",
        "first_name": "Sarah", "last_name": "Chen",
        "display_name": "Sarah Chen",
        "headline": "Content Writer & Copywriter",
        "bio": "Professional writer crafting compelling content for tech startups and SaaS companies. SEO-optimized and conversion-focused.",
        "location": "Toronto, Canada", "timezone": "America/Toronto",
        "hourly_rate": 30, "currency": "USD",
        "availability_status": "AVAILABLE",
        "working_hours": "Mon-Fri 9AM-5PM EST",
        "tags": ["copywriting"],
    },
    {
        "email": "dev@demo.com", "username": "dev_mobile",
        "first_name": "Dev", "last_name": "Kumar",
        "display_name": "Dev Kumar",
        "headline": "Mobile App Developer | Flutter & React Native",
        "bio": "Cross-platform mobile developer building beautiful, performant apps. Published 10+ apps on Play Store and App Store.",
        "location": "Bangalore, India", "timezone": "Asia/Kolkata",
        "hourly_rate": 28, "currency": "USD",
        "availability_status": "UNAVAILABLE",
        "working_hours": "Mon-Sat 10AM-7PM IST",
        "tags": ["flutter", "react", "typescript", "nodejs"],
    },
]

CLIENTS_DATA = [
    {
        "email": "james@techcorp.com", "username": "techcorp_james",
        "first_name": "James", "last_name": "Wilson",
        "company_name": "TechCorp Solutions",
        "description": "Enterprise SaaS company providing cloud-based project management tools.",
        "website": "https://techcorp.example.com",
        "location": "San Francisco, USA",
        "industry": "SaaS / Enterprise Software",
        "tags": ["react", "python", "django"],
    },
    {
        "email": "lisa@startup.io", "username": "startup_lisa",
        "first_name": "Lisa", "last_name": "Park",
        "company_name": "NextGen AI",
        "description": "AI-first startup building the next generation of intelligent automation tools.",
        "website": "https://nextgenai.example.com",
        "location": "Seoul, South Korea",
        "industry": "AI / Machine Learning",
        "tags": ["python", "ai", "machine-learning"],
    },
    {
        "email": "omar@creative.co", "username": "creative_omar",
        "first_name": "Omar", "last_name": "Hassan",
        "company_name": "Creative Studios Co",
        "description": "Digital agency specializing in brand identity, web design, and marketing.",
        "website": "https://creativestudios.example.com",
        "location": "Dubai, UAE",
        "industry": "Digital Agency",
        "tags": ["ui-ux-design", "graphic-design", "copywriting"],
    },
]

PORTFOLIO_ITEMS = [
    {"title": "E-commerce Platform Redesign", "description": "Complete redesign of a major e-commerce platform using React and Tailwind CSS. Increased conversion rate by 23%.", "category": "WEB_DEVELOPMENT"},
    {"title": "Task Management Dashboard", "description": "Real-time collaborative dashboard built with Django Channels and React.", "category": "WEB_DEVELOPMENT"},
    {"title": "AI Chatbot Interface", "description": "Beautiful conversational UI for an AI-powered customer support chatbot.", "category": "UI_UX"},
    {"title": "Brand Identity for Fintech Startup", "description": "Complete brand identity including logo, color palette, typography, and guidelines.", "category": "GRAPHIC_DESIGN"},
    {"title": "Product Launch Video", "description": "Animated explainer video for a SaaS product launch. 2 minutes, motion graphics.", "category": "VIDEO_EDITING"},
]


class Command(BaseCommand):
    help = "Seed demo data for hackathon demonstrations"

    def handle(self, *args, **options):
        self.stdout.write("🌱 Seeding demo data...")

        # Create tags
        tags = {}
        for name, slug in TAGS_DATA:
            tag, _ = Tag.objects.get_or_create(name=name, defaults={"slug": slug})
            tags[slug] = tag
        self.stdout.write(f"  ✅ Created {len(tags)} tags")

        # Create freelancers
        freelancer_profiles = []
        for data in FREELANCERS_DATA:
            tag_slugs = data.pop("tags")
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "user_type": "FREELANCER",
                },
            )
            if created:
                user.set_password("demo1234")
                user.save()

            profile, _ = FreelancerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "display_name": data["display_name"],
                    "headline": data["headline"],
                    "bio": data["bio"],
                    "location": data["location"],
                    "timezone": data["timezone"],
                    "hourly_rate": data["hourly_rate"],
                    "currency": data["currency"],
                    "availability_status": data["availability_status"],
                    "working_hours": data["working_hours"],
                },
            )
            profile.tags.set([tags[s] for s in tag_slugs if s in tags])
            freelancer_profiles.append(profile)

            # Social links
            SocialLink.objects.get_or_create(
                freelancer=profile, platform="GITHUB",
                defaults={"url": f"https://github.com/{data['username']}"},
            )

            # Portfolio items
            for item_data in random.sample(PORTFOLIO_ITEMS, min(2, len(PORTFOLIO_ITEMS))):
                PortfolioItem.objects.get_or_create(
                    freelancer=profile, title=item_data["title"],
                    defaults={
                        "description": item_data["description"],
                        "category": item_data["category"],
                    },
                )

        self.stdout.write(f"  ✅ Created {len(freelancer_profiles)} freelancers with profiles, social links, and portfolio items")

        # Create clients
        client_profiles = []
        for data in CLIENTS_DATA:
            tag_slugs = data.pop("tags")
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "username": data["username"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "user_type": "CLIENT",
                },
            )
            if created:
                user.set_password("demo1234")
                user.save()

            profile, _ = ClientProfile.objects.get_or_create(
                user=user,
                defaults={
                    "company_name": data["company_name"],
                    "description": data["description"],
                    "website": data["website"],
                    "location": data["location"],
                    "industry": data["industry"],
                },
            )
            profile.tags.set([tags[s] for s in tag_slugs if s in tags])
            client_profiles.append(profile)

        self.stdout.write(f"  ✅ Created {len(client_profiles)} clients with profiles")

        # Create deals
        now = timezone.now()
        deal_configs = [
            {
                "client": client_profiles[0].user,
                "freelancer": freelancer_profiles[0].user,
                "title": "E-commerce Platform Backend",
                "description": "Build a scalable Django backend for our e-commerce platform.",
                "scope": "REST API development with Django REST Framework, PostgreSQL database design, authentication system, and admin panel.",
                "deliverables": "Working API endpoints, database migrations, admin interface, documentation",
                "compensation_amount": 2500, "currency": "USD",
                "deadline": now + timedelta(days=30),
                "status": "COMPLETED",
                "tags": ["django", "python", "postgresql"],
            },
            {
                "client": client_profiles[1].user,
                "freelancer": freelancer_profiles[2].user,
                "title": "ML Model for Customer Churn Prediction",
                "description": "Build and deploy a machine learning model to predict customer churn.",
                "scope": "Data analysis, feature engineering, model training, API deployment, and monitoring dashboard.",
                "deliverables": "Trained model, FastAPI endpoint, monitoring dashboard, documentation",
                "compensation_amount": 4000, "currency": "USD",
                "deadline": now + timedelta(days=45),
                "status": "ACTIVE",
                "tags": ["python", "ai", "machine-learning"],
            },
            {
                "client": client_profiles[2].user,
                "freelancer": freelancer_profiles[1].user,
                "title": "Brand Identity Design for New Product",
                "description": "Complete brand identity for our upcoming product launch.",
                "scope": "Logo design, color palette, typography system, brand guidelines document, social media templates.",
                "deliverables": "Logo files (SVG, PNG), brand guidelines PDF, Figma source files",
                "compensation_amount": 1800, "currency": "USD",
                "deadline": now + timedelta(days=21),
                "status": "PROPOSED",
                "tags": ["graphic-design", "ui-ux-design"],
            },
            {
                "client": client_profiles[0].user,
                "freelancer": freelancer_profiles[3].user,
                "title": "Technical Blog Content Series",
                "description": "Write 5 technical blog posts about cloud architecture.",
                "scope": "5 SEO-optimized blog posts, 1500-2000 words each, about cloud-native architecture best practices.",
                "deliverables": "5 published blog posts with SEO metadata",
                "compensation_amount": 750, "currency": "USD",
                "deadline": now + timedelta(days=14),
                "status": "COMPLETED",
                "tags": ["copywriting"],
            },
            {
                "client": client_profiles[1].user,
                "freelancer": freelancer_profiles[4].user,
                "title": "AI Assistant Mobile App",
                "description": "Build a cross-platform mobile app for our AI assistant.",
                "scope": "React Native app with chat interface, voice input, push notifications, and offline support.",
                "deliverables": "Published app on Play Store and App Store",
                "compensation_amount": 5000, "currency": "USD",
                "deadline": now + timedelta(days=60),
                "status": "ACCEPTED",
                "tags": ["react", "flutter", "typescript"],
            },
        ]

        deals = []
        for config in deal_configs:
            tag_slugs = config.pop("tags")
            deal, _ = Deal.objects.get_or_create(
                title=config["title"],
                defaults={**config},
            )
            deal.tags.set([tags[s] for s in tag_slugs if s in tags])
            deals.append(deal)

        self.stdout.write(f"  ✅ Created {len(deals)} deals in various statuses")

        # Create signatures for completed/active deals
        for deal in deals[:2]:  # completed and active
            if deal.client:
                DealSignature.objects.get_or_create(
                    deal=deal, signer_role="CLIENT",
                    defaults={
                        "signer": deal.client,
                        "signature_hash": f"demo-hash-client-{deal.id}",
                    },
                )
            if deal.freelancer:
                DealSignature.objects.get_or_create(
                    deal=deal, signer_role="FREELANCER",
                    defaults={
                        "signer": deal.freelancer,
                        "signature_hash": f"demo-hash-freelancer-{deal.id}",
                    },
                )

        self.stdout.write("  ✅ Created deal signatures")

        # Create reputation records and scores
        for profile in freelancer_profiles:
            user = profile.user
            rep, _ = UserReputation.objects.get_or_create(
                user=user,
                defaults={
                    "score": random.randint(40, 95),
                    "completed_deals": random.randint(1, 8),
                    "on_time_completions": random.randint(1, 6),
                    "fair_compensation_count": random.randint(1, 5),
                    "both_confirmed_count": random.randint(0, 4),
                    "cancelled_deals": random.randint(0, 2),
                    "disputes": random.randint(0, 1),
                },
            )
            profile.reputation_score = rep.score
            profile.completed_deals = rep.completed_deals
            profile.successful_deals = rep.completed_deals - rep.disputes
            profile.save(update_fields=["reputation_score", "completed_deals", "successful_deals"])

        self.stdout.write("  ✅ Created reputation scores")

        # Audit logs
        AuditLog.objects.get_or_create(
            event_type="USER_REGISTERED",
            object_type="User",
            object_id="aisha_dev",
            defaults={"metadata": {"demo": True}},
        )

        self.stdout.write(self.style.SUCCESS("\n🎉 Demo data seeded successfully!"))
        self.stdout.write(f"\n📧 Demo login credentials (all passwords: demo1234):")
        self.stdout.write("  Freelancers:")
        for f in FREELANCERS_DATA:
            self.stdout.write(f"    {f['email']}")
        self.stdout.write("  Clients:")
        for c in CLIENTS_DATA:
            self.stdout.write(f"    {c['email']}")
