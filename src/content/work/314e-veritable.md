---
company: "314e Corp (Veritable)"
role: "Engineering Lead"
dateStart: "2024-07-01"
dateEnd: "present"
---
I've had the opportunity to build Veritable from the ground up, managing the full lifecycle from early product planning through to delivery and day-to-day operations, all while leading a close-knit team of 4-5 engineers.

In the early days, we focused on core capabilities—adding eligibility and claim status checks that could support thousands of payers, handling complex legacy X12 to FHIR conversions, and building out heavy batch processing features. We also shipped a code explorer to make code searches easier. Additionally, I put together a self-serve sign-up system for seamless user onboarding using a Kubernetes operator and Quarkus; because onboarding inherently involves payments, I ensured that our payment and notification flows were strictly idempotent.

Over the last year, my focus has shifted toward enterprise needs. I've been building out an accounts receivable billing system with a heavy emphasis on data consistency. Alongside that, I set up deep AR analytics using Superset, making sure we track every event accurately through a modern data stack running on Kafka, Spark, Iceberg, and StarRocks.