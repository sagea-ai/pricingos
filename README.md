# PricingOS

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up the database (CRITICAL STEP):

   ```bash
   # Generate Prisma client (MUST run this first)
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

### Business Intelligence & Testing Lab
- **Competitor Analysis**: Deep insights into competitive landscape, pricing strategies, and market positioning
- **Pricing Optimization**: AI-powered recommendations for optimal pricing strategies and models
- **Market Positioning**: Strategic guidance on market segments and brand positioning
- **Growth Opportunities**: Identification of expansion paths and revenue opportunities
- **A/B Testing Suite**: Comprehensive testing scenarios for pricing, messaging, features, and conversion optimization
- **Strategic Recommendations**: Actionable insights based on product profile and market analysis

### Core Platform
- Smart financial stress detection for SMBs and freelancers
- AI-driven pricing recommendations and competitor analysis
- Cash flow monitoring and risk assessment
- Real-time business health scoring
- Automated insights and proactive recommendations

## IMP HAI IMP

⚠️ **IMPORTANT**: Always run these commands in order when:
- Setting up the project for the first time
- After pulling changes that modify the Prisma schema
- When encountering "undefined model" errors

```bash
# 1. Generate Prisma client first
npm run db:generate

# 2. Then push schema to database
npm run db:push

# 3. Start the development server
npm run dev
```

### Troubleshooting

- **"Cannot read properties of undefined" errors**: Run `npm run db:generate` to regenerate the Prisma client
- **"Model not found" errors**: Ensure your database is running and run `npm run db:push`
- **Build errors in Docker**: The Dockerfile automatically runs `npx prisma generate` before building
- **Complete product profile setup before accessing the Testing Lab (/testing)**

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# to do
- [ ] Add a proper README with setup instructions (we really need it. cause wtf is this ffs)
